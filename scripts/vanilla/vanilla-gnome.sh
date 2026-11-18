#!/usr/bin/env bash
# Vanilla OS Vanilla OS 2 Orchid (GNOME) - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/vanilla/vanilla-gnome.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.1.0"
LOG_FILE="/var/log/install-hangul-vanilla-gnome.log"

log() { echo "[$(date '+%F %T')] $*" | tee -a "$LOG_FILE"; }
err() { log "❌ $*"; exit 1; }
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
  log "=== Vanilla OS Vanilla OS 2 Orchid (GNOME) 한글 입력기 설치 (v$SCRIPT_VERSION) ==="

  local USER TARGET_HOME
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  info "사용자: $USER (HOME=$TARGET_HOME)"

  # 1. ABRoot 패키지 추가
  log "[1/4] fcitx5 패키지 추가 (abroot pkg add)..."
  abroot pkg add \
    fcitx5 fcitx5-hangul fcitx5-config-qt \
    fcitx5-frontend-gtk3 fcitx5-frontend-gtk4 \
    fcitx5-frontend-qt5 fcitx5-frontend-qt6
  ok "패키지 추가 완료"

  # 2. Fcitx5 설정
  log "[2/4] Fcitx5 프로필·핫키 구성..."
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

  # 3. 환경변수 설정
  log "[3/4] 환경변수 설정..."
  local ENV_FILE="$TARGET_HOME/.config/environment.d/fcitx5.conf"
  mkdir -p "$(dirname "$ENV_FILE")"
  cat > "$ENV_FILE" <<'EOF'
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
  chown -R "$USER:$USER" "$(dirname "$ENV_FILE")"

  # 4. 자동시작
  log "[4/4] 자동시작 등록..."
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
  ok "자동시작 등록 완료"

  echo
  echo "============================================================"
  echo " 🎉 Vanilla OS 설정 완료! 반드시 재부팅하세요 (ABRoot 적용)."
  echo " 전환: 한/영 키, Ctrl+Space, Shift+Space"
  echo "============================================================"
}
main "$@"
