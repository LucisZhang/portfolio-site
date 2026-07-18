#!/usr/bin/env python3
"""Build the public-safe Olist contribution-margin artifact and measured reports."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import shutil
import urllib.request
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


PIPELINE_VERSION = "olist-margin-v2"
EVALUATED_AT = "2026-07-17"
METHOD = "STL + robust z-score"
ELASTICITY_METHOD = "HC3 log-log OLS with category, region, and payment-channel fixed effects; fit excludes final 8 weeks"
HOLDOUT_WEEKS = 8
Z_THRESHOLD = 3.5
COGS_RATE = 0.60
MAX_ARTIFACT_BYTES = 95 * 1024 * 1024
WEEKLY_CALENDAR_FREQUENCY = "W-MON"
MISSING_WEEK_TREATMENT = "complete Monday calendar; weeks with no derived Olist cells are zero-filled before STL"

ROOT = Path(__file__).resolve().parents[2]
PIPELINE_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT = PIPELINE_DIR / ".cache" / "raw"
DEFAULT_OUTPUT = ROOT / "public" / "case-studies" / "margin-control-tower"

NORTH_STATES = {"AC", "AL", "AP", "AM", "BA", "CE", "MA", "PA", "PB", "PE", "PI", "RN", "RO", "RR", "SE", "TO"}
SOUTH_STATES = {"ES", "MG", "PR", "RJ", "RS", "SC", "SP"}

OUTPUT_COLUMNS = [
    "week", "period_split", "category", "product_id", "product_name", "region", "channel",
    "order_count", "units", "unit_price", "gross_revenue", "promo_depth", "discounts",
    "return_rate", "returns", "net_revenue", "cogs", "fulfillment", "contribution_margin",
    "provenance", "injected_anomaly", "anomaly_reason",
]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_lock() -> dict[str, Any]:
    return json.loads((PIPELINE_DIR / "source-lock.json").read_text())


def require_safe_raw_location(source_dir: Path) -> None:
    resolved = source_dir.resolve()
    if resolved.is_relative_to(ROOT) and not resolved.is_relative_to((PIPELINE_DIR / ".cache").resolve()):
        raise ValueError("Raw Olist tables inside the repository must stay under the pipeline's ignored .cache directory")


def download_sources(destination: Path, lock: dict[str, Any]) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    commit = lock["transport"]["commit"]
    for item in lock["files"]:
        target = destination / item["name"]
        if target.exists() and target.stat().st_size == item["bytes"] and sha256_file(target) == item["sha256"]:
            continue
        url = f"https://media.githubusercontent.com/media/alphaiterations/multi-agent-chatbot/{commit}/{item['path']}"
        temporary = target.with_suffix(".download")
        with urllib.request.urlopen(url, timeout=120) as response, temporary.open("wb") as output:
            shutil.copyfileobj(response, output)
        if temporary.stat().st_size != item["bytes"] or sha256_file(temporary) != item["sha256"]:
            temporary.unlink(missing_ok=True)
            raise ValueError(f"Source lock mismatch for {item['name']}")
        temporary.replace(target)


def verify_sources(source_dir: Path, lock: dict[str, Any]) -> None:
    failures: list[str] = []
    for item in lock["files"]:
        path = source_dir / item["name"]
        if not path.exists():
            failures.append(f"missing {item['name']}")
            continue
        if path.stat().st_size != item["bytes"]:
            failures.append(f"size mismatch for {item['name']}")
        if sha256_file(path) != item["sha256"]:
            failures.append(f"SHA-256 mismatch for {item['name']}")
    if failures:
        raise ValueError("; ".join(failures))


def map_region(state: str) -> str:
    if state in NORTH_STATES:
        return "North"
    if state in SOUTH_STATES:
        return "South"
    return "West"


def read_and_reconcile(source_dir: Path) -> tuple[pd.DataFrame, dict[str, int | float]]:
    customers = pd.read_csv(source_dir / "olist_customers_dataset.csv", dtype={"customer_zip_code_prefix": "string"})
    items = pd.read_csv(source_dir / "olist_order_items_dataset.csv")
    payments = pd.read_csv(source_dir / "olist_order_payments_dataset.csv")
    reviews = pd.read_csv(source_dir / "olist_order_reviews_dataset.csv")
    orders = pd.read_csv(source_dir / "olist_orders_dataset.csv")
    products = pd.read_csv(source_dir / "olist_products_dataset.csv")

    raw_rows = int(sum(len(frame) for frame in [customers, items, payments, reviews, orders, products]))
    source_duplicate_rows = int(sum(frame.duplicated().sum() for frame in [customers, items, payments, reviews, orders, products]))

    payment_rollup = payments.groupby(["order_id", "payment_type"], as_index=False, sort=True)["payment_value"].sum()
    dominant_payment = (
        payment_rollup.sort_values(["order_id", "payment_value", "payment_type"], ascending=[True, False, True])
        .drop_duplicates("order_id", keep="first")
        .rename(columns={"payment_type": "channel"})[["order_id", "channel"]]
    )
    payment_total = payments.groupby("order_id", as_index=False)["payment_value"].sum().rename(columns={"payment_value": "payment_total"})
    review_rollup = reviews.groupby("order_id", as_index=False)["review_score"].min()

    products = products[["product_id", "product_category_name"]].copy()
    products["product_category_name"] = products["product_category_name"].fillna("unknown").astype(str).str.strip().replace("", "unknown")
    customers = customers[["customer_id", "customer_state"]].drop_duplicates("customer_id")
    customers["region"] = customers["customer_state"].map(map_region)

    orders["purchase_timestamp"] = pd.to_datetime(orders["order_purchase_timestamp"], errors="coerce")
    orders = orders.dropna(subset=["purchase_timestamp"]).drop_duplicates("order_id")
    orders["week"] = orders["purchase_timestamp"].dt.to_period("W-SUN").dt.start_time

    reconciled = (
        items.merge(orders[["order_id", "customer_id", "order_status", "week"]], on="order_id", how="inner", validate="many_to_one")
        .merge(customers[["customer_id", "region"]], on="customer_id", how="inner", validate="many_to_one")
        .merge(products, on="product_id", how="left", validate="many_to_one")
        .merge(dominant_payment, on="order_id", how="left", validate="many_to_one")
        .merge(payment_total, on="order_id", how="left", validate="many_to_one")
        .merge(review_rollup, on="order_id", how="left", validate="many_to_one")
    )
    reconciled["product_category_name"] = reconciled["product_category_name"].fillna("unknown")
    reconciled["channel"] = reconciled["channel"].fillna("unknown").replace("not_defined", "unknown")
    reconciled["review_score"] = reconciled["review_score"].fillna(5)

    weekly_category_price = (
        reconciled.groupby(["week", "product_category_name"], as_index=False)["price"].median()
        .sort_values(["product_category_name", "week"])
    )
    weekly_category_price["prior_reference_price"] = weekly_category_price.groupby("product_category_name")["price"].transform(
        lambda series: series.expanding(min_periods=1).median().shift(1)
    )
    reconciled = reconciled.merge(
        weekly_category_price[["week", "product_category_name", "prior_reference_price"]],
        on=["week", "product_category_name"], how="left", validate="many_to_one",
    )
    reconciled["reference_price_cold_start"] = reconciled["prior_reference_price"].isna()
    reconciled.loc[reconciled["reference_price_cold_start"], "prior_reference_price"] = reconciled.loc[reconciled["reference_price_cold_start"], "price"]
    reconciled["reference_price"] = np.maximum(reconciled["price"], np.minimum(reconciled["prior_reference_price"], reconciled["price"] * 2.0))
    reconciled["gross_line"] = reconciled["reference_price"]
    reconciled["discount_line"] = reconciled["reference_price"] - reconciled["price"]
    if not np.allclose(reconciled.loc[reconciled["reference_price_cold_start"], "discount_line"], 0.0):
        raise ValueError("Cold-start reference-price fallback must produce zero proxy discount")
    reconciled["return_proxy_rate"] = np.select(
        [reconciled["order_status"].isin(["canceled", "unavailable"]), reconciled["review_score"] <= 1, reconciled["review_score"] <= 2],
        [0.50, 0.25, 0.10], default=0.0,
    )
    reconciled["return_line"] = reconciled["gross_line"] * reconciled["return_proxy_rate"]
    reconciled["cogs_line"] = reconciled["price"] * COGS_RATE

    order_economics = items.groupby("order_id", as_index=False).agg(item_price=("price", "sum"), freight=("freight_value", "sum"))
    order_economics = order_economics.merge(payment_total, on="order_id", how="left")
    order_economics["payment_gap"] = (order_economics["payment_total"] - order_economics["item_price"] - order_economics["freight"]).abs()

    diagnostics: dict[str, int | float] = {
        "raw_table_rows": raw_rows,
        "source_duplicate_rows": source_duplicate_rows,
        "orders": int(orders["order_id"].nunique()),
        "order_items": int(len(items)),
        "multi_payment_orders_collapsed": int((payments.groupby("order_id").size() > 1).sum()),
        "multi_review_orders_collapsed": int((reviews.groupby("order_id").size() > 1).sum()),
        "missing_product_categories_retained_as_unknown": int(products["product_category_name"].eq("unknown").sum()),
        "cold_start_item_rows_with_current_price_fallback": int(reconciled["reference_price_cold_start"].sum()),
        "orders_with_payment_reconciliation_gap_over_1_brl": int((order_economics["payment_gap"] > 1.0).sum()),
    }
    return reconciled, diagnostics


def aggregate_margin(rows: pd.DataFrame) -> pd.DataFrame:
    grain = ["week", "product_category_name", "region", "channel"]
    output = rows.groupby(grain, as_index=False, sort=True).agg(
        order_count=("order_id", "nunique"),
        units=("order_item_id", "size"),
        gross_revenue=("gross_line", "sum"),
        discounts=("discount_line", "sum"),
        returns=("return_line", "sum"),
        cogs=("cogs_line", "sum"),
        fulfillment=("freight_value", "sum"),
    )
    output["net_revenue"] = output["gross_revenue"] - output["discounts"] - output["returns"]
    output["contribution_margin"] = output["net_revenue"] - output["cogs"] - output["fulfillment"]
    output["unit_price"] = output["gross_revenue"] / output["units"]
    output["promo_depth"] = output["discounts"] / output["gross_revenue"]
    output["return_rate"] = output["returns"] / output["gross_revenue"]
    output["category"] = output["product_category_name"]
    output["product_id"] = "category:" + output["category"].str.lower().str.replace(r"[^a-z0-9]+", "-", regex=True).str.strip("-")
    output["product_name"] = output["category"].str.replace("_", " ").str.title()
    weeks = sorted(output["week"].unique())
    holdout_start = weeks[-HOLDOUT_WEEKS]
    output["period_split"] = np.where(output["week"] >= holdout_start, "holdout", "analysis")
    output["week"] = output["week"].dt.strftime("%Y-%m-%d")
    output["provenance"] = "Olist observed order/item/freight + dominant payment channel; prior-only reference-price with first-observed-category-week current-price fallback (zero proxy discount), review/status return, and 60% COGS proxies"
    output["injected_anomaly"] = False
    output["anomaly_reason"] = ""
    money_columns = ["unit_price", "gross_revenue", "discounts", "returns", "net_revenue", "cogs", "fulfillment", "contribution_margin"]
    output[money_columns] = output[money_columns].round(6)
    output[["promo_depth", "return_rate"]] = output[["promo_depth", "return_rate"]].round(9)
    output["order_count"] = output["order_count"].astype("int64")
    output["units"] = output["units"].astype("int64")
    return output[OUTPUT_COLUMNS].sort_values(["week", "category", "region", "channel"]).reset_index(drop=True)


def robust_z(values: np.ndarray) -> np.ndarray:
    median = float(np.median(values))
    mad = float(np.median(np.abs(values - median)))
    if mad <= 1e-12:
        return np.zeros_like(values, dtype=float)
    return 0.6744897501960817 * (values - median) / mad


def complete_weekly_margin_series(margin: pd.DataFrame) -> pd.DataFrame:
    weekly = margin[["week", "contribution_margin"]].copy()
    weekly["week"] = pd.to_datetime(weekly["week"], format="%Y-%m-%d", errors="raise")
    if weekly.empty or not weekly["week"].dt.dayofweek.eq(0).all():
        raise ValueError("Margin detector input must contain Monday week keys")
    observed = weekly.groupby("week", as_index=False)["contribution_margin"].sum().sort_values("week")
    calendar = pd.date_range(observed["week"].min(), observed["week"].max(), freq=WEEKLY_CALENDAR_FREQUENCY)
    completed = observed.set_index("week").reindex(calendar)
    completed.index.name = "week"
    completed["observed_week"] = completed["contribution_margin"].notna()
    completed["contribution_margin"] = completed["contribution_margin"].fillna(0.0)
    return completed.reset_index()


def build_detection_report(margin: pd.DataFrame, dataset_id: str, artifact_hash: str) -> dict[str, Any]:
    from statsmodels.tsa.seasonal import STL

    weekly = complete_weekly_margin_series(margin)
    observed = weekly["contribution_margin"].to_numpy(dtype=float)
    if len(observed) < 40:
        raise ValueError("At least 40 weekly observations are required for STL evaluation")
    calendar_indexes = np.arange(len(weekly))
    eligible_indexes = calendar_indexes[
        weekly["observed_week"].to_numpy(dtype=bool)
        & (calendar_indexes >= 14)
        & (calendar_indexes <= len(weekly) - 15)
    ]
    if len(eligible_indexes) < 6:
        raise ValueError("At least six observed replay weeks are required after STL boundary guards")
    candidate_indexes = eligible_indexes[np.linspace(0, len(eligible_indexes) - 1, 6, dtype=int)]
    scale = max(float(np.median(np.abs(observed - np.median(observed)))), float(np.std(observed)) * 0.25, 1.0)
    replay = observed.copy()
    injected_delta = -8.0 * scale
    replay[candidate_indexes] += injected_delta
    residual = STL(replay, period=13, robust=True).fit().resid
    scores = robust_z(residual)
    detected_indexes = set(np.flatnonzero(np.abs(scores) >= Z_THRESHOLD).tolist())
    label_indexes = set(candidate_indexes.tolist())
    true_positives = len(label_indexes & detected_indexes)
    false_positives = len(detected_indexes - label_indexes)
    false_negatives = len(label_indexes - detected_indexes)
    precision = true_positives / max(1, true_positives + false_positives)
    recall = true_positives / max(1, true_positives + false_negatives)
    labeled_weeks = [
        {
            "week": weekly.iloc[index]["week"].strftime("%Y-%m-%d"),
            "label": "deterministic fixed-location negative perturbation replay",
            "label_localized": {"en": "Deterministic fixed-location negative perturbation replay", "zh": "确定性固定位置负向扰动重放"},
            "detected": index in detected_indexes,
            "status": "detected" if index in detected_indexes else "missed",
            "injected_delta": round(float(injected_delta), 6),
            "robust_z_score": round(float(scores[index]), 6),
        }
        for index in candidate_indexes
    ]
    return {
        "report_version": "detection-report-v2",
        "dataset_id": dataset_id,
        "artifact_sha256": artifact_hash,
        "evaluated_at": EVALUATED_AT,
        "method": METHOD,
        "label_source": "six deterministic fixed-location negative perturbations replayed on observed Mondays in a complete Monday calendar; missing weeks are zero-filled and no manually labeled real anomalies are claimed",
        "label_source_localized": {
            "en": "Six deterministic fixed-location negative perturbations replayed on observed Mondays in a complete Monday calendar; missing weeks are zero-filled and no manually labeled real anomalies are claimed.",
            "zh": "在完整星期一日历中有观测的周上重放 6 个确定性固定位置负向扰动；缺失周补零，不声称存在人工标注的真实异常。",
        },
        "precision": round(precision, 6),
        "recall": round(recall, 6),
        "true_positives": true_positives,
        "false_positives": false_positives,
        "false_negatives": false_negatives,
        "threshold": Z_THRESHOLD,
        "stl_period_weeks": 13,
        "evaluated_week_count": int(len(weekly)),
        "calendar_frequency": WEEKLY_CALENDAR_FREQUENCY,
        "observed_week_count": int(weekly["observed_week"].sum()),
        "missing_week_count": int((~weekly["observed_week"]).sum()),
        "missing_weeks": weekly.loc[~weekly["observed_week"], "week"].dt.strftime("%Y-%m-%d").tolist(),
        "missing_week_treatment": MISSING_WEEK_TREATMENT,
        "replay_week_rule": "six evenly spaced observed Mondays after 14-calendar-week boundary guards",
        "labeled_weeks": labeled_weeks,
        "boundary": "The perturbations are evaluation labels only; they are never written into the real-data Parquet artifact.",
        "boundary_localized": {
            "en": "Evaluation labels only; missing calendar weeks are zero-filled before STL, replay weeks are observed Mondays, and perturbations never enter the real-data Parquet.",
            "zh": "仅作为评估标签；缺失日历周在 STL 前补零，重放周只选择有观测的星期一，扰动从不写入真实数据 Parquet。",
        },
    }


def build_elasticity_report(margin: pd.DataFrame, dataset_id: str, artifact_hash: str) -> dict[str, Any]:
    import statsmodels.api as sm

    frame = margin.copy()
    frame["realized_price"] = (frame["gross_revenue"] - frame["discounts"]) / frame["units"]
    frame["log_units"] = np.log1p(frame["units"].astype(float))
    frame["log_price"] = np.log(frame["realized_price"].clip(lower=0.01))
    split = frame["period_split"].eq("analysis")
    combined = pd.concat([
        frame[["log_price"]],
        pd.get_dummies(frame[["category", "region", "channel"]], drop_first=True, dtype=float),
    ], axis=1)
    design = sm.add_constant(combined, has_constant="add").astype(float)
    model = sm.OLS(frame.loc[split, "log_units"], design.loc[split]).fit(cov_type="HC3")
    predicted_units = np.expm1(model.predict(design.loc[~split])).clip(lower=0)
    actual_units = frame.loc[~split, "units"].to_numpy(dtype=float)
    holdout_mape = float(np.mean(np.abs(predicted_units - actual_units) / np.maximum(actual_units, 1.0)))
    coefficient = float(model.params["log_price"])
    interval = model.conf_int().loc["log_price"].tolist()
    return {
        "report_version": "elasticity-report-v1",
        "dataset_id": dataset_id,
        "artifact_sha256": artifact_hash,
        "evaluated_at": EVALUATED_AT,
        "method": ELASTICITY_METHOD,
        "coefficient": round(coefficient, 6),
        "confidence_interval_95": [round(float(interval[0]), 6), round(float(interval[1]), 6)],
        "holdout_mape": round(holdout_mape, 6),
        "analysis_rows": int(split.sum()),
        "holdout_rows": int((~split).sum()),
        "boundary": "Coefficient fit uses analysis rows only; the later eight-week holdout evaluates MAPE only. Associational observed/proxy-price estimate; no causal lift claim.",
    }


def validate_margin(frame: pd.DataFrame) -> None:
    if list(frame.columns) != OUTPUT_COLUMNS:
        raise ValueError("Output columns do not match the browser contract")
    grain = frame[["week", "category", "region", "channel"]].astype(str).agg("|".join, axis=1)
    week_split_counts = frame.groupby("week")["period_split"].nunique()
    analysis_weeks = sorted(frame.loc[frame["period_split"].eq("analysis"), "week"].unique())
    holdout_weeks = sorted(frame.loc[frame["period_split"].eq("holdout"), "week"].unique())
    checks = {
        "unique category grain": not grain.duplicated().any(),
        "split coverage": set(frame["period_split"]) == {"analysis", "holdout"},
        "week never crosses split": week_split_counts.eq(1).all(),
        "exact final eight holdout weeks": len(holdout_weeks) == HOLDOUT_WEEKS and bool(analysis_weeks) and max(analysis_weeks) < min(holdout_weeks),
        "category ID is one-to-one": frame.groupby("category")["product_id"].nunique().eq(1).all() and frame.groupby("product_id")["category"].nunique().eq(1).all(),
        "no raw entity IDs": frame["product_id"].str.startswith("category:").all(),
        "nonnegative components": (frame[["order_count", "units", "gross_revenue", "discounts", "returns", "cogs", "fulfillment"]] >= 0).all().all(),
        "bounded rates": frame["promo_depth"].between(0, 0.5).all() and frame["return_rate"].between(0, 0.5).all(),
        "gross identity": np.allclose(frame["gross_revenue"], frame["units"] * frame["unit_price"], atol=0.02),
        "net identity": np.allclose(frame["net_revenue"], frame["gross_revenue"] - frame["discounts"] - frame["returns"], atol=0.02),
        "margin identity": np.allclose(frame["contribution_margin"], frame["net_revenue"] - frame["cogs"] - frame["fulfillment"], atol=0.02),
        "no injected rows": not frame["injected_anomaly"].any(),
    }
    failed = [name for name, passed in checks.items() if not passed]
    if failed:
        raise ValueError(f"Margin artifact contract failed: {', '.join(failed)}")


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


def methods_evidence(
    artifact_hash: str,
    frame: pd.DataFrame,
    diagnostics: dict[str, int | float],
    detection: dict[str, Any],
    elasticity: dict[str, Any],
    lock: dict[str, Any],
) -> dict[str, Any]:
    analysis_rows = int(frame["period_split"].eq("analysis").sum())
    holdout_rows = int(frame["period_split"].eq("holdout").sum())
    weekly_calendar = complete_weekly_margin_series(frame)
    observed_weeks = int(weekly_calendar["observed_week"].sum())
    missing_weeks = int((~weekly_calendar["observed_week"]).sum())
    return {
        "report_version": "analytics-methods-v1",
        "project": "margin",
        "dataset": {
            "name": lock["dataset"], "source_url": lock["canonical_url"], "license": lock["license"]["name"],
            "retrieval_date": lock["retrieved_at"], "raw_records": diagnostics["raw_table_rows"], "derived_rows": len(frame),
            "date_range": [frame["week"].min(), frame["week"].max()], "artifact_sha256": artifact_hash,
        },
        "acquisition_and_cleaning": {
            "en": [
                "Pinned the Olist owner dataset and verified every transported table against locked byte counts and SHA-256 hashes.",
                f"Collapsed {diagnostics['multi_payment_orders_collapsed']:,} multi-payment orders to the largest payment-value channel and {diagnostics['multi_review_orders_collapsed']:,} multi-review orders to the lowest reported score.",
                "Joined order items to orders, customers, categories, payments, and reviews; retained missing categories as explicit unknown values and audited payment-versus-item-plus-freight gaps.",
                "Aggregated only after reconciliation to week × category × state-mapped region × payment channel.",
            ],
            "zh": [
                "锁定 Olist 官方发布的数据集，并用固定字节数与 SHA-256 校验每个传输表。",
                f"将 {diagnostics['multi_payment_orders_collapsed']:,} 个多支付订单归到支付金额最大的渠道，并把 {diagnostics['multi_review_orders_collapsed']:,} 个多评价订单折叠为最低评分。",
                "连接订单明细、订单、客户、品类、支付和评价；缺失品类明确保留为 unknown，并审计支付额与商品加运费的差额。",
                "完成对账后才聚合到 周 × 品类 × 州映射区域 × 支付渠道。",
            ],
        },
        "modeling": {
            "en": [
                f"Contribution margin uses observed item price and freight, a prior-only category reference-price discount proxy, a status/review return proxy, and a disclosed 60% COGS proxy. Across categories, {diagnostics['cold_start_item_rows_with_current_price_fallback']:,} item rows fall in their category's first observed week; they use current price and therefore receive zero proxy discount.",
                f"Before anomaly evaluation, {observed_weeks} observed weekly totals are reindexed to a complete {len(weekly_calendar)}-Monday calendar. The {missing_weeks} weeks with no derived Olist cells are explicitly zero-filled; replay labels are placed only on observed Mondays. The detector then applies a 13-week robust STL residual and MAD z-score threshold of 3.5.",
                "Elasticity is HC3 log-log OLS with category, region, and channel fixed effects; it is associational, not causal.",
            ],
            "zh": [
                f"贡献毛利使用实测商品价格与运费、仅引用历史的品类参考价折扣代理、状态/评价退货代理，以及明确披露的 60% COGS 代理。各品类首个观测周的 {diagnostics['cold_start_item_rows_with_current_price_fallback']:,} 条商品明细会回填当前价格，因此代理折扣为零。",
                f"异常评估前，{observed_weeks} 个有观测周总额会重建为连续 {len(weekly_calendar)} 个星期一的完整日历；{missing_weeks} 个没有 Olist 聚合单元的周明确补零，重放标签只放在有观测的星期一。随后采用 13 周 robust STL 残差与阈值 3.5 的 MAD z-score。",
                "弹性模型为带品类、区域和渠道固定效应的 HC3 log-log OLS；它只表示相关性，不表示因果。",
            ],
        },
        "split_and_leakage": {
            "en": [f"The last eight observed weeks are holdout ({holdout_rows:,} rows); all earlier weeks are analysis ({analysis_rows:,} rows).", "Reference prices use shifted expanding medians after the explicit first-observed-category-week current-price fallback; the elasticity coefficient is fit only on analysis rows, while later holdout rows evaluate MAPE only."],
            "zh": [f"最后 8 个观测周为 holdout（{holdout_rows:,} 行），此前为 analysis（{analysis_rows:,} 行）。", "除明确披露的品类首周当前价格回填外，参考价格使用向后移位的扩展中位数；弹性系数只在 analysis 行拟合，后续 holdout 行仅用于评估 MAPE。"],
        },
        "labels": {
            "en": ["Six deterministic fixed-location negative perturbations are replayed on observed Mondays within the complete calendar series.", "No manual real-anomaly label is claimed, and replay values are never written into the Parquet artifact."],
            "zh": ["在完整日历序列中有观测的星期一上重放 6 个确定性固定位置负向扰动。", "不声称存在人工真实异常标签，重放值也从不写入 Parquet 产物。"],
        },
        "trust": {
            "en": ["The pipeline fails closed on source hashes, unique grain, bounds, and all three accounting identities; verification also reconstructs the complete Monday calendar and both reports from the exact Parquet.", "The artifact embeds source URL, license, retrieval date, raw hashes, transform version, missing-week treatment, and proxy boundaries."],
            "zh": ["源哈希、唯一粒度、数值边界或三条会计恒等式任一失败，流水线都会阻断；验证还会从精确 Parquet 重建完整星期一日历与两份报告。", "产物内嵌来源 URL、许可证、获取日期、原始哈希、转换版本、缺失周处理与代理边界。"],
        },
        "changed": {
            "en": f"The synthetic walkthrough remains available, but real mode now queries {len(frame):,} reconciled cells. Measured replay precision/recall are {detection['precision']:.3f}/{detection['recall']:.3f}; the analysis-fit associational log-log price coefficient is {elasticity['coefficient']:+.3f}, with {elasticity['holdout_mape'] * 100:.2f}% MAPE on the later eight weeks.",
            "zh": f"合成演示仍保留，但真实模式现查询 {len(frame):,} 个已对账单元。实测重放 precision/recall 为 {detection['precision']:.3f}/{detection['recall']:.3f}；analysis 期拟合的相关性 log-log 价格系数为 {elasticity['coefficient']:+.3f}，后续 8 周的 MAPE 为 {elasticity['holdout_mape'] * 100:.2f}%。",
        },
        "metrics": [
            {"label": {"en": "Reconciled cells", "zh": "对账后单元"}, "value": f"{len(frame):,}"},
            {"label": {"en": "STL calendar / missing weeks", "zh": "STL 日历周 / 缺失周"}, "value": f"{len(weekly_calendar)} / {missing_weeks}"},
            {"label": {"en": "Replay precision / recall", "zh": "重放 precision / recall"}, "value": f"{detection['precision']:.3f} / {detection['recall']:.3f}"},
            {"label": {"en": "Holdout MAPE", "zh": "Holdout MAPE"}, "value": f"{elasticity['holdout_mape'] * 100:.2f}%"},
        ],
        "reproduction": [
            "python3 -m venv .venv && .venv/bin/pip install -r pipelines/olist-margin/requirements.txt",
            ".venv/bin/python pipelines/olist-margin/build.py --download",
            ".venv/bin/python pipelines/olist-margin/build.py --verify-only",
        ],
        "boundaries": {
            "en": "No causal lift, production decisioning, audited COGS, or manually verified real-anomaly claim.",
            "zh": "不声称因果提升、生产决策、经审计 COGS 或人工验证的真实异常。",
        },
    }


def verify_outputs(output_dir: Path) -> None:
    import pyarrow.parquet as pq

    parquet_path = output_dir / "olist-margin.parquet"
    detection_path = output_dir / "detection-report.json"
    elasticity_path = output_dir / "elasticity-report.json"
    methods_path = output_dir / "methods-evidence.json"
    for path in [parquet_path, detection_path, elasticity_path, methods_path]:
        if not path.exists() or path.stat().st_size == 0:
            raise ValueError(f"Missing output: {path}")
    if parquet_path.stat().st_size >= MAX_ARTIFACT_BYTES:
        raise ValueError(f"Margin Parquet exceeds the {MAX_ARTIFACT_BYTES}-byte browser budget")
    artifact_hash = sha256_file(parquet_path)
    frame = pd.read_parquet(parquet_path)
    validate_margin(frame)
    parquet_metadata = pq.read_metadata(parquet_path)
    embedded = {(key.decode() if isinstance(key, bytes) else str(key)): (value.decode() if isinstance(value, bytes) else str(value)) for key, value in (parquet_metadata.metadata or {}).items()}
    required_metadata = {"dataset_name", "source_url", "retrieved_at", "license", "transport_commit", "raw_sha256", "pipeline_version", "grain", "proxy_boundary", "holdout", "missing_week_treatment"}
    if not required_metadata.issubset(embedded) or any(not embedded[key].strip() for key in required_metadata):
        raise ValueError("Margin Parquet provenance metadata is incomplete")
    if any(parquet_metadata.row_group(group).column(column).compression != "ZSTD" for group in range(parquet_metadata.num_row_groups) for column in range(parquet_metadata.row_group(group).num_columns)):
        raise ValueError("Margin Parquet must use ZSTD for every column chunk")
    detection = json.loads(detection_path.read_text())
    expected_dataset_id = f"olist-margin-parquet-v1:{artifact_hash[:12]}"
    if detection.get("report_version") != "detection-report-v2" or detection.get("method") != METHOD or detection.get("artifact_sha256") != artifact_hash:
        raise ValueError("Detection report contract failed")
    if detection.get("dataset_id") != expected_dataset_id or detection.get("evaluated_at") != EVALUATED_AT or not isinstance(detection.get("label_source"), str) or not detection["label_source"].strip():
        raise ValueError("Detection report identity contract failed")
    if detection.get("threshold") != Z_THRESHOLD or detection.get("stl_period_weeks") != 13:
        raise ValueError("Detection method parameters are invalid")
    if any(not isinstance(detection.get(key), int) or detection[key] < 0 for key in ["true_positives", "false_positives", "false_negatives"]):
        raise ValueError("Detection counts are invalid")
    localized = lambda value: isinstance(value, dict) and all(isinstance(value.get(locale), str) and value[locale].strip() for locale in ["en", "zh"])
    if not localized(detection.get("label_source_localized")) or not localized(detection.get("boundary_localized")):
        raise ValueError("Detection report localized provenance contract failed")
    labeled_weeks = detection.get("labeled_weeks", [])
    if not isinstance(labeled_weeks, list) or len(labeled_weeks) != 6 or len(labeled_weeks) != detection["true_positives"] + detection["false_negatives"]:
        raise ValueError("Detection drill-down does not reconcile to TP + FN")
    if not all(isinstance(row, dict) and isinstance(row.get("week"), str) and len(row["week"]) == 10 and isinstance(row.get("label"), str) and row["label"].strip() and isinstance(row.get("detected"), bool) and localized(row.get("label_localized")) and row.get("status") == ("detected" if row["detected"] else "missed") and isinstance(row.get("injected_delta"), (int, float)) and math.isfinite(row["injected_delta"]) and isinstance(row.get("robust_z_score"), (int, float)) and math.isfinite(row["robust_z_score"]) for row in labeled_weeks):
        raise ValueError("Detection labeled-week contract failed")
    weekly_calendar = complete_weekly_margin_series(frame)
    expected_missing_weeks = weekly_calendar.loc[~weekly_calendar["observed_week"], "week"].dt.strftime("%Y-%m-%d").tolist()
    if len({row["week"] for row in labeled_weeks}) != len(labeled_weeks) or detection.get("evaluated_week_count") != len(weekly_calendar):
        raise ValueError("Detection labeled weeks or evaluated-week count are invalid")
    if detection.get("calendar_frequency") != WEEKLY_CALENDAR_FREQUENCY or detection.get("observed_week_count") != int(weekly_calendar["observed_week"].sum()) or detection.get("missing_week_count") != len(expected_missing_weeks) or detection.get("missing_weeks") != expected_missing_weeks or detection.get("missing_week_treatment") != MISSING_WEEK_TREATMENT:
        raise ValueError("Detection calendar completion contract failed")
    detected = sum(bool(row["detected"]) for row in labeled_weeks)
    if detected != detection["true_positives"] or len(labeled_weeks) - detected != detection["false_negatives"]:
        raise ValueError("Detection labeled-week statuses do not reconcile")
    expected_precision = detection["true_positives"] / max(1, detection["true_positives"] + detection["false_positives"])
    expected_recall = detection["true_positives"] / max(1, detection["true_positives"] + detection["false_negatives"])
    if not all(isinstance(detection.get(metric), (int, float)) and math.isfinite(detection[metric]) for metric in ["precision", "recall"]) or not (0 <= detection["precision"] <= 1 and 0 <= detection["recall"] <= 1 and abs(detection["precision"] - expected_precision) <= 0.000001 and abs(detection["recall"] - expected_recall) <= 0.000001):
        raise ValueError("Detection precision/recall do not reconcile to counts")
    if detection != build_detection_report(frame, expected_dataset_id, artifact_hash):
        raise ValueError("Detection report does not exactly reproduce from the Parquet artifact")
    elasticity = json.loads(elasticity_path.read_text())
    interval = elasticity.get("confidence_interval_95", [])
    if elasticity.get("report_version") != "elasticity-report-v1" or elasticity.get("artifact_sha256") != artifact_hash or elasticity.get("dataset_id") != detection["dataset_id"] or elasticity.get("evaluated_at") != EVALUATED_AT or elasticity.get("method") != ELASTICITY_METHOD:
        raise ValueError("Elasticity report identity contract failed")
    if not math.isfinite(elasticity.get("coefficient", math.nan)) or len(interval) != 2 or not all(isinstance(value, (int, float)) and math.isfinite(value) for value in interval) or interval[0] > interval[1] or not interval[0] <= elasticity["coefficient"] <= interval[1] or not math.isfinite(elasticity.get("holdout_mape", math.nan)) or elasticity["holdout_mape"] < 0:
        raise ValueError("Elasticity report contract failed")
    if any(not isinstance(elasticity.get(key), int) or elasticity[key] <= 0 for key in ["analysis_rows", "holdout_rows"]):
        raise ValueError("Elasticity split counts are invalid")
    if elasticity["analysis_rows"] != int(frame["period_split"].eq("analysis").sum()) or elasticity["holdout_rows"] != int(frame["period_split"].eq("holdout").sum()) or not isinstance(elasticity.get("boundary"), str) or not elasticity["boundary"].strip():
        raise ValueError("Elasticity report does not reconcile to the artifact split")
    if elasticity != build_elasticity_report(frame, expected_dataset_id, artifact_hash):
        raise ValueError("Elasticity report does not exactly reproduce from the Parquet artifact")
    methods = json.loads(methods_path.read_text())
    required_sections = ["acquisition_and_cleaning", "modeling", "split_and_leakage", "labels", "trust"]
    localized_list = lambda value: isinstance(value, dict) and all(isinstance(value.get(locale), list) and len(value[locale]) > 0 and all(isinstance(item, str) and item.strip() for item in value[locale]) for locale in ["en", "zh"])
    localized_text = lambda value: isinstance(value, dict) and all(isinstance(value.get(locale), str) and value[locale].strip() for locale in ["en", "zh"])
    dataset = methods.get("dataset", {})
    dataset_strings_valid = all(isinstance(dataset.get(key), str) and dataset[key].strip() for key in ["name", "source_url", "license", "retrieval_date"])
    dataset_range_valid = isinstance(dataset.get("date_range"), list) and len(dataset["date_range"]) == 2 and all(isinstance(value, str) and value.strip() for value in dataset["date_range"])
    if methods.get("report_version") != "analytics-methods-v1" or methods.get("project") != "margin" or dataset.get("artifact_sha256") != artifact_hash or not dataset_strings_valid or not dataset_range_valid or dataset.get("date_range") != [frame["week"].min(), frame["week"].max()] or not isinstance(dataset.get("raw_records"), int) or dataset["raw_records"] <= 0 or not isinstance(dataset.get("derived_rows"), int) or dataset["derived_rows"] != len(frame):
        raise ValueError("Methods evidence does not match the Parquet artifact")
    if not all(localized_list(methods.get(section)) for section in required_sections) or not localized_text(methods.get("changed")) or not localized_text(methods.get("boundaries")):
        raise ValueError("Methods evidence bilingual section contract failed")
    if not isinstance(methods.get("metrics"), list) or not methods["metrics"] or not all(isinstance(metric, dict) and localized_text(metric.get("label")) and isinstance(metric.get("value"), str) and metric["value"].strip() for metric in methods["metrics"]):
        raise ValueError("Methods evidence metrics contract failed")
    if not isinstance(methods.get("reproduction"), list) or not methods["reproduction"] or not all(isinstance(command, str) and command.strip() for command in methods["reproduction"]):
        raise ValueError("Methods evidence reproduction contract failed")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--download", action="store_true")
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()

    if args.verify_only:
        verify_outputs(args.output)
        print(f"Verified margin outputs in {args.output}")
        return

    lock = load_lock()
    require_safe_raw_location(args.input)
    if args.download:
        download_sources(args.input, lock)
    verify_sources(args.input, lock)
    reconciled, diagnostics = read_and_reconcile(args.input)
    margin = aggregate_margin(reconciled)
    validate_margin(margin)
    metadata = {
        "dataset_name": lock["dataset"],
        "source_url": lock["canonical_url"],
        "retrieved_at": lock["retrieved_at"],
        "license": lock["license"]["name"],
        "transport_commit": lock["transport"]["commit"],
        "raw_sha256": json.dumps({item["name"]: item["sha256"] for item in lock["files"]}, sort_keys=True),
        "pipeline_version": PIPELINE_VERSION,
        "grain": "week x product_category x state-mapped region x dominant payment channel",
        "proxy_boundary": "discount=prior-only category reference price; first observed category week falls back to current price and zero proxy discount; returns=status/review; COGS=60% observed item price",
        "holdout": "final 8 observed weeks",
        "missing_week_treatment": MISSING_WEEK_TREATMENT,
    }
    artifact_hash = write_parquet(margin, args.output / "olist-margin.parquet", metadata)
    if (args.output / "olist-margin.parquet").stat().st_size >= MAX_ARTIFACT_BYTES:
        raise ValueError(f"Margin Parquet exceeds the {MAX_ARTIFACT_BYTES}-byte browser budget")
    dataset_id = f"olist-margin-parquet-v1:{artifact_hash[:12]}"
    detection = build_detection_report(margin, dataset_id, artifact_hash)
    elasticity = build_elasticity_report(margin, dataset_id, artifact_hash)
    evidence = methods_evidence(artifact_hash, margin, diagnostics, detection, elasticity, lock)
    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "detection-report.json").write_text(json.dumps(detection, indent=2, ensure_ascii=False) + "\n")
    (args.output / "elasticity-report.json").write_text(json.dumps(elasticity, indent=2, ensure_ascii=False) + "\n")
    (args.output / "methods-evidence.json").write_text(json.dumps(evidence, indent=2, ensure_ascii=False) + "\n")
    verify_outputs(args.output)
    print(json.dumps({"artifact": str(args.output / "olist-margin.parquet"), "sha256": artifact_hash, "rows": len(margin), "detection": {"precision": detection["precision"], "recall": detection["recall"]}, "elasticity": {"coefficient": elasticity["coefficient"], "holdout_mape": elasticity["holdout_mape"]}}, indent=2))


if __name__ == "__main__":
    main()
