#!/bin/sh
set -eu

# Read-only preflight for a newly purchased, dedicated Asia Preview host. The
# output deliberately contains no public address, hostname, listener owner,
# credential, environment value, or command line.

proc_root=${PORTFOLIO_AUDIT_PROC_ROOT:-/proc}
etc_root=${PORTFOLIO_AUDIT_ETC_ROOT:-/etc}
root_mount=${PORTFOLIO_AUDIT_ROOT_MOUNT:-/}
blocked=0

block() {
  printf '%s\n' "blocker=$1"
  blocked=1
}

read_os_value() {
  key=$1
  awk -F= -v key="$key" '
    $1 == key {
      value = substr($0, index($0, "=") + 1)
      gsub(/^"|"$/, "", value)
      print value
      exit
    }
  ' "$etc_root/os-release"
}

listener_count() {
  port=$1
  ss -ltnH "sport = :$port" 2>/dev/null | awk 'END { print NR + 0 }'
}

network_check() {
  name=$1
  shift
  if "$@" >/dev/null 2>&1; then
    printf '%s\n' "$name=yes"
  else
    printf '%s\n' "$name=no"
    block "$name"
  fi
}

[ -r "$etc_root/os-release" ] || {
  printf '%s\n' 'audit_status=blocked' 'blocker=os_release_unreadable'
  exit 1
}
[ -r "$proc_root/meminfo" ] || {
  printf '%s\n' 'audit_status=blocked' 'blocker=meminfo_unreadable'
  exit 1
}

architecture=$(uname -m)
cpu_count=$(getconf _NPROCESSORS_ONLN)
memory_kib=$(awk '$1 == "MemTotal:" { print $2; exit }' "$proc_root/meminfo")
disk_kib=$(df -Pk "$root_mount" | awk 'NR == 2 { print $2; exit }')
os_id=$(read_os_value ID)
os_version=$(read_os_value VERSION_ID)
port_80=$(listener_count 80)
port_443=$(listener_count 443)
failed_units=$(systemctl --failed --no-legend --no-pager 2>/dev/null | awk 'END { print NR + 0 }')

printf '%s\n' \
  "architecture=$architecture" \
  "cpu_count=$cpu_count" \
  "memory_kib=$memory_kib" \
  "disk_kib=$disk_kib" \
  "os_id=$os_id" \
  "os_version=$os_version" \
  "listeners_80=$port_80" \
  "listeners_443=$port_443" \
  "failed_systemd_units=$failed_units"

case "$architecture" in
  x86_64|amd64) ;;
  *) block unsupported_architecture ;;
esac
case "$os_id:$os_version" in
  ubuntu:22.04|ubuntu:24.04) ;;
  *) block unsupported_operating_system ;;
esac
case "$cpu_count" in
  ''|*[!0-9]*) block invalid_cpu_count ;;
  *) [ "$cpu_count" -ge 2 ] || block insufficient_cpu ;;
esac
case "$memory_kib" in
  ''|*[!0-9]*) block invalid_memory_total ;;
  *) [ "$memory_kib" -ge 1800000 ] || block insufficient_memory ;;
esac
case "$disk_kib" in
  ''|*[!0-9]*) block invalid_disk_total ;;
  *) [ "$disk_kib" -ge 35000000 ] || block insufficient_disk ;;
esac
[ "$port_80" -eq 0 ] || block port_80_in_use
[ "$port_443" -eq 0 ] || block port_443_in_use
[ "$failed_units" -eq 0 ] || block failed_systemd_units

network_check outbound_dns getent ahostsv4 nodejs.org
network_check outbound_https curl -fsSI --max-time 8 https://nodejs.org/dist/v24.18.0/

if [ "$blocked" -ne 0 ]; then
  printf '%s\n' 'audit_status=blocked'
  exit 1
fi

printf '%s\n' 'audit_status=pass'
