#!/usr/bin/env bash
# kime (Rust 기반 경량 입력기) Debian / Ubuntu / Mint (.deb) - kime (Rust 기반 경량 한글 입력기) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/kime/kime-debian.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.5.2"
LOG_FILE="/var/log/install-kime-kime-debian.log"

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
      _env_confs=(ibus.conf kime.conf fcitx.conf)
      _im_re="(ibus|kime)"
      _kwin_re="(ibus|kime)"
      _cmd_re="(kime|kime-daemon|kime-wayland|kime-xim|kime-xdg-autostart|fcitx)"
      [[ "$_is_gnome" != "true" ]] && _cmd_re="(ibus-daemon|kime|kime-daemon|kime-wayland|kime-xim|kime-xdg-autostart|fcitx)"
      ;;
    ibus)
      _target_desktops=(ibus.desktop ibus-daemon.desktop org.freedesktop.IBus.Panel.Wayland.Gtk3.desktop)
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

  local _env_line_re="^[[:space:]]*(export[[:space:]]+)?((GTK|QT|SDL|GLFW)_IM_MODULE=['\"]?${_im_re}['\"]?|QT_IM_MODULES=('[^']*${_im_re}[^']*'|\"[^\"]*${_im_re}[^\"]*\"|[^[:space:]'\";]*${_im_re}[^[:space:]'\";]*)|XMODIFIERS=['\"]?@im=${_im_re}['\"]?)[[:space:]]*(#.*)?$"
  local _etc_env_line_re="^[[:space:]]*(export[[:space:]]+)?((GTK|QT|SDL|GLFW)_IM_MODULE=['\"]?${_im_re}['\"]?|QT_IM_MODULES=('[^']*${_im_re}[^']*'|\"[^\"]*${_im_re}[^\"]*\"|[^[:space:]'\"]*${_im_re}[^[:space:]'\"]*)|XMODIFIERS=['\"]?@im=${_im_re}['\"]?)[[:space:]]*(#.*)?$"
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
            env_re = "^[ \t]*(export[ \t]+)?((GTK|QT|SDL|GLFW)_IM_MODULE=[\047\"]?" im_re "[\047\"]?|QT_IM_MODULES=(\047[^\047]*" im_re "[^\047]*\047|\"[^\"]*" im_re "[^\"]*\"|[^ \t\047\";]*" im_re "[^ \t\047\";]*)|XMODIFIERS=[\047\"]?@im=" im_re "[\047\"]?)[ \t]*(#.*)?$"
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
  local _write_etc="$5" _write_envd="$6" _x11_profile="${7:-}" _allow_pending="${8:-false}"
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
      local _etc_im_re="^[[:space:]]*(GTK|QT)_IM_MODULE=['\"]?fcitx['\"]?[[:space:]]*(#.*)?$"
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
      chown -R "$_uid:$_gid" "$(dirname "$_env_file")"
    fi
    if [[ "$_write_etc" == "true" ]]; then
      grep -q "GTK_IM_MODULE=fcitx" /etc/environment 2>/dev/null || cat >> /etc/environment <<'EOF'

# fcitx5 환경변수
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
    fi
    if [[ -n "$_x11_profile" ]]; then
      if ! grep -q "GTK_IM_MODULE=fcitx" "$_x11_profile" 2>/dev/null; then
        cat >> "$_x11_profile" <<'EOF'

# fcitx5 환경변수
export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx
EOF
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
    rhel|almalinux|rocky|centos|ol|oreon|eurolinux|scientific|springdale|virtuozzo|circle|navy|miraclelinux)
      echo "rhel"; return ;;
    fedora|nobara|ultramarine|bazzite|aurora|bluefin)
      echo "fedora"; return ;;
    opensuse*|suse*)
      echo "opensuse"; return ;;
    ubuntu|debian|linuxmint|lmde|pop|zorin|elementary|neon|kali|mx|antix|sparky|tuxedo|bodhi|peppermint|voyager|devuan|parrot|raspbian|deepin|pureos|tails|anduinos|bunsenlabs|cuerdos|solydxk)
      echo "debian"; return ;;
  esac
  case " $_like " in
    *" arch "*) echo "arch"; return ;;
    *" rhel "*|*" centos "*|*" rocky "*|*" almalinux "*) echo "rhel"; return ;;
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

  _avail_line=$(printf '%s\n' "$_chroots" | awk 'NR>1{printf ", "} {printf "%s", $0}' || true)
  echo "$_avail_line"
  return 1
}

_KIME_AUR_TMP=""

cleanup_kime_aur_tmp() {
  if [[ -n "${_KIME_AUR_TMP:-}" && -d "$_KIME_AUR_TMP" ]]; then
    rm -rf "$_KIME_AUR_TMP"
    _KIME_AUR_TMP=""
  fi
}

run_as_target_user() {
  local _u="$1" _home="$2"
  shift 2
  if command -v runuser >/dev/null 2>&1; then
    runuser -u "$_u" -- env \
      HOME="$_home" \
      USER="$_u" \
      LOGNAME="$_u" \
      PATH="${_home}/.cargo/bin:/usr/local/sbin:/usr/local/bin:/usr/bin:/bin" \
      "$@" </dev/null
  else
    local _cmd=""
    printf -v _cmd '%q ' env \
      "HOME=$_home" \
      "USER=$_u" \
      "LOGNAME=$_u" \
      "PATH=${_home}/.cargo/bin:/usr/local/sbin:/usr/local/bin:/usr/bin:/bin" \
      "$@"
    su -s /bin/sh "$_u" -c "$_cmd" </dev/null
  fi
}

parse_srcinfo_deps() {
  awk '
    /^[[:space:]]*(depends|depends_x86_64|makedepends|makedepends_x86_64|checkdepends|checkdepends_x86_64)[[:space:]]*=/ {
      sub(/^[^=]*=[[:space:]]*/, "")
      sub(/[[:space:]]+$/, "")
      if ($0 != "") print
    }
  '
}

install_kime_aur_arch() {
  local _user="$1" _home="$2" _uid="$3"
  local _aur_pkg="${KIME_AUR_PKG:-kime}"
  local _aur_url="${KIME_AUR_GIT_URL:-https://aur.archlinux.org/${_aur_pkg}.git}"
  local _gid _pacman_synced=false
  _gid=$(id -g "$_user" 2>/dev/null || echo "$_uid")

  if pacman -T base-devel git >/dev/null 2>&1; then
    ok "빌드 필수 도구(base-devel, git)가 이미 설치되어 있습니다"
  else
    log "   → 시스템 동기화/업그레이드 및 빌드 필수 도구 설치 (pacman -Syu: base-devel, git)..."
    pacman -Syu --needed --noconfirm base-devel git </dev/null || err "base-devel/git 설치에 실패했습니다. 인터넷 연결과 pacman 상태를 확인하세요."
    _pacman_synced=true
  fi

  local _aur_tmp
  _aur_tmp=$(mktemp -d /var/tmp/kime-aur-build.XXXXXX)
  _KIME_AUR_TMP="$_aur_tmp"
  trap cleanup_kime_aur_tmp EXIT

  local _aur_src="${_aur_tmp}/src"
  local _aur_out="${_aur_tmp}/pkg"
  local _aur_build="${_aur_tmp}/build"
  local _aur_log="${_aur_tmp}/log"
  mkdir -p "$_aur_out" "$_aur_build" "$_aur_log"
  chown -R "${_uid}:${_gid}" "$_aur_tmp"

  log "   → AUR 저장소 클론 (${_aur_pkg}, 사용자: ${_user})..."
  if ! run_as_target_user "$_user" "$_home" git clone --depth=1 "$_aur_url" "$_aur_src"; then
    err "AUR 저장소 클론 실패: $_aur_url"
  fi

  local _srcinfo=""
  _srcinfo=$(run_as_target_user "$_user" "$_home" env -C "$_aur_src" makepkg --printsrcinfo 2>/dev/null || true)
  if [[ -z "$_srcinfo" && -f "${_aur_src}/.SRCINFO" ]]; then
    _srcinfo=$(cat "${_aur_src}/.SRCINFO")
  fi

  local -a _aur_deps=()
  if [[ -n "$_srcinfo" ]]; then
    mapfile -t _aur_deps < <(printf '%s\n' "$_srcinfo" | parse_srcinfo_deps | sort -u)
  fi

  if [[ ${#_aur_deps[@]} -gt 0 ]]; then
    local _missing_raw=""
    _missing_raw=$(pacman -T "${_aur_deps[@]}" 2>/dev/null || true)
    if [[ -n "$_missing_raw" ]]; then
      local -a _missing_pkgs=()
      mapfile -t _missing_pkgs < <(printf '%s\n' "$_missing_raw" | sed 's/[<>=].*$//' | awk 'NF' | sort -u)
      if [[ ${#_missing_pkgs[@]} -gt 0 ]]; then
        if [[ "$_pacman_synced" == "true" ]]; then
          log "   → AUR 빌드/런타임 의존성 설치 (pacman): ${_missing_pkgs[*]}"
          pacman -S --needed --noconfirm --asdeps "${_missing_pkgs[@]}" </dev/null || err "kime 의존성 패키지 설치에 실패했습니다: ${_missing_pkgs[*]}"
        else
          log "   → 시스템 동기화/업그레이드 및 AUR 빌드/런타임 의존성 설치 (pacman -Syu): ${_missing_pkgs[*]}"
          pacman -Syu --needed --noconfirm --asdeps "${_missing_pkgs[@]}" </dev/null || err "kime 의존성 패키지 설치에 실패했습니다: ${_missing_pkgs[*]}"
          _pacman_synced=true
        fi
      fi
    fi
  fi

  log "   → AUR 패키지 빌드 (makepkg, 사용자: ${_user})..."
  if ! run_as_target_user "$_user" "$_home" env -C "$_aur_src" \
       makepkg --noconfirm --nosign --clean \
       "PKGDEST=${_aur_out}" \
       "SRCDEST=${_aur_src}" \
       "BUILDDIR=${_aur_build}" \
       "LOGDEST=${_aur_log}"; then
    err "makepkg를 통한 kime 빌드에 실패했습니다. 빌드 로그와 네트워크 상태를 확인하세요."
  fi

  local -a _pkg_files=()
  local _f
  shopt -s nullglob
  for _f in "${_aur_out}"/*.pkg.tar*; do
    case "$_f" in
      *.sig|*-debug-*.pkg.tar*) continue ;;
      *) _pkg_files+=("$_f") ;;
    esac
  done
  shopt -u nullglob

  if [[ ${#_pkg_files[@]} -eq 0 ]]; then
    err "빌드된 kime 패키지 파일(.pkg.tar*)을 찾을 수 없습니다."
  fi

  log "   → 빌드된 패키지 설치 (pacman -U)..."
  pacman -U --noconfirm "${_pkg_files[@]}" </dev/null || err "pacman -U를 통한 kime 패키지 설치에 실패했습니다."

  cleanup_kime_aur_tmp
  trap - EXIT
}

ver_ge() {
  local _v1="$1" _v2="$2"
  [[ "$(printf '%s\n%s\n' "$_v2" "$_v1" | sort -V | head -n1)" == "$_v2" ]]
}

resolve_kime_latest_tag() {
  if [[ -n "${KIME_SOURCE_TAG:-}" ]]; then
    echo "$KIME_SOURCE_TAG"
    return 0
  fi
  local _api_url="${KIME_RELEASE_API_URL:-https://api.github.com/repos/Riey/kime/releases/latest}"
  local _latest_url="${KIME_RELEASE_LATEST_URL:-https://github.com/Riey/kime/releases/latest}"
  local _api_json="" _tag=""
  _api_json=$(http_get "$_api_url" 2>/dev/null || true)
  if [[ -n "$_api_json" ]]; then
    _tag=$(printf '%s\n' "$_api_json" | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1 || true)
  fi
  if [[ -z "$_tag" ]]; then
    _tag=$(http_latest_tag "$_latest_url" || true)
  fi
  echo "$_tag"
}

_KIME_SRC_TMP=""

cleanup_kime_src_tmp() {
  if [[ -n "${_KIME_SRC_TMP:-}" && -d "$_KIME_SRC_TMP" ]]; then
    rm -rf "$_KIME_SRC_TMP"
    _KIME_SRC_TMP=""
  fi
}

enable_el_crb_repo() {
  if ! dnf config-manager --help >/dev/null 2>&1; then
    dnf install -y 'dnf-command(config-manager)' </dev/null 2>/dev/null || \
      dnf install -y dnf-plugins-core </dev/null 2>/dev/null || true
  fi
  local _crb_repo=""
  _crb_repo=$(dnf repolist --all 2>/dev/null | awk '
    {
      id = $1
      lid = tolower(id)
      if (lid == "" || lid == "repo") next
      if (lid ~ /debug/ || lid ~ /source/) next
      if (lid == "crb" || lid ~ /codeready-builder/ || lid ~ /_codeready_builder$/ || lid == "powertools") {
        print id
        exit
      }
    }
  ' || true)
  if [[ -n "$_crb_repo" ]]; then
    if ! dnf repolist --enabled 2>/dev/null | awk '{print $1}' | grep -qxF "$_crb_repo"; then
      log "   → CRB/CodeReady 저장소 활성화 (${_crb_repo})..."
      if command -v crb >/dev/null 2>&1 && [[ "${_crb_repo,,}" == "crb" ]]; then
        crb enable >/dev/null 2>&1 || true
      fi
      if ! dnf repolist --enabled 2>/dev/null | awk '{print $1}' | grep -qxF "$_crb_repo"; then
        dnf config-manager --set-enabled "$_crb_repo" </dev/null 2>/dev/null || \
          dnf config-manager setopt "${_crb_repo}.enabled=1" </dev/null 2>/dev/null || \
          warn "CRB 저장소(${_crb_repo}) 자동 활성화 실패 — 기존 활성 저장소로 진행합니다."
      fi
    fi
  fi
}

install_kime_source_rhel() {
  local _user="$1" _home="$2" _uid="$3" _tag="$4"
  local _gid
  _gid=$(id -g "$_user" 2>/dev/null || echo "$_uid")

  enable_el_crb_repo

  log "   → 빌드 필수 도구 및 코어 라이브러리 설치 (dnf)..."
  dnf install -y </dev/null \
    gcc gcc-c++ clang-devel pkgconf-pkg-config ninja-build rust cargo tar gzip \
    dbus-devel libxcb-devel fontconfig-devel freetype-devel libxkbcommon-devel wayland-devel \
    || err "kime 소스 빌드에 필요한 기본 개발 패키지 설치에 실패했습니다."
  dnf install -y meson </dev/null 2>/dev/null || true

  local -a _opt_pkgs=()
  local _op
  for _op in gtk3-devel gtk4-devel qt6-qtbase-devel qt6-qtbase-private-devel qt5-qtbase-devel qt5-qtbase-private-devel; do
    if rpm -q "$_op" >/dev/null 2>&1 || dnf -q -C info "$_op" >/dev/null 2>&1 || dnf -q info "$_op" >/dev/null 2>&1; then
      _opt_pkgs+=("$_op")
    fi
  done
  if [[ ${#_opt_pkgs[@]} -gt 0 ]]; then
    log "   → GUI 프론트엔드 개발 패키지 설치 (dnf): ${_opt_pkgs[*]}"
    dnf install -y "${_opt_pkgs[@]}" </dev/null || err "GUI 프론트엔드 개발 패키지 설치에 실패했습니다: ${_opt_pkgs[*]}"
  else
    warn "사용 가능한 GTK/Qt 개발 패키지를 찾지 못했습니다. Wayland/XIM 백엔드 위주로 빌드합니다."
  fi

  dnf install -y -q google-noto-sans-cjk-ttc-fonts </dev/null 2>/dev/null || \
    dnf install -y -q google-noto-sans-cjk-fonts </dev/null 2>/dev/null || \
    dnf install -y -q google-noto-cjk-fonts </dev/null 2>/dev/null || true

  local _src_tmp
  _src_tmp=$(mktemp -d /var/tmp/kime-src-build.XXXXXX)
  _KIME_SRC_TMP="$_src_tmp"
  trap cleanup_kime_src_tmp EXIT

  mkdir -p "${_src_tmp}/extract"
  chown -R "${_uid}:${_gid}" "$_src_tmp"

  local _meson_bin="" _meson_ver="0"
  _meson_bin=$(command -v meson || true)
  if [[ -n "$_meson_bin" ]]; then
    _meson_ver=$("$_meson_bin" --version 2>/dev/null | head -n1 || echo "0")
  fi
  if [[ -z "$_meson_bin" ]] || ! ver_ge "$_meson_ver" "1.1"; then
    log "   → Meson 1.1+ 필요 (현재: ${_meson_ver:-미설치}) — 임시 venv에 meson 설치 중..."
    command -v python3 >/dev/null 2>&1 || err "Meson 1.1+ 및 python3가 없어 kime 빌드를 진행할 수 없습니다."
    run_as_target_user "$_user" "$_home" python3 -m venv "${_src_tmp}/meson-venv" || err "임시 Python venv 생성 실패 (meson 설치 불가)"
    run_as_target_user "$_user" "$_home" "${_src_tmp}/meson-venv/bin/pip" install --quiet 'meson>=1.1' || err "임시 venv에 meson>=1.1 설치 실패"
    _meson_bin="${_src_tmp}/meson-venv/bin/meson"
  fi

  local _ninja_bin=""
  _ninja_bin=$(command -v ninja || command -v ninja-build || true)
  [[ -n "$_ninja_bin" ]] || err "ninja 빌드 도구를 찾을 수 없습니다."
  run_as_target_user "$_user" "$_home" sh -c 'command -v cargo >/dev/null 2>&1' || err "사용자($_user) 환경에서 cargo를 찾을 수 없습니다."

  local _tar_url="${KIME_SOURCE_TARBALL_URL:-https://github.com/Riey/kime/archive/refs/tags/${_tag}.tar.gz}"
  local _tar_path="${_src_tmp}/kime-${_tag}.tar.gz"
  log "   → kime 소스 아카이브 다운로드 (${_tag})..."
  http_download "$_tar_url" "$_tar_path" || err "kime 소스 아카이브 다운로드 실패: $_tar_url"
  chown "${_uid}:${_gid}" "$_tar_path"

  run_as_target_user "$_user" "$_home" tar -xzf "$_tar_path" -C "${_src_tmp}/extract" || err "kime 소스 아카이브 압축 해제 실패"
  local _src_dir=""
  _src_dir=$(find "${_src_tmp}/extract" -mindepth 1 -maxdepth 1 -type d | head -n1 || true)
  [[ -n "$_src_dir" && -f "${_src_dir}/meson.build" ]] || err "압축 해제된 kime 소스 디렉터리에서 meson.build를 찾을 수 없습니다."
  local _build_dir="${_src_dir}/build"

  local _libdir="lib"
  [[ -d /usr/lib64 ]] && _libdir="lib64"

  local -a _build_env=("NINJA=${_ninja_bin}")
  if [[ -x "${_home}/.cargo/bin/cargo" ]]; then
    _build_env+=("CARGO_HOME=${_home}/.cargo" "RUSTUP_HOME=${_home}/.rustup")
  else
    mkdir -p "${_src_tmp}/cargo-home"
    chown "${_uid}:${_gid}" "${_src_tmp}/cargo-home"
    _build_env+=("CARGO_HOME=${_src_tmp}/cargo-home")
  fi
  if [[ -n "${LIBCLANG_PATH:-}" ]]; then
    _build_env+=("LIBCLANG_PATH=${LIBCLANG_PATH}")
  elif [[ -d "/usr/${_libdir}" ]] && compgen -G "/usr/${_libdir}/libclang.so*" >/dev/null; then
    _build_env+=("LIBCLANG_PATH=/usr/${_libdir}")
  fi

  log "   → Meson 빌드 구성 (사용자: ${_user}, libdir=${_libdir})..."
  run_as_target_user "$_user" "$_home" env "${_build_env[@]}" \
    "$_meson_bin" setup "$_build_dir" "$_src_dir" \
    --prefix=/usr \
    --sysconfdir=/etc \
    --libdir="$_libdir" \
    --buildtype=release \
    -Dcargo_profile=release \
    -Dinstall_headers=true \
    -Dinstall_docs=true \
    || err "kime Meson 구성(meson setup)에 실패했습니다. 빌드 로그를 확인하세요."

  log "   → kime 컴파일 중 (Rust + C/C++, 수 분 소요될 수 있음)..."
  run_as_target_user "$_user" "$_home" env "${_build_env[@]}" \
    "$_ninja_bin" -C "$_build_dir" \
    || err "kime 소스 빌드(ninja)에 실패했습니다."

  log "   → 빌드된 kime 시스템 설치 (meson install --no-rebuild)..."
  "$_meson_bin" install -C "$_build_dir" --no-rebuild \
    || err "kime 설치(meson install)에 실패했습니다."

  ldconfig 2>/dev/null || true
  if command -v gtk-query-immodules-3.0-64 >/dev/null 2>&1; then
    gtk-query-immodules-3.0-64 --update-cache 2>/dev/null || true
  elif command -v gtk-query-immodules-3.0 >/dev/null 2>&1; then
    gtk-query-immodules-3.0 --update-cache 2>/dev/null || true
  fi
  if [[ -d "/usr/${_libdir}/gtk-4.0/4.0.0/immodules" ]]; then
    if command -v gio-querymodules-64 >/dev/null 2>&1; then
      gio-querymodules-64 "/usr/${_libdir}/gtk-4.0/4.0.0/immodules" 2>/dev/null || true
    elif command -v gio-querymodules >/dev/null 2>&1; then
      gio-querymodules "/usr/${_libdir}/gtk-4.0/4.0.0/immodules" 2>/dev/null || true
    fi
  fi
  if command -v gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache -q /usr/share/icons/hicolor 2>/dev/null || true
  fi
  if command -v restorecon >/dev/null 2>&1; then
    local -a _rc_paths=()
    local _rc_p
    for _rc_p in \
      /usr/bin/kime /usr/bin/kime-check /usr/bin/kime-indicator \
      /usr/bin/kime-candidate-window /usr/bin/kime-xim /usr/bin/kime-wayland \
      /usr/bin/kime-xdg-autostart \
      "/usr/${_libdir}/libkime_engine.so" \
      "/usr/${_libdir}/gtk-3.0/3.0.0/immodules" \
      "/usr/${_libdir}/gtk-4.0/4.0.0/immodules" \
      "/usr/${_libdir}/qt5/plugins/platforminputcontexts" \
      "/usr/${_libdir}/qt6/plugins/platforminputcontexts" \
      /etc/xdg/autostart/kime.desktop \
      /usr/share/applications/kime.desktop \
      /usr/share/icons/hicolor/64x64/apps; do
      [[ -e "$_rc_p" ]] && _rc_paths+=("$_rc_p")
    done
    if [[ ${#_rc_paths[@]} -gt 0 ]]; then
      restorecon -RF "${_rc_paths[@]}" 2>/dev/null || true
    fi
  fi

  cleanup_kime_src_tmp
  trap - EXIT
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

  local _kime_family _kime_arch_installed="false" _kime_rhel_installed="false" _pkg_summary="" _extra_warn=""
  local _deb_arch="" _deb_target="" _kime_tag="" _deb_url="" _deb_avail="" _deb_name=""
  _kime_family=$(detect_kime_family "$_os_id" "$_os_like")

  case "$_kime_family" in
    arch)
      if ! command -v pacman >/dev/null 2>&1; then
        err "pacman을 찾을 수 없습니다. Arch 계열 배포판에서만 실행할 수 있습니다."
      fi
      local _arch_m
      _arch_m=$(uname -m)
      if [[ "$_arch_m" != "x86_64" ]]; then
        err "AUR kime 패키지는 x86_64 아키텍처만 지원합니다 (현재: $_arch_m). 수동 빌드: https://github.com/Riey/kime"
      fi
      if pacman -T kime >/dev/null 2>&1 && command -v kime >/dev/null 2>&1; then
        _kime_arch_installed="true"
        _pkg_summary="   - AUR (kime): 이미 설치됨 ($(kime --version 2>/dev/null | head -n1 || echo installed)) — 빌드·설치 건너뜀 (설정만 적용)"
      else
        _pkg_summary="   - 누락된 빌드 도구(base-devel, git) 또는 AUR 의존성이 있을 경우 pacman -Syu --needed --noconfirm 실행 (부분 업그레이드 방지)\n   - AUR (kime): 일반 사용자($USER) 권한으로 git clone 및 makepkg 빌드 (sudo 재호출 없음)\n   - pacman -U --noconfirm kime-*.pkg.tar.* (root, paru/yay 호환 — 별도 AUR 헬퍼 불필요)"
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
    rhel)
      if [[ -e /run/ostree-booted ]]; then
        err "불변형 EL/Atomic 환경에서는 dnf 소스 자동 빌드를 지원하지 않습니다. 수동 확인: https://github.com/Riey/kime"
      fi
      if ! command -v dnf >/dev/null 2>&1; then
        err "dnf를 찾을 수 없습니다. RHEL/Rocky/AlmaLinux 계열에서만 실행할 수 있습니다."
      fi
      if [[ "${KIME_FORCE_REBUILD:-0}" != "1" ]] && command -v kime >/dev/null 2>&1 && command -v kime-wayland >/dev/null 2>&1 && [[ -f /usr/share/applications/kime.desktop ]]; then
        _kime_rhel_installed="true"
        _pkg_summary="   - kime (EL 소스 빌드): 이미 설치됨 ($(kime --version 2>/dev/null | head -n1 || echo installed)) — 빌드·설치 건너뜀 (설정만 적용)"
      else
        _kime_tag=$(resolve_kime_latest_tag)
        if [[ -z "$_kime_tag" ]]; then
          err "Riey/kime 최신 릴리스 버전을 조회하지 못했습니다. 네트워크 연결을 확인하거나 수동 빌드를 진행하세요: https://github.com/Riey/kime"
        fi
        _pkg_summary="   - CRB(CodeReady Builder) 저장소 활성화 (미활성화 시) 및 빌드 의존성 설치 (dnf: gcc-c++, clang-devel, meson, ninja-build, rust, cargo, dbus/xcb/wayland/xkbcommon/fontconfig/freetype-devel)\n   - 사용 가능한 GUI 프론트엔드 개발 패키지(gtk3-devel, gtk4-devel, qt6-qtbase-devel, qt6-qtbase-private-devel 등) 및 Noto CJK 폰트 설치\n   - Riey/kime (${_kime_tag}) 소스 다운로드 후 일반 사용자(${USER}) 권한으로 /var/tmp 에서 Meson/Cargo 릴리스 빌드\n   - /usr 설치 (meson install --no-rebuild) 및 ldconfig / GTK immodule 캐시 갱신 (임시 빌드 디렉터리 자동 정리)"
        _extra_warn=" ⚠️  참고: RHEL/Rocky/AlmaLinux 등 EL 계열은 공식 저장소 및 Fedora COPR에 kime 패키지가 없어 소스를 직접 컴파일합니다 (CPU/네트워크 환경에 따라 수 분 소요, 임시 빌드 파일은 설치 후 자동 삭제)."
      fi
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

  local _kde_will _kde6_wayland _cfg_summary
  _kde_will=$(will_configure_kde "false" "$TARGET_HOME" "$DESKTOP")
  _kde6_wayland=$(is_kde6_wayland "$_kde_will" "$SESSION_TYPE" "$DESKTOP")
  if [[ "$_kde6_wayland" == "true" ]]; then
    _cfg_summary="   - $TARGET_HOME/.config/environment.d/kime.conf (KDE Plasma 6 Wayland 안전 모드: QT_IM_MODULES=\"wayland;kime\", XMODIFIERS=@im=kime — 전역 QT_IM_MODULE/GTK_IM_MODULE 미설정)"
    if [[ "$_kime_family" == "debian" ]]; then
      _cfg_summary="${_cfg_summary}\n   - im-config -n none (Plasma 6 Wayland 전역 QT_IM_MODULE 충돌 방지)"
      _cfg_summary="${_cfg_summary}\n   - $TARGET_HOME/.xsessionrc (X11 세션 폴백)"
    else
      _cfg_summary="${_cfg_summary}\n   - $TARGET_HOME/.xprofile (X11 세션 호환)"
    fi
  else
    _cfg_summary="   - $TARGET_HOME/.config/environment.d/kime.conf, /etc/environment"
    if [[ "$_kime_family" == "debian" ]]; then
      _cfg_summary="${_cfg_summary}\n   - im-config -n kime (im-config 사용 가능 시)"
    else
      _cfg_summary="${_cfg_summary}\n   - ~/.bash_profile (또는 ~/.zprofile / ~/.profile), $TARGET_HOME/.xprofile"
    fi
  fi
  _cfg_summary="${_cfg_summary}\n   - /etc/xdg/autostart/kime.desktop 확인 (없을 경우 $TARGET_HOME/.config/autostart/kime.desktop 생성)"
  if [[ "$_kde_will" == "true" ]]; then
    _cfg_summary="${_cfg_summary}\n   - KDE Plasma 가상 키보드 설정: $TARGET_HOME/.config/kwinrc ([Wayland] InputMethod=/usr/share/applications/kime.desktop)"
  fi
  _cfg_summary="${_cfg_summary}\n   - 첫 로그인 1회 안내 팝업 등록 ($TARGET_HOME/.local/bin/hangul-first-login-guide.sh)"

  _extra_warn=$(append_conflict_ime_warn "kime" "$EXISTING_IME" "$_extra_warn" "$DESKTOP")
  if [[ "${DESKTOP,,}" == *"gnome"* && "$SESSION_TYPE" == "wayland" ]]; then
    local _gnome_warn=" ⚠️  참고: GNOME Wayland(Mutter)는 zwp_input_method_v2를 지원하지 않아 Wayland 네이티브/샌드박스 앱에서 kime 동작이 제한될 수 있습니다 (GTK/Qt IM 모듈 앱은 정상 동작, 참고: https://github.com/Riey/kime/issues/422)."
    if [[ -n "$_extra_warn" ]]; then
      _extra_warn="${_extra_warn}\n${_gnome_warn}"
    else
      _extra_warn="$_gnome_warn"
    fi
  fi

  confirm_before_changes \
    "kime (Rust 기반 경량 입력기) Debian / Ubuntu / Mint (.deb) (kime)" \
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== kime (Rust 기반 경량 입력기) Debian / Ubuntu / Mint (.deb) kime 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME (family=$_kime_family, id=${_os_id:-unknown})"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. 배포판별 설치
  case "$_kime_family" in
    arch)
      if [[ "$_kime_arch_installed" == "true" ]]; then
        log "[1/3] 이미 kime이 설치되어 있어 AUR 빌드를 건너뜁니다."
      else
        log "[1/3] kime 설치 (Arch AUR: root 의존성/설치 + 일반 사용자 makepkg 빌드)..."
        install_kime_aur_arch "$USER" "$TARGET_HOME" "$TARGET_UID"
      fi
      ;;
    fedora)
      log "[1/3] kime 설치 (Fedora COPR)..."
      if ! dnf copr --help >/dev/null 2>&1; then
        dnf install -y 'dnf-command(copr)' </dev/null
      fi
      dnf copr enable -y toroidalfox/kime </dev/null
      dnf install -y kime </dev/null
      ;;
    rhel)
      if [[ "$_kime_rhel_installed" == "true" ]]; then
        log "[1/3] 이미 kime이 설치되어 있어 소스 빌드를 건너뜁니다."
      else
        log "[1/3] kime 설치 (EL 소스 빌드: Riey/kime ${_kime_tag})..."
        install_kime_source_rhel "$USER" "$TARGET_HOME" "$TARGET_UID" "$_kime_tag"
      fi
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
  local _use_kde6_wl_env="false"
  if [[ "$_kde6_wayland" == "true" && -f /usr/share/applications/kime.desktop ]]; then
    _use_kde6_wl_env="true"
  fi
  if [[ "$_use_kde6_wl_env" == "true" ]]; then
    cat > "$ENV_FILE" <<'EOF'
# KDE Plasma 6 Wayland: KWin 가상 키보드(text-input-v3) 네이티브 경로 사용
# 전역 QT_IM_MODULE/GTK_IM_MODULE 강제는 Qt6 ABI(Qt_6_PRIVATE_API) 불일치 크래시 및
# KWin Wayland 입력 충돌 위험이 있어 설정하지 않습니다 (Qt 6.7+ XWayland 폴백 유지).
QT_IM_MODULES="wayland;kime"
XMODIFIERS=@im=kime
EOF
    chown -R "$TARGET_UID:$TARGET_GID" "$(dirname "$ENV_FILE")"

    local _etc_kime_re="^[[:space:]]*(GTK|QT)_IM_MODULE=['\"]?kime['\"]?[[:space:]]*(#.*)?$"
    if [[ -f /etc/environment && -w /etc/environment ]] && grep -qE "$_etc_kime_re" /etc/environment 2>/dev/null; then
      grep -Ev "$_etc_kime_re" /etc/environment > /etc/environment.tmp || true
      cat /etc/environment.tmp > /etc/environment
      rm -f /etc/environment.tmp
    fi
  else
    cat > "$ENV_FILE" <<'EOF'
GTK_IM_MODULE=kime
QT_IM_MODULE=kime
XMODIFIERS=@im=kime
EOF
    chown -R "$TARGET_UID:$TARGET_GID" "$(dirname "$ENV_FILE")"

    if [[ -w /etc/environment || ( ! -e /etc/environment && -w /etc ) ]]; then
      local _etc_header_added=false _etc_pair _env_k _env_v
      for _etc_pair in "GTK_IM_MODULE=kime" "QT_IM_MODULE=kime" "XMODIFIERS=@im=kime"; do
        _env_k="${_etc_pair%%=*}"
        _env_v="${_etc_pair#*=}"
        if ! grep -qE "^[[:space:]]*${_env_k}=['\"]?${_env_v}['\"]?[[:space:]]*(#.*)?$" /etc/environment 2>/dev/null; then
          if [[ "$_etc_header_added" != "true" ]]; then
            if [[ -s /etc/environment ]]; then
              [[ -n "$(tail -c 1 /etc/environment 2>/dev/null | tr -d '\n')" ]] && printf '\n' >> /etc/environment
              printf '\n# kime 환경변수\n' >> /etc/environment
            else
              printf '# kime 환경변수\n' >> /etc/environment
            fi
            _etc_header_added=true
          fi
          printf '%s\n' "$_etc_pair" >> /etc/environment
        fi
      done
    fi
  fi

  local KIME_CFG="$TARGET_HOME/.config/kime/config.yaml"
  if [[ ! -f "$KIME_CFG" ]]; then
    mkdir -p "$(dirname "$KIME_CFG")"
    cat > "$KIME_CFG" <<'KIMECFG'
engine:
  default_category: Latin
  global_category_state: false
  global_hotkeys:
    M-C-Backslash:
      behavior: !Mode Math
      result: ConsumeIfProcessed
    M-C-E:
      behavior: !Mode Emoji
      result: ConsumeIfProcessed
    Esc:
      behavior: !Switch Latin
      result: Bypass
    C-Space:
      behavior: !Toggle
      - Hangul
      - Latin
      result: Consume
    Muhenkan:
      behavior: !Toggle
      - Hangul
      - Latin
      result: Consume
    AltR:
      behavior: !Toggle
      - Hangul
      - Latin
      result: Consume
    Hangul:
      behavior: !Toggle
      - Hangul
      - Latin
      result: Consume
  category_hotkeys:
    Hangul:
      ControlR:
        behavior: !Mode Hanja
        result: Consume
      HangulHanja:
        behavior: !Mode Hanja
        result: Consume
      F9:
        behavior: !Mode Hanja
        result: ConsumeIfProcessed
  mode_hotkeys:
    Math:
      Enter:
        behavior: Commit
        result: ConsumeIfProcessed
      Tab:
        behavior: Commit
        result: ConsumeIfProcessed
    Hanja:
      Enter:
        behavior: Commit
        result: ConsumeIfProcessed
      Tab:
        behavior: Commit
        result: ConsumeIfProcessed
    Emoji:
      Enter:
        behavior: Commit
        result: ConsumeIfProcessed
      Tab:
        behavior: Commit
        result: ConsumeIfProcessed
KIMECFG
    chown -R "$TARGET_UID:$TARGET_GID" "$(dirname "$KIME_CFG")"
  fi

  if [[ "$_use_kde6_wl_env" == "true" ]]; then
    if [[ "$_kime_family" == "debian" ]]; then
      if command -v im-config >/dev/null 2>&1; then
        run_as_user_sh "$USER" "im-config -n none" 2>/dev/null || true
      fi
      local XSESSION_FILE="$TARGET_HOME/.xsessionrc"
      if ! grep -q "GTK_IM_MODULE=kime" "$XSESSION_FILE" 2>/dev/null; then
        cat >> "$XSESSION_FILE" <<'EOF'

# kime 환경변수 (X11 세션 폴백)
export GTK_IM_MODULE=kime
export QT_IM_MODULE=kime
export XMODIFIERS=@im=kime
EOF
        chown "$TARGET_UID:$TARGET_GID" "$XSESSION_FILE"
      fi
    else
      local XPROFILE_FILE="$TARGET_HOME/.xprofile"
      if ! grep -q "GTK_IM_MODULE=kime" "$XPROFILE_FILE" 2>/dev/null; then
        cat >> "$XPROFILE_FILE" <<'EOF'

# kime 환경변수 (X11 / Non-systemd 세션 호환)
export GTK_IM_MODULE=kime
export QT_IM_MODULE=kime
export XMODIFIERS=@im=kime
EOF
        chown "$TARGET_UID:$TARGET_GID" "$XPROFILE_FILE"
      fi
    fi
  elif [[ "$_kime_family" == "debian" ]] && command -v im-config >/dev/null 2>&1 && [[ -f /usr/share/im-config/data/51_kime.rc ]]; then
    run_as_user_sh "$USER" "im-config -n kime" 2>/dev/null || warn "im-config -n kime 실패 (수동으로 입력기를 kime으로 선택하세요)"
  else
    local XPROFILE_FILE="$TARGET_HOME/.xprofile"
    if ! grep -q "GTK_IM_MODULE=kime" "$XPROFILE_FILE" 2>/dev/null; then
      cat >> "$XPROFILE_FILE" <<'EOF'

# kime 환경변수 (X11 / Non-systemd 세션 호환)
export GTK_IM_MODULE=kime
export QT_IM_MODULE=kime
export XMODIFIERS=@im=kime
EOF
      chown "$TARGET_UID:$TARGET_GID" "$XPROFILE_FILE"
    fi
    if [[ "$_kime_family" != "debian" ]]; then
      local _user_shell PROFILE_FILE
      _user_shell=$(getent passwd "$USER" 2>/dev/null | cut -d: -f7 || true)
      if [[ "$_user_shell" == */zsh ]]; then
        PROFILE_FILE="$TARGET_HOME/.zprofile"
      elif [[ -f "$TARGET_HOME/.bash_profile" || "$_user_shell" == */bash ]]; then
        PROFILE_FILE="$TARGET_HOME/.bash_profile"
      else
        PROFILE_FILE="$TARGET_HOME/.profile"
      fi
      if ! grep -q "GTK_IM_MODULE=kime" "$PROFILE_FILE" 2>/dev/null; then
        cat >> "$PROFILE_FILE" <<'EOF'

# kime 환경변수
export GTK_IM_MODULE=kime
export QT_IM_MODULE=kime
export XMODIFIERS=@im=kime
EOF
        chown "$TARGET_UID:$TARGET_GID" "$PROFILE_FILE"
      fi
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
    chown -R "$TARGET_UID:$TARGET_GID" "$ADIR"
    ok "자동시작 등록 ($_kime_exec)"
  fi
  if command -v systemctl >/dev/null 2>&1 && [[ -S "/run/user/$TARGET_UID/bus" ]]; then
    run_as_user_sh "$USER" 'systemctl --user daemon-reload 2>/dev/null || true' || true
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

⌨️  전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space
🖥️  KDE Wayland: 가상 키보드(kime 데몬) 선택 및 안전 환경변수 적용 (kime-check의 QT_IM_MODULE/GTK_IM_MODULE 경고는 정상)
⚙️  설정: ~/.config/kime/config.yaml (샘플: /usr/share/doc/kime/default_config.yaml)
🩺 진단: kime-check
📝 로그: /var/log/install-kime-kime-debian.log

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
  echo " 🎉 kime 설치 완료! 재부팅(권장) 또는 로그아웃 후 다시 로그인하세요."
  echo " KDE Wayland: 시스템 설정 → 입력 및 출력 → 키보드 → 가상 키보드 → kime 데몬 선택"
  if [[ "$_kde6_wayland" == "true" ]]; then
    echo "              (안전 모드 적용됨: KWin 가상 키보드 사용을 위해 전역 QT_IM_MODULE/GTK_IM_MODULE 미설정 — kime-check 경고가 떠도 정상)"
  fi
  echo " GNOME Wayland: 재로그인·재부팅 후 kime-check 로 GTK_IM_MODULE/QT_IM_MODULE 적용 확인 (Mutter 한계로 GTK/Qt IM 모듈 앱 위주 동작)"
  echo " 전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space"
  echo " 진단: kime-check | 설정: ~/.config/kime/config.yaml (샘플: /usr/share/doc/kime/default_config.yaml)"
  echo " 로그: $LOG_FILE"
  echo "============================================================"
}
main "$@"
