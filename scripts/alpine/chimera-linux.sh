#!/usr/bin/env sh
# Alpine Linux / Chimera / Nura Chimera Linux (FreeBSD userland + apk) - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/alpine/chimera-linux.sh | sudo sh

set -eu

SCRIPT_VERSION="1.3.6"
LOG_FILE="/var/log/install-hangul-chimera-linux.log"

LOG_ENABLED=false
AUTO_YES=false
for _pf_arg in "$@"; do
  case "$_pf_arg" in
    -y|--yes) AUTO_YES=true ;;
  esac
done

log() {
  _pf_line="[$(date '+%F %T')] $*"
  if [ "$LOG_ENABLED" = "true" ]; then
    echo "$_pf_line" | tee -a "$LOG_FILE"
  else
    echo "$_pf_line"
  fi
}
err() {
  _pf_line="[$(date '+%F %T')] ❌ $*"
  if [ "$LOG_ENABLED" = "true" ]; then
    echo "$_pf_line" | tee -a "$LOG_FILE" >&2
  else
    echo "$_pf_line" >&2
  fi
  exit 1
}
warn() { log "⚠️  $*"; }
ok() { log "✅ $*"; }
info() { log "ℹ️  $*"; }

detect_os_pretty() {
  if [ -f /etc/os-release ]; then
    (
      . /etc/os-release
      echo "${PRETTY_NAME:-${NAME:-Unknown Linux}}"
    )
  else
    echo "Unknown Linux"
  fi
}

detect_desktop() {
  _pf_u="$1"
  _pf_d="${XDG_CURRENT_DESKTOP:-}"
  [ -n "$_pf_d" ] && { echo "$_pf_d"; return; }
  _pf_d=$(su - "$_pf_u" -c 'echo ${XDG_CURRENT_DESKTOP:-}' </dev/null 2>/dev/null || true)
  [ -n "$_pf_d" ] && { echo "$_pf_d"; return; }
  _pf_d=$(su - "$_pf_u" -c 'echo ${DESKTOP_SESSION:-}' </dev/null 2>/dev/null || true)
  [ -n "$_pf_d" ] && { echo "$_pf_d"; return; }
  echo "unknown"
}

detect_session_type() {
  _pf_u="$1"
  _pf_uid="$2"
  _pf_st="${XDG_SESSION_TYPE:-}"
  if [ -n "$_pf_st" ] && [ "$_pf_st" != "unspecified" ] && [ "$_pf_st" != "tty" ]; then
    echo "$_pf_st"; return
  fi
  if command -v loginctl >/dev/null 2>&1; then
    for _pf_sid in $(loginctl list-sessions --no-legend 2>/dev/null | awk -v u="$_pf_u" '$3==u {print $1}' || true); do
      _pf_st=$(loginctl show-session "$_pf_sid" -p Type --value 2>/dev/null || true)
      if [ "$_pf_st" = "wayland" ] || [ "$_pf_st" = "x11" ] || [ "$_pf_st" = "mir" ]; then
        echo "$_pf_st"; return
      fi
    done
  fi
  if ls "/run/user/$_pf_uid"/wayland-* >/dev/null 2>&1 || [ -n "${WAYLAND_DISPLAY:-}" ]; then
    echo "wayland"; return
  fi
  if [ -n "${DISPLAY:-}" ]; then
    echo "x11"; return
  fi
  echo "unknown"
}

detect_existing_ime() {
  _pf_uid="$1"
  _pf_found=""
  _pf_sep=""
  for _pf_im in fcitx5 fcitx ibus-daemon kime; do
    _pf_running=false
    if command -v pgrep >/dev/null 2>&1 && pgrep -u "$_pf_uid" -x "$_pf_im" >/dev/null 2>&1; then
      _pf_running=true
    fi
    if command -v "$_pf_im" >/dev/null 2>&1 || [ "$_pf_running" = "true" ]; then
      if [ "$_pf_running" = "true" ]; then
        _pf_found="${_pf_found}${_pf_sep}${_pf_im} (실행 중)"
      else
        _pf_found="${_pf_found}${_pf_sep}${_pf_im} (설치됨)"
      fi
      _pf_sep=", "
    fi
  done
  if [ -z "$_pf_found" ]; then
    echo "감지된 입력기 없음"
  else
    echo "$_pf_found"
  fi
}

has_conflicting_ime() {
  _hc_target="$1"
  _hc_existing="$2"
  case "$_hc_target" in
    fcitx5)
      case "$_hc_existing" in
        *ibus-daemon*|*kime*|*"fcitx ("*) return 0 ;;
      esac
      ;;
    ibus)
      case "$_hc_existing" in
        *fcitx5*|*"fcitx ("*|*kime*) return 0 ;;
      esac
      ;;
    kime)
      case "$_hc_existing" in
        *fcitx5*|*"fcitx ("*|*ibus-daemon*) return 0 ;;
      esac
      ;;
  esac
  return 1
}

append_conflict_ime_warn() {
  _cw_target="$1"
  _cw_existing="$2"
  _cw_base="${3:-}"
  _cw_w=""
  if has_conflicting_ime "$_cw_target" "$_cw_existing"; then
    _cw_w=" ⚠️  참고: 기존 입력기(${_cw_existing})가 감지되었습니다. 기존 입력기가 새 입력기와 충돌할 수 있으므로 기존 입력기 설정(자동시작·서비스·환경변수)을 자동으로 비활성화하겠습니다."
  fi
  if [ -n "$_cw_base" ] && [ -n "$_cw_w" ]; then
    printf '%s\n%s' "$_cw_base" "$_cw_w"
  elif [ -n "$_cw_base" ]; then
    printf '%s' "$_cw_base"
  else
    printf '%s' "$_cw_w"
  fi
}

disable_conflicting_imes() {
  _dc_target="$1"
  _dc_user="$2"
  _dc_home="$3"
  _dc_uid="$4"
  _dc_desk="$5"
  _dc_gid=$(id -g "$_dc_user" 2>/dev/null || echo "$_dc_uid")
  _dc_changed=false
  _dc_gnome=false
  case "$_dc_desk" in
    *[Gg][Nn][Oo][Mm][Ee]*) _dc_gnome=true ;;
  esac

  _dc_adir="$_dc_home/.config/autostart"
  _dc_edir="$_dc_home/.config/environment.d"
  _dc_tdesks=""
  _dc_svcs=""
  _dc_procs=""
  _dc_desks=""
  _dc_econfs=""
  _dc_im_re=""
  _dc_kwin_re=""

  case "$_dc_target" in
    fcitx5)
      _dc_tdesks="org.fcitx.Fcitx5.desktop fcitx5-wayland-launcher.desktop fcitx5.desktop fcitx5-autostart.desktop"
      _dc_svcs="ibus kime kime-daemon fcitx"
      _dc_procs="fcitx kime kime-daemon kime-indicator kime-wayland kime-xim"
      [ "$_dc_gnome" != "true" ] && _dc_procs="$_dc_procs ibus-daemon"
      _dc_desks="ibus.desktop ibus-daemon.desktop kime.desktop fcitx.desktop fcitx-autostart.desktop"
      _dc_econfs="ibus.conf kime.conf fcitx.conf"
      _dc_im_re="(ibus|kime)"
      _dc_kwin_re="(ibus|kime)"
      ;;
    *)
      return 0
      ;;
  esac

  for _dc_td in $_dc_tdesks; do
    if [ -f "$_dc_adir/$_dc_td" ] && grep -q '^Hidden=true$' "$_dc_adir/$_dc_td" 2>/dev/null; then
      rm -f "$_dc_adir/$_dc_td"
    fi
  done

  if command -v systemctl >/dev/null 2>&1; then
    for _dc_s in $_dc_svcs; do
      if [ -S "/run/user/$_dc_uid/bus" ] && command -v sudo >/dev/null 2>&1; then
        _dc_bus="unix:path=/run/user/$_dc_uid/bus"
        if sudo -u "$_dc_user" XDG_RUNTIME_DIR="/run/user/$_dc_uid" DBUS_SESSION_BUS_ADDRESS="$_dc_bus"              systemctl --user is-enabled "$_dc_s" >/dev/null 2>&1 ||            sudo -u "$_dc_user" XDG_RUNTIME_DIR="/run/user/$_dc_uid" DBUS_SESSION_BUS_ADDRESS="$_dc_bus"              systemctl --user is-active "$_dc_s" >/dev/null 2>&1; then
          sudo -u "$_dc_user" XDG_RUNTIME_DIR="/run/user/$_dc_uid" DBUS_SESSION_BUS_ADDRESS="$_dc_bus"             systemctl --user disable --now "$_dc_s" 2>/dev/null || true
          _dc_changed=true
        fi
      else
        if su - "$_dc_user" -c "systemctl --user is-enabled $_dc_s >/dev/null 2>&1" 2>/dev/null; then
          su - "$_dc_user" -c "systemctl --user disable $_dc_s 2>/dev/null || true" || true
          _dc_changed=true
        fi
      fi
    done
  fi

  for _dc_p in $_dc_procs; do
    if command -v pgrep >/dev/null 2>&1 && pgrep -u "$_dc_uid" -x "$_dc_p" >/dev/null 2>&1; then
      pkill -u "$_dc_uid" -x "$_dc_p" 2>/dev/null || true
      _dc_changed=true
    fi
  done

  for _dc_d in $_dc_desks; do
    if [ -f "/etc/xdg/autostart/$_dc_d" ]; then
      if [ ! -f "$_dc_adir/$_dc_d" ] || ! grep -q '^Hidden=true$' "$_dc_adir/$_dc_d" 2>/dev/null; then
        mkdir -p "$_dc_adir"
        cat > "$_dc_adir/$_dc_d" <<'EOF'
[Desktop Entry]
Type=Application
Name=Disabled IME
Hidden=true
X-GNOME-Autostart-enabled=false
EOF
        chown "$_dc_uid:$_dc_gid" "$_dc_adir" "$_dc_adir/$_dc_d" 2>/dev/null || true
        _dc_changed=true
      fi
    elif [ -f "$_dc_adir/$_dc_d" ]; then
      mv -f "$_dc_adir/$_dc_d" "$_dc_adir/${_dc_d}.disabled"
      chown "$_dc_uid:$_dc_gid" "$_dc_adir/${_dc_d}.disabled" 2>/dev/null || true
      _dc_changed=true
    fi
  done

  for _dc_ec in $_dc_econfs; do
    if [ -f "$_dc_edir/$_dc_ec" ]; then
      mv -f "$_dc_edir/$_dc_ec" "$_dc_edir/${_dc_ec}.disabled"
      chown "$_dc_uid:$_dc_gid" "$_dc_edir/${_dc_ec}.disabled" 2>/dev/null || true
      _dc_changed=true
    fi
  done

  _dc_env_re="^[[:space:]]*(export[[:space:]]+)?((GTK|QT|SDL|GLFW)_IM_MODULE=['\"]?${_dc_im_re}['\"]?|XMODIFIERS=['\"]?@im=${_dc_im_re}['\"]?)[[:space:]]*(#.*)?$"
  for _dc_ef in /etc/environment "$_dc_home/.xsessionrc" "$_dc_home/.xprofile" "$_dc_home/.bash_profile" "$_dc_home/.profile"; do
    if [ -f "$_dc_ef" ] && [ -w "$_dc_ef" ] && grep -qE "$_dc_env_re" "$_dc_ef" 2>/dev/null; then
      if [ "$_dc_ef" = "/etc/environment" ]; then
        grep -Ev "$_dc_env_re" "$_dc_ef" > "${_dc_ef}.tmp" || true
        cat "${_dc_ef}.tmp" > "$_dc_ef"
        rm -f "${_dc_ef}.tmp"
        _dc_changed=true
      else
        _dc_chk="sh"
        _dc_valid=false
        case "$_dc_ef" in
          */.bash_profile) command -v bash >/dev/null 2>&1 && _dc_chk="bash" ;;
        esac
        "$_dc_chk" -n "$_dc_ef" >/dev/null 2>&1 && _dc_valid=true
        if awk -v im_re="$_dc_im_re" '
          BEGIN {
            re = "^[ \t]*(export[ \t]+)?((GTK|QT|SDL|GLFW)_IM_MODULE=[\047\"]?" im_re "[\047\"]?|XMODIFIERS=[\047\"]?@im=" im_re "[\047\"]?)[ \t]*(#.*)?$"
            mark = "^[ \t]*:[ \t]*#[ \t]*korean_input: disabled conflicting IME env[ \t]*$"
            prev = 0
          }
          $0 ~ re {
            if (!prev) {
              match($0, /^[ \t]*/)
              print substr($0, 1, RLENGTH) ": # korean_input: disabled conflicting IME env"
              prev = 1
            }
            next
          }
          $0 ~ mark {
            if (!prev) { print; prev = 1 }
            next
          }
          { prev = 0; print }
        ' "$_dc_ef" > "${_dc_ef}.tmp"; then
          if [ "$_dc_valid" = "true" ] && ! "$_dc_chk" -n "${_dc_ef}.tmp" >/dev/null 2>&1; then
            rm -f "${_dc_ef}.tmp"
            warn "셸 구문 검증 실패로 $_dc_ef 자동 수정을 건너뜁니다 (수동 확인 필요)"
          else
            cat "${_dc_ef}.tmp" > "$_dc_ef"
            rm -f "${_dc_ef}.tmp"
            chown "$_dc_uid:$_dc_gid" "$_dc_ef" 2>/dev/null || true
            _dc_changed=true
          fi
        else
          rm -f "${_dc_ef}.tmp"
        fi
      fi
    fi
  done

  _dc_kwin="$_dc_home/.config/kwinrc"
  if [ -f "$_dc_kwin" ] && grep -qE '^InputMethod(\[\$e\])?=.*'"${_dc_kwin_re}" "$_dc_kwin" 2>/dev/null; then
    if command -v kwriteconfig6 >/dev/null 2>&1; then
      kwriteconfig6 --file "$_dc_kwin" --group Wayland --key InputMethod --delete 2>/dev/null || true
    elif command -v kwriteconfig5 >/dev/null 2>&1; then
      kwriteconfig5 --file "$_dc_kwin" --group Wayland --key InputMethod --delete 2>/dev/null || true
    else
      awk '
        BEGIN { in_wayland=0 }
        /^\[Wayland\]$/ { in_wayland=1; print; next }
        /^\[/ { in_wayland=0; print; next }
        in_wayland && /^InputMethod(\[\$e\])?=/ { next }
        { print }
      ' "$_dc_kwin" > "${_dc_kwin}.tmp" && cat "${_dc_kwin}.tmp" > "$_dc_kwin" && rm -f "${_dc_kwin}.tmp"
    fi
    chown "$_dc_uid:$_dc_gid" "$_dc_kwin" 2>/dev/null || true
    _dc_changed=true
  fi

  _dc_dbus_dir="$_dc_home/.local/share/dbus-1/services"
  if [ "$_dc_target" = "ibus" ]; then
    for _dc_ds in org.freedesktop.IBus.service org.freedesktop.portal.IBus.service; do
      if [ -f "$_dc_dbus_dir/$_dc_ds" ] && grep -q '^# korean_input: disabled' "$_dc_dbus_dir/$_dc_ds" 2>/dev/null; then
        rm -f "$_dc_dbus_dir/$_dc_ds"
        _dc_changed=true
      fi
    done
  elif [ "$_dc_gnome" != "true" ]; then
    mkdir -p "$_dc_dbus_dir"
    for _dc_ds in org.freedesktop.IBus.service org.freedesktop.portal.IBus.service; do
      if [ ! -f "$_dc_dbus_dir/$_dc_ds" ]; then
        _dc_dn="${_dc_ds%.service}"
        cat > "$_dc_dbus_dir/$_dc_ds" <<EOF
# korean_input: disabled (다른 한글 입력기와 충돌 방지 / prevent conflict with the selected IME)
[D-BUS Service]
Name=$_dc_dn
Exec=/bin/false
EOF
        _dc_changed=true
      fi
    done
    chown -R "$_dc_uid:$_dc_gid" "$_dc_home/.local/share/dbus-1" 2>/dev/null || true
  fi

  if [ "$_dc_target" != "ibus" ] && [ "$_dc_gnome" != "true" ]; then
    for _dc_hp in ibus-engine-hangul ibus-engine-simple ibus-ui-gtk3 ibus-x11 ibus-portal ibus-extension-gtk3 ibus-dconf ibus-memconf; do
      pkill -u "$_dc_uid" -x "$_dc_hp" 2>/dev/null || true
    done
  fi
  sleep 1
  _dc_surv=""
  for _dc_hp in $_dc_procs; do
    if command -v pgrep >/dev/null 2>&1 && pgrep -u "$_dc_uid" -x "$_dc_hp" >/dev/null 2>&1; then
      pkill -9 -u "$_dc_uid" -x "$_dc_hp" 2>/dev/null || true
      _dc_surv="$_dc_surv $_dc_hp"
    fi
  done
  if [ -n "$_dc_surv" ]; then
    warn "종료되지 않아 강제 종료한 입력기 프로세스:$_dc_surv"
    _dc_changed=true
  fi

  if [ "$_dc_changed" = "true" ]; then
    ok "기존 충돌 입력기 설정 자동 비활성화 완료 (대상: $_dc_target)"
  fi
}

fcitx5_overwrite_note() {
  if [ -f "$1/.config/fcitx5/profile" ] || [ -f "$1/.config/fcitx5/config" ]; then
    echo " (기존 파일 덮어쓰기)"
  else
    echo " (신규 생성)"
  fi
}

confirm_before_changes() {
  _pf_title="$1"
  _pf_os="$2"
  _pf_user="$3"
  _pf_uid="$4"
  _pf_home="$5"
  _pf_desktop="$6"
  _pf_session="$7"
  _pf_ime="$8"
  _pf_pkg="$9"
  shift 9
  _pf_cfg="$1"
  _pf_warn="${2:-}"

  echo
  echo "============================================================"
  echo " 🔍 설치 전 시스템 조사 및 변경 예정 내역"
  echo "============================================================"
  echo " • 대상 스크립트  : $_pf_title (v$SCRIPT_VERSION)"
  echo " • 감지된 OS      : $_pf_os"
  echo " • 대상 사용자    : $_pf_user (UID=$_pf_uid, HOME=$_pf_home)"
  echo " • 데스크톱/세션  : $_pf_desktop / $_pf_session"
  echo " • 기존 입력기    : $_pf_ime"
  echo "------------------------------------------------------------"
  echo " 📦 패키지 변경 예정:"
  printf "%b\n" "$_pf_pkg"
  echo " ⚙️  설정·파일 변경 예정:"
  printf "%b\n" "$_pf_cfg"
  echo " • 설치 로그 파일 : $LOG_FILE"
  if [ -n "$_pf_warn" ]; then
    echo "------------------------------------------------------------"
    printf "%b\n" "$_pf_warn"
  fi
  echo "============================================================"
  echo " ⚠️  경고: 계속 진행하면 위 패키지와 시스템/사용자 설정이 실제로 변경됩니다."

  if [ "$AUTO_YES" = "true" ]; then
    echo " ℹ️  --yes (-y) 옵션이 지정되어 확인 절차를 건너뛰고 진행합니다."
    echo
    return 0
  fi

  if ! ( : </dev/tty ) 2>/dev/null; then
    echo " ❌ 대화형 터미널(/dev/tty)이 없어 사용자 확인을 받을 수 없습니다." >&2
    echo "    대화형 터미널에서 실행하거나 --yes (-y) 옵션을 전달하세요." >&2
    exit 1
  fi

  _pf_reply=""
  printf " 이대로 설치를 진행하시겠습니까? [y/N]: "
  IFS= read -r _pf_reply </dev/tty || _pf_reply=""
  case "$_pf_reply" in
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

  USER=$(detect_user)
  TARGET_HOME=$(awk -F: -v u="$USER" '$1==u {print $6}' /etc/passwd)
  TARGET_UID=$(id -u "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")

  _pkg_summary="   - apk update && apk add: fcitx5, fcitx5-hangul, fcitx5-gtk,\n     fcitx5-qt, fcitx5-configtool, font-noto-cjk"
  _cfg_summary="   - /etc/environment, $TARGET_HOME/.profile\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록"
  _extra_warn=""
  if [ -f "$TARGET_HOME/.config/fcitx5/profile" ] || [ -f "$TARGET_HOME/.config/fcitx5/config" ]; then
    _extra_warn=" ⚠️  참고: 기존 Fcitx5 설정 파일($TARGET_HOME/.config/fcitx5/profile, config)이 덮어써집니다."
  fi
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn")

  confirm_before_changes     "Alpine Linux / Chimera / Nura Chimera Linux (FreeBSD userland + apk)"     "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME"     "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME"     "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== Alpine Linux / Chimera / Nura Chimera Linux (FreeBSD userland + apk) 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. apk 패키지 설치 (Alpine / Chimera 공용)
  log "[1/4] fcitx5 패키지 설치 (apk)..."
  apk update
  apk add fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool font-noto-cjk
  ok "패키지 설치 완료"
  disable_conflicting_imes "fcitx5" "$USER" "$TARGET_HOME" "$TARGET_UID" "$DESKTOP"

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

⌨️  전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space, Shift+Space
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
  echo " 전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space, Shift+Space"
  echo " 설정: fcitx5-configtool"
  echo "============================================================"
}
main "$@"
