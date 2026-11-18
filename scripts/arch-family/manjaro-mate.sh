#!/usr/bin/env bash
# Manjaro Linux MATE - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/stream9k/korean_input_method_installer/main/scripts/arch-family/manjaro-mate.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.0.0"
LOG_FILE="/var/log/install-hangul-manjaro-mate.log"

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
  err "대상 사용자 탐지 실패";
}

main() {
  require_root
  mkdir -p "$(dirname "$LOG_FILE")"
  log "=== Manjaro Linux MATE 한글 입력기 설치 (v$SCRIPT_VERSION) ==="

  local USER TARGET_HOME TARGET_UID
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  info "사용자: $USER (UID=$TARGET_UID)"

  # 1. 패키지 설치 (pacman)
  log "[1/5] fcitx5 패키지 설치 (pacman)..."
  pacman -Sy --needed --noconfirm \
    fcitx5-im fcitx5-hangul fcitx5-configtool \
    fcitx5-gtk fcitx5-qt
  ok "패키지 설치 완료"

  # 2. 환경변수 시스템 와이드 (/etc/environment)
  log "[2/5] 시스템 환경변수 설정 (/etc/environment)..."
  grep -q "GTK_IM_MODULE=fcitx" /etc/environment 2>/dev/null || cat >> /etc/environment <<'EOF'

# fcitx5 환경변수
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
  ok "시스템 환경변수 추가"

  # 3. 사용자 설정 (프로필/핫키)
  log "[3/5] 사용자 Fcitx5 설정..."
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
  ok "사용자 설정 완료"

  # 4. 자동시작 (systemd user 또는 데스크톱 autostart)
  log "[4/5] 자동시작 등록..."
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

  # systemd user 서비스도 활성화 (Wayland 세션용)
  su - "$USER" -c "systemctl --user enable fcitx5 2>/dev/null || true" || true
  ok "자동시작 등록"

  # 5. KDE Plasma 특화 안내
  log "[5/5] 데스크톱별 안내..."
  local DESKTOP="${XDG_CURRENT_DESKTOP:-}"
  if [[ "$DESKTOP" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]]; then
    info "KDE Plasma: 시스템설정 → 입력장치 → 가상키보드 → Fcitx 5 선택 후 재로그인"
  elif [[ "$DESKTOP" =~ [Gg][Nn][Oo][Mm][Ee] ]]; then
    info "GNOME: 재로그인 후 자동 적용 (환경변수 상속)"
  else
    info "타 WM/DE: ~/.xprofile 또는 ~/.xinitrc 에 환경변수 추가 후 재시작"
  fi

  echo
  echo "============================================================"
  echo " 🎉 설치 완료! 재로그인 또는 재부팅 필요"
  echo " 전환: 한/영 키, Ctrl+Space, Shift+Space"
  echo " 설정: fcitx5-configtool"
  echo " 진단: fcitx5-diagnose"
  echo "============================================================"
}
main "$@"
