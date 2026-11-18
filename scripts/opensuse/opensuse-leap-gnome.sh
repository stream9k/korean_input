#!/usr/bin/env bash
# openSUSE Leap 15.5+ GNOME - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/opensuse/opensuse-leap-gnome.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.1.0"
LOG_FILE="/var/log/install-hangul-opensuse-leap-gnome.log"

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
  log "=== openSUSE Leap 15.5+ GNOME 한글 입력기 설치 (v$SCRIPT_VERSION) ==="

  local USER TARGET_HOME TARGET_UID
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  info "사용자: $USER (UID=$TARGET_UID)"

  # 1. 패키지 설치 (transactional-update / zypper)
  log "[1/5] fcitx5 및 한글 폰트 패키지 설치..."
  if command -v transactional-update >/dev/null 2>&1; then
    transactional-update --non-interactive pkg install \
      fcitx5 fcitx5-hangul fcitx5-configtool \
      fcitx5-gtk fcitx5-qt fcitx5-qt5 fcitx5-qt6 \
      fcitx5-autostart google-noto-sans-cjk-fonts
    info "Aeon / MicroOS 감지: transactional-update 적용을 위해 설치 후 재부팅이 필요합니다."
  else
    zypper --non-interactive install -y \
      fcitx5 fcitx5-hangul fcitx5-configtool \
      fcitx5-gtk fcitx5-qt fcitx5-qt5 fcitx5-qt6 \
      fcitx5-autostart
    zypper --non-interactive install -y google-noto-sans-cjk-fonts 2>/dev/null || true
  fi
  ok "패키지 설치 완료"

  # 2. 시스템 입력기 설정 (alternatives)
  log "[2/5] 시스템 입력기 등록..."
  alternatives --set xinputrc /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
  sed -i 's/IMSETTINGS_IGNORE_SESSION=\*-wayland/#IMSETTINGS_IGNORE_SESSION=*-wayland/' /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
  sed -i 's/XIM=fcitx5/XIM=fcitx/' /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
  ok "시스템 입력기 설정"

  # 3. ibus 비활성화
  log "[3/5] ibus 자동시작 비활성화..."
  su - "$USER" -c "systemctl --user disable ibus 2>/dev/null || true" || true
  ok "ibus 비활성화"

  # 4. 사용자 설정
  log "[4/5] 사용자 Fcitx5 설정..."
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
  # 환경변수
  local PROFILE_FILE="$TARGET_HOME/.bash_profile"
  [[ -f "$TARGET_HOME/.profile" && ! -f "$PROFILE_FILE" ]] && PROFILE_FILE="$TARGET_HOME/.profile"
  grep -q "GTK_IM_MODULE=fcitx" "$PROFILE_FILE" 2>/dev/null || cat >> "$PROFILE_FILE" <<'EOF'

# fcitx5 환경변수
export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx
EOF
  chown -R "$USER:$USER" "$FCITX5_DIR" "$PROFILE_FILE"
  ok "사용자 설정 완료"

  # 5. KDE Plasma Virtual Keyboard 안내
  log "[5/5] 마무리..."
  local DESKTOP="${XDG_CURRENT_DESKTOP:-}"
  if [[ "$DESKTOP" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]]; then
    info "KDE Plasma: 시스템설정 → 입력장치 → 가상키보드 → Fcitx 5 선택 후 재로그인"
  fi

  echo
  echo "============================================================"
  echo " 🎉 설치 완료! 재부팅 또는 재로그인"
  echo " 전환: 한/영 키, Ctrl+Space"
  echo " 설정: fcitx5-configtool"
  echo " 진단: fcitx5-diagnose"
  echo "============================================================"
}
main "$@"
