#!/usr/bin/env bash
# Fedora Linux KDE Plasma (기본 권장) - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/fedora/fedora-kde.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.1.0"
LOG_FILE="/var/log/install-hangul-fedora-kde.log"

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
  log "=== Fedora Linux KDE Plasma (기본 권장) 한글 입력기 설치 (v$SCRIPT_VERSION) ==="

  local USER TARGET_HOME TARGET_UID
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  info "사용자: $USER (UID=$TARGET_UID)"

  # 1. 패키지 설치
  log "[1/5] fcitx5 및 한글 폰트 패키지 설치 (dnf)..."
  dnf install -y -q \
    fcitx5 fcitx5-hangul fcitx5-configtool fcitx5-gtk fcitx5-qt \
    fcitx5-autostart
  dnf install -y -q google-noto-sans-cjk-ttc-fonts 2>/dev/null || dnf install -y -q google-noto-cjk-fonts 2>/dev/null || true
  ok "패키지 설치 완료"

  # 2. 시스템 입력기 등록 (alternatives)
  log "[2/5] 시스템 입력기를 fcitx5로 등록..."
  alternatives --set xinputrc /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
  # Wayland 지원 활성화
  sed -i 's/IMSETTINGS_IGNORE_SESSION=\*-wayland/#IMSETTINGS_IGNORE_SESSION=*-wayland/' /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
  sed -i 's/XIM=fcitx5/XIM=fcitx/' /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
  ok "시스템 입력기 설정 완료"

  # 3. ibus 자동시작 비활성화 (충돌 방지)
  log "[3/5] ibus 자동시작 비활성화..."
  su - "$USER" -c "systemctl --user disable ibus 2>/dev/null || true" || true
  ok "ibus 비활성화"

  # 4. 사용자 설정 (프로필/핫키/환경변수)
  log "[4/5] 사용자 설정 구성..."
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
  # 환경변수 (~/.bash_profile 또는 ~/.profile)
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

  # 5. KDE Plasma면 Virtual Keyboard 설정 안내
  log "[5/5] 데스크톱별 마무리..."
  local DESKTOP="${XDG_CURRENT_DESKTOP:-}"
  if [[ "$DESKTOP" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]]; then
    info "KDE Plasma 감지: 시스템 설정 → 입력 장치 → 가상 키보드 → Fcitx 5 선택 후 재로그인"
  fi

  echo
  echo "============================================================"
  echo " 🎉 설치 완료! 재부팅 또는 재로그인 필요"
  echo " KDE: 시스템설정 → 입력장치 → 가상키보드 → Fcitx 5"
  echo " GNOME: 자동 적용 (환경변수 로드 후)"
  echo " 전환: 한/영 키, Ctrl+Space"
  echo " 설정: fcitx5-configtool"
  echo " 진단: fcitx5-diagnose"
  echo "============================================================"
}
main "$@"
