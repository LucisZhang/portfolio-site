# p1-reliability-lab 远程 Linux 全量复现操作指南

## 给 Codex CLI 的执行 prompt

在远程 Linux 开发机上打开 Codex CLI 后，把下面整段作为第一条消息发给它。这个 prompt
只说明要完成的工作、成功标准、失败处理和必须提交/返回的 portfolio 证据。

```text
你要在这台 Linux 机器上完成 p1-reliability-lab 的可审计全量复现，并把结果整理成可用于
portfolio-site 的证据材料。严格按步骤执行，不要跳步，不要为了通过而篡改结果文件。

仓库：
- GitHub: https://github.com/LucisZhang/p1-reliability-lab
- 目标分支基线: main
- main 必须包含 05738dd 或后续等效提交；否则停止并说明远端版本不对。

边界：
- 只在本次工作目录、repo 目录和本项目 Docker 资源范围内操作。
- 不要使用 sudo，除非人工明确批准。
- 如果仓库无法 clone、磁盘不足、Docker 不响应、依赖安装失败或测试失败，不要强行绕过。
  保存日志，说明失败阶段和需要人工处理的事项。
- 只有 eo_reconciliation.json 明确 summary.passed=true，且五类 failure class 全部通过，才算成功。

执行：
1. 准备工作区并 clone 仓库：
   mkdir -p ~/portfolio-work
   cd ~/portfolio-work
   git clone https://github.com/LucisZhang/p1-reliability-lab.git
   cd p1-reliability-lab
   git switch main
   git pull --ff-only
2. 创建证据分支和证据目录：
   BRANCH="evidence/u6-remote-linux-$(date -u +%Y%m%dT%H%M%SZ)"
   EVIDENCE_DIR="docs/workstation-run/$(date -u +%Y%m%dT%H%M%SZ)-remote-linux"
   git switch -c "$BRANCH"
   mkdir -p "$EVIDENCE_DIR"
3. 记录版本和机器信息：
   git log --oneline -5 | tee "$EVIDENCE_DIR/git-log.txt"
   git rev-parse HEAD | tee "$EVIDENCE_DIR/git-head.txt"
   uname -a | tee "$EVIDENCE_DIR/uname.txt"
   lscpu | tee "$EVIDENCE_DIR/lscpu.txt" || true
   free -h | tee "$EVIDENCE_DIR/memory.txt" || true
   df -h . | tee "$EVIDENCE_DIR/disk-before.txt"
   java -version 2>&1 | tee "$EVIDENCE_DIR/java-version.txt"
   mvn -version | tee "$EVIDENCE_DIR/maven-version.txt"
   python3 --version | tee "$EVIDENCE_DIR/python-version.txt"
   node --version | tee "$EVIDENCE_DIR/node-version.txt"
   docker version | tee "$EVIDENCE_DIR/docker-version.txt"
   docker info > "$EVIDENCE_DIR/docker-info.txt"
4. 确认 git log 能看到 05738dd 或后续等效提交；如果看不到，停止。
5. 运行轻量验证：
   make doctor 2>&1 | tee "$EVIDENCE_DIR/doctor.log"
   make local-verify 2>&1 | tee "$EVIDENCE_DIR/local-verify.log"
6. 运行 heavy preflight：
   make preflight-heavy 2>&1 | tee "$EVIDENCE_DIR/preflight-heavy.log"
7. 启动 core stack 并保存状态：
   make up-core 2>&1 | tee "$EVIDENCE_DIR/up-core.log"
   make ps 2>&1 | tee "$EVIDENCE_DIR/compose-ps-before.txt"
8. 执行五类故障复现，并完整保存输出：
   make eo-verify ARGS="--failure all" 2>&1 | tee "$EVIDENCE_DIR/eo-verify.log"
9. 检查 showcase/results/eo_reconciliation.json：
   - summary.passed 必须为 true
   - failure_class 必须包含 task-crash、checkpoint-restore、jobmanager-restart、
     savepoint-restore、sink-commit-fault
   - 每类 snapshot_diff_count 必须为 0
   - event_id_audit 必须一致
10. 如果成功，读取 RUN_ID，并复制证据：
    RUN_ID=$(python3 - <<'PY'
import json
from pathlib import Path
print(json.loads(Path("showcase/results/eo_reconciliation.json").read_text())["run_id"])
PY
    )
    cp showcase/results/eo_reconciliation.json "showcase/results/eo_reconciliation-${RUN_ID}-remote-linux.json"
    cp "$EVIDENCE_DIR/eo-verify.log" "showcase/logs/phase-2.1-eo-verify-${RUN_ID}-remote-linux.log"
11. 保存收尾状态和校验和：
    date -u +"%Y-%m-%dT%H:%M:%SZ" | tee "$EVIDENCE_DIR/finished-at.txt"
    df -h . | tee "$EVIDENCE_DIR/disk-after.txt"
    make ps 2>&1 | tee "$EVIDENCE_DIR/compose-ps-after.txt"
    shasum -a 256 "$EVIDENCE_DIR"/* \
      "showcase/results/eo_reconciliation-${RUN_ID}-remote-linux.json" \
      "showcase/logs/phase-2.1-eo-verify-${RUN_ID}-remote-linux.log" \
      | tee "$EVIDENCE_DIR/sha256s.txt"
12. 在 RUNBOOK.md 追加 Remote Linux reproduction 记录，写清：
    - UTC 时间
    - 分支名、commit、RUN_ID
    - 机器信息摘要：OS、CPU、RAM、Docker、开始/结束磁盘
    - 五类 failure class 的结果
    - 证据文件路径
13. 提交并推送证据分支：
    git status --short
    git add RUNBOOK.md "$EVIDENCE_DIR" \
      "showcase/results/eo_reconciliation-${RUN_ID}-remote-linux.json" \
      "showcase/logs/phase-2.1-eo-verify-${RUN_ID}-remote-linux.log"
    git commit -m "evidence: reproduce five-failure EO on remote linux"
    git push -u origin HEAD
14. 无论成功或失败，最后运行 make down 清理本项目 compose stack。

必须返回/提交给 portfolio-site 的材料：
- 证据分支名和 commit SHA
- RUN_ID 和 git_sha
- showcase/results/eo_reconciliation-${RUN_ID}-remote-linux.json
- showcase/logs/phase-2.1-eo-verify-${RUN_ID}-remote-linux.log
- docs/workstation-run/<timestamp>-remote-linux/ 整个目录
- 更新后的 RUNBOOK.md
- sha256s.txt
- 一段简短结论：成功/失败；若失败，失败阶段、关键日志路径、下一步建议
```

目标：在远程 Linux 机器上完成 `p1-reliability-lab` 的完整 heavy stack 复现，并把结果整理成
可直接支撑 `portfolio-site` 的证据材料。

## 仓库公开策略

远程开发机通常只有命令行环境，配置个人 GitHub SSH key 或 PAT 比较麻烦。**建议路径是：先做
公开前检查，确认没有真实 secret、个人敏感信息、超大文件或不该公开的内部说明后，再把
`LucisZhang/p1-reliability-lab` 设为 public。** 这样远程机器可以直接用 HTTPS clone。

当前状态（2026-07-10）：已按人工批准将
`https://github.com/LucisZhang/p1-reliability-lab` 设为 public。远程 Linux 机器可以直接用
HTTPS clone，不需要配置个人 GitHub SSH key 或 PAT。

公开前至少检查：

```bash
cd ~/p1-reliability-lab
git status --short
find . -type f -size +50M -not -path './.git/*' -print
rg -n --hidden -S "(password|passwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|BEGIN (RSA|OPENSSH|PRIVATE)|ghp_|github_pat_|AKIA|OPENAI_API_KEY|ANTHROPIC_API_KEY|AWS_)" \
  -g '!/.git/**' -g '!/.venv/**' -g '!/.m2/**' -g '!dashboard/node_modules/**' -g '!flink-jobs/target/**'
```

说明：

- `cdc_pw`、`minioadmin` 这类 Docker Compose 本地实验默认密码不是生产 secret，但公开时最好在
  README/RUNBOOK 里明确它们只是本地 lab 默认值。
- repo 里的 `AGENTS.md` 是内部操作说明；如果 repo 公开，需要人工确认它是否适合保留。
- GitHub 当前应返回 `visibility=PUBLIC`、`isPrivate=false`。

## 一句话原则

- 远程 Linux：跑 `make eo-verify ARGS="--failure all"` 全量五类故障复现。
- 作品集：只根据带回来的证据说话。没有成功带回全量证据前，不写 "reproduced on demand"。

## 0. 开始前检查

远程机器建议条件：

- 至少 16 GB RAM，Docker 可用内存建议 10-12 GB 以上。
- 开始前至少 40 GB 可用磁盘空间。
- Docker Engine 可正常运行。
- Java 11、Maven 3.9、Python 3.11、Node 20。
- 可以 clone `LucisZhang/p1-reliability-lab`。

如果仓库仍是 private，远程机器需要可用的 SSH key、PAT 或 GitHub CLI 登录。若无法安全配置凭证，
优先走公开仓库路径。

版本门槛：

- 本指南假设远程机器 clone 到的 p1 repo 包含远端 `main` 上的提交 `05738dd` 或后续提交。这个提交加入了
  `make local-verify`、`make preflight-heavy` 和工作站说明。
- 如果 `git log --oneline -3` 看不到 `05738dd` 或后续包含这些改动的提交，先不要直接照第
  4 步跑。需要先确认远程机器 clone 到的是最新远端 `main`，或切到包含该提交的分支。
- 没拿到该提交时，旧版 repo 仍可跑 heavy stack，但没有磁盘/Docker 预检保护，容易复现本机
  ENOSPC 问题。

## 1. 在远程 Linux 机器准备仓库

```bash
mkdir -p ~/portfolio-work
cd ~/portfolio-work
git clone https://github.com/LucisZhang/p1-reliability-lab.git
cd p1-reliability-lab
git checkout main
git pull --ff-only
git checkout -b evidence/u6-remote-linux-$(date -u +%Y%m%dT%H%M%SZ)
git log --oneline -3
```

如果仓库仍是 private 且 HTTPS 无法 clone，才改用 SSH/PAT：

```bash
git clone git@github.com:LucisZhang/p1-reliability-lab.git
```

## 2. 准备本地环境

优先用 repo 自带工具链版本；没有 mise/asdf 也可以用系统安装，只要版本匹配。

```bash
java -version
mvn -version
python3 --version
node --version
docker version
docker info
df -h .
```

如果 8081 被占用，修改 gitignored `.env`：

```bash
cp .env.example .env
printf '\nFLINK_REST_PORT=18081\n' >> .env
```

## 3. 先跑轻量验证

```bash
make doctor
make local-verify
git status --short
```

预期：

- `make doctor` 通过。
- `make local-verify` 通过。
- `git status --short` 只允许出现可解释的生成文件；理想状态是干净。

如果轻量验证失败，先不要跑 heavy stack。把失败日志保存下来，回本地再判断。

## 4. 跑 heavy preflight

```bash
make preflight-heavy
df -h .
```

预期：

- 剩余磁盘大于 25 GiB；建议大于 40 GiB。
- Docker daemon 在 10 秒内响应。

如果 preflight 失败，不要强行覆盖阈值。先释放远程机器空间或修复 Docker。

## 5. 启动 core stack

```bash
make up-core
make ps
```

预期：

- MySQL、Flink JobManager、Flink TaskManager、MinIO、Iceberg catalog 相关服务都处于
  running/healthy 状态。
- 如果某个服务不健康，先看 compose 日志，不要直接进入 `eo-verify`。

保存一次环境快照：

```bash
mkdir -p docs/workstation-run
date -u +"%Y-%m-%dT%H:%M:%SZ" | tee docs/workstation-run/started-at.txt
git rev-parse HEAD | tee docs/workstation-run/git-head.txt
git status --short | tee docs/workstation-run/git-status-before.txt
df -h . | tee docs/workstation-run/disk-before.txt
docker compose --env-file .env -f infra/docker-compose.yml ps | tee docs/workstation-run/compose-ps-before.txt
docker info > docs/workstation-run/docker-info.txt
```

## 6. 跑五类故障全量复现

```bash
make eo-verify ARGS="--failure all"
```

成功标准：

- 命令退出码为 0。
- `showcase/results/eo_reconciliation.json` 里 `summary.passed=true`。
- 五类 failure class 都在结果中：
  - `task-crash`
  - `checkpoint-restore`
  - `jobmanager-restart`
  - `savepoint-restore`
  - `sink-commit-fault`
- 每类 `snapshot_diff_count=0`。
- event-id audit 一致。

用 Python 快速检查：

```bash
python3 - <<'PY'
import json
from pathlib import Path

doc = json.loads(Path("showcase/results/eo_reconciliation.json").read_text())
print("run_id:", doc.get("run_id"))
print("git_sha:", doc.get("git_sha"))
print("summary:", doc.get("summary"))
for row in doc.get("results", []):
    audit = row.get("event_id_audit", {})
    print(row.get("failure_class"), "diff=", row.get("snapshot_diff_count"), "audit=", audit)
PY
```

如果失败：

- 不要改结果 JSON 伪装成功。
- 复制失败日志，记录失败阶段和错误。
- 执行第 9 步清理。
- 保留失败 evidence bundle，用于后续 portfolio 记录和诊断。

## 7. 固化本次成功证据

如果第 6 步成功，创建 timestamped copy，避免覆盖旧证据后无法区分。

```bash
RUN_ID=$(python3 - <<'PY'
import json
from pathlib import Path
print(json.loads(Path("showcase/results/eo_reconciliation.json").read_text())["run_id"])
PY
)

cp showcase/results/eo_reconciliation.json "showcase/results/eo_reconciliation-${RUN_ID}-remote-linux.json"
cp showcase/logs/phase-2.1-eo-verify.log "showcase/logs/phase-2.1-eo-verify-${RUN_ID}-remote-linux.log"

date -u +"%Y-%m-%dT%H:%M:%SZ" | tee docs/workstation-run/finished-at.txt
df -h . | tee docs/workstation-run/disk-after.txt
docker compose --env-file .env -f infra/docker-compose.yml ps | tee docs/workstation-run/compose-ps-after.txt
shasum -a 256 "showcase/results/eo_reconciliation-${RUN_ID}-remote-linux.json" \
  "showcase/logs/phase-2.1-eo-verify-${RUN_ID}-remote-linux.log" \
  | tee docs/workstation-run/sha256s.txt
```

在 `RUNBOOK.md` 追加一段 `Remote Linux reproduction`，至少写：

- 日期和 UTC 时间。
- 远程机器环境摘要：OS、CPU/RAM、Docker memory、开始/结束磁盘空间。
- `RUN_ID`。
- `git_sha`。
- 五类 failure class 通过，`snapshot_diff_count=0`。
- artifacts 路径。

## 8. 推荐回传方式：commit + push 分支

成功后在远程机器上提交证据分支：

```bash
git status --short
git add RUNBOOK.md docs/workstation-run \
  "showcase/results/eo_reconciliation-${RUN_ID}-remote-linux.json" \
  "showcase/logs/phase-2.1-eo-verify-${RUN_ID}-remote-linux.log"

git commit -m "evidence: reproduce five-failure EO on remote linux"
git push -u origin HEAD
```

回到主开发环境后：

```bash
cd ~/p1-reliability-lab
git fetch origin
git switch main
git pull --ff-only
git switch -c import-remote-linux-u6 origin/evidence/u6-remote-linux-<timestamp>
```

检查证据：

```bash
python3 - <<'PY'
import json
from pathlib import Path

for path in sorted(Path("showcase/results").glob("eo_reconciliation-*-remote-linux.json")):
    doc = json.loads(path.read_text())
    print(path.name, doc["run_id"], doc["git_sha"], doc.get("summary"))
PY
```

## 9. 备选回传方式：打包 evidence bundle

如果远程机器不能 push 到 GitHub，就打包下面这些文件：

```bash
BUNDLE="p1-remote-linux-evidence-${RUN_ID}.tar.gz"
tar -czf "$BUNDLE" \
  RUNBOOK.md \
  docs/workstation-run \
  "showcase/results/eo_reconciliation-${RUN_ID}-remote-linux.json" \
  "showcase/logs/phase-2.1-eo-verify-${RUN_ID}-remote-linux.log"
shasum -a 256 "$BUNDLE" > "$BUNDLE.sha256"
ls -lh "$BUNDLE" "$BUNDLE.sha256"
```

拿到 bundle 后放到一个临时目录，先解包检查：

```bash
mkdir -p ~/p1-evidence-import
cd ~/p1-evidence-import
tar -xzf /path/to/p1-remote-linux-evidence-<run_id>.tar.gz
shasum -a 256 -c /path/to/p1-remote-linux-evidence-<run_id>.tar.gz.sha256
```

然后再由本地 Codex/Claude 按文件复制进 `p1-reliability-lab` 和 `portfolio-site`。

## 10. 远程机器收尾清理

不管成功还是失败，都要清理远程机器上的本项目 Docker 栈：

```bash
make down
docker compose --env-file .env -f infra/docker-compose.yml ps
df -h .
```

只在你确认没有其他项目依赖这些 Docker 资源时，才考虑额外 Docker 清理。不要默认运行全局
`docker system prune`。

## 11. Portfolio site 需要更新什么

成功时，把下面信息带回：

- p1 evidence branch 名称或 commit SHA。
- `RUN_ID`。
- `git_sha`。
- 新 JSON：`showcase/results/eo_reconciliation-${RUN_ID}-remote-linux.json`。
- 新 log：`showcase/logs/phase-2.1-eo-verify-${RUN_ID}-remote-linux.log`。
- `docs/workstation-run/` 整个目录。
- 更新后的 `RUNBOOK.md`。
- `sha256s.txt`。

然后本地 portfolio 更新：

1. 复制 JSON/log/environment summary 到 `portfolio-site/public/case-studies/p1-reliability-lab/`
   或 `portfolio-site/docs/p1-u6-attempts/` 的新 remote-linux 子目录。
2. 更新 `portfolio-site/docs/p1-u6-attempts/RECORD.md`：把状态从
   "not reproducible on this machine today" 改成 "reproduced on remote Linux at <date>"。
3. 更新 `portfolio-site/STATE.md`。
4. 只有在所有证据都齐全并校验通过后，case study 才能写：
   "full heavy-stack reproduction completed on remote Linux"。

## 12. 失败时怎么记录

如果远程机器也失败，不要硬改项目结论。保留：

- 失败日志。
- `git-head.txt`。
- `disk-before.txt` / `disk-after.txt`。
- `compose-ps-before.txt` / `compose-ps-after.txt`。
- Docker info。
- 失败时的 `showcase/results/eo_reconciliation.json`，如果有。

portfolio 文案继续保持：

- committed May 2026 artifacts are the evidence；
- remote Linux reproduction attempts are documented；
- do not claim on-demand reproduction until one full run passes.
