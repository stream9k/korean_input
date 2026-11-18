#!/usr/bin/env bash
# AlmaLinux / Rocky / RHEL / CentOS / Oreon CentOS Stream - 한글 입력기(ibus-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/stream9k/korean_input_method_installer/main/scripts/rhel-family/centos-stream.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.0.0"
LOG_FILE="/var/log/install-hangul-centos-stream.log"

log() { echo "[$(date '+%F %T')] $*" | tee -a "$LOG_FILE"; }
err() { log "❌ $*"; exit 1; }
warn() { log "⚠️  $*"; }
ok() { log "✅ $*"; }
info() { log "ℹ️  $*"; }

require_root() { [[ $EUID -eq 0 ]] || err "root 권한 필요: sudo bash $0"; }

detect_user() {
  local u="${SUDO_USER:-}"
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(logname 2>/dev/null || true)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(who | awk '{print $1}' | head -1)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  err "대상 사용자 탐지 실패"
}

main() {
  require_root
  mkdir -p "$(dirname "$LOG_FILE")"
  log "=== AlmaLinux / Rocky / RHEL / CentOS / Oreon CentOS Stream 한글 입력기(ibus-hangul) 설치 (v$SCRIPT_VERSION) ==="

  local USER TARGET_HOME TARGET_UID
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  info "사용자: $USER (UID=$TARGET_UID)"

  # 1. ibus-hangul 설치 (RHEL 계열 기본 공식 저장소)
  log "[1/3] ibus-hangul 패키지 설치 (dnf)..."
  dnf install -y -q ibus-hangul ibus-setup
  ok "패키지 설치 완료"

  # 2. GNOME 입력 소스 자동 등록
  log "[2/3] GNOME 입력 소스에 한국어(Hangul) 등록..."
  local sources="[('xkb', 'us'), ('ibus', 'hangul')]"
  if [ -S "/run/user/$TARGET_UID/bus" ]; then
    local bus="unix:path=/run/user/$TARGET_UID/bus"
    sudo -u "$USER" DBUS_SESSION_BUS_ADDRESS="$bus" gsettings set org.gnome.desktop.input-sources sources "$sources" 2>/dev/null || true
  else
    su - "$USER" -c "gsettings set org.gnome.desktop.input-sources sources \"$sources\"" 2>/dev/null || true
  fi
  ok "입력 소스 설정 완료"

  # 3. 환경변수 설정
  log "[3/3] 환경변수 설정..."
  local ENV_FILE="$TARGET_HOME/.config/environment.d/ibus.conf"
  mkdir -p "$(dirname "$ENV_FILE")"
  cat > "$ENV_FILE" <<'EOF'
GTK_IM_MODULE=ibus
QT_IM_MODULE=ibus
XMODIFIERS=@im=ibus
EOF
  chown -R "$USER:$USER" "$(dirname "$ENV_FILE")"

  local PROFILE_FILE="$TARGET_HOME/.bash_profile"
  [[ -f "$TARGET_HOME/.profile" && ! -f "$PROFILE_FILE" ]] && PROFILE_FILE="$TARGET_HOME/.profile"
  grep -q "GTK_IM_MODULE=ibus" "$PROFILE_FILE" 2>/dev/null || cat >> "$PROFILE_FILE" <<'EOF'

# ibus 환경변수
export GTK_IM_MODULE=ibus
export QT_IM_MODULE=ibus
export XMODIFIERS=@im=ibus
EOF
  chown "$USER:$USER" "$PROFILE_FILE"
  ok "환경변수 설정 완료"

  echo
  echo "============================================================"
  echo " 🎉 ibus-hangul 설치 완료! 재로그인 또는 재부팅 필요"
  echo " 전환: Super+Space 또는 한/영 키"
  echo " 세부 설정: ibus-setup"
  echo "============================================================"
}
main "$@"
