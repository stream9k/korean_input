#!/usr/bin/env bash
# Arch Linux StratOS - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/arch-family/arch-stratos.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.2.1"
LOG_FILE="/var/log/install-hangul-arch-stratos.log"

LOG_ENABLED=false
AUTO_YES=false
for _arg in "$@"; do
  case "$_arg" in
    -y|--yes) AUTO_YES=true ;;
  esac
done

log() {
  local _line="[$(date '+%F %T')] $*"
  if [[ "$LOG_ENABLED" == "true" ]]; then
    echo "$_line" | tee -a "$LOG_FILE"
  else
    echo "$_line"
  fi
}
err() {
  local _line="[$(date '+%F %T')] ❌ $*"
  if [[ "$LOG_ENABLED" == "true" ]]; then
    echo "$_line" | tee -a "$LOG_FILE" >&2
  else
    echo "$_line" >&2
  fi
  exit 1
}
warn() { log "⚠️  $*"; }
ok() { log "✅ $*"; }
info() { log "ℹ️  $*"; }

detect_os_pretty() {
  if [[ -f /etc/os-release ]]; then
    (
      # shellcheck disable=SC1091
      . /etc/os-release
      echo "${PRETTY_NAME:-${NAME:-Unknown Linux}}"
    )
  else
    echo "Unknown Linux"
  fi
}

detect_desktop() {
  local _u="$1"
  local _d="${XDG_CURRENT_DESKTOP:-}"
  [[ -n "$_d" ]] && { echo "$_d"; return; }
  _d=$(su - "$_u" -c 'echo ${XDG_CURRENT_DESKTOP:-}' </dev/null 2>/dev/null || true)
  [[ -n "$_d" ]] && { echo "$_d"; return; }
  _d=$(su - "$_u" -c 'echo ${DESKTOP_SESSION:-}' </dev/null 2>/dev/null || true)
  [[ -n "$_d" ]] && { echo "$_d"; return; }
  echo "unknown"
}

detect_session_type() {
  local _u="$1"
  local _uid="$2"
  local _st="${XDG_SESSION_TYPE:-}"
  if [[ -n "$_st" && "$_st" != "unspecified" && "$_st" != "tty" ]]; then
    echo "$_st"; return
  fi
  if command -v loginctl >/dev/null 2>&1; then
    local _sid
    for _sid in $(loginctl list-sessions --no-legend 2>/dev/null | awk -v u="$_u" '$3==u {print $1}' || true); do
      _st=$(loginctl show-session "$_sid" -p Type --value 2>/dev/null || true)
      if [[ "$_st" == "wayland" || "$_st" == "x11" || "$_st" == "mir" ]]; then
        echo "$_st"; return
      fi
    done
  fi
  if ls "/run/user/$_uid"/wayland-* >/dev/null 2>&1 || [[ -n "${WAYLAND_DISPLAY:-}" ]]; then
    echo "wayland"; return
  fi
  if [[ -n "${DISPLAY:-}" ]]; then
    echo "x11"; return
  fi
  echo "unknown"
}

detect_existing_ime() {
  local _uid="$1"
  local _found=() _im _running
  for _im in fcitx5 fcitx ibus-daemon kime; do
    _running=false
    if command -v pgrep >/dev/null 2>&1 && pgrep -u "$_uid" -x "$_im" >/dev/null 2>&1; then
      _running=true
    fi
    if command -v "$_im" >/dev/null 2>&1 || [[ "$_running" == "true" ]]; then
      if [[ "$_running" == "true" ]]; then
        _found+=("$_im (실행 중)")
      else
        _found+=("$_im (설치됨)")
      fi
    fi
  done
  if [[ ${#_found[@]} -eq 0 ]]; then
    echo "감지된 입력기 없음"
  else
    local IFS=", "
    echo "${_found[*]}"
  fi
}

will_configure_kde() {
  local _force="$1"
  local _home="$2"
  local _desk="$3"
  if [[ "$_force" == "true" ]] || \
     [[ "$_desk" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]] || \
     [[ "${XDG_CURRENT_DESKTOP:-}" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]] || \
     command -v kwriteconfig6 >/dev/null 2>&1 || \
     command -v kwriteconfig5 >/dev/null 2>&1 || \
     [[ -f "$_home/.config/kwinrc" ]]; then
    echo "true"
  else
    echo "false"
  fi
}

fcitx5_overwrite_note() {
  if [[ -f "$1/.config/fcitx5/profile" || -f "$1/.config/fcitx5/config" ]]; then
    echo " (기존 파일 덮어쓰기)"
  else
    echo " (신규 생성)"
  fi
}

append_kde_cfg_line() {
  local _kde_will="$1"
  local _home="$2"
  local _cfg="$3"
  if [[ "$_kde_will" == "true" ]]; then
    printf '%s\n   - KDE Plasma 가상 키보드 설정: %s/.config/kwinrc ([Wayland] InputMethod)' "$_cfg" "$_home"
  else
    printf '%s' "$_cfg"
  fi
}

append_fcitx5_overwrite_warn() {
  local _home="$1"
  local _base="${2:-}"
  local _w=""
  if [[ -f "$_home/.config/fcitx5/profile" || -f "$_home/.config/fcitx5/config" ]]; then
    _w=" ⚠️  참고: 기존 Fcitx5 설정 파일($_home/.config/fcitx5/profile, config)이 덮어써집니다."
  fi
  if [[ -n "$_base" && -n "$_w" ]]; then
    printf '%s\n%s' "$_base" "$_w"
  elif [[ -n "$_base" ]]; then
    printf '%s' "$_base"
  else
    printf '%s' "$_w"
  fi
}

confirm_before_changes() {
  local _title="$1"
  local _os_name="$2"
  local _user="$3"
  local _uid="$4"
  local _home="$5"
  local _desktop="$6"
  local _session="$7"
  local _existing_ime="$8"
  local _pkg_summary="$9"
  local _cfg_summary="${10}"
  local _extra_warn="${11:-}"

  echo
  echo "============================================================"
  echo " 🔍 설치 전 시스템 조사 및 변경 예정 내역"
  echo "============================================================"
  echo " • 대상 스크립트  : $_title (v$SCRIPT_VERSION)"
  echo " • 감지된 OS      : $_os_name"
  echo " • 대상 사용자    : $_user (UID=$_uid, HOME=$_home)"
  echo " • 데스크톱/세션  : $_desktop / $_session"
  echo " • 기존 입력기    : $_existing_ime"
  echo "------------------------------------------------------------"
  echo " 📦 패키지 변경 예정:"
  printf "%b\n" "$_pkg_summary"
  echo " ⚙️  설정·파일 변경 예정:"
  printf "%b\n" "$_cfg_summary"
  echo " • 설치 로그 파일 : $LOG_FILE"
  if [[ -n "$_extra_warn" ]]; then
    echo "------------------------------------------------------------"
    printf "%b\n" "$_extra_warn"
  fi
  echo "============================================================"
  echo " ⚠️  경고: 계속 진행하면 위 패키지와 시스템/사용자 설정이 실제로 변경됩니다."

  if [[ "$AUTO_YES" == "true" ]]; then
    echo " ℹ️  --yes (-y) 옵션이 지정되어 확인 절차를 건너뛰고 진행합니다."
    echo
    return 0
  fi

  if ! ( : </dev/tty ) 2>/dev/null; then
    echo " ❌ 대화형 터미널(/dev/tty)이 없어 사용자 확인을 받을 수 없습니다." >&2
    echo "    대화형 터미널에서 실행하거나 --yes (-y) 옵션을 전달하세요." >&2
    exit 1
  fi

  local _reply=""
  printf " 이대로 설치를 진행하시겠습니까? [y/N]: "
  IFS= read -r _reply </dev/tty || _reply=""
  case "$_reply" in
    y|Y|yes|YES)
      echo
      return 0
      ;;
    *)
      echo " 🛑 설치를 취소했습니다. 시스템에 아무런 변경도 적용되지 않았습니다."
      exit 0
      ;;
  esac
}

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

  local USER TARGET_HOME TARGET_UID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME _ow_note _kde_will
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")
  _kde_will=$(will_configure_kde "false" "$TARGET_HOME" "$DESKTOP")

  local _pkg_summary="   - pacman -Sy --needed --noconfirm: fcitx5-im, fcitx5-hangul,\n     fcitx5-configtool, fcitx5-gtk, fcitx5-qt, noto-fonts-cjk"
  local _cfg_summary="   - /etc/environment 환경변수 추가\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop, systemctl --user enable fcitx5\n   - 첫 로그인 1회 안내 등록"
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary")
  local _extra_warn
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME")

  confirm_before_changes     "Arch Linux StratOS"     "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME"     "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME"     "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== Arch Linux StratOS 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. 패키지 설치 (pacman)
  log "[1/5] fcitx5 및 한글 폰트 패키지 설치 (pacman)..."
  pacman -Sy --needed --noconfirm \
    fcitx5-im fcitx5-hangul fcitx5-configtool \
    fcitx5-gtk fcitx5-qt noto-fonts-cjk
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
  # 실행 중인 fcitx5가 종료 시 기존 프로필로 덮어쓰는 현상 방지
  local _fcitx5_uid _fcitx5_svcs=()
  _fcitx5_uid=$(id -u "$USER" 2>/dev/null || echo "")
  if [[ -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]] && command -v systemctl >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    local _svc
    while IFS= read -r _svc; do
      if [[ -n "$_svc" ]]; then
        sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \
          systemctl --user stop "$_svc" 2>/dev/null || true
        _fcitx5_svcs+=("$_svc")
      fi
    done < <(sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \
      systemctl --user list-units --type=service --state=running --no-legend '*fcitx5*' 2>/dev/null | awk '{print $1}' || true)
  fi
  if [[ -n "$_fcitx5_uid" ]] && command -v pkill >/dev/null 2>&1; then
    pkill -u "$_fcitx5_uid" -x fcitx5 2>/dev/null || true
  elif command -v killall >/dev/null 2>&1; then
    killall -u "$USER" fcitx5 2>/dev/null || true
  fi
  if [[ -n "$_fcitx5_uid" ]] && command -v pgrep >/dev/null 2>&1; then
    local _wi=0
    while pgrep -u "$_fcitx5_uid" -x fcitx5 >/dev/null 2>&1 && [[ $_wi -lt 20 ]]; do
      sleep 0.1 2>/dev/null || sleep 1
      _wi=$((_wi + 1))
    done
    if pgrep -u "$_fcitx5_uid" -x fcitx5 >/dev/null 2>&1; then
      pkill -9 -u "$_fcitx5_uid" -x fcitx5 2>/dev/null || true
      sleep 0.2 2>/dev/null || sleep 1
    fi
  else
    sleep 1
  fi
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
  if [[ ${#_fcitx5_svcs[@]} -gt 0 && -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]]; then
    local _svc
    for _svc in "${_fcitx5_svcs[@]}"; do
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \
        systemctl --user start "$_svc" 2>/dev/null || true
    done
  fi
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

  # 5. KDE Plasma 가상 키보드 자동 설정 및 데스크톱별 안내
  log "[5/5] 데스크톱별 마무리..."

  # KDE Plasma 가상 키보드(Fcitx 5) 자동 설정
  local _kde_detected=false
  if [[ "${XDG_CURRENT_DESKTOP:-}" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]] || \
     command -v kwriteconfig6 >/dev/null 2>&1 || \
     command -v kwriteconfig5 >/dev/null 2>&1 || \
     [[ -f "$TARGET_HOME/.config/kwinrc" ]]; then
    _kde_detected=true
  fi
  if [[ "$_kde_detected" == "true" ]]; then
    local _fcitx5_desktop="/usr/share/applications/org.fcitx.Fcitx5.desktop"
    if [[ -f /usr/share/applications/fcitx5-wayland-launcher.desktop ]]; then
      _fcitx5_desktop="/usr/share/applications/fcitx5-wayland-launcher.desktop"
    fi
    local _kwinrc="$TARGET_HOME/.config/kwinrc"
    mkdir -p "$TARGET_HOME/.config"
    if command -v kwriteconfig6 >/dev/null 2>&1; then
      kwriteconfig6 --file "$_kwinrc" --group Wayland --key InputMethod "$_fcitx5_desktop" 2>/dev/null || true
    elif command -v kwriteconfig5 >/dev/null 2>&1; then
      kwriteconfig5 --file "$_kwinrc" --group Wayland --key InputMethod "$_fcitx5_desktop" 2>/dev/null || true
    elif [[ -f "$_kwinrc" ]]; then
      awk -v im="$_fcitx5_desktop" '
        BEGIN { in_wayland=0; found_wayland=0; updated=0 }
        /^\[Wayland\]$/ { in_wayland=1; found_wayland=1; print; next }
        /^\[/ {
          if (in_wayland && !updated) { print "InputMethod=" im; updated=1 }
          in_wayland=0; print; next
        }
        in_wayland && /^InputMethod(\[\$e\])?=/ {
          if (!updated) { print "InputMethod=" im; updated=1 }
          next
        }
        { print }
        END {
          if (in_wayland && !updated) { print "InputMethod=" im }
          else if (!found_wayland) { print ""; print "[Wayland]"; print "InputMethod=" im }
        }
      ' "$_kwinrc" > "${_kwinrc}.tmp" && mv "${_kwinrc}.tmp" "$_kwinrc"
    else
      printf '[Wayland]\nInputMethod=%s\n' "$_fcitx5_desktop" > "$_kwinrc"
    fi
    chown "$USER:$USER" "$TARGET_HOME/.config" "$_kwinrc" 2>/dev/null || true
    local _kde_uid
    _kde_uid=$(id -u "$USER" 2>/dev/null || echo "")
    if [[ -n "$_kde_uid" && -S "/run/user/$_kde_uid/bus" ]] && command -v sudo >/dev/null 2>&1; then
      local _qdbus=""
      if command -v qdbus6 >/dev/null 2>&1; then _qdbus="qdbus6"
      elif command -v qdbus >/dev/null 2>&1; then _qdbus="qdbus"
      fi
      if [[ -n "$_qdbus" ]]; then
        sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_kde_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_kde_uid/bus" \
          "$_qdbus" org.kde.KWin /KWin reconfigure 2>/dev/null || true
      fi
    fi
    ok "KDE Plasma 가상 키보드(Fcitx 5) 자동 설정 완료 ($_fcitx5_desktop)"
  fi

  if [[ "$DESKTOP" =~ [Gg][Nn][Oo][Mm][Ee] ]]; then
    info "GNOME: 재로그인 후 자동 적용 (환경변수 상속)"
  elif ! [[ "$DESKTOP" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]]; then
    info "타 WM/DE: ~/.xprofile 또는 ~/.xinitrc 에 환경변수 추가 후 재시작"
  fi


  # 재부팅/재로그인 후 1회성 안내 팝업 자동시작 등록 (표시 후 자폭)
  local GUIDE_DIR="$TARGET_HOME/.local/bin"
  local GUIDE_BIN="$GUIDE_DIR/hangul-first-login-guide.sh"
  local GUIDE_DESK="$TARGET_HOME/.config/autostart/hangul-first-login-guide.desktop"
  mkdir -p "$TARGET_HOME/.config/autostart" "$GUIDE_DIR"

  cat > "$GUIDE_BIN" <<'GUIDE_EOF'
#!/usr/bin/env bash
sleep 2
TITLE="리눅스 한글 입력기 안내"
MSG="🎉 Arch Linux 한글 입력기 설정이 완료되었습니다!

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
  echo " 🎉 설치 완료! 재로그인 또는 재부팅 필요"
  echo " 전환: 한/영 키, Ctrl+Space, Shift+Space"
  echo " 설정: fcitx5-configtool"
  echo " 진단: fcitx5-diagnose"
  echo "============================================================"
}
main "$@"
