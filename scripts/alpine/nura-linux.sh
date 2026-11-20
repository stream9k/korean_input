#!/usr/bin/env sh
# Alpine Linux / Chimera / Nura Nura Linux (Alpine 기반) - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/alpine/nura-linux.sh | sudo sh

set -eu

SCRIPT_VERSION="1.1.3"
LOG_FILE="/var/log/install-hangul-nura-linux.log"

log() { echo "[$(date '+%F %T')] $*" | tee -a "$LOG_FILE"; }
err() { log "❌ $*"; exit 1; }
ok() { log "✅ $*"; }
info() { log "ℹ️  $*"; }

require_root() { [ "$(id -u)" -eq 0 ] || err "root 권한 필요: sudo sh $0"; }

detect_user() {
  u="${SUDO_USER:-}"
  [ -n "$u" ] && [ "$u" != "root" ] && { echo "$u"; return; }
  u=$(logname 2>/dev/null || true)
  [ -n "$u" ] && [ "$u" != "root" ] && { echo "$u"; return; }
  u=$(who | awk '{print $1}' | head -n 1 || true)
  [ -n "$u" ] && [ "$u" != "root" ] && { echo "$u"; return; }
  err "대상 사용자 탐지 실패"
}

main() {
  require_root
  mkdir -p "$(dirname "$LOG_FILE")"
  log "=== Alpine Linux / Chimera / Nura Nura Linux (Alpine 기반) 한글 입력기 설치 (v$SCRIPT_VERSION) ==="

  USER=$(detect_user)
  TARGET_HOME=$(awk -F: -v u="$USER" '$1==u {print $6}' /etc/passwd)
  info "사용자: $USER (HOME=$TARGET_HOME)"

  # 1. apk 패키지 설치 (Alpine / Chimera 공용)
  log "[1/4] fcitx5 패키지 설치 (apk)..."
  apk update
  apk add fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool font-noto-cjk
  ok "패키지 설치 완료"

  # 2. 환경변수 설정
  log "[2/4] 환경변수 설정..."
  grep -q "GTK_IM_MODULE=fcitx" /etc/environment 2>/dev/null || cat >> /etc/environment <<'EOF'

# fcitx5 환경변수
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
  PROFILE_FILE="$TARGET_HOME/.profile"
  grep -q "GTK_IM_MODULE=fcitx" "$PROFILE_FILE" 2>/dev/null || cat >> "$PROFILE_FILE" <<'EOF'

# fcitx5 환경변수
export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx
EOF
  chown "$USER:$USER" "$PROFILE_FILE"
  ok "환경변수 설정 완료"

  # 3. Fcitx5 설정
  log "[3/4] Fcitx5 프로필·핫키 구성..."
  # 실행 중인 fcitx5가 종료 시 기존 프로필로 덮어쓰는 현상 방지
  _fcitx5_uid=$(id -u "$USER" 2>/dev/null || echo "")
  if [ -n "$_fcitx5_uid" ] && command -v pkill >/dev/null 2>&1; then
    pkill -u "$_fcitx5_uid" -x fcitx5 2>/dev/null || true
  elif command -v killall >/dev/null 2>&1; then
    killall fcitx5 2>/dev/null || true
  fi
  sleep 1
  FCITX5_DIR="$TARGET_HOME/.config/fcitx5"
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

  # 4. 자동시작
  log "[4/4] 자동시작 등록..."
  ADIR="$TARGET_HOME/.config/autostart"
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


  # 재부팅/재로그인 후 1회성 안내 팝업 자동시작 등록 (표시 후 자폭)
  local GUIDE_DIR="$TARGET_HOME/.local/bin"
  local GUIDE_BIN="$GUIDE_DIR/hangul-first-login-guide.sh"
  local GUIDE_DESK="$TARGET_HOME/.config/autostart/hangul-first-login-guide.desktop"
  mkdir -p "$TARGET_HOME/.config/autostart" "$GUIDE_DIR"

  cat > "$GUIDE_BIN" <<'GUIDE_EOF'
#!/usr/bin/env bash
sleep 2
TITLE="리눅스 한글 입력기 안내"
MSG="🎉 Alpine Linux / Chimera / Nura 한글 입력기 설정이 완료되었습니다!

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
  echo " 🎉 Alpine Linux 설치 완료! 재로그인 필요"
  echo " 전환: 한/영 키, Ctrl+Space, Shift+Space"
  echo " 설정: fcitx5-configtool"
  echo "============================================================"
}
main "$@"
