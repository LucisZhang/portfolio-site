#!/bin/sh
set -eu

CLOUDFLARED_VERSION=2026.7.2
CLOUDFLARED_SHA256=ec905ea7b7e327ff8abdde8cb64697a2152de74dbcdbf6aec9db8364eb3886cd
INSTALL_DIRECTORY=/opt/cloudflared-$CLOUDFLARED_VERSION
SCRIPT_DIRECTORY=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BINARY=${1:-$SCRIPT_DIRECTORY/cloudflared-linux-amd64}

fail() {
  printf '%s\n' "error: $*" >&2
  exit 1
}

[ "$(id -u)" -eq 0 ] || fail "run as root"
[ -f "$BINARY" ] || fail "missing pinned cloudflared binary"
printf '%s  %s\n' "$CLOUDFLARED_SHA256" "$BINARY" | sha256sum -c - >/dev/null \
  || fail "cloudflared checksum mismatch"
systemctl is-active --quiet portfolio-preview.service || fail "portfolio service is not active"
systemctl is-active --quiet x-ui.service || fail "proxy service is not active"
curl -fsS --max-time 3 http://127.0.0.1:18080/_vps/health >/dev/null \
  || fail "loopback Preview health check failed"
ss -ltnH | awk '{print $4}' | grep -Eq '(^|\])[^:]*:18081$' \
  && fail "port 18081 is already in use"

proxy_pid_before=$(systemctl show x-ui.service -p MainPID --value)
proxy_started_before=$(systemctl show x-ui.service -p ExecMainStartTimestamp --value)
xray_pid_before=$(pidof xray-linux-amd64)

if ! id portfolio-tunnel >/dev/null 2>&1; then
  useradd --system --user-group --no-create-home --home-dir /var/empty \
    --shell /usr/sbin/nologin portfolio-tunnel
fi
getent group portfolio-tunnel >/dev/null || fail "portfolio-tunnel group is missing"
install -d -o root -g root -m 0755 "$INSTALL_DIRECTORY"
install -o root -g root -m 0755 "$BINARY" "$INSTALL_DIRECTORY/cloudflared"
install -o root -g root -m 0644 "$SCRIPT_DIRECTORY/nginx-portfolio-preview-tunnel.conf" \
  /etc/nginx/conf.d/portfolio-preview-tunnel.conf
install -o root -g root -m 0644 "$SCRIPT_DIRECTORY/portfolio-preview-tunnel.service" \
  /etc/systemd/system/portfolio-preview-tunnel.service
install -o root -g root -m 0755 "$SCRIPT_DIRECTORY/portfolio-preview-tunnel-start" \
  /usr/local/sbin/portfolio-preview-tunnel-start
install -o root -g root -m 0755 "$SCRIPT_DIRECTORY/portfolio-preview-tunnel-stop" \
  /usr/local/sbin/portfolio-preview-tunnel-stop

nginx -t
systemctl daemon-reload
systemctl reload nginx
curl -fsS --max-time 3 http://127.0.0.1:18081/_vps/health >/dev/null \
  || fail "dedicated tunnel ingress health check failed"
systemctl is-active --quiet portfolio-preview-tunnel.service \
  && fail "tunnel unexpectedly active before the explicit start gate"
systemctl is-enabled --quiet portfolio-preview-tunnel.service \
  && fail "temporary tunnel must not be enabled at boot"
if runuser -u portfolio-tunnel -- test -r /etc/portfolio-preview.env; then
  fail "tunnel user can read the portfolio secret file"
fi

proxy_pid_after=$(systemctl show x-ui.service -p MainPID --value)
proxy_started_after=$(systemctl show x-ui.service -p ExecMainStartTimestamp --value)
xray_pid_after=$(pidof xray-linux-amd64)
[ "$proxy_pid_before" = "$proxy_pid_after" ] || fail "proxy PID changed"
[ "$proxy_started_before" = "$proxy_started_after" ] || fail "proxy start time changed"
[ "$xray_pid_before" = "$xray_pid_after" ] || fail "xray PID changed"
printf '%s\n' "provisioned disabled Quick Tunnel runtime; no public URL was created"
