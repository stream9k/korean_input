#!/usr/bin/env bash
# 기타 Debian / Ubuntu 파생 (Generic Debian/Ubuntu) KDE Plasma - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/generic-debian-kde.sh | sudo bash
#       또는: sudo bash generic-debian-kde.sh [-y|--yes]

set -euo pipefail

SCRIPT_VERSION="1.5.3"
LOG_FILE="/var/log/install-hangul-generic-debian-kde.log"
BACKUP_DIR="/root/hangul-backup-$(date +%Y%m%d-%H%M%S)"

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

run_as_user_sh() {
  local _u="$1" _cmd="$2" _home _uid _pre=""
  _home=$(getent passwd "$_u" 2>/dev/null | cut -d: -f6 || awk -F: -v u="$_u" '$1==u {print $6}' /etc/passwd)
  _uid=$(id -u "$_u" 2>/dev/null || echo "")
  if command -v runuser >/dev/null 2>&1; then
    local -a _envs=("HOME=${_home:-/tmp}" "USER=$_u" "LOGNAME=$_u")
    if [[ -n "$_uid" && -d "/run/user/$_uid" ]]; then
      _envs+=("XDG_RUNTIME_DIR=/run/user/$_uid")
      [[ -S "/run/user/$_uid/bus" ]] && _envs+=("DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$_uid/bus")
    fi
    runuser -u "$_u" -- env "${_envs[@]}" /bin/sh -c "$_cmd" </dev/null
  else
    [[ -n "$_uid" && -d "/run/user/$_uid" ]] && _pre="export XDG_RUNTIME_DIR='/run/user/$_uid'; "
    [[ -n "$_uid" && -S "/run/user/$_uid/bus" ]] && _pre="${_pre}export DBUS_SESSION_BUS_ADDRESS='unix:path=/run/user/$_uid/bus'; "
    su -s /bin/sh "$_u" -c "${_pre}${_cmd}" </dev/null
  fi
}

run_user_gsettings() {
  local _u="$1" _uid="$2" _home="$3"
  shift 3
  command -v gsettings >/dev/null 2>&1 || return 1
  local -a _envs=("HOME=${_home:-/tmp}" "USER=$_u" "LOGNAME=$_u")
  if [[ -n "$_uid" && -d "/run/user/$_uid" ]]; then
    _envs+=("XDG_RUNTIME_DIR=/run/user/$_uid")
    [[ -S "/run/user/$_uid/bus" ]] && _envs+=("DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$_uid/bus")
  fi
  local -a _cmd=(gsettings "$@")
  if [[ -z "$_uid" || ! -S "/run/user/$_uid/bus" ]] && [[ "${1:-}" == "set" || "${1:-}" == "reset" ]] && command -v dbus-run-session >/dev/null 2>&1; then
    _cmd=(dbus-run-session -- gsettings "$@")
  fi
  if command -v runuser >/dev/null 2>&1; then
    runuser -u "$_u" -- env "${_envs[@]}" "${_cmd[@]}" </dev/null
  elif command -v sudo >/dev/null 2>&1; then
    sudo -u "$_u" env "${_envs[@]}" "${_cmd[@]}" </dev/null
  else
    local _q_cmd="" _item _esc
    for _item in "${_envs[@]}" "${_cmd[@]}"; do
      _esc=$(printf '%s' "$_item" | sed "s/'/'\\\\''/g")
      _q_cmd="${_q_cmd:+${_q_cmd} }'${_esc}'"
    done
    su -s /bin/sh "$_u" -c "env $_q_cmd" </dev/null
  fi
}

proc_running() {
  local _uid="$1" _proc="$2"
  command -v pgrep >/dev/null 2>&1 || return 1
  if [[ ${#_proc} -gt 15 ]]; then
    pgrep -u "$_uid" -f "(^|/)${_proc}([[:space:]]|$)" >/dev/null 2>&1
  else
    pgrep -u "$_uid" -x "$_proc" >/dev/null 2>&1
  fi
}

proc_kill() {
  local _uid="$1" _proc="$2" _sig="${3:-}"
  command -v pkill >/dev/null 2>&1 || return 0
  if [[ ${#_proc} -gt 15 ]]; then
    pkill ${_sig:+"$_sig"} -u "$_uid" -f "(^|/)${_proc}([[:space:]]|$)" 2>/dev/null || true
  else
    pkill ${_sig:+"$_sig"} -u "$_uid" -x "$_proc" 2>/dev/null || true
  fi
}

detect_desktop() {
  local _u="$1" _uid _d _env_out _sid
  _d="${XDG_CURRENT_DESKTOP:-}"
  [[ -n "$_d" ]] && { echo "$_d"; return; }
  _uid=$(id -u "$_u" 2>/dev/null || echo "")
  if [[ -n "$_uid" && -S "/run/user/$_uid/bus" ]] && command -v systemctl >/dev/null 2>&1; then
    _env_out=$(run_as_user_sh "$_u" 'systemctl --user show-environment 2>/dev/null' || true)
    _d=$(printf '%s\n' "$_env_out" | sed -n 's/^XDG_CURRENT_DESKTOP=//p' | head -n 1 || true)
    [[ -n "$_d" ]] && { echo "$_d"; return; }
    _d=$(printf '%s\n' "$_env_out" | sed -n 's/^DESKTOP_SESSION=//p' | head -n 1 || true)
    [[ -n "$_d" ]] && { echo "$_d"; return; }
  fi
  if command -v loginctl >/dev/null 2>&1; then
    for _sid in $(loginctl list-sessions --no-legend 2>/dev/null | awk -v u="$_u" '$3==u {print $1}' || true); do
      _d=$(loginctl show-session "$_sid" -p Desktop --value 2>/dev/null || true)
      [[ -n "$_d" ]] && { echo "$_d"; return; }
    done
  fi
  _d=$(run_as_user_sh "$_u" 'printf "%s\n" "${XDG_CURRENT_DESKTOP:-${DESKTOP_SESSION:-}}"' 2>/dev/null | head -n 1 || true)
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
  local _desktop="${2:-}"
  local _is_gnome=false
  [[ "${_desktop,,}" == *"gnome"* ]] && _is_gnome=true
  local _found=() _im _running
  for _im in fcitx5 fcitx ibus-daemon kime; do
    _running=false
    if command -v pgrep >/dev/null 2>&1 && pgrep -u "$_uid" -x "$_im" >/dev/null 2>&1; then
      _running=true
    fi
    if command -v "$_im" >/dev/null 2>&1 || [[ "$_running" == "true" ]]; then
      if [[ "$_im" == "ibus-daemon" && "$_running" == "true" && "$_is_gnome" == "true" ]]; then
        if proc_running "$_uid" "ibus-engine-hangul"; then
          _found+=("$_im (실행 중 · GNOME 기본 내장, ibus-hangul 활성)")
        else
          _found+=("$_im (실행 중 · GNOME 기본 내장)")
        fi
      elif [[ "$_running" == "true" ]]; then
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
  local _desktop="${4:-}"
  local _w=""
  if has_conflicting_ime "$_target_ime" "$_existing_ime"; then
    _w=" ⚠️  참고: 기존 입력기(${_existing_ime})가 감지되었습니다. 기존 입력기가 새 입력기와 충돌할 수 있으므로 기존 입력기 설정(자동시작·서비스·환경변수)을 자동으로 비활성화하겠습니다."
    if [[ "$_target_ime" != "ibus" && "${_desktop,,}" == *"gnome"* && "$_existing_ime" == *"ibus-daemon"* ]]; then
      _w="${_w}\n ℹ️  GNOME 안내: ibus-daemon 자체는 GNOME Shell 기본 기능(이모지·화상키보드·Wayland 입력) 유지를 위해 종료·차단하지 않으며, ibus-hangul 입력 소스·엔진·환경변수·단축키 충돌만 비활성화합니다."
    fi
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
  local _autostart_changed=false
  local _is_gnome=false
  [[ "${_desktop,,}" == *"gnome"* ]] && _is_gnome=true

  local _autostart_dir="$_home/.config/autostart"
  local _autostart_disabled_dir="$_home/.config/autostart-disabled"
  local _env_dir="$_home/.config/environment.d"
  local _env_disabled_dir="$_home/.config/environment.d-disabled"
  local _target_desktops=() _svcs=() _procs=() _desktops=() _env_confs=()
  local _im_re="" _kwin_re="" _cmd_re=""

  case "$_target_ime" in
    fcitx5)
      _target_desktops=(org.fcitx.Fcitx5.desktop fcitx5-wayland-launcher.desktop fcitx5.desktop fcitx5-autostart.desktop)
      _svcs=(ibus kime kime-daemon fcitx)
      _procs=(fcitx kime kime-daemon kime-indicator kime-wayland kime-xim)
      [[ "$_is_gnome" != "true" ]] && _procs+=(ibus-daemon)
      _desktops=(ibus.desktop ibus-daemon.desktop kime.desktop fcitx.desktop fcitx-autostart.desktop)
      [[ "$_is_gnome" != "true" ]] && _desktops+=(ibus-autostart.desktop)
      _env_confs=(ibus.conf kime.conf fcitx.conf)
      _im_re="(ibus|kime)"
      _kwin_re="(ibus|kime)"
      _cmd_re="(kime|kime-daemon|kime-wayland|kime-xim|kime-xdg-autostart|fcitx)"
      [[ "$_is_gnome" != "true" ]] && _cmd_re="(ibus-daemon|kime|kime-daemon|kime-wayland|kime-xim|kime-xdg-autostart|fcitx)"
      ;;
    ibus)
      _target_desktops=(ibus.desktop ibus-daemon.desktop ibus-autostart.desktop org.freedesktop.IBus.Panel.Wayland.Gtk3.desktop)
      _svcs=(fcitx5 fcitx kime kime-daemon)
      _procs=(fcitx5 fcitx5-wayland-launcher fcitx kime kime-daemon kime-indicator kime-wayland kime-xim)
      _desktops=(fcitx5.desktop org.fcitx.Fcitx5.desktop fcitx5-wayland-launcher.desktop fcitx5-autostart.desktop fcitx.desktop fcitx-autostart.desktop kime.desktop)
      _env_confs=(fcitx5.conf fcitx.conf kime.conf)
      _im_re="(fcitx5|fcitx|kime)"
      _kwin_re="(fcitx|kime)"
      _cmd_re="(fcitx5|fcitx5-wayland-launcher|fcitx|kime|kime-daemon|kime-wayland|kime-xim|kime-xdg-autostart)"
      ;;
    kime)
      _target_desktops=(kime.desktop)
      _svcs=(fcitx5 fcitx ibus)
      _procs=(fcitx5 fcitx5-wayland-launcher fcitx)
      [[ "$_is_gnome" != "true" ]] && _procs+=(ibus-daemon)
      _desktops=(fcitx5.desktop org.fcitx.Fcitx5.desktop fcitx5-wayland-launcher.desktop fcitx5-autostart.desktop fcitx.desktop fcitx-autostart.desktop ibus.desktop ibus-daemon.desktop)
      [[ "$_is_gnome" != "true" ]] && _desktops+=(ibus-autostart.desktop)
      _env_confs=(fcitx5.conf fcitx.conf ibus.conf)
      _im_re="(fcitx5|fcitx|ibus)"
      _kwin_re="(fcitx|ibus)"
      _cmd_re="(fcitx5|fcitx5-wayland-launcher|fcitx)"
      [[ "$_is_gnome" != "true" ]] && _cmd_re="(ibus-daemon|fcitx5|fcitx5-wayland-launcher|fcitx)"
      ;;
    *)
      return 0
      ;;
  esac

  local _td
  for _td in "${_target_desktops[@]}"; do
    if [[ -f "$_autostart_dir/$_td" ]] && grep -q '^Hidden=true$' "$_autostart_dir/$_td" 2>/dev/null; then
      rm -f "$_autostart_dir/$_td"
      _autostart_changed=true
    fi
    if [[ -f "$_autostart_dir/${_td}.disabled" ]]; then
      mkdir -p "$_autostart_disabled_dir"
      mv -f "$_autostart_dir/${_td}.disabled" "$_autostart_disabled_dir/$_td"
      chown "$_uid:$_gid" "$_autostart_disabled_dir" "$_autostart_disabled_dir/$_td" 2>/dev/null || true
      _autostart_changed=true
      _changed=true
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
        if run_as_user_sh "$_user" "systemctl --user is-enabled $_svc >/dev/null 2>&1" 2>/dev/null; then
          run_as_user_sh "$_user" "systemctl --user disable $_svc 2>/dev/null || true" || true
          _changed=true
        fi
      done
    fi
  fi

  local _p
  for _p in "${_procs[@]}"; do
    if proc_running "$_uid" "$_p"; then
      proc_kill "$_uid" "$_p"
      _changed=true
    fi
  done

  local _desk
  for _desk in "${_desktops[@]}"; do
    if [[ -f "$_autostart_dir/${_desk}.disabled" ]]; then
      mkdir -p "$_autostart_disabled_dir"
      mv -f "$_autostart_dir/${_desk}.disabled" "$_autostart_disabled_dir/$_desk"
      chown "$_uid:$_gid" "$_autostart_disabled_dir" "$_autostart_disabled_dir/$_desk" 2>/dev/null || true
      _autostart_changed=true
      _changed=true
    fi
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
        _autostart_changed=true
        _changed=true
      fi
    elif [[ -f "$_autostart_dir/$_desk" ]]; then
      mkdir -p "$_autostart_disabled_dir"
      mv -f "$_autostart_dir/$_desk" "$_autostart_disabled_dir/$_desk"
      chown "$_uid:$_gid" "$_autostart_disabled_dir" "$_autostart_disabled_dir/$_desk" 2>/dev/null || true
      _autostart_changed=true
      _changed=true
    fi
  done
  if [[ "$_autostart_changed" == "true" ]] && command -v systemctl >/dev/null 2>&1 && [[ -S "/run/user/$_uid/bus" ]]; then
    run_as_user_sh "$_user" 'systemctl --user daemon-reload 2>/dev/null || true' || true
  fi

  local _econf
  for _econf in "${_env_confs[@]}"; do
    if [[ -f "$_env_dir/${_econf}.disabled" ]]; then
      mkdir -p "$_env_disabled_dir"
      mv -f "$_env_dir/${_econf}.disabled" "$_env_disabled_dir/$_econf"
      chown "$_uid:$_gid" "$_env_disabled_dir" "$_env_disabled_dir/$_econf" 2>/dev/null || true
      _changed=true
    fi
    if [[ -f "$_env_dir/$_econf" ]]; then
      mkdir -p "$_env_disabled_dir"
      mv -f "$_env_dir/$_econf" "$_env_disabled_dir/$_econf"
      chown "$_uid:$_gid" "$_env_disabled_dir" "$_env_disabled_dir/$_econf" 2>/dev/null || true
      _changed=true
    fi
  done

  local _env_line_re="^[[:space:]]*(export[[:space:]]+)?((GTK|QT|SDL|GLFW)_IM_MODULE=['\"]?${_im_re}['\"]?|INPUT_METHOD=['\"]?${_im_re}['\"]?|QT_IM_MODULES=('[^']*${_im_re}[^']*'|\"[^\"]*${_im_re}[^\"]*\"|[^[:space:]'\";]*${_im_re}[^[:space:]'\";]*)|XMODIFIERS=['\"]?@im=${_im_re}['\"]?)[[:space:]]*(#.*)?$"
  local _etc_env_line_re="^[[:space:]]*(export[[:space:]]+)?((GTK|QT|SDL|GLFW)_IM_MODULE=['\"]?${_im_re}['\"]?|INPUT_METHOD=['\"]?${_im_re}['\"]?|QT_IM_MODULES=('[^']*${_im_re}[^']*'|\"[^\"]*${_im_re}[^\"]*\"|[^[:space:]'\"]*${_im_re}[^[:space:]'\"]*)|XMODIFIERS=['\"]?@im=${_im_re}['\"]?)[[:space:]]*(#.*)?$"
  local _cmd_line_re="^[[:space:]]*((/usr(/local)?/bin/)?${_cmd_re})([[:space:]]+(-[A-Za-z0-9_=-]+|>/dev/null|2>/dev/null|2>&1|&>/dev/null))*([[:space:]]*&)?[[:space:]]*(#.*)?$"
  local _ef
  for _ef in /etc/environment "$_home/.xsessionrc" "$_home/.xprofile" "$_home/.bash_profile" "$_home/.zprofile" "$_home/.profile"; do
    if [[ -f "$_ef" && -w "$_ef" ]]; then
      if [[ "$_ef" == "/etc/environment" ]]; then
        if grep -qE "$_etc_env_line_re" "$_ef" 2>/dev/null; then
          grep -Ev "$_etc_env_line_re" "$_ef" > "${_ef}.tmp" || true
          cat "${_ef}.tmp" > "$_ef"
          rm -f "${_ef}.tmp"
          _changed=true
        fi
      elif grep -qE "$_env_line_re" "$_ef" 2>/dev/null || grep -qE "$_cmd_line_re" "$_ef" 2>/dev/null; then
        local _chk_sh="sh" _orig_valid=false
        if [[ "$_ef" == */.bash_profile ]] && command -v bash >/dev/null 2>&1; then
          _chk_sh="bash"
        elif [[ "$_ef" == */.zprofile ]] && command -v zsh >/dev/null 2>&1; then
          _chk_sh="zsh"
        fi
        "$_chk_sh" -n "$_ef" >/dev/null 2>&1 && _orig_valid=true
        if awk -v im_re="$_im_re" -v cmd_re="$_cmd_re" '
          BEGIN {
            env_re = "^[ \t]*(export[ \t]+)?((GTK|QT|SDL|GLFW)_IM_MODULE=[\047\"]?" im_re "[\047\"]?|INPUT_METHOD=[\047\"]?" im_re "[\047\"]?|QT_IM_MODULES=(\047[^\047]*" im_re "[^\047]*\047|\"[^\"]*" im_re "[^\"]*\"|[^ \t\047\";]*" im_re "[^ \t\047\";]*)|XMODIFIERS=[\047\"]?@im=" im_re "[\047\"]?)[ \t]*(#.*)?$"
            cmd_re_full = "^[ \t]*((/usr(/local)?/bin/)?" cmd_re ")([ \t]+(-[A-Za-z0-9_=-]+|>/dev/null|2>/dev/null|2>&1|&>/dev/null))*([ \t]*&)?[ \t]*(#.*)?$"
            mark = "^[ \t]*:[ \t]*#[ \t]*korean_input: disabled conflicting IME([ \t]+env)?[ \t]*$"
            prev = 0
          }
          ($0 ~ env_re) || ($0 ~ cmd_re_full) {
            if (!prev) {
              match($0, /^[ \t]*/)
              print substr($0, 1, RLENGTH) ": # korean_input: disabled conflicting IME"
              prev = 1
            }
            next
          }
          $0 ~ mark {
            if (!prev) { print; prev = 1 }
            next
          }
          { prev = 0; print }
        ' "$_ef" > "${_ef}.tmp"; then
          if [[ "$_orig_valid" == "true" ]] && ! "$_chk_sh" -n "${_ef}.tmp" >/dev/null 2>&1; then
            rm -f "${_ef}.tmp"
            warn "셸 구문 검증 실패로 $_ef 자동 수정을 건너뜁니다 (수동 확인 필요)"
          else
            cat "${_ef}.tmp" > "$_ef"
            rm -f "${_ef}.tmp"
            chown "$_uid:$_gid" "$_ef" 2>/dev/null || true
            _changed=true
          fi
        else
          rm -f "${_ef}.tmp"
        fi
      fi
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
  if [[ "$_target_ime" != "ibus" ]]; then
    if [[ "$_is_gnome" != "true" ]]; then
      for _hp in ibus-engine-hangul ibus-engine-simple ibus-ui-gtk3 ibus-x11 ibus-portal ibus-extension-gtk3 ibus-dconf ibus-memconf; do
        proc_kill "$_uid" "$_hp"
      done
    else
      if command -v gsettings >/dev/null 2>&1; then
        local _cur_sources _new_sources
        _cur_sources=$(run_user_gsettings "$_user" "$_uid" "$_home" get org.gnome.desktop.input-sources sources 2>/dev/null || true)
        if printf '%s\n' "$_cur_sources" | grep -qE "\('ibus',[[:space:]]*'hangul'\)"; then
          _new_sources=$(printf '%s\n' "$_cur_sources" | sed -E \
            -e "s/,[[:space:]]*\('ibus',[[:space:]]*'hangul'\)//g" \
            -e "s/\('ibus',[[:space:]]*'hangul'\)[[:space:]]*,[[:space:]]*//g" \
            -e "s/\('ibus',[[:space:]]*'hangul'\)//g")
          printf '%s\n' "$_new_sources" | grep -q "'" || _new_sources="[('xkb', 'us')]"
          run_user_gsettings "$_user" "$_uid" "$_home" set org.gnome.desktop.input-sources sources "$_new_sources" 2>/dev/null || true
          _changed=true
        fi

        local _cur_preload _new_preload
        _cur_preload=$(run_user_gsettings "$_user" "$_uid" "$_home" get org.freedesktop.ibus.general preload-engines 2>/dev/null || true)
        if printf '%s\n' "$_cur_preload" | grep -q "'hangul'"; then
          _new_preload=$(printf '%s\n' "$_cur_preload" | sed -E \
            -e "s/,[[:space:]]*'hangul'//g" \
            -e "s/'hangul'[[:space:]]*,[[:space:]]*//g" \
            -e "s/'hangul'//g")
          printf '%s\n' "$_new_preload" | grep -q "'" || _new_preload="[]"
          run_user_gsettings "$_user" "$_uid" "$_home" set org.freedesktop.ibus.general preload-engines "$_new_preload" 2>/dev/null || true
          _changed=true
        fi

        local _cur_triggers
        _cur_triggers=$(run_user_gsettings "$_user" "$_uid" "$_home" get org.freedesktop.ibus.general.hotkey triggers 2>/dev/null || true)
        if printf '%s\n' "$_cur_triggers" | grep -qE "(Hangul|space)"; then
          run_user_gsettings "$_user" "$_uid" "$_home" set org.freedesktop.ibus.general.hotkey triggers "[]" 2>/dev/null || true
          _changed=true
        fi

        local _cur_gtk_im
        _cur_gtk_im=$(run_user_gsettings "$_user" "$_uid" "$_home" get org.gnome.desktop.interface gtk-im-module 2>/dev/null || true)
        if [[ "$_cur_gtk_im" == "'ibus'" ]]; then
          run_user_gsettings "$_user" "$_uid" "$_home" reset org.gnome.desktop.interface gtk-im-module 2>/dev/null || true
          _changed=true
        fi

        local _kb_key _cur_kb
        for _kb_key in switch-input-source switch-input-source-backward; do
          _cur_kb=$(run_user_gsettings "$_user" "$_uid" "$_home" get org.gnome.desktop.wm.keybindings "$_kb_key" 2>/dev/null || true)
          if [[ -n "$_cur_kb" && "$_cur_kb" != "@as []" && "$_cur_kb" != "[]" ]]; then
            run_user_gsettings "$_user" "$_uid" "$_home" set org.gnome.desktop.wm.keybindings "$_kb_key" "[]" 2>/dev/null || true
            _changed=true
          fi
        done
      fi

      if proc_running "$_uid" "ibus-engine-hangul"; then
        proc_kill "$_uid" "ibus-engine-hangul"
        _changed=true
      fi
    fi
  fi
  sleep 1
  local _survivors=()
  for _hp in "${_procs[@]}"; do
    if proc_running "$_uid" "$_hp"; then
      proc_kill "$_uid" "$_hp" "-9"
      _survivors+=("$_hp")
    fi
  done
  if [[ "$_target_ime" != "ibus" && "$_is_gnome" == "true" ]] && proc_running "$_uid" "ibus-engine-hangul"; then
    proc_kill "$_uid" "ibus-engine-hangul" "-9"
    _survivors+=("ibus-engine-hangul")
  fi
  if [[ ${#_survivors[@]} -gt 0 ]]; then
    warn "종료되지 않아 강제 종료한 입력기 프로세스: ${_survivors[*]}"
    _changed=true
  fi

  if [[ "$_target_ime" != "ibus" && "$_is_gnome" == "true" ]] && { proc_running "$_uid" "ibus-daemon" || command -v ibus-daemon >/dev/null 2>&1; }; then
    info "GNOME 환경에서는 셸 안정성을 위해 ibus-daemon은 유지하고, ibus-hangul 입력 소스·엔진·환경변수·단축키 충돌만 비활성화했습니다."
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
     [[ "${XDG_CURRENT_DESKTOP:-}" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]]; then
    echo "true"
  elif [[ -z "$_desk" || "$_desk" == "unknown" ]] && {
       command -v plasmashell >/dev/null 2>&1 || \
       command -v kwin_wayland >/dev/null 2>&1 || \
       command -v kwriteconfig6 >/dev/null 2>&1 || \
       command -v kwriteconfig5 >/dev/null 2>&1 || \
       [[ -f "$_home/.config/kwinrc" ]]; }; then
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

is_kde6_wayland() {
  local _kde_will="$1" _session="$2" _desk="${3:-${DESKTOP:-}}"
  if [[ -n "$_desk" && "$_desk" != "unknown" ]] && ! [[ "$_desk" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]]; then
    echo "false"
    return
  fi
  if [[ "$_kde_will" == "true" && "$_session" != "x11" ]] && command -v kwriteconfig6 >/dev/null 2>&1; then
    echo "true"
  else
    echo "false"
  fi
}

write_fcitx5_env() {
  local _kde6_wl="$1" _home="$2" _uid="$3" _gid="$4"
  local _write_etc="$5" _write_envd="$6" _x11_profile="${7:-}" _allow_pending="${8:-false}" _include_im="${9:-false}"
  local _use_kde6_wl="false"
  if [[ "$_kde6_wl" == "true" ]]; then
    if [[ "$_allow_pending" == "true" ]] || \
       [[ -f /usr/share/applications/fcitx5-wayland-launcher.desktop || -f /usr/share/applications/org.fcitx.Fcitx5.desktop ]]; then
      _use_kde6_wl="true"
    fi
  fi

  if [[ "$_use_kde6_wl" == "true" ]]; then
    if [[ "$_write_envd" == "true" ]]; then
      local _env_file="$_home/.config/environment.d/fcitx5.conf"
      mkdir -p "$(dirname "$_env_file")"
      cat > "$_env_file" <<'EOF'
# KDE Plasma 6 Wayland: use KWin Virtual Keyboard (text-input-v3)
# Avoid forcing global QT_IM_MODULE/GTK_IM_MODULE on Plasma 6 Wayland
QT_IM_MODULES="wayland;fcitx"
XMODIFIERS=@im=fcitx
EOF
      chown -R "$_uid:$_gid" "$(dirname "$_env_file")"
    fi
    if [[ "$_write_etc" == "true" ]]; then
      local _etc_im_re="^[[:space:]]*((GTK|QT)_IM_MODULE=['\"]?fcitx['\"]?|INPUT_METHOD=['\"]?fcitx5?['\"]?)[[:space:]]*(#.*)?$"
      local _etc_xm_re="^[[:space:]]*XMODIFIERS=['\"]?@im=fcitx['\"]?"
      if [[ -f /etc/environment && -w /etc/environment ]]; then
        if grep -qE "$_etc_im_re" /etc/environment 2>/dev/null; then
          grep -Ev "$_etc_im_re" /etc/environment > /etc/environment.tmp || true
          cat /etc/environment.tmp > /etc/environment
          rm -f /etc/environment.tmp
        fi
      fi
      if [[ -w /etc/environment || ( ! -e /etc/environment && -w /etc ) ]]; then
        if ! grep -qE "$_etc_xm_re" /etc/environment 2>/dev/null; then
          if [[ -s /etc/environment ]] && [[ -n "$(tail -c 1 /etc/environment 2>/dev/null | tr -d '\n')" ]]; then
            printf '\n' >> /etc/environment
          fi
          cat >> /etc/environment <<'EOF'

# fcitx5 환경변수 (XWayland)
XMODIFIERS=@im=fcitx
EOF
        fi
      fi
    fi
    if [[ -n "$_x11_profile" ]]; then
      if ! grep -q "GTK_IM_MODULE=fcitx" "$_x11_profile" 2>/dev/null; then
        cat >> "$_x11_profile" <<'EOF'

# fcitx5 환경변수 (X11 세션 호환)
export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx
EOF
      fi
      chown "$_uid:$_gid" "$_x11_profile"
    fi
  else
    if [[ "$_write_envd" == "true" ]]; then
      local _env_file="$_home/.config/environment.d/fcitx5.conf"
      mkdir -p "$(dirname "$_env_file")"
      cat > "$_env_file" <<'EOF'
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
      if [[ "$_include_im" == "true" ]]; then
        echo "INPUT_METHOD=fcitx" >> "$_env_file"
      fi
      chown -R "$_uid:$_gid" "$(dirname "$_env_file")"
    fi
    if [[ "$_write_etc" == "true" ]] && [[ -w /etc/environment || ( ! -e /etc/environment && -w /etc ) ]]; then
      if ! grep -q "GTK_IM_MODULE=fcitx" /etc/environment 2>/dev/null; then
        if [[ -s /etc/environment ]] && [[ -n "$(tail -c 1 /etc/environment 2>/dev/null | tr -d '\n')" ]]; then
          printf '\n' >> /etc/environment
        fi
        cat >> /etc/environment <<'EOF'

# fcitx5 환경변수
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
      fi
      if [[ "$_include_im" == "true" ]] && ! grep -qE '^[[:space:]]*INPUT_METHOD=['\''"]?fcitx5?['\''"]?[[:space:]]*(#.*)?$' /etc/environment 2>/dev/null; then
        if [[ -s /etc/environment ]] && [[ -n "$(tail -c 1 /etc/environment 2>/dev/null | tr -d '\n')" ]]; then
          printf '\n' >> /etc/environment
        fi
        echo "INPUT_METHOD=fcitx" >> /etc/environment
      fi
    fi
    if [[ -n "$_x11_profile" ]]; then
      if ! grep -q "GTK_IM_MODULE=fcitx" "$_x11_profile" 2>/dev/null; then
        if [[ -s "$_x11_profile" ]] && [[ -n "$(tail -c 1 "$_x11_profile" 2>/dev/null | tr -d '\n')" ]]; then
          printf '\n' >> "$_x11_profile"
        fi
        cat >> "$_x11_profile" <<'EOF'

# fcitx5 환경변수
export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx
EOF
        if [[ "$_include_im" == "true" ]] && ! grep -qE '^[[:space:]]*(export[[:space:]]+)?INPUT_METHOD=['\''"]?fcitx5?['\''"]?[[:space:]]*(#.*)?$' "$_x11_profile" 2>/dev/null; then
          echo "export INPUT_METHOD=fcitx" >> "$_x11_profile"
        fi
      elif [[ "$_include_im" == "true" ]] && ! grep -qE '^[[:space:]]*(export[[:space:]]+)?INPUT_METHOD=['\''"]?fcitx5?['\''"]?[[:space:]]*(#.*)?$' "$_x11_profile" 2>/dev/null; then
        if [[ -s "$_x11_profile" ]] && [[ -n "$(tail -c 1 "$_x11_profile" 2>/dev/null | tr -d '\n')" ]]; then
          printf '\n' >> "$_x11_profile"
        fi
        echo "export INPUT_METHOD=fcitx" >> "$_x11_profile"
      fi
      chown "$_uid:$_gid" "$_x11_profile"
    fi
  fi
}

append_kde_cfg_line() {
  local _kde_will="$1"
  local _home="$2"
  local _cfg="$3"
  local _kde6_wl="${4:-false}"
  local _out="$_cfg"
  if [[ "$_kde_will" == "true" ]]; then
    _out=$(printf '%s\n   - KDE Plasma 가상 키보드 설정: %s/.config/kwinrc ([Wayland] InputMethod)' "$_out" "$_home")
  fi
  if [[ "$_kde6_wl" == "true" ]]; then
    _out=$(printf '%s\n   - KDE Plasma 6 Wayland 안전 환경변수: %s/.config/environment.d/fcitx5.conf (QT_IM_MODULES="wayland;fcitx", XMODIFIERS=@im=fcitx)' "$_out" "$_home")
  fi
  printf '%s' "$_out"
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
  err "대상 사용자 탐지 실패. SUDO_USER로 실행하세요."
}

main() {
  require_root

  local USER TARGET_HOME TARGET_UID TARGET_GID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME _ow_note _kde_will
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  TARGET_GID=$(id -g "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID" "$DESKTOP")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")
  _kde_will=$(will_configure_kde "true" "$TARGET_HOME" "$DESKTOP")
  local _kde6_wayland
  _kde6_wayland=$(is_kde6_wayland "$_kde_will" "$SESSION_TYPE")

  local _pkg_summary="   - apt-get update 후 레거시 fcitx(4.x) 제거 및 autoremove --purge\n   - apt-get install: fcitx5, fcitx5-hangul, fcitx5-config-qt, fcitx5-configtool,\n     fcitx5-frontend-gtk3/gtk4/qt5/qt6, fonts-noto-cjk"
  local _cfg_summary="   - im-config -n fcitx5 적용 및 데스크톱 단축키 충돌 해제(gsettings)\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\n   - $TARGET_HOME/.config/environment.d/fcitx5.conf, /etc/environment, $TARGET_HOME/.xsessionrc\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록"
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary" "$_kde6_wayland")
  local _extra_warn=" ⚠️  참고: 기존 fcitx 4.x 패키지 및 미사용 의존성(autoremove)이 제거됩니다."
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME" "$_extra_warn")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn" "$DESKTOP")

  confirm_before_changes     "기타 Debian / Ubuntu 파생 (Generic Debian/Ubuntu) KDE Plasma"     "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME"     "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME"     "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== 기타 Debian / Ubuntu 파생 (Generic Debian/Ubuntu) KDE Plasma 한글 입력기 설치 시작 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. 레거시 제거 & 업데이트
  log "[1/7] 레거시 fcitx4 제거 및 패키지 업데이트..."
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get purge -y -qq fcitx fcitx-bin fcitx-data fcitx-hangul fcitx-config-gtk \
    fcitx-frontend-all fcitx-frontend-gtk2 fcitx-frontend-gtk3 fcitx-frontend-qt5 2>/dev/null || true
  apt-get autoremove --purge -y -qq
  ok "정리 완료"

  # 2. fcitx5 스택 + 한글 폰트 설치
  log "[2/7] fcitx5 + 한글 엔진 + 프론트엔드 + 한글 폰트 설치..."
  apt-get install -y -qq \
    fcitx5 fcitx5-hangul fcitx5-config-qt fcitx5-configtool \
    fcitx5-frontend-gtk3 fcitx5-frontend-gtk4 \
    fcitx5-frontend-qt5 fcitx5-frontend-qt6 \
    fonts-noto-cjk
  ok "설치 완료"
  disable_conflicting_imes "fcitx5" "$USER" "$TARGET_HOME" "$TARGET_UID" "$DESKTOP"

  # 3. 입력 프레임워크 전환
  log "[3/7] 입력 프레임워크를 fcitx5로 설정 (im-config)..."
  run_as_user_sh "$USER" "im-config -n fcitx5" 2>/dev/null || warn "im-config 실패 (수동 실행 필요)"
  ok "프레임워크 설정 완료"

  # 4. Fcitx5 프로필/핫키
  log "[4/7] Fcitx5 프로필·핫키 구성..."
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
EOF
  chown -R "$TARGET_UID:$TARGET_GID" "$FCITX5_DIR"
  if [[ ${#_fcitx5_svcs[@]} -gt 0 && -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]]; then
    local _svc
    for _svc in "${_fcitx5_svcs[@]}"; do
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \
        systemctl --user start "$_svc" 2>/dev/null || true
    done
  fi
  ok "설정 파일 생성"

  # 5. 데스크톱 단축키 충돌 해제
  log "[5/7] 데스크톱 단축키 충돌 해제 ($DESKTOP)..."
  local cmds=()
  case "$DESKTOP" in
    *CINNAMON*|*cinnamon*)
      cmds=(
        "org.cinnamon.desktop.keybindings.wm switch-input-source []"
        "org.cinnamon.desktop.keybindings.wm switch-input-source-backward []"
        "org.gnome.desktop.wm.keybindings switch-input-source []"
        "org.gnome.desktop.wm.keybindings switch-input-source-backward []"
      );;
    *GNOME*|*gnome*|*UNITY*|*unity*|*PANTHEON*|*pantheon*|*BUDGIE*|*budgie*|*COSMIC*|*cosmic*)
      cmds=(
        "org.gnome.desktop.wm.keybindings switch-input-source []"
        "org.gnome.desktop.wm.keybindings switch-input-source-backward []"
      );;
    *XFCE*|*xfce*)
      cmds=(
        "org.xfce.keyboard-shortcuts.commands.custom '<Super>space' ''"
        "org.xfce.keyboard-shortcuts.commands.custom '<Shift><Super>space' ''"
      );;
    *MATE*|*mate*)
      cmds=(
        "org.mate.Marco.global-keybindings switch-input-source ''"
        "org.mate.Marco.global-keybindings switch-input-source-backward ''"
        "org.gnome.desktop.wm.keybindings switch-input-source []"
        "org.gnome.desktop.wm.keybindings switch-input-source-backward []"
      );;
    *KDE*|*kde*|*PLASMA*|*plasma*)
      # KDE는 보통 Virtual Keyboard 방식으로 처리, gsettings 불필요
      cmds=();;
    *) cmds=(
        "org.gnome.desktop.wm.keybindings switch-input-source []"
        "org.gnome.desktop.wm.keybindings switch-input-source-backward []"
      );;
  esac

  if [ -S "/run/user/$TARGET_UID/bus" ]; then
    local bus="unix:path=/run/user/$TARGET_UID/bus"
    for c in "${cmds[@]}"; do sudo -u "$USER" DBUS_SESSION_BUS_ADDRESS="$bus" gsettings set $c 2>/dev/null || true; done
  else
    for c in "${cmds[@]}"; do run_as_user_sh "$USER" "gsettings set $c 2>/dev/null || true"; done
  fi
  ok "단축키 해제 완료"

  # 6. Wayland / X11 / Non-systemd 환경변수
  log "[6/7] Wayland/X11 환경변수 설정..."
  write_fcitx5_env "$_kde6_wayland" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "true" "true" "$TARGET_HOME/.xsessionrc" "false"
  ok "환경변수 파일 생성"

  # 7. 자동시작
  log "[7/7] 자동시작 등록..."
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
  chown -R "$TARGET_UID:$TARGET_GID" "$ADIR"
  ok "자동시작 등록"

  # KDE Plasma 가상 키보드(Fcitx 5) 자동 설정
  local _kde_detected=true
  if [[ "${DESKTOP:-}" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]] || \
     [[ "${XDG_CURRENT_DESKTOP:-}" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]] || \
     { [[ -z "${DESKTOP:-}" || "${DESKTOP:-}" == "unknown" ]] && { command -v plasmashell >/dev/null 2>&1 || command -v kwin_wayland >/dev/null 2>&1 || command -v kwriteconfig6 >/dev/null 2>&1 || command -v kwriteconfig5 >/dev/null 2>&1 || [[ -f "$TARGET_HOME/.config/kwinrc" ]]; }; }; then
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
    chown "$TARGET_UID:$TARGET_GID" "$TARGET_HOME/.config" "$_kwinrc" 2>/dev/null || true
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


  # 재부팅/재로그인 후 1회성 안내 팝업 자동시작 등록 (표시 후 자폭)
  local GUIDE_DIR="$TARGET_HOME/.local/bin"
  local GUIDE_BIN="$GUIDE_DIR/hangul-first-login-guide.sh"
  local GUIDE_DESK="$TARGET_HOME/.config/autostart/hangul-first-login-guide.desktop"
  mkdir -p "$TARGET_HOME/.config/autostart" "$GUIDE_DIR"

  cat > "$GUIDE_BIN" <<'GUIDE_EOF'
#!/usr/bin/env bash
sleep 2
TITLE="리눅스 한글 입력기 안내"
MSG="🎉 기타 Debian / Ubuntu 파생 (Generic Debian/Ubuntu) 한글 입력기 설정이 완료되었습니다!

🖥️  KDE Plasma 가상 키보드(Fcitx 5) 자동 설정됨 (미적용 시: 시스템 설정 → 입력 장치 → 가상 키보드 확인)

⌨️  전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space
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
  chown -R "$TARGET_UID:$TARGET_GID" "$TARGET_HOME/.config/autostart" "$GUIDE_DIR"

  echo
  echo "============================================================"
  echo " 🎉 설치 완료! 로그아웃 후 다시 로그인하세요."
  echo " 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space 로 전환"
  echo " 설정: fcitx5-configtool"
  echo " 로그: $LOG_FILE"
  echo "============================================================"
}
main "$@"
