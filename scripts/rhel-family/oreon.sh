#!/usr/bin/env bash
# AlmaLinux / Rocky / RHEL / CentOS / Oreon Oreon Linux (Alma 기반 데스크톱) - 한글 입력기(ibus-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/rhel-family/oreon.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.3.1"
LOG_FILE="/var/log/install-hangul-oreon.log"

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
    local _out="" _item
    for _item in "${_found[@]}"; do
      _out="${_out:+$_out, }$_item"
    done
    echo "$_out"
  fi
}

has_conflicting_ime() {
  local _hc_target="$1"
  local _hc_existing="$2"
  case "$_hc_target" in
    fcitx5)
      [[ "$_hc_existing" == *"ibus-daemon"* || "$_hc_existing" == *"kime"* || "$_hc_existing" == *"fcitx ("* ]] && return 0
      ;;
    ibus)
      [[ "$_hc_existing" == *"fcitx5"* || "$_hc_existing" == *"fcitx ("* || "$_hc_existing" == *"kime"* ]] && return 0
      ;;
    kime)
      [[ "$_hc_existing" == *"fcitx5"* || "$_hc_existing" == *"fcitx ("* || "$_hc_existing" == *"ibus-daemon"* ]] && return 0
      ;;
  esac
  return 1
}

append_conflict_ime_warn() {
  local _target_ime="$1"
  local _existing_ime="$2"
  local _base="${3:-}"
  local _w=""
  if has_conflicting_ime "$_target_ime" "$_existing_ime"; then
    _w=" ⚠️  참고: 기존 입력기(${_existing_ime})가 감지되었습니다. 기존 입력기가 새 입력기와 충돌할 수 있으므로 기존 입력기 설정(자동시작·서비스·환경변수)을 자동으로 비활성화하겠습니다."
  fi
  if [[ -n "$_base" && -n "$_w" ]]; then
    printf '%s\n%s' "$_base" "$_w"
  elif [[ -n "$_base" ]]; then
    printf '%s' "$_base"
  else
    printf '%s' "$_w"
  fi
}

disable_conflicting_imes() {
  local _target_ime="$1"
  local _user="$2"
  local _home="$3"
  local _uid="$4"
  local _desktop="$5"
  local _gid
  _gid=$(id -g "$_user" 2>/dev/null || echo "$_uid")
  local _changed=false
  local _is_gnome=false
  [[ "${_desktop,,}" == *"gnome"* ]] && _is_gnome=true

  local _autostart_dir="$_home/.config/autostart"
  local _env_dir="$_home/.config/environment.d"
  local _target_desktops=() _svcs=() _procs=() _desktops=() _env_confs=()
  local _im_re="" _kwin_re=""

  case "$_target_ime" in
    fcitx5)
      _target_desktops=(org.fcitx.Fcitx5.desktop fcitx5-wayland-launcher.desktop fcitx5.desktop fcitx5-autostart.desktop)
      _svcs=(ibus kime kime-daemon fcitx)
      _procs=(fcitx kime kime-daemon kime-indicator kime-wayland kime-xim)
      [[ "$_is_gnome" != "true" ]] && _procs+=(ibus-daemon)
      _desktops=(ibus.desktop ibus-daemon.desktop kime.desktop fcitx.desktop fcitx-autostart.desktop)
      _env_confs=(ibus.conf kime.conf fcitx.conf)
      _im_re="(ibus|kime)"
      _kwin_re="(ibus|kime)"
      ;;
    ibus)
      _target_desktops=(ibus.desktop ibus-daemon.desktop org.freedesktop.IBus.Panel.Wayland.Gtk3.desktop)
      _svcs=(fcitx5 fcitx kime kime-daemon)
      _procs=(fcitx5 fcitx kime kime-daemon kime-indicator kime-wayland kime-xim)
      _desktops=(fcitx5.desktop org.fcitx.Fcitx5.desktop fcitx5-wayland-launcher.desktop fcitx5-autostart.desktop fcitx.desktop fcitx-autostart.desktop kime.desktop)
      _env_confs=(fcitx5.conf fcitx.conf kime.conf)
      _im_re="(fcitx5|fcitx|kime)"
      _kwin_re="(fcitx|kime)"
      ;;
    kime)
      _target_desktops=(kime.desktop)
      _svcs=(fcitx5 fcitx ibus)
      _procs=(fcitx5 fcitx)
      [[ "$_is_gnome" != "true" ]] && _procs+=(ibus-daemon)
      _desktops=(fcitx5.desktop org.fcitx.Fcitx5.desktop fcitx5-wayland-launcher.desktop fcitx5-autostart.desktop fcitx.desktop fcitx-autostart.desktop ibus.desktop ibus-daemon.desktop)
      _env_confs=(fcitx5.conf fcitx.conf ibus.conf)
      _im_re="(fcitx5|fcitx|ibus)"
      _kwin_re="(fcitx|ibus)"
      ;;
    *)
      return 0
      ;;
  esac

  local _td
  for _td in "${_target_desktops[@]}"; do
    if [[ -f "$_autostart_dir/$_td" ]] && grep -q '^Hidden=true$' "$_autostart_dir/$_td" 2>/dev/null; then
      rm -f "$_autostart_dir/$_td"
    fi
  done

  local _svc
  if command -v systemctl >/dev/null 2>&1; then
    if [[ -S "/run/user/$_uid/bus" ]] && command -v sudo >/dev/null 2>&1; then
      local _bus="unix:path=/run/user/$_uid/bus"
      for _svc in "${_svcs[@]}"; do
        if sudo -u "$_user" XDG_RUNTIME_DIR="/run/user/$_uid" DBUS_SESSION_BUS_ADDRESS="$_bus" \
             systemctl --user is-enabled "$_svc" >/dev/null 2>&1 || \
           sudo -u "$_user" XDG_RUNTIME_DIR="/run/user/$_uid" DBUS_SESSION_BUS_ADDRESS="$_bus" \
             systemctl --user is-active "$_svc" >/dev/null 2>&1; then
          sudo -u "$_user" XDG_RUNTIME_DIR="/run/user/$_uid" DBUS_SESSION_BUS_ADDRESS="$_bus" \
            systemctl --user disable --now "$_svc" 2>/dev/null || true
          _changed=true
        fi
      done
    else
      for _svc in "${_svcs[@]}"; do
        if su - "$_user" -c "systemctl --user is-enabled $_svc >/dev/null 2>&1" 2>/dev/null; then
          su - "$_user" -c "systemctl --user disable $_svc 2>/dev/null || true" || true
          _changed=true
        fi
      done
    fi
  fi

  local _p
  for _p in "${_procs[@]}"; do
    if command -v pgrep >/dev/null 2>&1 && pgrep -u "$_uid" -x "$_p" >/dev/null 2>&1; then
      pkill -u "$_uid" -x "$_p" 2>/dev/null || true
      _changed=true
    fi
  done

  local _desk
  for _desk in "${_desktops[@]}"; do
    if [[ -f "/etc/xdg/autostart/$_desk" ]]; then
      if [[ ! -f "$_autostart_dir/$_desk" ]] || ! grep -q '^Hidden=true$' "$_autostart_dir/$_desk" 2>/dev/null; then
        mkdir -p "$_autostart_dir"
        cat > "$_autostart_dir/$_desk" <<'EOF'
[Desktop Entry]
Type=Application
Name=Disabled IME
Hidden=true
X-GNOME-Autostart-enabled=false
EOF
        chown "$_uid:$_gid" "$_autostart_dir" "$_autostart_dir/$_desk" 2>/dev/null || true
        _changed=true
      fi
    elif [[ -f "$_autostart_dir/$_desk" ]]; then
      mv -f "$_autostart_dir/$_desk" "$_autostart_dir/${_desk}.disabled"
      chown "$_uid:$_gid" "$_autostart_dir/${_desk}.disabled" 2>/dev/null || true
      _changed=true
    fi
  done

  local _econf
  for _econf in "${_env_confs[@]}"; do
    if [[ -f "$_env_dir/$_econf" ]]; then
      mv -f "$_env_dir/$_econf" "$_env_dir/${_econf}.disabled"
      chown "$_uid:$_gid" "$_env_dir/${_econf}.disabled" 2>/dev/null || true
      _changed=true
    fi
  done

  local _env_line_re="^[[:space:]]*(export[[:space:]]+)?((GTK|QT|SDL|GLFW)_IM_MODULE=['\"]?${_im_re}['\"]?|XMODIFIERS=['\"]?@im=${_im_re}['\"]?)[[:space:]]*(#.*)?$"
  local _ef
  for _ef in /etc/environment "$_home/.xsessionrc" "$_home/.xprofile" "$_home/.bash_profile" "$_home/.profile"; do
    if [[ -f "$_ef" && -w "$_ef" ]] && grep -qE "$_env_line_re" "$_ef" 2>/dev/null; then
      grep -Ev "$_env_line_re" "$_ef" > "${_ef}.tmp" || true
      cat "${_ef}.tmp" > "$_ef"
      rm -f "${_ef}.tmp"
      if [[ "$_ef" != "/etc/environment" ]]; then
        chown "$_uid:$_gid" "$_ef" 2>/dev/null || true
      fi
      _changed=true
    fi
  done

  local _kwinrc="$_home/.config/kwinrc"
  if [[ -f "$_kwinrc" ]] && grep -qE '^InputMethod(\[\$e\])?=.*'"${_kwin_re}" "$_kwinrc" 2>/dev/null; then
    if command -v kwriteconfig6 >/dev/null 2>&1; then
      kwriteconfig6 --file "$_kwinrc" --group Wayland --key InputMethod --delete 2>/dev/null || true
    elif command -v kwriteconfig5 >/dev/null 2>&1; then
      kwriteconfig5 --file "$_kwinrc" --group Wayland --key InputMethod --delete 2>/dev/null || true
    else
      awk '
        BEGIN { in_wayland=0 }
        /^\[Wayland\]$/ { in_wayland=1; print; next }
        /^\[/ { in_wayland=0; print; next }
        in_wayland && /^InputMethod(\[\$e\])?=/ { next }
        { print }
      ' "$_kwinrc" > "${_kwinrc}.tmp" && cat "${_kwinrc}.tmp" > "$_kwinrc" && rm -f "${_kwinrc}.tmp"
    fi
    chown "$_uid:$_gid" "$_kwinrc" 2>/dev/null || true
    if [[ -S "/run/user/$_uid/bus" ]] && command -v sudo >/dev/null 2>&1; then
      local _qdbus=""
      if command -v qdbus6 >/dev/null 2>&1; then _qdbus="qdbus6"
      elif command -v qdbus >/dev/null 2>&1; then _qdbus="qdbus"
      fi
      if [[ -n "$_qdbus" ]]; then
        sudo -u "$_user" XDG_RUNTIME_DIR="/run/user/$_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_uid/bus" \
          "$_qdbus" org.kde.KWin /KWin reconfigure 2>/dev/null || true
      fi
    fi
    _changed=true
  fi

  if [[ "$_changed" == "true" ]]; then
    ok "기존 충돌 입력기 설정 자동 비활성화 완료 (대상: $_target_ime)"
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
  err "대상 사용자 탐지 실패"
}

main() {
  require_root

  local USER TARGET_HOME TARGET_UID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID")

  local _pkg_summary="   - dnf install -y: ibus-hangul, ibus-setup, google-noto-sans-cjk-ttc-fonts (또는 google-noto-cjk-fonts)"
  local _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\n   - 실행 중인 ibus-daemon 재시작\n   - $TARGET_HOME/.config/environment.d/ibus.conf, ~/.bash_profile (또는 ~/.profile)"
  local _extra_warn
  _extra_warn=$(append_conflict_ime_warn "ibus" "$EXISTING_IME")

  confirm_before_changes     "AlmaLinux / Rocky / RHEL / CentOS / Oreon Oreon Linux (Alma 기반 데스크톱) (ibus-hangul)"     "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME"     "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME"     "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== AlmaLinux / Rocky / RHEL / CentOS / Oreon Oreon Linux (Alma 기반 데스크톱) 한글 입력기(ibus-hangul) 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. ibus-hangul + 한글 폰트 설치 (RHEL 계열 기본 공식 저장소)
  log "[1/3] ibus-hangul 및 한글 폰트 패키지 설치 (dnf)..."
  dnf install -y -q ibus-hangul ibus-setup
  dnf install -y -q google-noto-sans-cjk-ttc-fonts 2>/dev/null || dnf install -y -q google-noto-cjk-fonts 2>/dev/null || true
  ok "패키지 설치 완료"
  disable_conflicting_imes "ibus" "$USER" "$TARGET_HOME" "$TARGET_UID" "$DESKTOP"

  # 2. 입력 소스 등록 및 ibus 엔진 캐시 갱신 (GNOME + 비-GNOME 대응)
  log "[2/3] 입력 소스 및 ibus 엔진 캐시 등록 (Hangul)..."
  ibus write-cache --system 2>/dev/null || true
  local sources="[('xkb', 'us'), ('ibus', 'hangul')]"
  local preload="['xkb:us::eng', 'hangul']"
  if [ -S "/run/user/$TARGET_UID/bus" ]; then
    local bus="unix:path=/run/user/$TARGET_UID/bus"
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \
      gsettings set org.gnome.desktop.input-sources sources "$sources" 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \
      gsettings set org.freedesktop.ibus.general preload-engines "$preload" 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \
      ibus write-cache 2>/dev/null || true
    if pgrep -u "$TARGET_UID" -x ibus-daemon >/dev/null 2>&1; then
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \
        ibus restart 2>/dev/null || true
    fi
  else
    su - "$USER" -c "gsettings set org.gnome.desktop.input-sources sources \"$sources\"" 2>/dev/null || true
    su - "$USER" -c "gsettings set org.freedesktop.ibus.general preload-engines \"$preload\"" 2>/dev/null || true
    su - "$USER" -c "ibus write-cache" 2>/dev/null || true
  fi
  ok "입력 소스 및 엔진 캐시 설정 완료"

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
