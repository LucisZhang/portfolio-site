#!/bin/sh
set -eu

NODE_VERSION=24.18.0
NODE_SHA256=55aa7153f9d88f28d765fcdad5ae6945b5c0f98a36881703817e4c450fa76742
NODE_PREFIX=/opt/node-v24.18.0-linux-x64
BASE=/srv/portfolio

fail() {
  printf '%s\n' "provision-loopback: $*" >&2
  exit 1
}

[ "$(id -u)" -eq 0 ] || fail "must run as root"
[ "$#" -eq 2 ] || fail "usage: provision-loopback.sh <node-archive> <asset-directory>"

node_archive=$1
asset_directory=$2
[ -f "$node_archive" ] || fail "Node.js archive missing"
[ -d "$asset_directory" ] || fail "asset directory missing"

for asset in portfolio-preview.service nginx-portfolio-preview.conf portfolio-release portfolio-rollback; do
  [ -f "$asset_directory/$asset" ] || fail "missing asset: $asset"
done

actual_node_sha=$(sha256sum "$node_archive" | awk '{print $1}')
[ "$actual_node_sha" = "$NODE_SHA256" ] || fail "Node.js archive checksum mismatch"

for port in 3100 18080; do
  if ss -ltn "sport = :$port" | grep -q LISTEN; then
    fail "required loopback port $port is already listening"
  fi
done

# Prevent package installation from starting the distribution's public :80 default server.
policy_created=0
if [ ! -e /usr/sbin/policy-rc.d ]; then
  printf '#!/bin/sh\nexit 101\n' >/usr/sbin/policy-rc.d
  chmod 0755 /usr/sbin/policy-rc.d
  policy_created=1
fi
trap 'if [ "$policy_created" -eq 1 ]; then rm -f /usr/sbin/policy-rc.d; fi' EXIT HUP INT TERM

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends nginx ca-certificates xz-utils curl

if [ "$policy_created" -eq 1 ]; then
  rm -f /usr/sbin/policy-rc.d
  policy_created=0
fi

if ! id portfolio >/dev/null 2>&1; then
  useradd --system --home-dir "$BASE" --shell /usr/sbin/nologin --user-group portfolio
fi
mkdir -p "$BASE/releases" /var/lib/portfolio-preview
chown -R portfolio:portfolio "$BASE" /var/lib/portfolio-preview
# Nginx needs traverse-only access to reach release-local public artifacts.
# Directory listing remains unavailable, and portfolio server/runtime files are
# kept private by portfolio-release.
chmod 0751 "$BASE" "$BASE/releases"
chmod 0750 /var/lib/portfolio-preview

if [ ! -x "$NODE_PREFIX/bin/node" ]; then
  tar -xJf "$node_archive" -C /opt
fi
node_version=$($NODE_PREFIX/bin/node --version)
[ "$node_version" = "v$NODE_VERSION" ] || fail "unexpected Node.js version: $node_version"

install -m 0644 "$asset_directory/portfolio-preview.service" /etc/systemd/system/portfolio-preview.service
install -m 0644 "$asset_directory/nginx-portfolio-preview.conf" /etc/nginx/conf.d/portfolio-preview.conf
install -m 0755 "$asset_directory/portfolio-release" /usr/local/sbin/portfolio-release
install -m 0755 "$asset_directory/portfolio-rollback" /usr/local/sbin/portfolio-rollback

if [ -L /etc/nginx/sites-enabled/default ]; then
  rm /etc/nginx/sites-enabled/default
fi

if [ ! -f /etc/portfolio-preview.env ]; then
  install -o root -g portfolio -m 0640 /dev/null /etc/portfolio-preview.env
fi

nginx -t
systemctl daemon-reload
systemctl enable nginx portfolio-preview.service
systemctl start nginx

# Fail closed until a verified release and required secrets are installed.
systemctl is-active nginx >/dev/null
ss -ltnp | grep -F '127.0.0.1:18080' >/dev/null || fail "Nginx loopback listener missing"
if ss -ltnp | grep -E '(^|[[:space:]])[^[:space:]]*:80([[:space:]]|$)|:443([[:space:]]|$)' | grep -v -E 'xray|x-ui'; then
  fail "unexpected new public listener detected"
fi

printf '%s\n' "provisioned loopback-only portfolio runtime"
