#!/usr/bin/env bash
# SteamOS 3.x SteamOS 3 / Deck Desktop Mode - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/stream9k/korean_input_method_installer/main/scripts/steamos/steamos-holo.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.0.0"
LOG_FILE="/var/log/install-hangul-steamos-holo.log"

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
  echo "deck"
}

cleanup() {
  if command -v steamos-readonly >/dev/null 2>&1; then
    steamos-readonly enable 2>/dev/null || true
  fi
}

main() {
  require_root
  mkdir -p "$(dirname "$LOG_FILE")"
  trap cleanup EXIT
  log "=== SteamOS 3.x SteamOS 3 / Deck Desktop Mode 한글 입력기 설치 (v$SCRIPT_VERSION) ==="

  local USER TARGET_HOME
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  info "사용자: $USER (HOME=$TARGET_HOME)"

  # 1. 읽기 전용 해제 및 pacman 키 초기화
  log "[1/4] steamos-readonly 해제 및 패키지 설치..."
  steamos-readonly disable
  pacman-key --init
  pacman-key --populate archlinux holo 2>/dev/null || pacman-key --populate
  pacman -Sy --needed --noconfirm \
    fcitx5-im fcitx5-hangul fcitx5-configtool fcitx5-gtk fcitx5-qt
  ok "패키지 설치 완료"

  # 2. 시스템 환경변수
  log "[2/4] 시스템 환경변수 설정..."
  grep -q "GTK_IM_MODULE=fcitx" /etc/environment 2>/dev/null || cat >> /etc/environment <<'EOF'

# fcitx5 환경변수
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
  ok "환경변수 추가"

  # 3. 사용자 Fcitx5 설정 및 자동시작
  log "[3/4] 사용자 설정 및 자동시작 등록..."
  local FCITX5_DIR="$TARGET_HOME/.config/fcitx5"
  mkdir -p "$FCITX5_DIR"
  cat > "$FCITX5_DIR/profile" <<'EOF'
[Groups/0]
Name=Default
Default Layout=us
DefaultIM=keyboard-us
[Groups/0/Items/0]
Name=keyboard-us
Layout=
[Groups/0/Items/1]
Name=hangul
Layout=
[GroupOrder]
0=Default
EOF
  cat > "$FCITX5_DIR/config" <<'EOF'
[Hotkey]
EnumerateWithTriggerKeys=True
SkipFirst=False
[Hotkey/TriggerKeys]
0=Hangul
1=Control+space
2=Shift+space
EOF
  chown -R "$USER:$USER" "$FCITX5_DIR"

  local ADIR="$TARGET_HOME/.config/autostart"
  mkdir -p "$ADIR"
  cat > "$ADIR/fcitx5.desktop" <<'EOF'
[Desktop Entry]
Type=Application
Name=Fcitx 5
Exec=fcitx5 -d
X-GNOME-Autostart-enabled=true
Hidden=false
NoDisplay=false
EOF
  chown -R "$USER:$USER" "$ADIR"
  ok "사용자 설정 완료"

  # 4. 읽기 전용 복구
  log "[4/4] steamos-readonly 복구..."
  steamos-readonly enable
  ok "읽기 전용 복구 완료"

  echo
  echo "============================================================"
  echo " 🎉 SteamOS 설치 완료! 재로그인 또는 재부팅 필요"
  echo " KDE: 시스템설정 → 입력장치 → 가상키보드 → Fcitx 5 선택"
  echo " 참고: SteamOS 메이저 업데이트 시 루트 패키지가 초기화될 수 있습니다."
  echo "============================================================"
}
main "$@"
