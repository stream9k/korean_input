#!/usr/bin/env bash
# ibus-hangul (GNOME 친화 대안 입력기) Arch / Manjaro / Endeavour (pacman) - ibus-hangul (GNOME 친화 대안 한글 입력기) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/ibus/ibus-arch.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.5.12"
LOG_FILE="/var/log/install-ibus-ibus-arch.log"

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

  if [[ -f "$_home/.xim" ]] && grep -q '^# korean_input: managed xim' "$_home/.xim" 2>/dev/null && \
     ! grep -qE "^# korean_input: managed xim \(${_target_ime}\)$" "$_home/.xim" 2>/dev/null; then
    rm -f "$_home/.xim"
    _changed=true
  fi

  local _env_line_re="^[[:space:]]*(export[[:space:]]+)?((GTK|QT|SDL|GLFW)_IM_MODULE=['\"]?${_im_re}['\"]?|INPUT_METHOD=['\"]?${_im_re}['\"]?|QT_IM_MODULES=('[^']*${_im_re}[^']*'|\"[^\"]*${_im_re}[^\"]*\"|[^[:space:]'\";]*${_im_re}[^[:space:]'\";]*)|XMODIFIERS=['\"]?@im=${_im_re}['\"]?)[[:space:]]*(#.*)?$"
  local _etc_env_line_re="^[[:space:]]*(export[[:space:]]+)?((GTK|QT|SDL|GLFW)_IM_MODULE=['\"]?${_im_re}['\"]?|INPUT_METHOD=['\"]?${_im_re}['\"]?|QT_IM_MODULES=('[^']*${_im_re}[^']*'|\"[^\"]*${_im_re}[^\"]*\"|[^[:space:]'\"]*${_im_re}[^[:space:]'\"]*)|XMODIFIERS=['\"]?@im=${_im_re}['\"]?)[[:space:]]*(#.*)?$"
  local _cmd_line_re="^[[:space:]]*((/usr(/local)?/bin/)?${_cmd_re})([[:space:]]+(-[A-Za-z0-9_=-]+|>/dev/null|2>/dev/null|2>&1|&>/dev/null))*([[:space:]]*&)?[[:space:]]*(#.*)?$"
  local _ef
  for _ef in /etc/environment "$_home/.xsessionrc" "$_home/.xprofile" "$_home/.bash_profile" "$_home/.zprofile" "$_home/.profile" "$_home/.xim"; do
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

is_readable_tty_fd() {
  local _fd="$1" _k="" _v="" _flags=""
  [[ -t "$_fd" ]] || return 1
  if [[ -r "/proc/self/fdinfo/$_fd" ]]; then
    while read -r _k _v _; do
      if [[ "$_k" == "flags:" ]]; then
        _flags="$_v"
        break
      fi
    done < "/proc/self/fdinfo/$_fd"
    [[ -n "$_flags" && "$_flags" =~ ^[0-7]+$ ]] || return 1
    if (( (8#$_flags & 3) == 0 || (8#$_flags & 3) == 2 )); then
      return 0
    fi
    return 1
  fi
  return 1
}

resolve_confirm_tty() {
  _CONFIRM_TTY_MODE=""
  if ( : </dev/tty ) 2>/dev/null; then
    _CONFIRM_TTY_MODE="devtty"
    return 0
  fi
  if [[ -t 0 ]]; then
    _CONFIRM_TTY_MODE="fd0"
    return 0
  fi
  if is_readable_tty_fd 1; then
    _CONFIRM_TTY_MODE="fd1"
    return 0
  fi
  if is_readable_tty_fd 2; then
    _CONFIRM_TTY_MODE="fd2"
    return 0
  fi
  local _t1="" _t2="" _tpath=""
  if [[ -t 1 ]]; then
    exec 9<&1
    _t1=$(readlink /proc/self/fd/9 2>/dev/null || tty <&9 2>/dev/null || true)
    exec 9<&-
    [[ "$_t1" == /* && -c "$_t1" ]] || _t1=""
  fi
  if [[ -t 2 ]]; then
    exec 9<&2
    _t2=$(readlink /proc/self/fd/9 2>/dev/null || tty <&9 2>/dev/null || true)
    exec 9<&-
    [[ "$_t2" == /* && -c "$_t2" ]] || _t2=""
  fi
  if [[ -n "$_t1" && "$_t1" == "$_t2" ]]; then
    _tpath="$_t1"
  elif [[ ! -r /proc/self/fdinfo/1 && -n "$_t1" ]]; then
    _tpath="$_t1"
  elif [[ ! -r /proc/self/fdinfo/2 && -n "$_t2" ]]; then
    _tpath="$_t2"
  fi
  if [[ -n "$_tpath" ]] && ( : <"$_tpath" ) 2>/dev/null; then
    _CONFIRM_TTY_MODE="path:$_tpath"
    return 0
  fi
  return 1
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

  local _CONFIRM_TTY_MODE=""
  if ! resolve_confirm_tty; then
    echo " ❌ 대화형 터미널(/dev/tty)이 없어 사용자 확인을 받을 수 없습니다." >&2
    echo "    대화형 터미널에서 실행하거나, 파이프 실행 시 '| sudo bash -s -- --yes' (로컬 실행 시 '--yes' / '-y') 옵션을 전달하세요." >&2
    exit 1
  fi

  local _reply=""
  local _prompt=" 이대로 설치를 진행하시겠습니까? [y/N]: "
  case "$_CONFIRM_TTY_MODE" in
    devtty)
      if [[ -t 1 ]]; then
        printf "%s" "$_prompt"
      elif ( : >/dev/tty ) 2>/dev/null; then
        printf "%s" "$_prompt" >/dev/tty
      else
        printf "%s" "$_prompt" >&2
      fi
      IFS= read -r _reply </dev/tty || _reply=""
      ;;
    fd0)
      printf "%s" "$_prompt"
      IFS= read -r _reply || _reply=""
      ;;
    fd1)
      printf "%s" "$_prompt"
      IFS= read -r _reply <&1 || _reply=""
      ;;
    fd2)
      printf "%s" "$_prompt" >&2
      IFS= read -r _reply <&2 || _reply=""
      ;;
    path:*)
      local _tty_path="${_CONFIRM_TTY_MODE#path:}"
      if [[ -t 1 ]]; then
        printf "%s" "$_prompt"
      elif [[ -t 2 ]]; then
        printf "%s" "$_prompt" >&2
      else
        printf "%s" "$_prompt" >"$_tty_path"
      fi
      IFS= read -r _reply <"$_tty_path" || _reply=""
      ;;
  esac
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
  if id -u deck >/dev/null 2>&1; then
    echo "deck"
    return
  fi
  err "대상 사용자 탐지 실패"
}

steamos_cleanup() {
  if command -v steamos-readonly >/dev/null 2>&1; then
    steamos-readonly enable 2>/dev/null || true
  fi
}

detect_ibus_family() {
  local _id="${1,,}"
  if command -v steamos-readonly >/dev/null 2>&1 || [[ "$_id" == "steamos" ]]; then
    echo "steamos"; return
  fi
  if command -v rpm-ostree >/dev/null 2>&1; then
    echo "fedora-atomic"; return
  fi
  if command -v abroot >/dev/null 2>&1; then
    echo "vanilla"; return
  fi
  if command -v transactional-update >/dev/null 2>&1; then
    echo "opensuse-transactional"; return
  fi
  if [[ "$_id" == "kaos" ]]; then
    err "KaOS는 KDE/Qt 전용 배포판으로 공식 ibus-hangul을 지원하지 않습니다. Fcitx5 스크립트 사용을 권장합니다."
  fi
  if [[ "$_id" == "altlinux" || -f /etc/altlinux-release ]]; then
    err "ALT Linux는 Fcitx5 스크립트 사용을 권장합니다."
  fi
  if command -v pacman >/dev/null 2>&1; then
    echo "arch"; return
  fi
  if command -v apt-get >/dev/null 2>&1; then
    echo "debian"; return
  fi
  if command -v dnf >/dev/null 2>&1; then
    echo "fedora"; return
  fi
  if command -v zypper >/dev/null 2>&1; then
    echo "opensuse"; return
  fi
  err "지원하지 않는 배포판입니다 (ID=${_id:-unknown}). Debian/Ubuntu, Fedora/RHEL, Arch, openSUSE 계열에서 실행하세요."
}

main() {
  require_root

  local USER TARGET_HOME TARGET_UID TARGET_GID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  TARGET_GID=$(id -g "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID" "$DESKTOP")

  local _os_id=""
  if [[ -f /etc/os-release ]]; then
    _os_id=$(
      # shellcheck disable=SC1091
      . /etc/os-release
      echo "${ID:-}"
    )
  fi

  local _ibus_family _pkg_summary="" _cfg_summary="" _extra_warn="" _need_reboot=false
  _ibus_family=$(detect_ibus_family "$_os_id")

  case "$_ibus_family" in
    debian)
      _pkg_summary="   - apt-get update && apt-get install: ibus, ibus-hangul, im-config, fonts-noto-cjk (+ ibus-gtk3/gtk4 사용 가능 시)"
      _cfg_summary="   - im-config -n ibus\n   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\n   - fcitx5 사용자 서비스 비활성화(있는 경우)\n   - $TARGET_HOME/.config/environment.d/ibus.conf, $TARGET_HOME/.xsessionrc\n   - 첫 로그인 1회 안내 팝업 등록"
      _cfg_summary="   - im-config -n ibus\n   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\n   - fcitx5 사용자 서비스 비활성화(있는 경우)\n   - $TARGET_HOME/.config/environment.d/ibus.conf, $TARGET_HOME/.xsessionrc\n   - 첫 로그인 1회 안내 팝업 등록"
      ;;
    vanilla)
      _need_reboot=true
      _pkg_summary="   - abroot pkg add: ibus, ibus-hangul, im-config, fonts-noto-cjk"
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\n   - fcitx5 사용자 서비스 비활성화(있는 경우)\n   - $TARGET_HOME/.config/environment.d/ibus.conf, $TARGET_HOME/.xsessionrc\n   - 첫 로그인 1회 안내 팝업 등록"
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\n   - fcitx5 사용자 서비스 비활성화(있는 경우)\n   - $TARGET_HOME/.config/environment.d/ibus.conf, $TARGET_HOME/.xsessionrc\n   - 첫 로그인 1회 안내 팝업 등록"
      _extra_warn=" ⚠️  참고: 불변 OS(ABRoot)이므로 설치 완료 후 반드시 재부팅이 필요합니다."
      ;;
    fedora)
      _pkg_summary="   - dnf install: ibus, ibus-hangul, ibus-setup, google-noto-sans-cjk-ttc-fonts (또는 google-noto-cjk-fonts)"
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\n   - alternatives --set xinputrc (ibus.conf 있는 경우), systemctl --user enable ibus / disable fcitx5\n   - $TARGET_HOME/.config/environment.d/ibus.conf, ~/.bash_profile (또는 ~/.profile)\n   - 비-GNOME 데스크톱 시 $TARGET_HOME/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - 첫 로그인 1회 안내 팝업 등록"
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\n   - alternatives --set xinputrc (ibus.conf 있는 경우), systemctl --user enable ibus / disable fcitx5\n   - $TARGET_HOME/.config/environment.d/ibus.conf, ~/.bash_profile (또는 ~/.profile)\n   - 비-GNOME 데스크톱 시 $TARGET_HOME/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - 첫 로그인 1회 안내 팝업 등록"
      ;;
    fedora-atomic)
      _need_reboot=true
      _pkg_summary="   - rpm-ostree install --idempotent --allow-inactive: ibus, ibus-hangul, ibus-setup, google-noto-sans-cjk-ttc-fonts"
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\n   - fcitx5 사용자 서비스 비활성화(있는 경우)\n   - $TARGET_HOME/.config/environment.d/ibus.conf, ~/.bash_profile (또는 ~/.profile)\n   - 비-GNOME 데스크톱 시 $TARGET_HOME/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - 첫 로그인 1회 안내 팝업 등록"
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\n   - fcitx5 사용자 서비스 비활성화(있는 경우)\n   - $TARGET_HOME/.config/environment.d/ibus.conf, ~/.bash_profile (또는 ~/.profile)\n   - 비-GNOME 데스크톱 시 $TARGET_HOME/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - 첫 로그인 1회 안내 팝업 등록"
      _extra_warn=" ⚠️  참고: 불변 OS(rpm-ostree)이므로 설치 완료 후 반드시 재부팅이 필요합니다."
      ;;
    arch)
      _pkg_summary="   - pacman -Syu --needed: ibus, ibus-hangul, noto-fonts-cjk (미설치 시 부분 업그레이드 방지)"
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\n   - fcitx5 사용자 서비스 비활성화(있는 경우)\n   - $TARGET_HOME/.config/environment.d/ibus.conf, $TARGET_HOME/.xprofile\n   - 비-GNOME 데스크톱 시 $TARGET_HOME/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - 첫 로그인 1회 안내 팝업 등록"
      ;;
    steamos)
      _pkg_summary="   - steamos-readonly disable → pacman-key init/populate → pacman -Sy --needed: ibus, ibus-hangul, noto-fonts-cjk → steamos-readonly enable"
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\n   - $TARGET_HOME/.config/environment.d/ibus.conf, $TARGET_HOME/.xprofile\n   - 비-GNOME 데스크톱 시 $TARGET_HOME/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - 첫 로그인 1회 안내 팝업 등록"
      _extra_warn=" ⚠️  참고: SteamOS 루트 파일시스템 읽기 전용 상태를 일시 해제했다가 복구합니다."
      ;;
    opensuse|opensuse-transactional)
      if [[ "$_ibus_family" == "opensuse-transactional" ]]; then
        _need_reboot=true
        _pkg_summary="   - transactional-update --non-interactive pkg install: ibus, ibus-hangul, google-noto-sans-cjk-fonts"
        _extra_warn=" ⚠️  참고: Transactional OS이므로 설치 완료 후 반드시 재부팅이 필요합니다."
      else
        _pkg_summary="   - zypper --non-interactive install -y: ibus, ibus-hangul, google-noto-sans-cjk-fonts"
      fi
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\n   - alternatives --set xinputrc (ibus.conf 있는 경우), systemctl --user enable ibus / disable fcitx5\n   - $TARGET_HOME/.config/environment.d/ibus.conf, ~/.profile (또는 ~/.bash_profile, INPUT_METHOD=ibus 포함)\n   - 비-GNOME 데스크톱 시 $TARGET_HOME/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - 첫 로그인 1회 안내 팝업 등록"
      ;;
  esac

  _extra_warn=$(append_conflict_ime_warn "ibus" "$EXISTING_IME" "$_extra_warn" "$DESKTOP")
  if [[ "$DESKTOP" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] && "$SESSION_TYPE" == "wayland" ]]; then
    local _kde_warn=" ⚠️  참고: KDE Plasma Wayland 환경에서는 IBus보다 Fcitx 5가 더 안정적으로 권장됩니다."
    if [[ -n "$_extra_warn" ]]; then
      _extra_warn="${_extra_warn}\n${_kde_warn}"
    else
      _extra_warn="$_kde_warn"
    fi
  fi

  confirm_before_changes \
    "ibus-hangul (GNOME 친화 대안 입력기) Arch / Manjaro / Endeavour (pacman) (ibus-hangul)" \
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== ibus-hangul (GNOME 친화 대안 입력기) Arch / Manjaro / Endeavour (pacman) ibus-hangul 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME (family=$_ibus_family, id=${_os_id:-unknown})"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. 배포판별 패키지 설치
  case "$_ibus_family" in
    debian)
      log "[1/3] ibus-hangul 및 한글 폰트 설치 (apt-get)..."
      export DEBIAN_FRONTEND=noninteractive
      apt-get update -qq
      local _deb_pkgs=(ibus ibus-hangul im-config fonts-noto-cjk)
      local _opt_pkg
      for _opt_pkg in ibus-gtk3 ibus-gtk4; do
        if apt-cache show "$_opt_pkg" >/dev/null 2>&1; then
          _deb_pkgs+=("$_opt_pkg")
        fi
      done
      apt-get install -y -qq "${_deb_pkgs[@]}"
      ;;
    vanilla)
      log "[1/3] ibus-hangul 및 한글 폰트 추가 (abroot)..."
      abroot pkg add ibus ibus-hangul im-config fonts-noto-cjk
      ;;
    fedora)
      log "[1/3] ibus-hangul 및 한글 폰트 설치 (dnf)..."
      dnf install -y -q ibus ibus-hangul ibus-setup
      dnf install -y -q google-noto-sans-cjk-ttc-fonts 2>/dev/null || dnf install -y -q google-noto-cjk-fonts 2>/dev/null || true
      ;;
    fedora-atomic)
      log "[1/3] ibus-hangul 및 한글 폰트 레이어링 (rpm-ostree)..."
      rpm-ostree install --idempotent --allow-inactive ibus ibus-hangul ibus-setup google-noto-sans-cjk-ttc-fonts
      ;;
    arch)
      log "[1/3] ibus-hangul 및 한글 폰트 설치 (pacman)..."
      if pacman -T ibus ibus-hangul noto-fonts-cjk >/dev/null 2>&1; then
        ok "필수 패키지가 이미 설치되어 있어 pacman 업그레이드를 건너뜁니다"
      else
        pacman -Syu --needed --noconfirm ibus ibus-hangul noto-fonts-cjk
      fi
      ;;
    steamos)
      trap steamos_cleanup EXIT
      log "[1/3] SteamOS 읽기 전용 해제 및 ibus-hangul 설치..."
      steamos-readonly disable
      pacman-key --init
      pacman-key --populate archlinux holo 2>/dev/null || pacman-key --populate
      # SteamOS Holo uses immutable A/B snapshot repos; avoid pacman -Syu
      pacman -Sy --needed --noconfirm ibus ibus-hangul noto-fonts-cjk
      steamos-readonly enable
      ;;
    opensuse)
      log "[1/3] ibus-hangul 및 한글 폰트 설치 (zypper)..."
      if ! zypper --non-interactive --gpg-auto-import-keys install -y ibus ibus-hangul; then
        warn "zypper 설치 실패 — 미러 메타데이터 강제 갱신(refresh -f) 후 재시도합니다..."
        zypper --non-interactive --gpg-auto-import-keys refresh -f || true
        zypper --non-interactive --gpg-auto-import-keys install -y ibus ibus-hangul
      fi
      zypper --non-interactive --gpg-auto-import-keys install -y google-noto-sans-cjk-fonts 2>/dev/null || true
      ;;
    opensuse-transactional)
      log "[1/3] ibus-hangul 및 한글 폰트 설치 (transactional-update)..."
      transactional-update --non-interactive pkg install ibus ibus-hangul google-noto-sans-cjk-fonts
      ;;
  esac
  ok "패키지 설치 완료"
  disable_conflicting_imes "ibus" "$USER" "$TARGET_HOME" "$TARGET_UID" "$DESKTOP"

  # 2. 입력 소스 등록, ibus 엔진 캐시 갱신 및 충돌 서비스 비활성화
  log "[2/3] 입력 소스('hangul') 등록 및 ibus 엔진 캐시 갱신..."
  ibus write-cache --system 2>/dev/null || true
  local sources="[('ibus', 'hangul')]"
  local preload="['hangul']"
  local triggers="['<Control>space', 'Hangul']"
  local hangul_switch_keys="Hangul,Control+space"
  if [[ -S "/run/user/$TARGET_UID/bus" ]]; then
    local bus="unix:path=/run/user/$TARGET_UID/bus"
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \
      gsettings set org.gnome.desktop.input-sources sources "$sources" 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \
      gsettings set org.freedesktop.ibus.general preload-engines "$preload" 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \
      gsettings set org.freedesktop.ibus.general.hotkey triggers "$triggers" 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \
      gsettings set org.freedesktop.ibus.engine.hangul switch-keys "$hangul_switch_keys" 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \
      gsettings set org.freedesktop.ibus.engine.hangul initial-input-mode 'latin' 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \
      ibus write-cache 2>/dev/null || true
    if command -v systemctl >/dev/null 2>&1; then
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \
        systemctl --user disable fcitx5 2>/dev/null || true
    fi
    if pgrep -u "$TARGET_UID" -x ibus-daemon >/dev/null 2>&1; then
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \
        ibus restart 2>/dev/null || true
    fi
  else
    run_as_user_sh "$USER" "gsettings set org.gnome.desktop.input-sources sources \"$sources\"" 2>/dev/null || true
    run_as_user_sh "$USER" "gsettings set org.freedesktop.ibus.general preload-engines \"$preload\"" 2>/dev/null || true
    run_as_user_sh "$USER" "gsettings set org.freedesktop.ibus.general.hotkey triggers \"$triggers\"" 2>/dev/null || true
    run_as_user_sh "$USER" "gsettings set org.freedesktop.ibus.engine.hangul switch-keys \"$hangul_switch_keys\"" 2>/dev/null || true
    run_as_user_sh "$USER" "gsettings set org.freedesktop.ibus.engine.hangul initial-input-mode 'latin'" 2>/dev/null || true
    run_as_user_sh "$USER" "ibus write-cache" 2>/dev/null || true
    run_as_user_sh "$USER" "systemctl --user disable fcitx5 2>/dev/null || true" || true
  fi
  ok "입력 소스 및 엔진 캐시 설정 완료"

  # 3. 프레임워크 및 환경변수 설정
  log "[3/3] 프레임워크 및 환경변수 설정..."
  local ENV_FILE="$TARGET_HOME/.config/environment.d/ibus.conf"
  mkdir -p "$(dirname "$ENV_FILE")"
  cat > "$ENV_FILE" <<'EOF'
GTK_IM_MODULE=ibus
QT_IM_MODULE=ibus
XMODIFIERS=@im=ibus
EOF
  if [[ "$_ibus_family" == "opensuse" || "$_ibus_family" == "opensuse-transactional" ]]; then
    echo "INPUT_METHOD=ibus" >> "$ENV_FILE"
  fi
  chown -R "$TARGET_UID:$TARGET_GID" "$(dirname "$ENV_FILE")"

  case "$_ibus_family" in
    debian|vanilla)
      if [[ "$_ibus_family" == "debian" ]] && command -v im-config >/dev/null 2>&1; then
        run_as_user_sh "$USER" "im-config -n ibus" 2>/dev/null || warn "im-config -n ibus 실패 (수동으로 입력기를 ibus로 선택하세요)"
      fi
      local XSESSION_FILE="$TARGET_HOME/.xsessionrc"
      if ! grep -q "GTK_IM_MODULE=ibus" "$XSESSION_FILE" 2>/dev/null; then
        cat >> "$XSESSION_FILE" <<'EOF'

# ibus 환경변수
export GTK_IM_MODULE=ibus
export QT_IM_MODULE=ibus
export XMODIFIERS=@im=ibus
EOF
        chown "$TARGET_UID:$TARGET_GID" "$XSESSION_FILE"
      fi
      ;;
    fedora|opensuse|opensuse-transactional)
      if [[ -f /etc/X11/xinit/xinput.d/ibus.conf ]] && command -v alternatives >/dev/null 2>&1; then
        alternatives --set xinputrc /etc/X11/xinit/xinput.d/ibus.conf 2>/dev/null || true
      fi
      if [[ -S "/run/user/$TARGET_UID/bus" ]] && command -v systemctl >/dev/null 2>&1; then
        sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$TARGET_UID/bus" \
          systemctl --user enable ibus 2>/dev/null || true
      else
        run_as_user_sh "$USER" "systemctl --user enable ibus 2>/dev/null || true" || true
      fi
      local _is_suse_ibus="false"
      local PROFILE_FILE="$TARGET_HOME/.bash_profile"
      if [[ "$_ibus_family" == "opensuse" || "$_ibus_family" == "opensuse-transactional" ]]; then
        _is_suse_ibus="true"
        PROFILE_FILE="$TARGET_HOME/.profile"
        [[ ! -f "$PROFILE_FILE" && -f "$TARGET_HOME/.bash_profile" ]] && PROFILE_FILE="$TARGET_HOME/.bash_profile"
      else
        [[ -f "$TARGET_HOME/.profile" && ! -f "$PROFILE_FILE" ]] && PROFILE_FILE="$TARGET_HOME/.profile"
      fi
      if ! grep -q "GTK_IM_MODULE=ibus" "$PROFILE_FILE" 2>/dev/null; then
        if [[ -s "$PROFILE_FILE" ]] && [[ -n "$(tail -c 1 "$PROFILE_FILE" 2>/dev/null | tr -d '\n')" ]]; then
          printf '\n' >> "$PROFILE_FILE"
        fi
        cat >> "$PROFILE_FILE" <<'EOF'

# ibus 환경변수
export GTK_IM_MODULE=ibus
export QT_IM_MODULE=ibus
export XMODIFIERS=@im=ibus
EOF
        if [[ "$_is_suse_ibus" == "true" ]] && ! grep -qE '^[[:space:]]*(export[[:space:]]+)?INPUT_METHOD=['\''"]?ibus['\''"]?[[:space:]]*(#.*)?$' "$PROFILE_FILE" 2>/dev/null; then
          echo "export INPUT_METHOD=ibus" >> "$PROFILE_FILE"
        fi
      elif [[ "$_is_suse_ibus" == "true" ]] && ! grep -qE '^[[:space:]]*(export[[:space:]]+)?INPUT_METHOD=['\''"]?ibus['\''"]?[[:space:]]*(#.*)?$' "$PROFILE_FILE" 2>/dev/null; then
        if [[ -s "$PROFILE_FILE" ]] && [[ -n "$(tail -c 1 "$PROFILE_FILE" 2>/dev/null | tr -d '\n')" ]]; then
          printf '\n' >> "$PROFILE_FILE"
        fi
        echo "export INPUT_METHOD=ibus" >> "$PROFILE_FILE"
      fi
      chown "$TARGET_UID:$TARGET_GID" "$PROFILE_FILE"
      ;;
    fedora-atomic)
      local PROFILE_FILE="$TARGET_HOME/.bash_profile"
      [[ -f "$TARGET_HOME/.profile" && ! -f "$PROFILE_FILE" ]] && PROFILE_FILE="$TARGET_HOME/.profile"
      if ! grep -q "GTK_IM_MODULE=ibus" "$PROFILE_FILE" 2>/dev/null; then
        cat >> "$PROFILE_FILE" <<'EOF'

# ibus 환경변수
export GTK_IM_MODULE=ibus
export QT_IM_MODULE=ibus
export XMODIFIERS=@im=ibus
EOF
        chown "$TARGET_UID:$TARGET_GID" "$PROFILE_FILE"
      fi
      ;;
    arch|steamos)
      local XPROFILE_FILE="$TARGET_HOME/.xprofile"
      if ! grep -q "GTK_IM_MODULE=ibus" "$XPROFILE_FILE" 2>/dev/null; then
        cat >> "$XPROFILE_FILE" <<'EOF'

# ibus 환경변수
export GTK_IM_MODULE=ibus
export QT_IM_MODULE=ibus
export XMODIFIERS=@im=ibus
EOF
        chown "$TARGET_UID:$TARGET_GID" "$XPROFILE_FILE"
      fi
      ;;
  esac

  if [[ "$_ibus_family" != "debian" && "$_ibus_family" != "vanilla" && ! "${DESKTOP,,}" == *"gnome"* ]]; then
    local ADIR="$TARGET_HOME/.config/autostart"
    mkdir -p "$ADIR"
    cat > "$ADIR/ibus-daemon.desktop" <<'EOF'
[Desktop Entry]
Type=Application
Name=IBus Daemon
Exec=ibus-daemon -drxR
NotShowIn=GNOME;
X-GNOME-Autostart-enabled=true
Hidden=false
NoDisplay=false
EOF
    chown -R "$TARGET_UID:$TARGET_GID" "$ADIR"
    ok "비-GNOME 데스크톱용 ibus-daemon 자동시작 등록 (NotShowIn=GNOME;)"
  fi
  ok "환경변수 설정 완료"

  # 재부팅/재로그인 후 1회성 안내 팝업 자동시작 등록 (표시 후 자폭)
  local GUIDE_DIR="$TARGET_HOME/.local/bin"
  local GUIDE_BIN="$GUIDE_DIR/hangul-first-login-guide.sh"
  local GUIDE_DESK="$TARGET_HOME/.config/autostart/hangul-first-login-guide.desktop"
  mkdir -p "$TARGET_HOME/.config/autostart" "$GUIDE_DIR"

  cat > "$GUIDE_BIN" <<'GUIDE_EOF'
#!/usr/bin/env bash
sleep 2
TITLE="리눅스 한글 입력기 안내"
MSG="🎉 ibus-hangul (GNOME 친화 대안 입력기) 한글 입력기(ibus-hangul) 설정이 완료되었습니다!

⌨️  전환: Ctrl+Space 또는 한/영 키
⚙️  설정: ibus-setup (GNOME: 설정 → 키보드 → 입력 소스)
📝 로그: /var/log/install-ibus-ibus-arch.log
🔍 미작동 시: 설치 페이지(https://stream9k.github.io/korean_input/)의 3단계(설치 후 검증) 참고

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
  if [[ "$_need_reboot" == "true" ]]; then
    echo " 🎉 ibus-hangul 설치 완료! 불변 OS이므로 반드시 재부팅하세요 (systemctl reboot)."
  else
    echo " 🎉 ibus-hangul 설치 완료! 로그아웃 후 다시 로그인하세요."
  fi
  echo " 전환: Ctrl+Space 또는 한/영 키"
  echo " 세부 설정: ibus-setup (GNOME: 설정 → 키보드 → 입력 소스)"
  echo " 로그: $LOG_FILE"
  echo " 🔍 미작동 시: 설치 페이지(https://stream9k.github.io/korean_input/)의 3단계(설치 후 검증)를 참고하세요."
  echo "============================================================"
}
main "$@"
