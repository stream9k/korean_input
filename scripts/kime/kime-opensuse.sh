#!/usr/bin/env bash
# kime (Rust 기반 경량 입력기) openSUSE (zypper) - kime (Rust 기반 경량 한글 입력기) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/kime/kime-opensuse.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.1.1"
LOG_FILE="/var/log/install-kime-kime-opensuse.log"

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
  log "=== kime (Rust 기반 경량 입력기) openSUSE (zypper) kime 한글 입력기 설치 (v$SCRIPT_VERSION) ==="

  local USER TARGET_HOME TARGET_UID
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  info "사용자: $USER"

  # 배포판별 설치
  . /etc/os-release
  case "$ID" in
    arch|manjaro|endeavouros|garuda)
      log "[1/3] kime 설치 (pacman/AUR)..."
      if command -v yay &>/dev/null; then
        su - "$USER" -c "yay -S --noconfirm kime"
      elif command -v paru &>/dev/null; then
        su - "$USER" -c "paru -S --noconfirm kime"
      else
        warn "AUR 헬퍼 없음. 수동 설치 필요: https://github.com/kime-ime/kime"
        exit 1
      fi
      ;;
    fedora)
      log "[1/3] kime 설치 (COPR)..."
      dnf copr enable -y toroidalfox/kime
      dnf install -y kime
      ;;
    opensuse*)
      log "[1/3] kime 설치 (zypper)..."
      zypper --non-interactive install -y kime
      ;;
    ubuntu|debian|linuxmint|pop|zorin|elementary|neon)
      log "[1/3] kime 설치 (.deb 다운로드)..."
      cd /tmp
      wget -q "https://github.com/kime-ime/kime/releases/latest/download/kime-$(uname -m).deb"
      apt-get install -y ./kime-*.deb
      ;;
    *)
      err "지원하지 않는 배포판: $ID. 수동 설치: https://github.com/kime-ime/kime"
      ;;
  esac
  ok "kime 설치 완료"

  # 2. 환경변수
  log "[2/3] 환경변수 설정..."
  local ENV_FILE="$TARGET_HOME/.config/environment.d/kime.conf"
  mkdir -p "$(dirname "$ENV_FILE")"
  cat > "$ENV_FILE" <<'EOF'
GTK_IM_MODULE=kime
QT_IM_MODULE=kime
XMODIFIERS=@im=kime
EOF
  chown -R "$USER:$USER" "$(dirname "$ENV_FILE")"
  ok "환경변수 설정"

  # 3. 자동시작
  log "[3/3] 자동시작 등록..."
  local ADIR="$TARGET_HOME/.config/autostart"
  mkdir -p "$ADIR"
  cat > "$ADIR/kime.desktop" <<'EOF'
[Desktop Entry]
Type=Application
Name=Kime
Exec=kime-daemon
X-GNOME-Autostart-enabled=true
Hidden=false
NoDisplay=false
EOF
  chown -R "$USER:$USER" "$ADIR"
  ok "자동시작 등록"

  # 재부팅/재로그인 후 1회성 안내 팝업 자동시작 등록 (표시 후 자폭)
  local GUIDE_DIR="$TARGET_HOME/.local/bin"
  local GUIDE_BIN="$GUIDE_DIR/hangul-first-login-guide.sh"
  local GUIDE_DESK="$TARGET_HOME/.config/autostart/hangul-first-login-guide.desktop"
  mkdir -p "$TARGET_HOME/.config/autostart" "$GUIDE_DIR"

  cat > "$GUIDE_BIN" <<'GUIDE_EOF'
#!/usr/bin/env bash
sleep 2
TITLE="리눅스 한글 입력기 안내"
MSG="🎉 kime (Rust 기반 경량 입력기) 한글 입력기 설정이 완료되었습니다!

⌨️  전환: 한/영 키, Ctrl+Space, Shift+Space
💡 영문 키보드 사용 시: fcitx5-configtool 에서 오른쪽 Alt(Alt_R) 등록 가능
⚙️  설정: fcitx5-configtool | 진단: fcitx5-diagnose
📝 로그: $LOG_FILE

(💡 이 안내창은 재부팅 후 1회만 표시되며 자동으로 삭제됩니다.)"

if command -v kdialog >/dev/null 2>&1; then
  kdialog --title "$TITLE" --msgbox "$MSG" 2>/dev/null
elif command -v zenity >/dev/null 2>&1; then
  zenity --info --title="$TITLE" --text="$MSG" --width=480 2>/dev/null
elif command -v notify-send >/dev/null 2>&1; then
  notify-send -u critical -t 20000 "$TITLE" "$MSG" 2>/dev/null
fi
rm -f "$HOME/.config/autostart/hangul-first-login-guide.desktop"
rm -f "$0"
GUIDE_EOF
  chmod +x "$GUIDE_BIN"

  cat > "$GUIDE_DESK" <<GUIDE_DSK_EOF
[Desktop Entry]
Type=Application
Name=Hangul First Login Guide
Exec=$GUIDE_BIN
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
GUIDE_DSK_EOF
  chown -R "$USER:$USER" "$TARGET_HOME/.config/autostart" "$GUIDE_DIR"

  echo
  echo "============================================================"
  echo " 🎉 kime 설치 완료! 재로그인 필요"
  echo " KDE: 시스템설정 → 입력장치 → 가상키보드 → Kime 선택"
  echo " GNOME: 설정 → 키보드 → 입력 소스 → 한국어 (Kime) 추가"
  echo " 전환: 한/영 키 (우측 Alt), Shift+Space"
  echo " 설정: kime-config (GUI) 또는 ~/.config/kime/config.toml"
  echo "============================================================"
}
main "$@"
