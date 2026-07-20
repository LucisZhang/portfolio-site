#!/usr/bin/env python3
"""Build a public-safe, time-ordered Lending Club scored backtest."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import shutil
import urllib.request
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


PIPELINE_VERSION = "credit-backtest-v2"
EVALUATED_AT = "2026-07-17"
RANDOM_SEED = 20260717
SAMPLE_TARGETS = {"train": 72_000, "calibration": 24_000, "backtest": 24_000}
LGD_ASSUMPTION = 0.45
MAX_ARTIFACT_BYTES = 95 * 1024 * 1024

ROOT = Path(__file__).resolve().parents[2]
PIPELINE_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT = PIPELINE_DIR / ".cache" / "raw" / "LC_loans_granting_model_dataset.csv"
DEFAULT_OUTPUT = ROOT / "public" / "case-studies" / "credit-policy-lab"

OUTPUT_COLUMNS = [
    "application_id", "loan_id", "vintage", "split", "utilization", "late_payments",
    "debt_to_income", "bureau_age_months", "income_band", "audit_group", "channel",
    "raw_pd", "calibrated_pd", "challenger_pd", "lgd", "ead", "observed_default",
    "reason_codes", "provenance",
]

NUMERIC_FEATURES = ["log_revenue", "dti_capped", "log_loan_amnt", "fico_n", "experience_c", "employment_months"]
CATEGORICAL_FEATURES = ["purpose", "home_ownership_n", "addr_state"]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def md5_file(path: Path) -> str:
    digest = hashlib.md5(usedforsecurity=False)
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_lock() -> dict[str, Any]:
    return json.loads((PIPELINE_DIR / "source-lock.json").read_text())


def require_safe_raw_location(source_path: Path) -> None:
    resolved = source_path.resolve()
    if resolved.is_relative_to(ROOT) and not resolved.is_relative_to((PIPELINE_DIR / ".cache").resolve()):
        raise ValueError("Raw credit rows inside the repository must stay under the pipeline's ignored .cache directory")


def download_source(target: Path, lock: dict[str, Any]) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and verify_source(target, lock, raise_on_error=False):
        return
    transport = lock["transport"]
    url = f"https://media.githubusercontent.com/media/j4xie/5900incred/{transport['commit']}/{transport['path']}"
    temporary = target.with_suffix(".download")
    with urllib.request.urlopen(url, timeout=180) as response, temporary.open("wb") as output:
        shutil.copyfileobj(response, output)
    verify_source(temporary, lock)
    temporary.replace(target)


def verify_source(path: Path, lock: dict[str, Any], raise_on_error: bool = True) -> bool:
    expected = lock["file"]
    passed = path.exists() and path.stat().st_size == expected["bytes"] and sha256_file(path) == expected["sha256"] and md5_file(path) == expected["md5"]
    if not passed and raise_on_error:
        raise ValueError("Credit source does not match the locked Zenodo size, MD5, and SHA-256")
    return passed


def employment_months(value: object) -> int:
    text = str(value).strip().lower()
    if text in {"ni", "nan", "none", ""}:
        return -1
    if text.startswith("<"):
        return 6
    if text.startswith("10+"):
        return 120
    digits = "".join(character for character in text if character.isdigit())
    return int(digits) * 12 if digits else -1


def choose_time_cutoffs(frame: pd.DataFrame) -> tuple[pd.Period, pd.Period]:
    month_counts = frame.groupby("issue_month", observed=True).size().sort_index()
    cumulative = month_counts.cumsum() / month_counts.sum()
    train_end = cumulative[cumulative >= 0.60].index[0]
    calibration_end = cumulative[cumulative >= 0.80].index[0]
    if not train_end < calibration_end:
        raise ValueError("Time cutoffs do not form disjoint chronological windows")
    return train_end, calibration_end


def stable_sample(group: pd.DataFrame, count: int) -> pd.DataFrame:
    if len(group) < count:
        raise ValueError(f"Split {group['split'].iloc[0]} has only {len(group):,} rows; needs {count:,}")
    hashes = pd.util.hash_pandas_object(group["id"].astype(str) + f"|{RANDOM_SEED}", index=False)
    return group.loc[hashes.nsmallest(count).index]


def read_prepare_sample(path: Path) -> tuple[pd.DataFrame, dict[str, Any]]:
    raw = pd.read_csv(path, low_memory=False)
    required = {"id", "issue_d", "revenue", "dti_n", "loan_amnt", "fico_n", "experience_c", "emp_length", "purpose", "home_ownership_n", "addr_state", "Default", "title", "desc"}
    missing = required - set(raw.columns)
    if missing:
        raise ValueError(f"Credit source missing columns: {sorted(missing)}")
    diagnostics = {
        "raw_rows": int(len(raw)),
        "duplicate_ids_removed": int(raw["id"].duplicated().sum()),
        "missing_titles": int(raw["title"].isna().sum()),
        "missing_descriptions": int(raw["desc"].isna().sum()),
        "no_information_employment_rows": int(raw["emp_length"].astype(str).str.upper().eq("NI").sum()),
    }
    raw = raw.drop_duplicates("id", keep="first").copy()
    raw["issue_date"] = pd.to_datetime(raw["issue_d"], format="%b-%Y", errors="coerce")
    raw = raw.dropna(subset=["issue_date", "revenue", "dti_n", "loan_amnt", "fico_n", "purpose", "home_ownership_n", "addr_state", "Default"])
    raw = raw[raw["Default"].isin([0, 1]) & raw["loan_amnt"].gt(0) & raw["revenue"].gt(0)].copy()
    raw["issue_month"] = raw["issue_date"].dt.to_period("M")
    train_end, calibration_end = choose_time_cutoffs(raw)
    raw["split"] = np.select(
        [raw["issue_month"] <= train_end, raw["issue_month"] <= calibration_end],
        ["train", "calibration"], default="backtest",
    )
    sampled = pd.concat([stable_sample(raw[raw["split"].eq(split)], target) for split, target in SAMPLE_TARGETS.items()])
    sampled = sampled.sort_values(["issue_date", "id"]).reset_index(drop=True)
    sampled["employment_months"] = sampled["emp_length"].map(employment_months).astype(float)
    diagnostics.update({
        "eligible_rows": int(len(raw)),
        "sample_rows": int(len(sampled)),
        "train_end_month": str(train_end),
        "calibration_end_month": str(calibration_end),
        "source_date_range": [str(raw["issue_month"].min()), str(raw["issue_month"].max())],
        "sample_split_rows": {split: int(sampled["split"].eq(split).sum()) for split in SAMPLE_TARGETS},
    })
    return sampled, diagnostics


def feature_frame(sampled: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, float]]:
    train = sampled["split"].eq("train")
    dti_cap = float(sampled.loc[train, "dti_n"].quantile(0.995))
    frame = pd.DataFrame(index=sampled.index)
    frame["log_revenue"] = np.log1p(sampled["revenue"].clip(lower=0))
    frame["dti_capped"] = sampled["dti_n"].clip(lower=0, upper=dti_cap)
    frame["log_loan_amnt"] = np.log1p(sampled["loan_amnt"].clip(lower=0))
    frame["fico_n"] = sampled["fico_n"]
    frame["experience_c"] = sampled["experience_c"]
    frame["employment_months"] = sampled["employment_months"]
    for column in CATEGORICAL_FEATURES:
        frame[column] = sampled[column].astype(str).str.strip().replace("", "UNKNOWN")
    return frame, {"dti_cap_train_p995": dti_cap}


def build_transformer() -> ColumnTransformer:
    from sklearn.compose import ColumnTransformer
    from sklearn.impute import SimpleImputer
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import OneHotEncoder, StandardScaler

    numeric = Pipeline([("impute", SimpleImputer(strategy="median")), ("scale", StandardScaler())])
    categorical = Pipeline([("impute", SimpleImputer(strategy="most_frequent")), ("onehot", OneHotEncoder(handle_unknown="ignore", min_frequency=25, sparse_output=True))])
    return ColumnTransformer([("num", numeric, NUMERIC_FEATURES), ("cat", categorical, CATEGORICAL_FEATURES)], sparse_threshold=1.0)


def calibrate(scores: np.ndarray, outcomes: np.ndarray) -> IsotonicRegression:
    from sklearn.isotonic import IsotonicRegression

    return IsotonicRegression(y_min=0.0, y_max=1.0, out_of_bounds="clip").fit(scores, outcomes)


def reason_code_for_feature(feature: str) -> str:
    def categorical_code(token: str, prefix: str) -> str | None:
        if token not in feature:
            return None
        value = feature.split(token, 1)[1]
        normalized = re.sub(r"[^A-Z0-9]+", "_", value.upper()).strip("_") or "UNKNOWN"
        return f"{prefix}_{normalized}_SIGNAL"

    for token, prefix in [
        ("purpose_", "LOAN_PURPOSE"),
        ("home_ownership_n_", "HOME_OWNERSHIP"),
        ("addr_state_", "STATE_PORTFOLIO"),
    ]:
        code = categorical_code(token, prefix)
        if code:
            return code
    mappings = [
        ("dti_capped", "DEBT_TO_INCOME_SIGNAL"),
        ("fico_n", "FICO_SIGNAL"),
        ("log_revenue", "REPORTED_INCOME_SIGNAL"),
        ("log_loan_amnt", "REQUESTED_AMOUNT_SIGNAL"),
        ("employment_months", "EMPLOYMENT_HISTORY_SIGNAL"),
        ("experience_c", "ENTITY_EXPERIENCE_SIGNAL"),
    ]
    return next((code for token, code in mappings if token in feature), "MODEL_FEATURE_SIGNAL")


def shap_reason_codes(model: xgb.XGBClassifier, matrix: Any, feature_names: list[str], batch_size: int = 10_000) -> list[str]:
    import xgboost as xgb

    booster = model.get_booster()
    mapped_codes = [reason_code_for_feature(name) for name in feature_names]
    result: list[str] = []
    for start in range(0, matrix.shape[0], batch_size):
        stop = min(start + batch_size, matrix.shape[0])
        contributions = booster.predict(xgb.DMatrix(matrix[start:stop]), pred_contribs=True)[:, :-1]
        for row in contributions:
            absolute_order = np.argsort(-np.abs(row), kind="stable")[:3]
            chosen: list[str] = []
            for index in absolute_order:
                base_code = mapped_codes[int(index)]
                contribution = float(row[int(index)])
                direction = "INCREASES_PD" if contribution > 0 else "DECREASES_PD" if contribution < 0 else "NEUTRAL"
                chosen.append(f"{base_code}_{direction}")
            while len(chosen) < 3:
                fallback = next(code for code in ["MODEL_FEATURE_SIGNAL_NEUTRAL", "ENTITY_EXPERIENCE_SIGNAL_NEUTRAL", "LOAN_PURPOSE_SIGNAL_NEUTRAL", "STATE_PORTFOLIO_SIGNAL_NEUTRAL"] if code not in chosen)
                chosen.append(fallback)
            result.append(json.dumps(chosen[:3], separators=(",", ":")))
    return result


def band_income(values: pd.Series, train_values: pd.Series) -> tuple[pd.Series, list[float]]:
    thresholds = [float(train_values.quantile(q)) for q in [0.2, 0.4, 0.6, 0.8]]
    labels = ["low", "lower-middle", "middle", "upper-middle", "high"]
    bands = pd.cut(values, bins=[-np.inf, *thresholds, np.inf], labels=labels, include_lowest=True)
    return bands.astype(str), thresholds


def train_and_score(sampled: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, Any]]:
    import xgboost as xgb
    from sklearn.linear_model import LogisticRegression

    features, preprocessing = feature_frame(sampled)
    outcomes = sampled["Default"].astype(int).to_numpy()
    train = sampled["split"].eq("train").to_numpy()
    calibration = sampled["split"].eq("calibration").to_numpy()

    transformer = build_transformer()
    train_matrix = transformer.fit_transform(features.loc[train])
    all_matrix = transformer.transform(features)
    baseline = LogisticRegression(C=1.0, penalty="l2", solver="lbfgs", max_iter=500, random_state=RANDOM_SEED)
    baseline.fit(train_matrix, outcomes[train])
    challenger = xgb.XGBClassifier(
        n_estimators=240, max_depth=4, learning_rate=0.05, subsample=0.85, colsample_bytree=0.85,
        min_child_weight=20, reg_lambda=2.0, objective="binary:logistic", eval_metric="logloss",
        tree_method="hist", random_state=RANDOM_SEED, n_jobs=4,
    )
    challenger.fit(train_matrix, outcomes[train], verbose=False)

    baseline_raw = baseline.predict_proba(all_matrix)[:, 1]
    challenger_raw = challenger.predict_proba(all_matrix)[:, 1]
    baseline_isotonic = calibrate(baseline_raw[calibration], outcomes[calibration])
    challenger_isotonic = calibrate(challenger_raw[calibration], outcomes[calibration])
    baseline_calibrated = np.clip(baseline_isotonic.predict(baseline_raw), 1e-6, 1 - 1e-6)
    challenger_calibrated = np.clip(challenger_isotonic.predict(challenger_raw), 1e-6, 1 - 1e-6)
    feature_names = transformer.get_feature_names_out().tolist()
    reasons = shap_reason_codes(challenger, all_matrix, feature_names)

    income_band, income_thresholds = band_income(sampled["revenue"], sampled.loc[train, "revenue"])
    hashed_ids = sampled["id"].astype(str).map(lambda value: hashlib.sha256(value.encode()).hexdigest()[:16])
    output = pd.DataFrame({
        "application_id": "APP-" + hashed_ids,
        "loan_id": "LOAN-" + hashed_ids,
        "vintage": sampled["issue_date"].dt.strftime("%Y-%m"),
        "split": sampled["split"],
        "utilization": (sampled["loan_amnt"] / sampled["revenue"]).clip(lower=0, upper=5).round(8),
        "late_payments": -1,
        "debt_to_income": (sampled["dti_n"] / 100.0).round(8),
        "bureau_age_months": -1,
        "income_band": income_band,
        "audit_group": "home-" + sampled["home_ownership_n"].astype(str).str.lower(),
        "channel": "not_provided",
        "raw_pd": np.asarray(np.clip(baseline_raw, 1e-6, 1 - 1e-6), dtype=np.float64),
        "calibrated_pd": np.asarray(baseline_calibrated, dtype=np.float64),
        "challenger_pd": np.asarray(challenger_calibrated, dtype=np.float64),
        "lgd": LGD_ASSUMPTION,
        "ead": sampled["loan_amnt"].astype(float),
        "observed_default": sampled["Default"].astype(bool),
        "reason_codes": reasons,
        "provenance": "Zenodo 11295916 observed final outcome; pseudonymous linkable IDs; application-time features; logistic/XGBoost + isotonic; LGD 45%; unavailable legacy browser fields use -1/not_provided",
    })

    model_context = {
        "feature_count_after_encoding": len(feature_names),
        "income_band_train_quantiles": income_thresholds,
        **preprocessing,
    }
    return output[OUTPUT_COLUMNS], model_context


def scored_artifact_metrics(frame: pd.DataFrame) -> dict[str, Any]:
    from sklearn.metrics import brier_score_loss, log_loss, roc_auc_score

    backtest = frame["split"].eq("backtest")
    labels = frame.loc[backtest, "observed_default"].astype(int).to_numpy()

    def metrics(column: str) -> dict[str, float]:
        values = frame.loc[backtest, column].astype(float).to_numpy()
        return {
            "brier": round(float(brier_score_loss(labels, values)), 8),
            "log_loss": round(float(log_loss(labels, values)), 8),
            "roc_auc": round(float(roc_auc_score(labels, values)), 8),
        }

    return {
        "baseline_raw": metrics("raw_pd"),
        "baseline_isotonic": metrics("calibrated_pd"),
        "challenger_isotonic": metrics("challenger_pd"),
        "backtest_default_rate": round(float(labels.mean()), 8),
    }


def validate_output(frame: pd.DataFrame) -> None:
    if list(frame.columns) != OUTPUT_COLUMNS:
        raise ValueError("Output columns do not match the browser contract")
    parsed_reasons = frame["reason_codes"].map(json.loads)
    split_counts = frame["split"].value_counts().to_dict()
    train_vintages = frame.loc[frame["split"].eq("train"), "vintage"]
    calibration_vintages = frame.loc[frame["split"].eq("calibration"), "vintage"]
    backtest_vintages = frame.loc[frame["split"].eq("backtest"), "vintage"]
    checks = {
        "application grain": not frame["application_id"].duplicated().any(),
        "pseudonymous identifier format": frame["application_id"].str.fullmatch(r"APP-[a-f0-9]{16}").all() and frame["loan_id"].str.fullmatch(r"LOAN-[a-f0-9]{16}").all() and (frame["application_id"].str.removeprefix("APP-") == frame["loan_id"].str.removeprefix("LOAN-")).all(),
        "all splits": set(frame["split"]) == {"train", "calibration", "backtest"},
        "exact split rows": split_counts == SAMPLE_TARGETS,
        "chronological split order": max(train_vintages) < min(calibration_vintages) and max(calibration_vintages) < min(backtest_vintages),
        "probability bounds": frame[["raw_pd", "calibrated_pd", "challenger_pd"]].apply(lambda column: column.between(0, 1).all()).all(),
        "LGD/EAD bounds": frame["lgd"].between(0, 1).all() and frame["ead"].gt(0).all(),
        "outcomes": frame["observed_default"].map(lambda value: isinstance(value, (bool, np.bool_))).all(),
        "three reason codes": parsed_reasons.map(lambda value: isinstance(value, list) and len(value) == 3 and all(isinstance(item, str) and re.fullmatch(r"[A-Z0-9_]+_(?:INCREASES_PD|DECREASES_PD|NEUTRAL)", item) for item in value) and len(set(value)) == 3).all(),
        "provenance": frame["provenance"].astype(str).str.len().gt(0).all(),
    }
    failed = [name for name, passed in checks.items() if not passed]
    if failed:
        raise ValueError(f"Credit artifact contract failed: {', '.join(failed)}")


def write_parquet(frame: pd.DataFrame, path: Path, metadata: dict[str, str]) -> str:
    import pyarrow as pa
    import pyarrow.parquet as pq

    path.parent.mkdir(parents=True, exist_ok=True)
    table = pa.Table.from_pandas(frame, preserve_index=False)
    schema_metadata = dict(table.schema.metadata or {})
    schema_metadata.update({key.encode(): value.encode() for key, value in metadata.items()})
    table = table.replace_schema_metadata(schema_metadata)
    pq.write_table(table, path, compression="zstd", compression_level=9, use_dictionary=True, write_statistics=True)
    return sha256_file(path)


def methods_evidence(artifact_hash: str, frame: pd.DataFrame, diagnostics: dict[str, Any], metrics: dict[str, Any], lock: dict[str, Any]) -> dict[str, Any]:
    split_counts = {split: int(frame["split"].eq(split).sum()) for split in SAMPLE_TARGETS}
    base = metrics["baseline_isotonic"]
    challenger = metrics["challenger_isotonic"]
    return {
        "report_version": "analytics-methods-v1",
        "project": "credit",
        "dataset": {
            "name": lock["dataset"], "source_url": lock["record_url"], "license": lock["license"]["name"],
            "retrieval_date": lock["retrieved_at"], "raw_records": diagnostics["raw_rows"], "derived_rows": len(frame),
            "date_range": [frame["vintage"].min(), frame["vintage"].max()], "artifact_sha256": artifact_hash,
        },
        "acquisition_and_cleaning": {
            "en": [
                "Pinned the UCM-curated Zenodo archive and verified its 167,468,415 bytes plus published MD5 and locked SHA-256.",
                f"Parsed month vintages, removed {diagnostics['duplicate_ids_removed']:,} duplicate IDs, retained explicit no-information employment encodings, and excluded free text/ZIP from modeling.",
                f"Audited {diagnostics['missing_titles']:,} missing titles and {diagnostics['missing_descriptions']:,} missing descriptions; neither text field enters the model.",
                "Selected 120,000 applications by deterministic ID hash within disjoint chronological windows so the browser artifact stays reviewable; the resulting IDs are pseudonymous and linkable within the artifact, not anonymous.",
            ],
            "zh": [
                "锁定 UCM 在 Zenodo 发布的数据档案，并校验 167,468,415 字节、官方 MD5 与锁定 SHA-256。",
                f"解析月份 vintage，删除 {diagnostics['duplicate_ids_removed']:,} 个重复 ID，保留明确的就业信息缺失编码，并将自由文本/邮编排除在建模之外。",
                f"审计 {diagnostics['missing_titles']:,} 个缺失标题与 {diagnostics['missing_descriptions']:,} 个缺失描述；两个文本字段均不进入模型。",
                "在互不重叠的时间窗口内按确定性 ID 哈希选取 120,000 条申请，使浏览器产物保持可审阅；生成的 ID 是产物内可关联的假名标识，并非匿名。",
            ],
        },
        "modeling": {
            "en": [
                "Baseline: L2-regularized logistic regression over scaled numeric and one-hot categorical application-time features.",
                "Nine source features enter both models: log reported income, capped DTI, log requested amount, FICO, entity-experience flag, employment months, purpose, home ownership, and state.",
                "Challenger: 240-tree depth-4 XGBoost; both scores are independently isotonic-calibrated on the calibration window.",
                "Score columns retain float64 precision, and AUC, Brier, log-loss, and default rate are computed after rereading the final Parquet.",
                "Top-three reason codes are the largest absolute per-application XGBoost SHAP contributions and encode whether each contribution increases or decreases PD. EAD is requested amount; LGD is a disclosed 45% assumption.",
                "The legacy display fields utilization, late payments, and bureau age are respectively mapped to requested-amount/income and explicit unavailable sentinels; they are not model inputs.",
            ],
            "zh": [
                "Baseline：对缩放数值特征与 one-hot 申请时点类别特征拟合 L2 正则逻辑回归。",
                "两个模型都使用 9 个来源特征：log 申报收入、截断 DTI、log 申请金额、FICO、机构经验标记、就业月数、用途、住房状态和州。",
                "Challenger：240 棵、深度 4 的 XGBoost；两组分数分别在 calibration 窗口做 isotonic 校准。",
                "分数字段保留 float64 精度，AUC、Brier、log-loss 与违约率都在重新读取最终 Parquet 后计算。",
                "每条申请的前三个原因码取 XGBoost SHAP 绝对贡献最大的三个特征，并编码其提高或降低 PD 的方向。EAD 为申请金额；LGD 是明确披露的 45% 假设。",
                "旧版展示字段 utilization、late payments、bureau age 分别映射为申请金额/收入与明确的不可用哨兵；它们不进入模型。",
            ],
        },
        "split_and_leakage": {
            "en": [f"Train {split_counts['train']:,} / calibration {split_counts['calibration']:,} / backtest {split_counts['backtest']:,}; time cutoffs end {diagnostics['train_end_month']} and {diagnostics['calibration_end_month']}.", "Preprocessing and DTI caps fit on train only; isotonic maps fit on calibration only; all reported metrics use later backtest outcomes."],
            "zh": [f"Train {split_counts['train']:,} / calibration {split_counts['calibration']:,} / backtest {split_counts['backtest']:,}；时间截止月为 {diagnostics['train_end_month']} 与 {diagnostics['calibration_end_month']}。", "预处理与 DTI 截断只拟合 train；isotonic 映射只拟合 calibration；所有报告指标只使用更晚的 backtest 结果。"],
        },
        "labels": {
            "en": ["Observed outcome is the archive's final resolution: charged-off/default = 1 and fully paid = 0.", "No transitory loan state is relabeled, and no protected-class or fairness label is inferred."],
            "zh": ["观察结果采用档案中的最终结局：charged-off/default = 1，fully paid = 0。", "不重标任何过渡贷款状态，也不推断受保护类别或公平性标签。"],
        },
        "trust": {
            "en": ["The pipeline fails closed on the source size, MD5, SHA-256, application grain, split coverage, score bounds, outcome types, and exactly three reason codes; verification recomputes AUC, Brier, log-loss, and default rate from the exact Parquet columns.", "The Parquet embeds DOI, authorship, license, hashes, time cutoffs, algorithm versions, sampling rule, metric-recomputation rule, and LGD/display-field assumptions."],
            "zh": ["源文件大小、MD5、SHA-256、申请粒度、split 覆盖、分数边界、结果类型或恰好三个原因码任一失败，流水线都会阻断；验证会从精确 Parquet 字段重算 AUC、Brier、log-loss 与违约率。", "Parquet 内嵌 DOI、作者、许可证、哈希、时间截止、算法版本、抽样规则、指标重算规则与 LGD/展示字段假设。"],
        },
        "changed": {
            "en": f"The synthetic policy walkthrough remains the default. Real mode now compares calibrated scores on observed later outcomes: baseline Brier {base['brier']:.4f}, challenger Brier {challenger['brier']:.4f}, with {metrics['backtest_default_rate'] * 100:.2f}% observed defaults.",
            "zh": f"合成策略演示仍为默认。真实模式现基于更晚的观察结果比较校准分数：baseline Brier {base['brier']:.4f}，challenger Brier {challenger['brier']:.4f}，观察违约率 {metrics['backtest_default_rate'] * 100:.2f}%。",
        },
        "metrics": [
            {"label": {"en": "Scored applications", "zh": "已评分申请"}, "value": f"{len(frame):,}"},
            {"label": {"en": "Baseline / challenger Brier", "zh": "Baseline / challenger Brier"}, "value": f"{base['brier']:.4f} / {challenger['brier']:.4f}"},
            {"label": {"en": "Observed backtest defaults", "zh": "观察回测违约率"}, "value": f"{metrics['backtest_default_rate'] * 100:.2f}%"},
        ],
        "reproduction": [
            "python3 -m venv .venv && .venv/bin/pip install -r pipelines/credit-backtest/requirements.txt",
            ".venv/bin/python pipelines/credit-backtest/build.py --download",
            ".venv/bin/python pipelines/credit-backtest/build.py --verify-only",
        ],
        "boundaries": {
            "en": "The archive contains granted loans only, so rejected applicants and acceptance-population policy effects are not represented. No production decisioning, causal impact, regulatory validation, or fairness conclusion; home-ownership slices are descriptive only.",
            "zh": "该档案仅包含已授信贷款，不代表被拒申请人或完整受理人群的策略效果。不声称生产决策、因果影响、监管验证或公平性结论；住房状态切片仅作描述。",
        },
    }


def verify_outputs(output_dir: Path) -> None:
    import pyarrow.parquet as pq

    parquet_path = output_dir / "scored-backtest.parquet"
    methods_path = output_dir / "methods-evidence.json"
    metrics_path = output_dir / "backtest-report.json"
    for path in [parquet_path, methods_path, metrics_path]:
        if not path.exists() or path.stat().st_size == 0:
            raise ValueError(f"Missing output: {path}")
    if parquet_path.stat().st_size >= MAX_ARTIFACT_BYTES:
        raise ValueError(f"Credit Parquet exceeds the {MAX_ARTIFACT_BYTES}-byte browser budget")
    artifact_hash = sha256_file(parquet_path)
    frame = pd.read_parquet(parquet_path)
    validate_output(frame)
    parquet_metadata = pq.read_metadata(parquet_path)
    embedded = {(key.decode() if isinstance(key, bytes) else str(key)): (value.decode() if isinstance(value, bytes) else str(value)) for key, value in (parquet_metadata.metadata or {}).items()}
    required_metadata = {"dataset_name", "record_url", "doi", "retrieved_at", "license", "creators", "raw_md5", "raw_sha256", "transport_commit", "pipeline_version", "time_cutoffs", "sampling", "models", "reason_codes", "metric_recomputation", "lgd_assumption", "display_field_boundary"}
    if not required_metadata.issubset(embedded) or any(not embedded[key].strip() for key in required_metadata):
        raise ValueError("Credit Parquet provenance metadata is incomplete")
    if any(parquet_metadata.row_group(group).column(column).compression != "ZSTD" for group in range(parquet_metadata.num_row_groups) for column in range(parquet_metadata.row_group(group).num_columns)):
        raise ValueError("Credit Parquet must use ZSTD for every column chunk")
    methods = json.loads(methods_path.read_text())
    required_sections = ["acquisition_and_cleaning", "modeling", "split_and_leakage", "labels", "trust"]
    localized_list = lambda value: isinstance(value, dict) and all(isinstance(value.get(locale), list) and len(value[locale]) > 0 and all(isinstance(item, str) and item.strip() for item in value[locale]) for locale in ["en", "zh"])
    localized_text = lambda value: isinstance(value, dict) and all(isinstance(value.get(locale), str) and value[locale].strip() for locale in ["en", "zh"])
    dataset = methods.get("dataset", {})
    dataset_strings_valid = all(isinstance(dataset.get(key), str) and dataset[key].strip() for key in ["name", "source_url", "license", "retrieval_date"])
    dataset_range_valid = isinstance(dataset.get("date_range"), list) and len(dataset["date_range"]) == 2 and all(isinstance(value, str) and value.strip() for value in dataset["date_range"])
    if methods.get("report_version") != "analytics-methods-v1" or methods.get("project") != "credit" or dataset.get("artifact_sha256") != artifact_hash or not dataset_strings_valid or not dataset_range_valid or dataset.get("date_range") != [frame["vintage"].min(), frame["vintage"].max()] or not isinstance(dataset.get("raw_records"), int) or dataset["raw_records"] <= 0 or not isinstance(dataset.get("derived_rows"), int) or dataset["derived_rows"] != len(frame):
        raise ValueError("Methods evidence does not match the Parquet artifact")
    if not all(localized_list(methods.get(section)) for section in required_sections) or not localized_text(methods.get("changed")) or not localized_text(methods.get("boundaries")):
        raise ValueError("Methods evidence bilingual section contract failed")
    if not isinstance(methods.get("metrics"), list) or not methods["metrics"] or not all(isinstance(metric, dict) and localized_text(metric.get("label")) and isinstance(metric.get("value"), str) and metric["value"].strip() for metric in methods["metrics"]):
        raise ValueError("Methods evidence metrics contract failed")
    if not isinstance(methods.get("reproduction"), list) or not methods["reproduction"] or not all(isinstance(command, str) and command.strip() for command in methods["reproduction"]):
        raise ValueError("Methods evidence reproduction contract failed")
    report = json.loads(metrics_path.read_text())
    model_names = ["baseline_raw", "baseline_isotonic", "challenger_isotonic"]
    model_reports = report.get("models")
    models_valid = isinstance(model_reports, dict) and all(
        isinstance(model_reports.get(model), dict)
        and all(isinstance(model_reports[model].get(metric), (int, float)) and math.isfinite(model_reports[model][metric]) for metric in ["brier", "log_loss", "roc_auc"])
        and 0 <= model_reports[model]["brier"] <= 1
        and model_reports[model]["log_loss"] >= 0
        and 0 <= model_reports[model]["roc_auc"] <= 1
        for model in model_names
    )
    if report.get("report_version") != "credit-backtest-report-v1" or report.get("artifact_sha256") != artifact_hash or report.get("evaluated_at") != EVALUATED_AT or report.get("dataset_id") != f"credit-backtest-parquet-v1:{artifact_hash[:12]}" or report.get("splits") != SAMPLE_TARGETS or not models_valid or not isinstance(report.get("backtest_default_rate"), (int, float)) or not math.isfinite(report["backtest_default_rate"]) or not 0 <= report["backtest_default_rate"] <= 1 or not isinstance(report.get("boundaries"), str) or not report["boundaries"].strip():
        raise ValueError("Backtest report contract failed")
    recomputed = scored_artifact_metrics(frame)
    if report["models"] != {key: recomputed[key] for key in model_names} or report["backtest_default_rate"] != recomputed["backtest_default_rate"]:
        raise ValueError("Backtest report metrics do not exactly reproduce from the Parquet artifact")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--download", action="store_true")
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()

    if args.verify_only:
        verify_outputs(args.output)
        print(f"Verified credit outputs in {args.output}")
        return

    lock = load_lock()
    require_safe_raw_location(args.input)
    if args.download:
        download_source(args.input, lock)
    verify_source(args.input, lock)
    sampled, diagnostics = read_prepare_sample(args.input)
    scored, model_context = train_and_score(sampled)
    validate_output(scored)
    metadata = {
        "dataset_name": lock["dataset"], "record_url": lock["record_url"], "doi": lock["doi"],
        "retrieved_at": lock["retrieved_at"], "license": lock["license"]["name"],
        "creators": json.dumps(lock["creators"], ensure_ascii=False), "raw_md5": lock["file"]["md5"],
        "raw_sha256": lock["file"]["sha256"], "transport_commit": lock["transport"]["commit"],
        "pipeline_version": PIPELINE_VERSION, "time_cutoffs": f"train through {diagnostics['train_end_month']}; calibration through {diagnostics['calibration_end_month']}; later backtest",
        "sampling": json.dumps(SAMPLE_TARGETS, sort_keys=True), "models": "L2 logistic regression + XGBoost 240xdepth4; independent isotonic calibration",
        "reason_codes": "top-3 absolute per-application XGBoost SHAP contributions with PD direction",
        "metric_recomputation": "float64 score columns; report AUC, Brier, log-loss, and default rate computed after rereading final Parquet",
        "lgd_assumption": str(LGD_ASSUMPTION),
        "display_field_boundary": "utilization=requested amount/income; late_payments=-1 unavailable; bureau_age_months=-1 unavailable; channel=not_provided",
    }
    artifact_hash = write_parquet(scored, args.output / "scored-backtest.parquet", metadata)
    if (args.output / "scored-backtest.parquet").stat().st_size >= MAX_ARTIFACT_BYTES:
        raise ValueError(f"Credit Parquet exceeds the {MAX_ARTIFACT_BYTES}-byte browser budget")
    serialized_scored = pd.read_parquet(args.output / "scored-backtest.parquet")
    validate_output(serialized_scored)
    metrics = {**scored_artifact_metrics(serialized_scored), **model_context}
    evidence = methods_evidence(artifact_hash, serialized_scored, diagnostics, metrics, lock)
    report = {"report_version": "credit-backtest-report-v1", "dataset_id": f"credit-backtest-parquet-v1:{artifact_hash[:12]}", "artifact_sha256": artifact_hash, "evaluated_at": EVALUATED_AT, "splits": diagnostics["sample_split_rows"], "time_cutoffs": {"train_end": diagnostics["train_end_month"], "calibration_end": diagnostics["calibration_end_month"]}, "models": {key: metrics[key] for key in ["baseline_raw", "baseline_isotonic", "challenger_isotonic"]}, "backtest_default_rate": metrics["backtest_default_rate"], "boundaries": "Granted-loan-only offline historical association; rejected applicants are absent; no production, causal, regulatory, or fairness claim."}
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "methods-evidence.json").write_text(json.dumps(evidence, indent=2, ensure_ascii=False) + "\n")
    (args.output / "backtest-report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    verify_outputs(args.output)
    print(json.dumps({"artifact": str(args.output / "scored-backtest.parquet"), "sha256": artifact_hash, "rows": len(scored), "splits": diagnostics["sample_split_rows"], "metrics": report["models"], "backtest_default_rate": report["backtest_default_rate"]}, indent=2))


if __name__ == "__main__":
    main()
