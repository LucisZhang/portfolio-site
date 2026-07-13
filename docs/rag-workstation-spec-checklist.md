# RAG workstation spec checklist

Run this on the Linux workstation before Track C starts. Do not paste secrets,
API keys, private tokens, or internal hostnames that company policy forbids
sharing.

## 1. One-shot capture

```bash
mkdir -p ~/rag-workstation-probe
OUT=~/rag-workstation-probe/specs-$(date +%Y%m%d-%H%M%S).txt
{
  echo "## Time / host"
  date
  hostname
  whoami
  id

  echo
  echo "## OS / kernel"
  uname -a
  hostnamectl 2>/dev/null || true
  lsb_release -a 2>/dev/null || true
  cat /etc/os-release 2>/dev/null || true

  echo
  echo "## CPU"
  lscpu
  echo "nproc=$(nproc)"

  echo
  echo "## RAM"
  free -h

  echo
  echo "## Disk"
  df -h
  lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT

  echo
  echo "## GPU - NVIDIA"
  command -v nvidia-smi || true
  nvidia-smi 2>/dev/null || true
  nvidia-smi --query-gpu=name,memory.total,memory.free,driver_version,cuda_version --format=csv 2>/dev/null || true

  echo
  echo "## GPU - PCI devices"
  lspci | grep -Ei 'nvidia|amd|vga|3d|display' || true

  echo
  echo "## CUDA / compiler"
  command -v nvcc || true
  nvcc --version 2>/dev/null || true
  command -v gcc || true
  gcc --version 2>/dev/null | head -5 || true

  echo
  echo "## Python / package managers"
  command -v python3 || true
  python3 --version 2>/dev/null || true
  command -v pip3 || true
  pip3 --version 2>/dev/null || true
  command -v conda || true
  conda --version 2>/dev/null || true

  echo
  echo "## Git / GitHub"
  command -v git || true
  git --version 2>/dev/null || true
  command -v gh || true
  gh --version 2>/dev/null || true
  gh auth status 2>/dev/null || true

  echo
  echo "## Docker / container runtime"
  command -v docker || true
  docker --version 2>/dev/null || true
  docker info 2>/dev/null | sed -n '1,80p' || true
  command -v nvidia-container-cli || true
  nvidia-container-cli --version 2>/dev/null || true

  echo
  echo "## Ollama / local model runtime"
  command -v ollama || true
  ollama --version 2>/dev/null || true
  ollama list 2>/dev/null || true

  echo
  echo "## User limits / permissions"
  ulimit -a
  groups
  sudo -n true 2>/dev/null && echo "passwordless sudo: yes" || echo "passwordless sudo: no or unavailable"

  echo
  echo "## Network probes"
  curl -I --max-time 10 https://github.com 2>/dev/null | head -5 || true
  curl -I --max-time 10 https://huggingface.co 2>/dev/null | head -5 || true
  curl -I --max-time 10 https://pypi.org 2>/dev/null | head -5 || true
} 2>&1 | tee "$OUT"
echo "Saved to: $OUT"
```

## 2. Optional Python GPU probe

Run this only after Python dependencies are allowed to be installed. It does not
install anything by itself.

```bash
python3 - <<'PY'
import importlib.util
print("python ok")
if importlib.util.find_spec("torch") is None:
    print("torch: not installed")
else:
    import torch
    print("torch:", torch.__version__)
    print("cuda available:", torch.cuda.is_available())
    print("cuda device count:", torch.cuda.device_count())
    for i in range(torch.cuda.device_count()):
        print(i, torch.cuda.get_device_name(i))
        props = torch.cuda.get_device_properties(i)
        print("  total_memory_gb:", round(props.total_memory / 1024**3, 2))
PY
```

## 3. What to bring back

Bring back:

- `~/rag-workstation-probe/specs-*.txt`
- GPU model and VRAM from `nvidia-smi`
- free disk space from `df -h`
- whether Docker/Ollama/Python 3.11 are available
- whether GitHub, Hugging Face, and PyPI are reachable
- company policy constraints: allowed installs, allowed downloads, whether API keys may be used
