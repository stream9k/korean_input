#!/usr/bin/env bash
# kime (Rust 기반 경량 입력기) openSUSE (zypper) - kime (Rust 기반 경량 한글 입력기) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/kime/kime-opensuse.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.3.3"
LOG_FILE="/var/log/install-kime-kime-opensuse.log"

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

  # ibus D-Bus 자동 활성화(on-demand 실행) 차단 / 복원 (GNOME은 ibus를 직접 사용하므로 제외)
  local _dbus_dir="$_home/.local/share/dbus-1/services"
  local _dbus_svc _dbus_name
  local _ibus_dbus_svcs=(org.freedesktop.IBus.service org.freedesktop.portal.IBus.service)
  if [[ "$_target_ime" == "ibus" ]]; then
    for _dbus_svc in "${_ibus_dbus_svcs[@]}"; do
      if [[ -f "$_dbus_dir/$_dbus_svc" ]] && grep -q '^# korean_input: disabled' "$_dbus_dir/$_dbus_svc" 2>/dev/null; then
        rm -f "$_dbus_dir/$_dbus_svc"
        _changed=true
      fi
    done
  elif [[ "$_is_gnome" != "true" ]]; then
    mkdir -p "$_dbus_dir"
    for _dbus_svc in "${_ibus_dbus_svcs[@]}"; do
      if [[ ! -f "$_dbus_dir/$_dbus_svc" ]]; then
        _dbus_name="${_dbus_svc%.service}"
        cat > "$_dbus_dir/$_dbus_svc" <<EOF
# korean_input: disabled (다른 한글 입력기와 충돌 방지 / prevent conflict with the selected IME)
[D-BUS Service]
Name=$_dbus_name
Exec=/bin/false
EOF
        _changed=true
      fi
    done
    chown -R "$_uid:$_gid" "$_home/.local/share/dbus-1" 2>/dev/null || true
  fi

  # 남아있는 보조 프로세스(ibus 엔진/UI 등) 정리 후, 끝까지 살아있는 충돌 프로세스는 강제 종료
  local _hp
  if [[ "$_target_ime" != "ibus" && "$_is_gnome" != "true" ]]; then
    for _hp in ibus-engine-hangul ibus-engine-simple ibus-ui-gtk3 ibus-x11 ibus-portal ibus-extension-gtk3 ibus-dconf ibus-memconf; do
      pkill -u "$_uid" -x "$_hp" 2>/dev/null || true
    done
  fi
  sleep 1
  local _survivors=()
  for _hp in "${_procs[@]}"; do
    if command -v pgrep >/dev/null 2>&1 && pgrep -u "$_uid" -x "$_hp" >/dev/null 2>&1; then
      pkill -9 -u "$_uid" -x "$_hp" 2>/dev/null || true
      _survivors+=("$_hp")
    fi
  done
  if [[ ${#_survivors[@]} -gt 0 ]]; then
    warn "종료되지 않아 강제 종료한 입력기 프로세스: ${_survivors[*]}"
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

http_get() {
  local _url="$1"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$_url"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- "$_url"
  else
    err "curl 또는 wget이 필요합니다."
  fi
}

http_latest_tag() {
  local _url="$1"
  if command -v curl >/dev/null 2>&1; then
    local _eff
    _eff=$(curl -fsSLI -o /dev/null -w '%{url_effective}' "$_url" 2>/dev/null || true)
    if [[ -n "$_eff" && "$_eff" == */tag/* ]]; then
      echo "${_eff##*/}"
    fi
  elif command -v wget >/dev/null 2>&1; then
    local _loc
    _loc=$(wget --spider -S "$_url" 2>&1 | awk '/^[[:space:]]*[Ll]ocation:/ {u=$2} END {gsub(/\r/,"",u); print u}' || true)
    if [[ -n "$_loc" && "$_loc" == */tag/* ]]; then
      echo "${_loc##*/}"
    fi
  fi
}

http_download() {
  local _url="$1" _out="$2"
  if command -v curl >/dev/null 2>&1; then
    curl -fSL --retry 2 -o "$_out" "$_url"
  elif command -v wget >/dev/null 2>&1; then
    wget -O "$_out" "$_url"
  else
    err "curl 또는 wget이 필요합니다."
  fi
}

detect_kime_family() {
  local _id="${1,,}" _like="${2,,}" _deb_ver_file="${3:-/etc/debian_version}"
  case "$_id" in
    arch|manjaro|endeavouros|garuda|cachyos|artix|arcolinux|rebornos|biglinux|bluestar|archcraft)
      echo "arch"; return ;;
    fedora|nobara|ultramarine|bazzite|aurora|bluefin)
      echo "fedora"; return ;;
    opensuse*|suse*)
      echo "opensuse"; return ;;
    ubuntu|debian|linuxmint|lmde|pop|zorin|elementary|neon|kali|mx|antix|sparky|tuxedo|bodhi|peppermint|voyager|devuan|parrot|raspbian|deepin|pureos|tails|anduinos|bunsenlabs|cuerdos|solydxk)
      echo "debian"; return ;;
  esac
  case " $_like " in
    *" arch "*) echo "arch"; return ;;
    *" fedora "*) echo "fedora"; return ;;
    *" opensuse "*|*" suse "*) echo "opensuse"; return ;;
    *" debian "*|*" ubuntu "*) echo "debian"; return ;;
  esac
  if [[ -f "$_deb_ver_file" ]]; then
    echo "debian"; return
  fi
  echo "unknown"
}

ubuntu_codename_to_ver() {
  case "${1,,}" in
    bionic) echo "18.04" ;;
    focal) echo "20.04" ;;
    jammy) echo "22.04" ;;
    noble) echo "24.04" ;;
    oracular) echo "24.10" ;;
    plucky) echo "25.04" ;;
    questing) echo "25.10" ;;
    resolute) echo "26.04" ;;
    *) echo "" ;;
  esac
}

debian_ver_to_codename() {
  local _v="${1,,}"
  _v=$(printf '%s' "$_v" | tr -d '[:space:]')
  _v="${_v%%/*}"
  case "$_v" in
    14|14.*|forky*) echo "forky" ;;
    13|13.*|trixie*) echo "trixie" ;;
    12|12.*|bookworm*) echo "bookworm" ;;
    11|11.*|bullseye*) echo "bullseye" ;;
    10|10.*|buster*) echo "buster" ;;
    *) echo "" ;;
  esac
}

read_upstream_lsb() {
  local _file="$1"
  if [[ -f "$_file" ]]; then
    (
      # shellcheck disable=SC1090
      . "$_file" 2>/dev/null || true
      printf '%s|%s|%s\n' "${DISTRIB_ID:-}" "${DISTRIB_RELEASE:-}" "${DISTRIB_CODENAME:-}"
    )
  fi
}

resolve_kime_deb_target() {
  local _id="${1,,}" _ver="$2" _os_cn="${3,,}" _ubuntu_cn="${4,,}" _debian_cn="${5,,}"
  local _upstream_lsb="${6:-/etc/upstream-release/lsb-release}"
  local _debian_ver_file="${7:-/etc/debian_version}"
  local _uver="" _dcn="" _up_id="" _up_rel="" _up_cn=""

  if [[ "$_id" == "ubuntu" ]]; then
    if [[ "$_ver" =~ ^[0-9]+\.[0-9]+$ ]]; then
      echo "ubuntu-${_ver}"; return
    fi
    _uver=$(ubuntu_codename_to_ver "${_ubuntu_cn:-$_os_cn}")
    if [[ -n "$_uver" ]]; then
      echo "ubuntu-${_uver}"; return
    fi
  fi

  if [[ -n "$_ubuntu_cn" ]]; then
    if [[ -f "$_upstream_lsb" ]]; then
      IFS='|' read -r _up_id _up_rel _up_cn < <(read_upstream_lsb "$_upstream_lsb")
      if [[ "${_up_id,,}" == "ubuntu" && "$_up_rel" =~ ^[0-9]+\.[0-9]+$ ]]; then
        echo "ubuntu-${_up_rel}"; return
      fi
    fi
    _uver=$(ubuntu_codename_to_ver "$_ubuntu_cn")
    if [[ -n "$_uver" ]]; then
      echo "ubuntu-${_uver}"; return
    fi
  fi

  if [[ "$_id" == "debian" ]]; then
    if [[ -n "$_os_cn" ]]; then
      echo "debian-${_os_cn}"; return
    fi
    _dcn=$(debian_ver_to_codename "$_ver")
    if [[ -z "$_dcn" && -f "$_debian_ver_file" ]]; then
      local _dv=""
      IFS= read -r _dv < "$_debian_ver_file" || true
      _dcn=$(debian_ver_to_codename "$_dv")
    fi
    if [[ -n "$_dcn" ]]; then
      echo "debian-${_dcn}"; return
    fi
  fi

  if [[ -n "$_debian_cn" ]]; then
    echo "debian-${_debian_cn}"; return
  fi

  if [[ -f "$_upstream_lsb" ]]; then
    IFS='|' read -r _up_id _up_rel _up_cn < <(read_upstream_lsb "$_upstream_lsb")
    if [[ "${_up_id,,}" == "ubuntu" ]]; then
      if [[ "$_up_rel" =~ ^[0-9]+\.[0-9]+$ ]]; then
        echo "ubuntu-${_up_rel}"; return
      fi
      _uver=$(ubuntu_codename_to_ver "$_up_cn")
      if [[ -n "$_uver" ]]; then
        echo "ubuntu-${_uver}"; return
      fi
    elif [[ "${_up_id,,}" == "debian" && -n "$_up_cn" ]]; then
      echo "debian-${_up_cn,,}"; return
    fi
  fi

  if [[ -f "$_debian_ver_file" ]]; then
    local _dv=""
    IFS= read -r _dv < "$_debian_ver_file" || true
    _dcn=$(debian_ver_to_codename "$_dv")
    if [[ -n "$_dcn" ]]; then
      echo "debian-${_dcn}"; return
    fi
  fi

  if [[ -n "$_os_cn" ]]; then
    _dcn=$(debian_ver_to_codename "$_os_cn")
    if [[ -n "$_dcn" ]]; then
      echo "debian-${_dcn}"; return
    fi
  fi

  echo ""
}

resolve_kime_deb_release() {
  local _deb_arch="$1" _deb_target="$2"
  local _api_url="${KIME_RELEASE_API_URL:-https://api.github.com/repos/Riey/kime/releases/latest}"
  local _latest_url="${KIME_RELEASE_LATEST_URL:-https://github.com/Riey/kime/releases/latest}"
  local _api_json="" _tag="" _urls="" _html="" _paths="" _matched="" _avail="" _u _fname _re

  _api_json=$(http_get "$_api_url" 2>/dev/null || true)
  if [[ -n "$_api_json" ]]; then
    _tag=$(printf '%s\n' "$_api_json" | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1 || true)
    _urls=$(printf '%s\n' "$_api_json" | grep -oE 'https://github\.com/Riey/kime/releases/download/[^"]+\.deb' | sort -u || true)
  fi

  if [[ -z "$_urls" ]]; then
    _tag=$(http_latest_tag "$_latest_url" || true)
    if [[ -n "$_tag" ]]; then
      _html=$(http_get "https://github.com/Riey/kime/releases/expanded_assets/${_tag}" 2>/dev/null || true)
      _paths=$(printf '%s\n' "$_html" | grep -oE '/Riey/kime/releases/download/[^"]+\.deb' | sort -u || true)
      if [[ -n "$_paths" ]]; then
        _urls=$(printf '%s\n' "$_paths" | sed 's|^|https://github.com|')
      fi
    fi
  fi

  _re="(_${_deb_arch}_${_deb_target}\.deb$|_${_deb_target}_[^/]+_${_deb_arch}\.deb$)"
  for _u in $_urls; do
    _fname="${_u##*/}"
    if [[ -n "$_avail" ]]; then
      _avail="${_avail} ${_fname}"
    else
      _avail="$_fname"
    fi
    if [[ -z "$_matched" && "$_fname" =~ $_re ]]; then
      _matched="$_u"
    fi
  done

  printf '%s|%s|%s\n' "$_tag" "$_matched" "$_avail"
}

check_fedora_copr_support() {
  local _ver="$1" _arch="$2" _pretty="$3"
  local _copr_url="${KIME_COPR_API_URL:-https://copr.fedorainfracloud.org/api_3/project?ownername=toroidalfox&projectname=kime}"
  local _api_json="" _chroots="" _target_chroot _avail_line=""

  _api_json=$(http_get "$_copr_url" 2>/dev/null || true)
  if [[ -z "$_api_json" ]]; then
    warn "Fedora COPR API 조회 실패 — dnf로 직접 시도합니다." >&2
    return 0
  fi

  _chroots=$(printf '%s\n' "$_api_json" | grep -oE '"fedora-[a-z0-9]+-[a-z0-9_]+"' | tr -d '"' | sort -u || true)
  if [[ -z "$_chroots" ]]; then
    warn "Fedora COPR 지원 목록 파싱 실패 — dnf로 직접 시도합니다." >&2
    return 0
  fi

  _target_chroot="fedora-${_ver}-${_arch}"
  if [[ "${_pretty,,}" == *"rawhide"* ]]; then
    _target_chroot="fedora-rawhide-${_arch}"
  fi

  if printf '%s\n' "$_chroots" | grep -qxF "$_target_chroot"; then
    return 0
  fi

  _avail_line=$(printf '%s\n' "$_chroots" | paste -sd ', ' - || true)
  echo "$_avail_line"
  return 1
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

  local _os_id="" _os_like="" _os_ver="" _os_codename="" _ubuntu_codename="" _debian_codename=""
  if [[ -f /etc/os-release ]]; then
    IFS='|' read -r _os_id _os_like _os_ver _os_codename _ubuntu_codename _debian_codename < <(
      # shellcheck disable=SC1091
      . /etc/os-release
      printf '%s|%s|%s|%s|%s|%s\n' \
        "${ID:-}" "${ID_LIKE:-}" "${VERSION_ID:-}" "${VERSION_CODENAME:-}" \
        "${UBUNTU_CODENAME:-}" "${DEBIAN_CODENAME:-}"
    )
  fi

  local _kime_family _aur_helper="" _pkg_summary=""
  local _deb_arch="" _deb_target="" _kime_tag="" _deb_url="" _deb_avail="" _deb_name=""
  _kime_family=$(detect_kime_family "$_os_id" "$_os_like")

  case "$_kime_family" in
    arch)
      local _arch_m
      _arch_m=$(uname -m)
      if [[ "$_arch_m" != "x86_64" ]]; then
        err "AUR kime 패키지는 x86_64 아키텍처만 지원합니다 (현재: $_arch_m). 수동 빌드: https://github.com/Riey/kime"
      fi
      if command -v yay >/dev/null 2>&1 || su - "$USER" -c 'command -v yay >/dev/null 2>&1'; then
        _aur_helper="yay"
        _pkg_summary="   - AUR (yay): su - $USER -c \"yay -S --noconfirm kime\""
      elif command -v paru >/dev/null 2>&1 || su - "$USER" -c 'command -v paru >/dev/null 2>&1'; then
        _aur_helper="paru"
        _pkg_summary="   - AUR (paru): su - $USER -c \"paru -S --noconfirm kime\""
      else
        err "AUR 헬퍼(yay 또는 paru)가 없습니다. 수동 설치 필요: https://github.com/Riey/kime"
      fi
      ;;
    fedora)
      if [[ -e /run/ostree-booted ]]; then
        err "Fedora Atomic(Silverblue/Kinoite 등) 환경은 dnf/COPR 대신 rpm-ostree 레이어링이 필요합니다. 수동 설치: https://github.com/Riey/kime"
      fi
      local _fedora_arch _copr_target _copr_avail=""
      _fedora_arch=$(uname -m)
      _copr_target="fedora-${_os_ver}-${_fedora_arch}"
      if [[ "${OS_NAME,,}" == *"rawhide"* ]]; then
        _copr_target="fedora-rawhide-${_fedora_arch}"
      fi
      if ! _copr_avail=$(check_fedora_copr_support "$_os_ver" "$_fedora_arch" "$OS_NAME"); then
        err "Fedora COPR(toroidalfox/kime)에서 현재 버전(${_copr_target})을 지원하지 않습니다. 지원 대상: ${_copr_avail:-없음} | 수동 빌드: https://github.com/Riey/kime"
      fi
      _pkg_summary="   - Fedora COPR (toroidalfox/kime, ${_copr_target}): dnf copr enable -y toroidalfox/kime && dnf install -y kime"
      ;;
    opensuse)
      if [[ "$_os_id" == "opensuse-microos" || "$_os_id" == "opensuse-aeon" || "$_os_id" == "opensuse-kalpa" ]] || \
         { [[ ! -w /usr ]] && command -v transactional-update >/dev/null 2>&1; }; then
        err "불변형 openSUSE(${OS_NAME})는 일반 zypper 설치 대신 transactional-update가 필요합니다. 수동 확인: https://github.com/Riey/kime"
      fi
      if ! zypper --non-interactive se -x kime >/dev/null 2>&1; then
        err "현재 설정된 openSUSE 저장소(${OS_NAME})에 kime 패키지가 없습니다. 공식 저장소에서는 openSUSE Tumbleweed만 kime을 기본 제공합니다. 수동 설치/OBS 저장소 확인: https://github.com/Riey/kime 또는 https://software.opensuse.org/package/kime"
      fi
      _pkg_summary="   - openSUSE (${_os_id}): zypper --non-interactive install -y kime"
      ;;
    debian)
      if command -v dpkg >/dev/null 2>&1; then
        _deb_arch=$(dpkg --print-architecture 2>/dev/null || true)
      fi
      if [[ -z "$_deb_arch" ]]; then
        case "$(uname -m)" in
          x86_64|amd64) _deb_arch="amd64" ;;
          aarch64|arm64) _deb_arch="arm64" ;;
          *) _deb_arch=$(uname -m) ;;
        esac
      fi
      _deb_target=$(resolve_kime_deb_target "$_os_id" "$_os_ver" "$_os_codename" "$_ubuntu_codename" "$_debian_codename")
      if [[ -z "$_deb_target" ]]; then
        err "현재 OS(${OS_NAME})의 기반 Debian/Ubuntu 버전을 판별할 수 없습니다 (/etc/os-release, /etc/debian_version 확인 필요). 수동 설치: https://github.com/Riey/kime/releases"
      fi
      local _rel_info
      _rel_info=$(resolve_kime_deb_release "$_deb_arch" "$_deb_target")
      IFS='|' read -r _kime_tag _deb_url _deb_avail <<< "$_rel_info"
      if [[ -z "$_deb_url" ]]; then
        err "Riey/kime 최신 릴리스(${_kime_tag:-unknown})에서 호환되는 .deb를 찾지 못했습니다 (감지된 OS: ${OS_NAME} -> 대상: ${_deb_target}, 아키텍처: ${_deb_arch}). 제공 중인 패키지: ${_deb_avail:-조회 실패} | 수동 확인: https://github.com/Riey/kime/releases"
      fi
      _deb_name="${_deb_url##*/}"
      _pkg_summary="   - 감지된 패키지 대상: ${_deb_target} (${_deb_arch}) / 최신 릴리스: ${_kime_tag:-latest}\n   - 다운로드: ${_deb_name}\n   - 설치: apt-get update && apt-get install -y ${_deb_name}"
      ;;
    *)
      err "지원하지 않는 배포판: ${_os_id:-unknown} (ID_LIKE=${_os_like:-none}). 수동 설치: https://github.com/Riey/kime"
      ;;
  esac

  local _kde_will _cfg_summary _extra_warn=""
  _kde_will=$(will_configure_kde "false" "$TARGET_HOME" "$DESKTOP")
  _cfg_summary="   - $TARGET_HOME/.config/environment.d/kime.conf"
  if [[ "$_kime_family" == "debian" ]]; then
    _cfg_summary="${_cfg_summary}\n   - im-config -n kime (im-config 사용 가능 시)"
  else
    _cfg_summary="${_cfg_summary}\n   - $TARGET_HOME/.xprofile (X11 세션 호환)"
  fi
  _cfg_summary="${_cfg_summary}\n   - /etc/xdg/autostart/kime.desktop 확인 (없을 경우 $TARGET_HOME/.config/autostart/kime.desktop 생성)"
  if [[ "$_kde_will" == "true" ]]; then
    _cfg_summary="${_cfg_summary}\n   - KDE Plasma 가상 키보드 설정: $TARGET_HOME/.config/kwinrc ([Wayland] InputMethod=/usr/share/applications/kime.desktop)"
  fi
  _cfg_summary="${_cfg_summary}\n   - 첫 로그인 1회 안내 팝업 등록 ($TARGET_HOME/.local/bin/hangul-first-login-guide.sh)"

  _extra_warn=$(append_conflict_ime_warn "kime" "$EXISTING_IME" "$_extra_warn")
  if [[ "${DESKTOP,,}" == *"gnome"* && "$SESSION_TYPE" == "wayland" ]]; then
    local _gnome_warn=" ⚠️  참고: GNOME Wayland(Mutter)는 zwp_input_method_v2를 지원하지 않아 Wayland 네이티브/샌드박스 앱에서 kime 동작이 제한될 수 있습니다 (GTK/Qt IM 모듈 앱은 정상 동작, 참고: https://github.com/Riey/kime/issues/422)."
    if [[ -n "$_extra_warn" ]]; then
      _extra_warn="${_extra_warn}\n${_gnome_warn}"
    else
      _extra_warn="$_gnome_warn"
    fi
  fi

  confirm_before_changes \
    "kime (Rust 기반 경량 입력기) openSUSE (zypper) (kime)" \
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== kime (Rust 기반 경량 입력기) openSUSE (zypper) kime 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME (family=$_kime_family, id=${_os_id:-unknown})"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. 배포판별 설치
  case "$_kime_family" in
    arch)
      log "[1/3] kime 설치 (AUR: $_aur_helper)..."
      su - "$USER" -c "$_aur_helper -S --noconfirm kime"
      ;;
    fedora)
      log "[1/3] kime 설치 (Fedora COPR)..."
      if ! dnf copr --help >/dev/null 2>&1; then
        dnf install -y 'dnf-command(copr)'
      fi
      dnf copr enable -y toroidalfox/kime
      dnf install -y kime
      ;;
    opensuse)
      log "[1/3] kime 설치 (zypper)..."
      zypper --non-interactive install -y kime
      ;;
    debian)
      log "[1/3] kime 설치 (${_deb_target} / ${_deb_name} 다운로드)..."
      local _tmp_dir _deb_path
      _tmp_dir=$(mktemp -d)
      _deb_path="${_tmp_dir}/${_deb_name}"
      if ! http_download "$_deb_url" "$_deb_path"; then
        rm -rf "$_tmp_dir"
        err "kime .deb 다운로드 실패: $_deb_url"
      fi
      export DEBIAN_FRONTEND=noninteractive
      if ! (apt-get update -qq && apt-get install -y "$_deb_path"); then
        rm -rf "$_tmp_dir"
        err "apt-get을 통한 kime 패키지 설치에 실패했습니다: $_deb_path"
      fi
      rm -rf "$_tmp_dir"
      ;;
  esac
  command -v kime >/dev/null 2>&1 || err "kime 바이너리를 찾을 수 없습니다. 설치 로그를 확인하세요: $LOG_FILE"
  ok "kime 설치 완료 ($(kime --version 2>/dev/null || echo installed))"
  disable_conflicting_imes "kime" "$USER" "$TARGET_HOME" "$TARGET_UID" "$DESKTOP"

  # 2. 환경변수 및 입력기 프레임워크 설정
  log "[2/3] 환경변수 및 입력기 설정..."
  local ENV_FILE="$TARGET_HOME/.config/environment.d/kime.conf"
  mkdir -p "$(dirname "$ENV_FILE")"
  cat > "$ENV_FILE" <<'EOF'
GTK_IM_MODULE=kime
QT_IM_MODULE=kime
XMODIFIERS=@im=kime
EOF
  chown -R "$USER:$USER" "$(dirname "$ENV_FILE")"

  if [[ "$_kime_family" == "debian" ]] && command -v im-config >/dev/null 2>&1 && [[ -f /usr/share/im-config/data/51_kime.rc ]]; then
    su - "$USER" -c "im-config -n kime" 2>/dev/null || warn "im-config -n kime 실패 (수동으로 입력기를 kime으로 선택하세요)"
  else
    local XPROFILE_FILE="$TARGET_HOME/.xprofile"
    if ! grep -q "GTK_IM_MODULE=kime" "$XPROFILE_FILE" 2>/dev/null; then
      cat >> "$XPROFILE_FILE" <<'EOF'

# kime 환경변수 (X11 / Non-systemd 세션 호환)
export GTK_IM_MODULE=kime
export QT_IM_MODULE=kime
export XMODIFIERS=@im=kime
EOF
      chown "$USER:$USER" "$XPROFILE_FILE"
    fi
  fi

  if [[ "$_kde_will" == "true" && -f /usr/share/applications/kime.desktop ]]; then
    local _kime_desktop="/usr/share/applications/kime.desktop"
    local _kwinrc="$TARGET_HOME/.config/kwinrc"
    mkdir -p "$TARGET_HOME/.config"
    if command -v kwriteconfig6 >/dev/null 2>&1; then
      kwriteconfig6 --file "$_kwinrc" --group Wayland --key InputMethod "$_kime_desktop" 2>/dev/null || true
    elif command -v kwriteconfig5 >/dev/null 2>&1; then
      kwriteconfig5 --file "$_kwinrc" --group Wayland --key InputMethod "$_kime_desktop" 2>/dev/null || true
    elif [[ -f "$_kwinrc" ]]; then
      awk -v im="$_kime_desktop" '
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
      printf '[Wayland]\nInputMethod=%s\n' "$_kime_desktop" > "$_kwinrc"
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
    ok "KDE Plasma 가상 키보드 설정 완료 ($_kime_desktop)"
  fi
  ok "환경변수 설정"

  # 3. 자동시작 확인 및 등록
  log "[3/3] 자동시작 확인 및 등록..."
  local ADIR="$TARGET_HOME/.config/autostart"
  if [[ -f "$ADIR/kime.desktop" ]] && grep -q "Exec=kime-daemon" "$ADIR/kime.desktop" 2>/dev/null; then
    rm -f "$ADIR/kime.desktop"
  fi
  if [[ -f /etc/xdg/autostart/kime.desktop ]]; then
    ok "시스템 자동시작 확인됨 (/etc/xdg/autostart/kime.desktop)"
  else
    local _kime_exec
    if [[ -x /usr/bin/kime-xdg-autostart ]]; then
      _kime_exec="/usr/bin/kime-xdg-autostart"
    else
      _kime_exec=$(command -v kime || echo "/usr/bin/kime")
    fi
    mkdir -p "$ADIR"
    cat > "$ADIR/kime.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Kime
Exec=${_kime_exec}
X-GNOME-Autostart-enabled=true
Hidden=false
NoDisplay=false
EOF
    chown -R "$USER:$USER" "$ADIR"
    ok "자동시작 등록 ($_kime_exec)"
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
MSG="🎉 kime (Rust 기반 경량 입력기) 한글 입력기 설정이 완료되었습니다!

⌨️  전환: 한/영 키, 오른쪽 Alt(Alt_R), Super+Space
⚙️  설정: ~/.config/kime/config.yaml (샘플: /usr/share/doc/kime/default_config.yaml)
🩺 진단: kime-check
📝 로그: /var/log/install-kime-kime-opensuse.log

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
  echo " 🎉 kime 설치 완료! 로그아웃 후 다시 로그인하세요."
  echo " KDE Wayland: 시스템 설정 → 입력 및 출력 → 키보드 → 가상 키보드 → kime 데몬 선택"
  echo " GNOME Wayland: Mutter 한계로 GTK/Qt IM 모듈 앱 위주 동작 (Wayland 네이티브 앱 제한)"
  echo " 전환: 한/영 키, 오른쪽 Alt(Alt_R), Super+Space"
  echo " 진단: kime-check | 설정: ~/.config/kime/config.yaml (샘플: /usr/share/doc/kime/default_config.yaml)"
  echo " 로그: $LOG_FILE"
  echo "============================================================"
}
main "$@"
