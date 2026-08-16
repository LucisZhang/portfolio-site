#!/bin/sh
set -eu

fail() {
  printf '%s\n' "deploy-loopback: $*" >&2
  exit 1
}

[ "$#" -eq 3 ] || fail "usage: deploy-loopback.sh <ssh-host> <archive> <source-commit>"
ssh_host=$1
archive=$2
source_commit=$3

[ -f "$archive" ] || fail "archive missing"
case "$ssh_host" in
  -*|*[!A-Za-z0-9._@:-]*) fail "invalid SSH host alias" ;;
esac
case "$source_commit" in
  *[!0-9a-f]*|'') fail "invalid source commit" ;;
esac
[ "${#source_commit}" -eq 40 ] || fail "invalid source commit length"

if command -v sha256sum >/dev/null 2>&1; then
  archive_sha=$(sha256sum "$archive" | awk '{print $1}')
else
  archive_sha=$(shasum -a 256 "$archive" | awk '{print $1}')
fi
remote_archive="/var/tmp/portfolio-$source_commit.tar.gz"

scp "$archive" "$ssh_host:$remote_archive"
release_status=0
ssh "$ssh_host" /usr/local/sbin/portfolio-release "$remote_archive" "$archive_sha" "$source_commit" \
  || release_status=$?
ssh "$ssh_host" rm -f "$remote_archive" || true
[ "$release_status" -eq 0 ] || fail "remote release failed"

printf '%s\n' "deployed $source_commit to loopback-only Preview"
