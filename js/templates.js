if (typeof GITHUB_REPO === "undefined" && typeof require === "function") {
  global.GITHUB_REPO = require("./data.js").GITHUB_REPO;
}

// ──────────────────────────────────────────────────────────────
// 스크립트 템플릿 (배포판별 핵심 로직)
// ──────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
// 재부팅/재로그인 후 1회성 안내 팝업 자폭 스크립트 스니펫
// ──────────────────────────────────────────────────────────────
const POST_LOGIN_GUIDE_SNIPPET = (distroName, isKde = false) => `
  # 재부팅/재로그인 후 1회성 안내 팝업 자동시작 등록 (표시 후 자폭)
  local GUIDE_DIR="$TARGET_HOME/.local/bin"
  local GUIDE_BIN="$GUIDE_DIR/hangul-first-login-guide.sh"
  local GUIDE_DESK="$TARGET_HOME/.config/autostart/hangul-first-login-guide.desktop"
  mkdir -p "$TARGET_HOME/.config/autostart" "$GUIDE_DIR"

  cat > "$GUIDE_BIN" <<'GUIDE_EOF'
#!/usr/bin/env bash
sleep 2
TITLE="리눅스 한글 입력기 안내"
MSG="🎉 ${distroName} 한글 입력기 설정이 완료되었습니다!

${isKde ? "🖥️  KDE Plasma 가상 키보드(Fcitx 5) 자동 설정됨 (미적용 시: 시스템 설정 → 입력 장치 → 가상 키보드 확인)\n\n" : ""}⌨️  전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space
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
`;

const KIME_POST_LOGIN_GUIDE_SNIPPET = (distroName, scriptId) => `
  # 재부팅/재로그인 후 1회성 안내 팝업 자동시작 등록 (표시 후 자폭)
  local GUIDE_DIR="$TARGET_HOME/.local/bin"
  local GUIDE_BIN="$GUIDE_DIR/hangul-first-login-guide.sh"
  local GUIDE_DESK="$TARGET_HOME/.config/autostart/hangul-first-login-guide.desktop"
  mkdir -p "$TARGET_HOME/.config/autostart" "$GUIDE_DIR"

  cat > "$GUIDE_BIN" <<'GUIDE_EOF'
#!/usr/bin/env bash
sleep 2
TITLE="리눅스 한글 입력기 안내"
MSG="🎉 ${distroName} 한글 입력기 설정이 완료되었습니다!

⌨️  전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space
🖥️  KDE Wayland: 가상 키보드(kime 데몬) 선택 및 안전 환경변수 적용 (kime-check의 QT_IM_MODULE/GTK_IM_MODULE 경고는 정상)
⚙️  설정: ~/.config/kime/config.yaml (샘플: /usr/share/doc/kime/default_config.yaml)
🩺 진단: kime-check
📝 로그: /var/log/install-kime-${scriptId}.log

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
`;

const IBUS_POST_LOGIN_GUIDE_SNIPPET = (distroName, scriptId) => `
  # 재부팅/재로그인 후 1회성 안내 팝업 자동시작 등록 (표시 후 자폭)
  local GUIDE_DIR="$TARGET_HOME/.local/bin"
  local GUIDE_BIN="$GUIDE_DIR/hangul-first-login-guide.sh"
  local GUIDE_DESK="$TARGET_HOME/.config/autostart/hangul-first-login-guide.desktop"
  mkdir -p "$TARGET_HOME/.config/autostart" "$GUIDE_DIR"

  cat > "$GUIDE_BIN" <<'GUIDE_EOF'
#!/usr/bin/env bash
sleep 2
TITLE="리눅스 한글 입력기 안내"
MSG="🎉 ${distroName} 한글 입력기(ibus-hangul) 설정이 완료되었습니다!

⌨️  전환: Ctrl+Space 또는 한/영 키
⚙️  설정: ibus-setup (GNOME: 설정 → 키보드 → 입력 소스)
📝 로그: /var/log/install-ibus-${scriptId}.log

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
`;

const FCITX5_POST_LOGIN_GUIDE_SNIPPET = (distroName, scriptId) => `
  # 재부팅/재로그인 후 1회성 안내 팝업 자동시작 등록 (표시 후 자폭)
  local GUIDE_DIR="$TARGET_HOME/.local/bin"
  local GUIDE_BIN="$GUIDE_DIR/hangul-first-login-guide.sh"
  local GUIDE_DESK="$TARGET_HOME/.config/autostart/hangul-first-login-guide.desktop"
  local _guide_kde_tip=""
  if [[ "\${_kde_will:-false}" == "true" ]]; then
    _guide_kde_tip="🖥️  KDE Plasma 가상 키보드(Fcitx 5) 자동 설정됨 (미적용 시: 시스템 설정 → 입력 장치 → 가상 키보드 확인)"
  fi
  mkdir -p "$TARGET_HOME/.config/autostart" "$GUIDE_DIR"

  {
    cat <<'GUIDE_HEAD_EOF'
#!/usr/bin/env bash
sleep 2
TITLE="리눅스 한글 입력기 안내"
GUIDE_HEAD_EOF
    if [[ -n "$_guide_kde_tip" ]]; then
      printf 'MSG="🎉 %s 한글 입력기(fcitx5-hangul) 설정이 완료되었습니다!\\n\\n%s\\n\\n⌨️  전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space\\n💡 영문 키보드 사용 시: fcitx5-configtool 에서 오른쪽 Alt(Alt_R) 등록 가능\\n⚙️  설정: fcitx5-configtool | 진단: fcitx5-diagnose\\n📝 로그: %s\\n\\n(💡 이 안내창은 재부팅 후 1회만 표시되며 자동으로 삭제됩니다.)"\\n' \\
        "${distroName}" "$_guide_kde_tip" "/var/log/install-hangul-${scriptId}.log"
    else
      printf 'MSG="🎉 %s 한글 입력기(fcitx5-hangul) 설정이 완료되었습니다!\\n\\n⌨️  전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space\\n💡 영문 키보드 사용 시: fcitx5-configtool 에서 오른쪽 Alt(Alt_R) 등록 가능\\n⚙️  설정: fcitx5-configtool | 진단: fcitx5-diagnose\\n📝 로그: %s\\n\\n(💡 이 안내창은 재부팅 후 1회만 표시되며 자동으로 삭제됩니다.)"\\n' \\
        "${distroName}" "/var/log/install-hangul-${scriptId}.log"
    fi
    cat <<'GUIDE_TAIL_EOF'

if command -v kdialog >/dev/null 2>&1; then
  kdialog --title "$TITLE" --msgbox "$MSG" 2>/dev/null
elif command -v zenity >/dev/null 2>&1; then
  zenity --info --title="$TITLE" --text="$MSG" --width=480 2>/dev/null
elif command -v notify-send >/dev/null 2>&1; then
  notify-send -u critical -t 20000 "$TITLE" "$MSG" 2>/dev/null
fi
rm -f "$HOME/.config/autostart/hangul-first-login-guide.desktop"
rm -f "$0"
GUIDE_TAIL_EOF
  } > "$GUIDE_BIN"
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
`;

// ──────────────────────────────────────────────────────────────
// KDE Plasma 가상 키보드(Fcitx 5) 자동 설정 스니펫 (~/.config/kwinrc)
// ──────────────────────────────────────────────────────────────
const KDE_VIRTUAL_KEYBOARD_SNIPPET = (forceKde = false) => `
  # KDE Plasma 가상 키보드(Fcitx 5) 자동 설정
  local _kde_detected=${forceKde ? "true" : "false"}
  if [[ "\${DESKTOP:-}" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]] || \\
     [[ "\${XDG_CURRENT_DESKTOP:-}" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]] || \\
     { [[ -z "\${DESKTOP:-}" || "\${DESKTOP:-}" == "unknown" ]] && { command -v plasmashell >/dev/null 2>&1 || command -v kwin_wayland >/dev/null 2>&1 || command -v kwriteconfig6 >/dev/null 2>&1 || command -v kwriteconfig5 >/dev/null 2>&1 || [[ -f "$TARGET_HOME/.config/kwinrc" ]]; }; }; then
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
        /^\\[Wayland\\]$/ { in_wayland=1; found_wayland=1; print; next }
        /^\\[/ {
          if (in_wayland && !updated) { print "InputMethod=" im; updated=1 }
          in_wayland=0; print; next
        }
        in_wayland && /^InputMethod(\\[\\$e\\])?=/ {
          if (!updated) { print "InputMethod=" im; updated=1 }
          next
        }
        { print }
        END {
          if (in_wayland && !updated) { print "InputMethod=" im }
          else if (!found_wayland) { print ""; print "[Wayland]"; print "InputMethod=" im }
        }
      ' "$_kwinrc" > "\${_kwinrc}.tmp" && mv "\${_kwinrc}.tmp" "$_kwinrc"
    else
      printf '[Wayland]\\nInputMethod=%s\\n' "$_fcitx5_desktop" > "$_kwinrc"
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
        sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_kde_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_kde_uid/bus" \\
          "$_qdbus" org.kde.KWin /KWin reconfigure 2>/dev/null || true
      fi
    fi
    ok "KDE Plasma 가상 키보드(Fcitx 5) 자동 설정 완료 ($_fcitx5_desktop)"
  fi
`;

// ──────────────────────────────────────────────────────────────
// 설치 전 시스템 조사 + 변경 내역 경고 + 사용자 확인([y/N]) 공통 스니펫
// ──────────────────────────────────────────────────────────────
const PREFLIGHT_COMMON_BASH = `
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
      echo "\${PRETTY_NAME:-\${NAME:-Unknown Linux}}"
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
    local -a _envs=("HOME=\${_home:-/tmp}" "USER=$_u" "LOGNAME=$_u")
    if [[ -n "$_uid" && -d "/run/user/$_uid" ]]; then
      _envs+=("XDG_RUNTIME_DIR=/run/user/$_uid")
      [[ -S "/run/user/$_uid/bus" ]] && _envs+=("DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$_uid/bus")
    fi
    runuser -u "$_u" -- env "\${_envs[@]}" /bin/sh -c "$_cmd" </dev/null
  else
    [[ -n "$_uid" && -d "/run/user/$_uid" ]] && _pre="export XDG_RUNTIME_DIR='/run/user/$_uid'; "
    [[ -n "$_uid" && -S "/run/user/$_uid/bus" ]] && _pre="\${_pre}export DBUS_SESSION_BUS_ADDRESS='unix:path=/run/user/$_uid/bus'; "
    su -s /bin/sh "$_u" -c "\${_pre}\${_cmd}" </dev/null
  fi
}

run_user_gsettings() {
  local _u="$1" _uid="$2" _home="$3"
  shift 3
  command -v gsettings >/dev/null 2>&1 || return 1
  local -a _envs=("HOME=\${_home:-/tmp}" "USER=$_u" "LOGNAME=$_u")
  if [[ -n "$_uid" && -d "/run/user/$_uid" ]]; then
    _envs+=("XDG_RUNTIME_DIR=/run/user/$_uid")
    [[ -S "/run/user/$_uid/bus" ]] && _envs+=("DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$_uid/bus")
  fi
  local -a _cmd=(gsettings "$@")
  if [[ -z "$_uid" || ! -S "/run/user/$_uid/bus" ]] && [[ "\${1:-}" == "set" || "\${1:-}" == "reset" ]] && command -v dbus-run-session >/dev/null 2>&1; then
    _cmd=(dbus-run-session -- gsettings "$@")
  fi
  if command -v runuser >/dev/null 2>&1; then
    runuser -u "$_u" -- env "\${_envs[@]}" "\${_cmd[@]}" </dev/null
  elif command -v sudo >/dev/null 2>&1; then
    sudo -u "$_u" env "\${_envs[@]}" "\${_cmd[@]}" </dev/null
  else
    local _q_cmd="" _item _esc
    for _item in "\${_envs[@]}" "\${_cmd[@]}"; do
      _esc=$(printf '%s' "$_item" | sed "s/'/'\\\\\\\\''/g")
      _q_cmd="\${_q_cmd:+\${_q_cmd} }'\${_esc}'"
    done
    su -s /bin/sh "$_u" -c "env $_q_cmd" </dev/null
  fi
}

proc_running() {
  local _uid="$1" _proc="$2"
  command -v pgrep >/dev/null 2>&1 || return 1
  if [[ \${#_proc} -gt 15 ]]; then
    pgrep -u "$_uid" -f "(^|/)\${_proc}([[:space:]]|$)" >/dev/null 2>&1
  else
    pgrep -u "$_uid" -x "$_proc" >/dev/null 2>&1
  fi
}

proc_kill() {
  local _uid="$1" _proc="$2" _sig="\${3:-}"
  command -v pkill >/dev/null 2>&1 || return 0
  if [[ \${#_proc} -gt 15 ]]; then
    pkill \${_sig:+"$_sig"} -u "$_uid" -f "(^|/)\${_proc}([[:space:]]|$)" 2>/dev/null || true
  else
    pkill \${_sig:+"$_sig"} -u "$_uid" -x "$_proc" 2>/dev/null || true
  fi
}

detect_desktop() {
  local _u="$1" _uid _d _env_out _sid
  _d="\${XDG_CURRENT_DESKTOP:-}"
  [[ -n "$_d" ]] && { echo "$_d"; return; }
  _uid=$(id -u "$_u" 2>/dev/null || echo "")
  if [[ -n "$_uid" && -S "/run/user/$_uid/bus" ]] && command -v systemctl >/dev/null 2>&1; then
    _env_out=$(run_as_user_sh "$_u" 'systemctl --user show-environment 2>/dev/null' || true)
    _d=$(printf '%s\\n' "$_env_out" | sed -n 's/^XDG_CURRENT_DESKTOP=//p' | head -n 1 || true)
    [[ -n "$_d" ]] && { echo "$_d"; return; }
    _d=$(printf '%s\\n' "$_env_out" | sed -n 's/^DESKTOP_SESSION=//p' | head -n 1 || true)
    [[ -n "$_d" ]] && { echo "$_d"; return; }
  fi
  if command -v loginctl >/dev/null 2>&1; then
    for _sid in $(loginctl list-sessions --no-legend 2>/dev/null | awk -v u="$_u" '$3==u {print $1}' || true); do
      _d=$(loginctl show-session "$_sid" -p Desktop --value 2>/dev/null || true)
      [[ -n "$_d" ]] && { echo "$_d"; return; }
    done
  fi
  _d=$(run_as_user_sh "$_u" 'printf "%s\\n" "\${XDG_CURRENT_DESKTOP:-\${DESKTOP_SESSION:-}}"' 2>/dev/null | head -n 1 || true)
  [[ -n "$_d" ]] && { echo "$_d"; return; }
  echo "unknown"
}

detect_session_type() {
  local _u="$1"
  local _uid="$2"
  local _st="\${XDG_SESSION_TYPE:-}"
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
  if ls "/run/user/$_uid"/wayland-* >/dev/null 2>&1 || [[ -n "\${WAYLAND_DISPLAY:-}" ]]; then
    echo "wayland"; return
  fi
  if [[ -n "\${DISPLAY:-}" ]]; then
    echo "x11"; return
  fi
  echo "unknown"
}

detect_existing_ime() {
  local _uid="$1"
  local _desktop="\${2:-}"
  local _is_gnome=false
  [[ "\${_desktop,,}" == *"gnome"* ]] && _is_gnome=true
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
  if [[ \${#_found[@]} -eq 0 ]]; then
    echo "감지된 입력기 없음"
  else
    local _out="" _item
    for _item in "\${_found[@]}"; do
      _out="\${_out:+$_out, }$_item"
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
  local _base="\${3:-}"
  local _desktop="\${4:-}"
  local _w=""
  if has_conflicting_ime "$_target_ime" "$_existing_ime"; then
    _w=" ⚠️  참고: 기존 입력기(\${_existing_ime})가 감지되었습니다. 기존 입력기가 새 입력기와 충돌할 수 있으므로 기존 입력기 설정(자동시작·서비스·환경변수)을 자동으로 비활성화하겠습니다."
    if [[ "$_target_ime" != "ibus" && "\${_desktop,,}" == *"gnome"* && "$_existing_ime" == *"ibus-daemon"* ]]; then
      _w="\${_w}\\n ℹ️  GNOME 안내: ibus-daemon 자체는 GNOME Shell 기본 기능(이모지·화상키보드·Wayland 입력) 유지를 위해 종료·차단하지 않으며, ibus-hangul 입력 소스·엔진·환경변수·단축키 충돌만 비활성화합니다."
    fi
  fi
  if [[ -n "$_base" && -n "$_w" ]]; then
    printf '%s\\n%s' "$_base" "$_w"
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
  [[ "\${_desktop,,}" == *"gnome"* ]] && _is_gnome=true

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
  for _td in "\${_target_desktops[@]}"; do
    if [[ -f "$_autostart_dir/$_td" ]] && grep -q '^Hidden=true$' "$_autostart_dir/$_td" 2>/dev/null; then
      rm -f "$_autostart_dir/$_td"
      _autostart_changed=true
    fi
    if [[ -f "$_autostart_dir/\${_td}.disabled" ]]; then
      mkdir -p "$_autostart_disabled_dir"
      mv -f "$_autostart_dir/\${_td}.disabled" "$_autostart_disabled_dir/$_td"
      chown "$_uid:$_gid" "$_autostart_disabled_dir" "$_autostart_disabled_dir/$_td" 2>/dev/null || true
      _autostart_changed=true
      _changed=true
    fi
  done

  local _svc
  if command -v systemctl >/dev/null 2>&1; then
    if [[ -S "/run/user/$_uid/bus" ]] && command -v sudo >/dev/null 2>&1; then
      local _bus="unix:path=/run/user/$_uid/bus"
      for _svc in "\${_svcs[@]}"; do
        if sudo -u "$_user" XDG_RUNTIME_DIR="/run/user/$_uid" DBUS_SESSION_BUS_ADDRESS="$_bus" \\
             systemctl --user is-enabled "$_svc" >/dev/null 2>&1 || \\
           sudo -u "$_user" XDG_RUNTIME_DIR="/run/user/$_uid" DBUS_SESSION_BUS_ADDRESS="$_bus" \\
             systemctl --user is-active "$_svc" >/dev/null 2>&1; then
          sudo -u "$_user" XDG_RUNTIME_DIR="/run/user/$_uid" DBUS_SESSION_BUS_ADDRESS="$_bus" \\
            systemctl --user disable --now "$_svc" 2>/dev/null || true
          _changed=true
        fi
      done
    else
      for _svc in "\${_svcs[@]}"; do
        if run_as_user_sh "$_user" "systemctl --user is-enabled $_svc >/dev/null 2>&1" 2>/dev/null; then
          run_as_user_sh "$_user" "systemctl --user disable $_svc 2>/dev/null || true" || true
          _changed=true
        fi
      done
    fi
  fi

  local _p
  for _p in "\${_procs[@]}"; do
    if proc_running "$_uid" "$_p"; then
      proc_kill "$_uid" "$_p"
      _changed=true
    fi
  done

  local _desk
  for _desk in "\${_desktops[@]}"; do
    if [[ -f "$_autostart_dir/\${_desk}.disabled" ]]; then
      mkdir -p "$_autostart_disabled_dir"
      mv -f "$_autostart_dir/\${_desk}.disabled" "$_autostart_disabled_dir/$_desk"
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
  for _econf in "\${_env_confs[@]}"; do
    if [[ -f "$_env_dir/\${_econf}.disabled" ]]; then
      mkdir -p "$_env_disabled_dir"
      mv -f "$_env_dir/\${_econf}.disabled" "$_env_disabled_dir/$_econf"
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

  local _env_line_re="^[[:space:]]*(export[[:space:]]+)?((GTK|QT|SDL|GLFW)_IM_MODULE=['\\"]?\${_im_re}['\\"]?|INPUT_METHOD=['\\"]?\${_im_re}['\\"]?|QT_IM_MODULES=('[^']*\${_im_re}[^']*'|\\"[^\\"]*\${_im_re}[^\\"]*\\"|[^[:space:]'\\";]*\${_im_re}[^[:space:]'\\";]*)|XMODIFIERS=['\\"]?@im=\${_im_re}['\\"]?)[[:space:]]*(#.*)?$"
  local _etc_env_line_re="^[[:space:]]*(export[[:space:]]+)?((GTK|QT|SDL|GLFW)_IM_MODULE=['\\"]?\${_im_re}['\\"]?|INPUT_METHOD=['\\"]?\${_im_re}['\\"]?|QT_IM_MODULES=('[^']*\${_im_re}[^']*'|\\"[^\\"]*\${_im_re}[^\\"]*\\"|[^[:space:]'\\"]*\${_im_re}[^[:space:]'\\"]*)|XMODIFIERS=['\\"]?@im=\${_im_re}['\\"]?)[[:space:]]*(#.*)?$"
  local _cmd_line_re="^[[:space:]]*((/usr(/local)?/bin/)?\${_cmd_re})([[:space:]]+(-[A-Za-z0-9_=-]+|>/dev/null|2>/dev/null|2>&1|&>/dev/null))*([[:space:]]*&)?[[:space:]]*(#.*)?$"
  local _ef
  for _ef in /etc/environment "$_home/.xsessionrc" "$_home/.xprofile" "$_home/.bash_profile" "$_home/.zprofile" "$_home/.profile"; do
    if [[ -f "$_ef" && -w "$_ef" ]]; then
      if [[ "$_ef" == "/etc/environment" ]]; then
        if grep -qE "$_etc_env_line_re" "$_ef" 2>/dev/null; then
          grep -Ev "$_etc_env_line_re" "$_ef" > "\${_ef}.tmp" || true
          cat "\${_ef}.tmp" > "$_ef"
          rm -f "\${_ef}.tmp"
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
            env_re = "^[ \\t]*(export[ \\t]+)?((GTK|QT|SDL|GLFW)_IM_MODULE=[\\047\\"]?" im_re "[\\047\\"]?|INPUT_METHOD=[\\047\\"]?" im_re "[\\047\\"]?|QT_IM_MODULES=(\\047[^\\047]*" im_re "[^\\047]*\\047|\\\"[^\\\"]*" im_re "[^\\\"]*\\\"|[^ \\t\\047\\\";]*" im_re "[^ \\t\\047\\\";]*)|XMODIFIERS=[\\047\\"]?@im=" im_re "[\\047\\"]?)[ \\t]*(#.*)?$"
            cmd_re_full = "^[ \\t]*((/usr(/local)?/bin/)?" cmd_re ")([ \\t]+(-[A-Za-z0-9_=-]+|>/dev/null|2>/dev/null|2>&1|&>/dev/null))*([ \\t]*&)?[ \\t]*(#.*)?$"
            mark = "^[ \\t]*:[ \\t]*#[ \\t]*korean_input: disabled conflicting IME([ \\t]+env)?[ \\t]*$"
            prev = 0
          }
          ($0 ~ env_re) || ($0 ~ cmd_re_full) {
            if (!prev) {
              match($0, /^[ \\t]*/)
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
        ' "$_ef" > "\${_ef}.tmp"; then
          if [[ "$_orig_valid" == "true" ]] && ! "$_chk_sh" -n "\${_ef}.tmp" >/dev/null 2>&1; then
            rm -f "\${_ef}.tmp"
            warn "셸 구문 검증 실패로 $_ef 자동 수정을 건너뜁니다 (수동 확인 필요)"
          else
            cat "\${_ef}.tmp" > "$_ef"
            rm -f "\${_ef}.tmp"
            chown "$_uid:$_gid" "$_ef" 2>/dev/null || true
            _changed=true
          fi
        else
          rm -f "\${_ef}.tmp"
        fi
      fi
    fi
  done

  local _kwinrc="$_home/.config/kwinrc"
  if [[ -f "$_kwinrc" ]] && grep -qE '^InputMethod(\\[\\$e\\])?=.*'"\${_kwin_re}" "$_kwinrc" 2>/dev/null; then
    if command -v kwriteconfig6 >/dev/null 2>&1; then
      kwriteconfig6 --file "$_kwinrc" --group Wayland --key InputMethod --delete 2>/dev/null || true
    elif command -v kwriteconfig5 >/dev/null 2>&1; then
      kwriteconfig5 --file "$_kwinrc" --group Wayland --key InputMethod --delete 2>/dev/null || true
    else
      awk '
        BEGIN { in_wayland=0 }
        /^\\[Wayland\\]$/ { in_wayland=1; print; next }
        /^\\[/ { in_wayland=0; print; next }
        in_wayland && /^InputMethod(\\[\\$e\\])?=/ { next }
        { print }
      ' "$_kwinrc" > "\${_kwinrc}.tmp" && cat "\${_kwinrc}.tmp" > "$_kwinrc" && rm -f "\${_kwinrc}.tmp"
    fi
    chown "$_uid:$_gid" "$_kwinrc" 2>/dev/null || true
    if [[ -S "/run/user/$_uid/bus" ]] && command -v sudo >/dev/null 2>&1; then
      local _qdbus=""
      if command -v qdbus6 >/dev/null 2>&1; then _qdbus="qdbus6"
      elif command -v qdbus >/dev/null 2>&1; then _qdbus="qdbus"
      fi
      if [[ -n "$_qdbus" ]]; then
        sudo -u "$_user" XDG_RUNTIME_DIR="/run/user/$_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_uid/bus" \\
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
    for _dbus_svc in "\${_ibus_dbus_svcs[@]}"; do
      if [[ -f "$_dbus_dir/$_dbus_svc" ]] && grep -q '^# korean_input: disabled' "$_dbus_dir/$_dbus_svc" 2>/dev/null; then
        rm -f "$_dbus_dir/$_dbus_svc"
        _changed=true
      fi
    done
  elif [[ "$_is_gnome" != "true" ]]; then
    mkdir -p "$_dbus_dir"
    for _dbus_svc in "\${_ibus_dbus_svcs[@]}"; do
      if [[ ! -f "$_dbus_dir/$_dbus_svc" ]]; then
        _dbus_name="\${_dbus_svc%.service}"
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
        if printf '%s\\n' "$_cur_sources" | grep -qE "\\('ibus',[[:space:]]*'hangul'\\)"; then
          _new_sources=$(printf '%s\\n' "$_cur_sources" | sed -E \\
            -e "s/,[[:space:]]*\\('ibus',[[:space:]]*'hangul'\\)//g" \\
            -e "s/\\('ibus',[[:space:]]*'hangul'\\)[[:space:]]*,[[:space:]]*//g" \\
            -e "s/\\('ibus',[[:space:]]*'hangul'\\)//g")
          printf '%s\\n' "$_new_sources" | grep -q "'" || _new_sources="[('xkb', 'us')]"
          run_user_gsettings "$_user" "$_uid" "$_home" set org.gnome.desktop.input-sources sources "$_new_sources" 2>/dev/null || true
          _changed=true
        fi

        local _cur_preload _new_preload
        _cur_preload=$(run_user_gsettings "$_user" "$_uid" "$_home" get org.freedesktop.ibus.general preload-engines 2>/dev/null || true)
        if printf '%s\\n' "$_cur_preload" | grep -q "'hangul'"; then
          _new_preload=$(printf '%s\\n' "$_cur_preload" | sed -E \\
            -e "s/,[[:space:]]*'hangul'//g" \\
            -e "s/'hangul'[[:space:]]*,[[:space:]]*//g" \\
            -e "s/'hangul'//g")
          printf '%s\\n' "$_new_preload" | grep -q "'" || _new_preload="[]"
          run_user_gsettings "$_user" "$_uid" "$_home" set org.freedesktop.ibus.general preload-engines "$_new_preload" 2>/dev/null || true
          _changed=true
        fi

        local _cur_triggers
        _cur_triggers=$(run_user_gsettings "$_user" "$_uid" "$_home" get org.freedesktop.ibus.general.hotkey triggers 2>/dev/null || true)
        if printf '%s\\n' "$_cur_triggers" | grep -qE "(Hangul|space)"; then
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
  for _hp in "\${_procs[@]}"; do
    if proc_running "$_uid" "$_hp"; then
      proc_kill "$_uid" "$_hp" "-9"
      _survivors+=("$_hp")
    fi
  done
  if [[ "$_target_ime" != "ibus" && "$_is_gnome" == "true" ]] && proc_running "$_uid" "ibus-engine-hangul"; then
    proc_kill "$_uid" "ibus-engine-hangul" "-9"
    _survivors+=("ibus-engine-hangul")
  fi
  if [[ \${#_survivors[@]} -gt 0 ]]; then
    warn "종료되지 않아 강제 종료한 입력기 프로세스: \${_survivors[*]}"
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
  if [[ "$_force" == "true" ]] || \\
     [[ "$_desk" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]] || \\
     [[ "\${XDG_CURRENT_DESKTOP:-}" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]]; then
    echo "true"
  elif [[ -z "$_desk" || "$_desk" == "unknown" ]] && {
       command -v plasmashell >/dev/null 2>&1 || \\
       command -v kwin_wayland >/dev/null 2>&1 || \\
       command -v kwriteconfig6 >/dev/null 2>&1 || \\
       command -v kwriteconfig5 >/dev/null 2>&1 || \\
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
  local _kde_will="$1" _session="$2" _desk="\${3:-\${DESKTOP:-}}"
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
  local _write_etc="$5" _write_envd="$6" _x11_profile="\${7:-}" _allow_pending="\${8:-false}" _include_im="\${9:-false}"
  local _use_kde6_wl="false"
  if [[ "$_kde6_wl" == "true" ]]; then
    if [[ "$_allow_pending" == "true" ]] || \\
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
      local _etc_im_re="^[[:space:]]*((GTK|QT)_IM_MODULE=['\\"]?fcitx['\\"]?|INPUT_METHOD=['\\"]?fcitx5?['\\"]?)[[:space:]]*(#.*)?$"
      local _etc_xm_re="^[[:space:]]*XMODIFIERS=['\\"]?@im=fcitx['\\"]?"
      if [[ -f /etc/environment && -w /etc/environment ]]; then
        if grep -qE "$_etc_im_re" /etc/environment 2>/dev/null; then
          grep -Ev "$_etc_im_re" /etc/environment > /etc/environment.tmp || true
          cat /etc/environment.tmp > /etc/environment
          rm -f /etc/environment.tmp
        fi
      fi
      if [[ -w /etc/environment || ( ! -e /etc/environment && -w /etc ) ]]; then
        if ! grep -qE "$_etc_xm_re" /etc/environment 2>/dev/null; then
          if [[ -s /etc/environment ]] && [[ -n "$(tail -c 1 /etc/environment 2>/dev/null | tr -d '\\n')" ]]; then
            printf '\\n' >> /etc/environment
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
        if [[ -s /etc/environment ]] && [[ -n "$(tail -c 1 /etc/environment 2>/dev/null | tr -d '\\n')" ]]; then
          printf '\\n' >> /etc/environment
        fi
        cat >> /etc/environment <<'EOF'

# fcitx5 환경변수
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
      fi
      if [[ "$_include_im" == "true" ]] && ! grep -qE '^[[:space:]]*INPUT_METHOD=['\\''"]?fcitx5?['\\''"]?[[:space:]]*(#.*)?$' /etc/environment 2>/dev/null; then
        if [[ -s /etc/environment ]] && [[ -n "$(tail -c 1 /etc/environment 2>/dev/null | tr -d '\\n')" ]]; then
          printf '\\n' >> /etc/environment
        fi
        echo "INPUT_METHOD=fcitx" >> /etc/environment
      fi
    fi
    if [[ -n "$_x11_profile" ]]; then
      if ! grep -q "GTK_IM_MODULE=fcitx" "$_x11_profile" 2>/dev/null; then
        if [[ -s "$_x11_profile" ]] && [[ -n "$(tail -c 1 "$_x11_profile" 2>/dev/null | tr -d '\\n')" ]]; then
          printf '\\n' >> "$_x11_profile"
        fi
        cat >> "$_x11_profile" <<'EOF'

# fcitx5 환경변수
export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx
EOF
        if [[ "$_include_im" == "true" ]] && ! grep -qE '^[[:space:]]*(export[[:space:]]+)?INPUT_METHOD=['\\''"]?fcitx5?['\\''"]?[[:space:]]*(#.*)?$' "$_x11_profile" 2>/dev/null; then
          echo "export INPUT_METHOD=fcitx" >> "$_x11_profile"
        fi
      elif [[ "$_include_im" == "true" ]] && ! grep -qE '^[[:space:]]*(export[[:space:]]+)?INPUT_METHOD=['\\''"]?fcitx5?['\\''"]?[[:space:]]*(#.*)?$' "$_x11_profile" 2>/dev/null; then
        if [[ -s "$_x11_profile" ]] && [[ -n "$(tail -c 1 "$_x11_profile" 2>/dev/null | tr -d '\\n')" ]]; then
          printf '\\n' >> "$_x11_profile"
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
  local _kde6_wl="\${4:-false}"
  local _out="$_cfg"
  if [[ "$_kde_will" == "true" ]]; then
    _out=$(printf '%s\\n   - KDE Plasma 가상 키보드 설정: %s/.config/kwinrc ([Wayland] InputMethod)' "$_out" "$_home")
  fi
  if [[ "$_kde6_wl" == "true" ]]; then
    _out=$(printf '%s\\n   - KDE Plasma 6 Wayland 안전 환경변수: %s/.config/environment.d/fcitx5.conf (QT_IM_MODULES="wayland;fcitx", XMODIFIERS=@im=fcitx)' "$_out" "$_home")
  fi
  printf '%s' "$_out"
}

append_fcitx5_overwrite_warn() {
  local _home="$1"
  local _base="\${2:-}"
  local _w=""
  if [[ -f "$_home/.config/fcitx5/profile" || -f "$_home/.config/fcitx5/config" ]]; then
    _w=" ⚠️  참고: 기존 Fcitx5 설정 파일($_home/.config/fcitx5/profile, config)이 덮어써집니다."
  fi
  if [[ -n "$_base" && -n "$_w" ]]; then
    printf '%s\\n%s' "$_base" "$_w"
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
  local _cfg_summary="\${10}"
  local _extra_warn="\${11:-}"

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
  printf "%b\\n" "$_pkg_summary"
  echo " ⚙️  설정·파일 변경 예정:"
  printf "%b\\n" "$_cfg_summary"
  echo " • 설치 로그 파일 : $LOG_FILE"
  if [[ -n "$_extra_warn" ]]; then
    echo "------------------------------------------------------------"
    printf "%b\\n" "$_extra_warn"
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
`;

const PREFLIGHT_COMMON_SH = `
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
      echo "\${PRETTY_NAME:-\${NAME:-Unknown Linux}}"
    )
  else
    echo "Unknown Linux"
  fi
}

run_as_user_sh() {
  _rau_u="$1"
  _rau_cmd="$2"
  _rau_home=$(awk -F: -v u="$_rau_u" '$1==u {print $6}' /etc/passwd 2>/dev/null || echo "")
  [ -z "$_rau_home" ] && command -v getent >/dev/null 2>&1 && _rau_home=$(getent passwd "$_rau_u" 2>/dev/null | cut -d: -f6 || echo "")
  _rau_uid=$(id -u "$_rau_u" 2>/dev/null || echo "")
  if command -v runuser >/dev/null 2>&1; then
    if [ -n "$_rau_uid" ] && [ -S "/run/user/$_rau_uid/bus" ]; then
      runuser -u "$_rau_u" -- env "HOME=\${_rau_home:-/tmp}" "USER=$_rau_u" "LOGNAME=$_rau_u" \\
        "XDG_RUNTIME_DIR=/run/user/$_rau_uid" "DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$_rau_uid/bus" \\
        /bin/sh -c "$_rau_cmd" </dev/null
    elif [ -n "$_rau_uid" ] && [ -d "/run/user/$_rau_uid" ]; then
      runuser -u "$_rau_u" -- env "HOME=\${_rau_home:-/tmp}" "USER=$_rau_u" "LOGNAME=$_rau_u" \\
        "XDG_RUNTIME_DIR=/run/user/$_rau_uid" /bin/sh -c "$_rau_cmd" </dev/null
    else
      runuser -u "$_rau_u" -- env "HOME=\${_rau_home:-/tmp}" "USER=$_rau_u" "LOGNAME=$_rau_u" \\
        /bin/sh -c "$_rau_cmd" </dev/null
    fi
  else
    _rau_pre=""
    [ -n "$_rau_uid" ] && [ -d "/run/user/$_rau_uid" ] && _rau_pre="export XDG_RUNTIME_DIR='/run/user/$_rau_uid'; "
    [ -n "$_rau_uid" ] && [ -S "/run/user/$_rau_uid/bus" ] && _rau_pre="\${_rau_pre}export DBUS_SESSION_BUS_ADDRESS='unix:path=/run/user/$_rau_uid/bus'; "
    su -s /bin/sh "$_rau_u" -c "\${_rau_pre}\${_rau_cmd}" </dev/null
  fi
}

run_user_gsettings() {
  _rug_u="$1"
  _rug_uid="$2"
  _rug_home="$3"
  shift 3
  command -v gsettings >/dev/null 2>&1 || return 1
  _rug_sub="\${1:-}"
  if [ -z "$_rug_uid" ] || [ ! -S "/run/user/$_rug_uid/bus" ]; then
    if [ "$_rug_sub" = "set" ] || [ "$_rug_sub" = "reset" ]; then
      if command -v dbus-run-session >/dev/null 2>&1; then
        set -- dbus-run-session -- gsettings "$@"
      else
        set -- gsettings "$@"
      fi
    else
      set -- gsettings "$@"
    fi
  else
    set -- gsettings "$@"
  fi
  if [ -n "$_rug_uid" ] && [ -S "/run/user/$_rug_uid/bus" ]; then
    set -- "XDG_RUNTIME_DIR=/run/user/$_rug_uid" "DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$_rug_uid/bus" "$@"
  elif [ -n "$_rug_uid" ] && [ -d "/run/user/$_rug_uid" ]; then
    set -- "XDG_RUNTIME_DIR=/run/user/$_rug_uid" "$@"
  fi
  set -- env "HOME=\${_rug_home:-/tmp}" "USER=$_rug_u" "LOGNAME=$_rug_u" "$@"
  if command -v runuser >/dev/null 2>&1; then
    runuser -u "$_rug_u" -- "$@" </dev/null
  elif command -v sudo >/dev/null 2>&1; then
    sudo -u "$_rug_u" "$@" </dev/null
  else
    _rug_q=""
    for _rug_arg in "$@"; do
      _rug_esc=$(printf '%s' "$_rug_arg" | sed "s/'/'\\\\\\\\''/g")
      _rug_q="\${_rug_q} '\${_rug_esc}'"
    done
    su -s /bin/sh "$_rug_u" -c "$_rug_q" </dev/null
  fi
}

proc_running() {
  _pr_uid="$1"
  _pr_proc="$2"
  command -v pgrep >/dev/null 2>&1 || return 1
  _pr_len=$(printf '%s' "$_pr_proc" | wc -c)
  if [ "$_pr_len" -gt 15 ]; then
    pgrep -u "$_pr_uid" -f "(^|/)\${_pr_proc}([[:space:]]|$)" >/dev/null 2>&1
  else
    pgrep -u "$_pr_uid" -x "$_pr_proc" >/dev/null 2>&1
  fi
}

proc_kill() {
  _pk_uid="$1"
  _pk_proc="$2"
  _pk_sig="\${3:-}"
  command -v pkill >/dev/null 2>&1 || return 0
  _pk_len=$(printf '%s' "$_pk_proc" | wc -c)
  if [ "$_pk_len" -gt 15 ]; then
    if [ -n "$_pk_sig" ]; then
      pkill "$_pk_sig" -u "$_pk_uid" -f "(^|/)\${_pk_proc}([[:space:]]|$)" 2>/dev/null || true
    else
      pkill -u "$_pk_uid" -f "(^|/)\${_pk_proc}([[:space:]]|$)" 2>/dev/null || true
    fi
  else
    if [ -n "$_pk_sig" ]; then
      pkill "$_pk_sig" -u "$_pk_uid" -x "$_pk_proc" 2>/dev/null || true
    else
      pkill -u "$_pk_uid" -x "$_pk_proc" 2>/dev/null || true
    fi
  fi
}

detect_desktop() {
  _pf_u="$1"
  _pf_d="\${XDG_CURRENT_DESKTOP:-}"
  [ -n "$_pf_d" ] && { echo "$_pf_d"; return; }
  _pf_uid=$(id -u "$_pf_u" 2>/dev/null || echo "")
  if [ -n "$_pf_uid" ] && [ -S "/run/user/$_pf_uid/bus" ] && command -v systemctl >/dev/null 2>&1; then
    _pf_env=$(run_as_user_sh "$_pf_u" 'systemctl --user show-environment 2>/dev/null' || true)
    _pf_d=$(printf '%s\\n' "$_pf_env" | sed -n 's/^XDG_CURRENT_DESKTOP=//p' | head -n 1 || true)
    [ -n "$_pf_d" ] && { echo "$_pf_d"; return; }
    _pf_d=$(printf '%s\\n' "$_pf_env" | sed -n 's/^DESKTOP_SESSION=//p' | head -n 1 || true)
    [ -n "$_pf_d" ] && { echo "$_pf_d"; return; }
  fi
  if command -v loginctl >/dev/null 2>&1; then
    for _pf_sid in $(loginctl list-sessions --no-legend 2>/dev/null | awk -v u="$_pf_u" '$3==u {print $1}' || true); do
      _pf_d=$(loginctl show-session "$_pf_sid" -p Desktop --value 2>/dev/null || true)
      [ -n "$_pf_d" ] && { echo "$_pf_d"; return; }
    done
  fi
  _pf_d=$(run_as_user_sh "$_pf_u" 'printf "%s\\n" "\${XDG_CURRENT_DESKTOP:-\${DESKTOP_SESSION:-}}"' 2>/dev/null | head -n 1 || true)
  [ -n "$_pf_d" ] && { echo "$_pf_d"; return; }
  echo "unknown"
}

detect_session_type() {
  _pf_u="$1"
  _pf_uid="$2"
  _pf_st="\${XDG_SESSION_TYPE:-}"
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
  if ls "/run/user/$_pf_uid"/wayland-* >/dev/null 2>&1 || [ -n "\${WAYLAND_DISPLAY:-}" ]; then
    echo "wayland"; return
  fi
  if [ -n "\${DISPLAY:-}" ]; then
    echo "x11"; return
  fi
  echo "unknown"
}

detect_existing_ime() {
  _pf_uid="$1"
  _pf_desk="\${2:-}"
  _pf_gnome=false
  case "$_pf_desk" in
    *[Gg][Nn][Oo][Mm][Ee]*) _pf_gnome=true ;;
  esac
  _pf_found=""
  _pf_sep=""
  for _pf_im in fcitx5 fcitx ibus-daemon kime; do
    _pf_running=false
    if command -v pgrep >/dev/null 2>&1 && pgrep -u "$_pf_uid" -x "$_pf_im" >/dev/null 2>&1; then
      _pf_running=true
    fi
    if command -v "$_pf_im" >/dev/null 2>&1 || [ "$_pf_running" = "true" ]; then
      if [ "$_pf_im" = "ibus-daemon" ] && [ "$_pf_running" = "true" ] && [ "$_pf_gnome" = "true" ]; then
        if proc_running "$_pf_uid" "ibus-engine-hangul"; then
          _pf_found="\${_pf_found}\${_pf_sep}\${_pf_im} (실행 중 · GNOME 기본 내장, ibus-hangul 활성)"
        else
          _pf_found="\${_pf_found}\${_pf_sep}\${_pf_im} (실행 중 · GNOME 기본 내장)"
        fi
      elif [ "$_pf_running" = "true" ]; then
        _pf_found="\${_pf_found}\${_pf_sep}\${_pf_im} (실행 중)"
      else
        _pf_found="\${_pf_found}\${_pf_sep}\${_pf_im} (설치됨)"
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
  _cw_base="\${3:-}"
  _cw_desk="\${4:-}"
  _cw_w=""
  if has_conflicting_ime "$_cw_target" "$_cw_existing"; then
    _cw_w=" ⚠️  참고: 기존 입력기(\${_cw_existing})가 감지되었습니다. 기존 입력기가 새 입력기와 충돌할 수 있으므로 기존 입력기 설정(자동시작·서비스·환경변수)을 자동으로 비활성화하겠습니다."
    if [ "$_cw_target" != "ibus" ]; then
      case "$_cw_desk" in
        *[Gg][Nn][Oo][Mm][Ee]*)
          case "$_cw_existing" in
            *ibus-daemon*)
              _cw_w="\${_cw_w}\\n ℹ️  GNOME 안내: ibus-daemon 자체는 GNOME Shell 기본 기능(이모지·화상키보드·Wayland 입력) 유지를 위해 종료·차단하지 않으며, ibus-hangul 입력 소스·엔진·환경변수·단축키 충돌만 비활성화합니다."
              ;;
          esac
          ;;
      esac
    fi
  fi
  if [ -n "$_cw_base" ] && [ -n "$_cw_w" ]; then
    printf '%s\\n%s' "$_cw_base" "$_cw_w"
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
  _dc_autostart_changed=false
  _dc_gnome=false
  case "$_dc_desk" in
    *[Gg][Nn][Oo][Mm][Ee]*) _dc_gnome=true ;;
  esac

  _dc_adir="$_dc_home/.config/autostart"
  _dc_adir_dis="$_dc_home/.config/autostart-disabled"
  _dc_edir="$_dc_home/.config/environment.d"
  _dc_edir_dis="$_dc_home/.config/environment.d-disabled"
  _dc_tdesks=""
  _dc_svcs=""
  _dc_procs=""
  _dc_desks=""
  _dc_econfs=""
  _dc_im_re=""
  _dc_kwin_re=""
  _dc_cmd_re=""

  case "$_dc_target" in
    fcitx5)
      _dc_tdesks="org.fcitx.Fcitx5.desktop fcitx5-wayland-launcher.desktop fcitx5.desktop fcitx5-autostart.desktop"
      _dc_svcs="ibus kime kime-daemon fcitx"
      _dc_procs="fcitx kime kime-daemon kime-indicator kime-wayland kime-xim"
      [ "$_dc_gnome" != "true" ] && _dc_procs="$_dc_procs ibus-daemon"
      _dc_desks="ibus.desktop ibus-daemon.desktop kime.desktop fcitx.desktop fcitx-autostart.desktop"
      [ "$_dc_gnome" != "true" ] && _dc_desks="$_dc_desks ibus-autostart.desktop"
      _dc_econfs="ibus.conf kime.conf fcitx.conf"
      _dc_im_re="(ibus|kime)"
      _dc_kwin_re="(ibus|kime)"
      _dc_cmd_re="(kime|kime-daemon|kime-wayland|kime-xim|kime-xdg-autostart|fcitx)"
      [ "$_dc_gnome" != "true" ] && _dc_cmd_re="(ibus-daemon|kime|kime-daemon|kime-wayland|kime-xim|kime-xdg-autostart|fcitx)"
      ;;
    ibus)
      _dc_tdesks="ibus.desktop ibus-daemon.desktop ibus-autostart.desktop org.freedesktop.IBus.Panel.Wayland.Gtk3.desktop"
      _dc_svcs="fcitx5 fcitx kime kime-daemon"
      _dc_procs="fcitx5 fcitx5-wayland-launcher fcitx kime kime-daemon kime-indicator kime-wayland kime-xim"
      _dc_desks="fcitx5.desktop org.fcitx.Fcitx5.desktop fcitx5-wayland-launcher.desktop fcitx5-autostart.desktop fcitx.desktop fcitx-autostart.desktop kime.desktop"
      _dc_econfs="fcitx5.conf fcitx.conf kime.conf"
      _dc_im_re="(fcitx5|fcitx|kime)"
      _dc_kwin_re="(fcitx|kime)"
      _dc_cmd_re="(fcitx5|fcitx5-wayland-launcher|fcitx|kime|kime-daemon|kime-wayland|kime-xim|kime-xdg-autostart)"
      ;;
    kime)
      _dc_tdesks="kime.desktop"
      _dc_svcs="fcitx5 fcitx ibus"
      _dc_procs="fcitx5 fcitx5-wayland-launcher fcitx"
      [ "$_dc_gnome" != "true" ] && _dc_procs="$_dc_procs ibus-daemon"
      _dc_desks="fcitx5.desktop org.fcitx.Fcitx5.desktop fcitx5-wayland-launcher.desktop fcitx5-autostart.desktop fcitx.desktop fcitx-autostart.desktop ibus.desktop ibus-daemon.desktop"
      [ "$_dc_gnome" != "true" ] && _dc_desks="$_dc_desks ibus-autostart.desktop"
      _dc_econfs="fcitx5.conf fcitx.conf ibus.conf"
      _dc_im_re="(fcitx5|fcitx|ibus)"
      _dc_kwin_re="(fcitx|ibus)"
      _dc_cmd_re="(fcitx5|fcitx5-wayland-launcher|fcitx)"
      [ "$_dc_gnome" != "true" ] && _dc_cmd_re="(ibus-daemon|fcitx5|fcitx5-wayland-launcher|fcitx)"
      ;;
    *)
      return 0
      ;;
  esac

  for _dc_td in $_dc_tdesks; do
    if [ -f "$_dc_adir/$_dc_td" ] && grep -q '^Hidden=true$' "$_dc_adir/$_dc_td" 2>/dev/null; then
      rm -f "$_dc_adir/$_dc_td"
      _dc_autostart_changed=true
    fi
    if [ -f "$_dc_adir/\${_dc_td}.disabled" ]; then
      mkdir -p "$_dc_adir_dis"
      mv -f "$_dc_adir/\${_dc_td}.disabled" "$_dc_adir_dis/$_dc_td"
      chown "$_dc_uid:$_dc_gid" "$_dc_adir_dis" "$_dc_adir_dis/$_dc_td" 2>/dev/null || true
      _dc_autostart_changed=true
      _dc_changed=true
    fi
  done

  if command -v systemctl >/dev/null 2>&1; then
    for _dc_s in $_dc_svcs; do
      if [ -S "/run/user/$_dc_uid/bus" ] && command -v sudo >/dev/null 2>&1; then
        _dc_bus="unix:path=/run/user/$_dc_uid/bus"
        if sudo -u "$_dc_user" XDG_RUNTIME_DIR="/run/user/$_dc_uid" DBUS_SESSION_BUS_ADDRESS="$_dc_bus" \\
             systemctl --user is-enabled "$_dc_s" >/dev/null 2>&1 || \\
           sudo -u "$_dc_user" XDG_RUNTIME_DIR="/run/user/$_dc_uid" DBUS_SESSION_BUS_ADDRESS="$_dc_bus" \\
             systemctl --user is-active "$_dc_s" >/dev/null 2>&1; then
          sudo -u "$_dc_user" XDG_RUNTIME_DIR="/run/user/$_dc_uid" DBUS_SESSION_BUS_ADDRESS="$_dc_bus" \\
            systemctl --user disable --now "$_dc_s" 2>/dev/null || true
          _dc_changed=true
        fi
      else
        if run_as_user_sh "$_dc_user" "systemctl --user is-enabled $_dc_s >/dev/null 2>&1" 2>/dev/null; then
          run_as_user_sh "$_dc_user" "systemctl --user disable $_dc_s 2>/dev/null || true" || true
          _dc_changed=true
        fi
      fi
    done
  fi

  for _dc_p in $_dc_procs; do
    if proc_running "$_dc_uid" "$_dc_p"; then
      proc_kill "$_dc_uid" "$_dc_p"
      _dc_changed=true
    fi
  done

  for _dc_d in $_dc_desks; do
    if [ -f "$_dc_adir/\${_dc_d}.disabled" ]; then
      mkdir -p "$_dc_adir_dis"
      mv -f "$_dc_adir/\${_dc_d}.disabled" "$_dc_adir_dis/$_dc_d"
      chown "$_dc_uid:$_dc_gid" "$_dc_adir_dis" "$_dc_adir_dis/$_dc_d" 2>/dev/null || true
      _dc_autostart_changed=true
      _dc_changed=true
    fi
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
        _dc_autostart_changed=true
        _dc_changed=true
      fi
    elif [ -f "$_dc_adir/$_dc_d" ]; then
      mkdir -p "$_dc_adir_dis"
      mv -f "$_dc_adir/$_dc_d" "$_dc_adir_dis/$_dc_d"
      chown "$_dc_uid:$_dc_gid" "$_dc_adir_dis" "$_dc_adir_dis/$_dc_d" 2>/dev/null || true
      _dc_autostart_changed=true
      _dc_changed=true
    fi
  done
  if [ "$_dc_autostart_changed" = "true" ] && command -v systemctl >/dev/null 2>&1 && [ -S "/run/user/$_dc_uid/bus" ]; then
    run_as_user_sh "$_dc_user" 'systemctl --user daemon-reload 2>/dev/null || true' || true
  fi

  for _dc_ec in $_dc_econfs; do
    if [ -f "$_dc_edir/\${_dc_ec}.disabled" ]; then
      mkdir -p "$_dc_edir_dis"
      mv -f "$_dc_edir/\${_dc_ec}.disabled" "$_dc_edir_dis/$_dc_ec"
      chown "$_dc_uid:$_dc_gid" "$_dc_edir_dis" "$_dc_edir_dis/$_dc_ec" 2>/dev/null || true
      _dc_changed=true
    fi
    if [ -f "$_dc_edir/$_dc_ec" ]; then
      mkdir -p "$_dc_edir_dis"
      mv -f "$_dc_edir/$_dc_ec" "$_dc_edir_dis/$_dc_ec"
      chown "$_dc_uid:$_dc_gid" "$_dc_edir_dis" "$_dc_edir_dis/$_dc_ec" 2>/dev/null || true
      _dc_changed=true
    fi
  done

  _dc_env_re="^[[:space:]]*(export[[:space:]]+)?((GTK|QT|SDL|GLFW)_IM_MODULE=['\\"]?\${_dc_im_re}['\\"]?|INPUT_METHOD=['\\"]?\${_dc_im_re}['\\"]?|QT_IM_MODULES=('[^']*\${_dc_im_re}[^']*'|\\"[^\\"]*\${_dc_im_re}[^\\"]*\\"|[^[:space:]'\\";]*\${_dc_im_re}[^[:space:]'\\";]*)|XMODIFIERS=['\\"]?@im=\${_dc_im_re}['\\"]?)[[:space:]]*(#.*)?$"
  _dc_etc_env_re="^[[:space:]]*(export[[:space:]]+)?((GTK|QT|SDL|GLFW)_IM_MODULE=['\\"]?\${_dc_im_re}['\\"]?|INPUT_METHOD=['\\"]?\${_dc_im_re}['\\"]?|QT_IM_MODULES=('[^']*\${_dc_im_re}[^']*'|\\"[^\\"]*\${_dc_im_re}[^\\"]*\\"|[^[:space:]'\\"]*\${_dc_im_re}[^[:space:]'\\"]*)|XMODIFIERS=['\\"]?@im=\${_dc_im_re}['\\"]?)[[:space:]]*(#.*)?$"
  _dc_cmd_re_grep="^[[:space:]]*((/usr(/local)?/bin/)?\${_dc_cmd_re})([[:space:]]+(-[A-Za-z0-9_=-]+|>/dev/null|2>/dev/null|2>&1|&>/dev/null))*([[:space:]]*&)?[[:space:]]*(#.*)?$"
  for _dc_ef in /etc/environment "$_dc_home/.xsessionrc" "$_dc_home/.xprofile" "$_dc_home/.bash_profile" "$_dc_home/.zprofile" "$_dc_home/.profile"; do
    if [ -f "$_dc_ef" ] && [ -w "$_dc_ef" ]; then
      if [ "$_dc_ef" = "/etc/environment" ]; then
        if grep -qE "$_dc_etc_env_re" "$_dc_ef" 2>/dev/null; then
          grep -Ev "$_dc_etc_env_re" "$_dc_ef" > "\${_dc_ef}.tmp" || true
          cat "\${_dc_ef}.tmp" > "$_dc_ef"
          rm -f "\${_dc_ef}.tmp"
          _dc_changed=true
        fi
      elif grep -qE "$_dc_env_re" "$_dc_ef" 2>/dev/null || grep -qE "$_dc_cmd_re_grep" "$_dc_ef" 2>/dev/null; then
        _dc_chk="sh"
        _dc_valid=false
        case "$_dc_ef" in
          */.bash_profile) command -v bash >/dev/null 2>&1 && _dc_chk="bash" ;;
          */.zprofile) command -v zsh >/dev/null 2>&1 && _dc_chk="zsh" ;;
        esac
        "$_dc_chk" -n "$_dc_ef" >/dev/null 2>&1 && _dc_valid=true
        if awk -v im_re="$_dc_im_re" -v cmd_re="$_dc_cmd_re" '
          BEGIN {
            env_re = "^[ \\t]*(export[ \\t]+)?((GTK|QT|SDL|GLFW)_IM_MODULE=[\\047\\"]?" im_re "[\\047\\"]?|INPUT_METHOD=[\\047\\"]?" im_re "[\\047\\"]?|QT_IM_MODULES=(\\047[^\\047]*" im_re "[^\\047]*\\047|\\\"[^\\\"]*" im_re "[^\\\"]*\\\"|[^ \\t\\047\\\";]*" im_re "[^ \\t\\047\\\";]*)|XMODIFIERS=[\\047\\"]?@im=" im_re "[\\047\\"]?)[ \\t]*(#.*)?$"
            cmd_re_full = "^[ \\t]*((/usr(/local)?/bin/)?" cmd_re ")([ \\t]+(-[A-Za-z0-9_=-]+|>/dev/null|2>/dev/null|2>&1|&>/dev/null))*([ \\t]*&)?[ \\t]*(#.*)?$"
            mark = "^[ \\t]*:[ \\t]*#[ \\t]*korean_input: disabled conflicting IME([ \\t]+env)?[ \\t]*$"
            prev = 0
          }
          ($0 ~ env_re) || ($0 ~ cmd_re_full) {
            if (!prev) {
              match($0, /^[ \\t]*/)
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
        ' "$_dc_ef" > "\${_dc_ef}.tmp"; then
          if [ "$_dc_valid" = "true" ] && ! "$_dc_chk" -n "\${_dc_ef}.tmp" >/dev/null 2>&1; then
            rm -f "\${_dc_ef}.tmp"
            warn "셸 구문 검증 실패로 $_dc_ef 자동 수정을 건너뜁니다 (수동 확인 필요)"
          else
            cat "\${_dc_ef}.tmp" > "$_dc_ef"
            rm -f "\${_dc_ef}.tmp"
            chown "$_dc_uid:$_dc_gid" "$_dc_ef" 2>/dev/null || true
            _dc_changed=true
          fi
        else
          rm -f "\${_dc_ef}.tmp"
        fi
      fi
    fi
  done

  _dc_kwin="$_dc_home/.config/kwinrc"
  if [ -f "$_dc_kwin" ] && grep -qE '^InputMethod(\\[\\$e\\])?=.*'"\${_dc_kwin_re}" "$_dc_kwin" 2>/dev/null; then
    if command -v kwriteconfig6 >/dev/null 2>&1; then
      kwriteconfig6 --file "$_dc_kwin" --group Wayland --key InputMethod --delete 2>/dev/null || true
    elif command -v kwriteconfig5 >/dev/null 2>&1; then
      kwriteconfig5 --file "$_dc_kwin" --group Wayland --key InputMethod --delete 2>/dev/null || true
    else
      awk '
        BEGIN { in_wayland=0 }
        /^\\[Wayland\\]$/ { in_wayland=1; print; next }
        /^\\[/ { in_wayland=0; print; next }
        in_wayland && /^InputMethod(\\[\\$e\\])?=/ { next }
        { print }
      ' "$_dc_kwin" > "\${_dc_kwin}.tmp" && cat "\${_dc_kwin}.tmp" > "$_dc_kwin" && rm -f "\${_dc_kwin}.tmp"
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
        _dc_dn="\${_dc_ds%.service}"
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

  if [ "$_dc_target" != "ibus" ]; then
    if [ "$_dc_gnome" != "true" ]; then
      for _dc_hp in ibus-engine-hangul ibus-engine-simple ibus-ui-gtk3 ibus-x11 ibus-portal ibus-extension-gtk3 ibus-dconf ibus-memconf; do
        proc_kill "$_dc_uid" "$_dc_hp"
      done
    else
      if command -v gsettings >/dev/null 2>&1; then
        _dc_cur_src=$(run_user_gsettings "$_dc_user" "$_dc_uid" "$_dc_home" get org.gnome.desktop.input-sources sources 2>/dev/null || true)
        if printf '%s\\n' "$_dc_cur_src" | grep -qE "\\('ibus',[[:space:]]*'hangul'\\)"; then
          _dc_new_src=$(printf '%s\\n' "$_dc_cur_src" | sed -E \\
            -e "s/,[[:space:]]*\\('ibus',[[:space:]]*'hangul'\\)//g" \\
            -e "s/\\('ibus',[[:space:]]*'hangul'\\)[[:space:]]*,[[:space:]]*//g" \\
            -e "s/\\('ibus',[[:space:]]*'hangul'\\)//g")
          printf '%s\\n' "$_dc_new_src" | grep -q "'" || _dc_new_src="[('xkb', 'us')]"
          run_user_gsettings "$_dc_user" "$_dc_uid" "$_dc_home" set org.gnome.desktop.input-sources sources "$_dc_new_src" 2>/dev/null || true
          _dc_changed=true
        fi

        _dc_cur_pre=$(run_user_gsettings "$_dc_user" "$_dc_uid" "$_dc_home" get org.freedesktop.ibus.general preload-engines 2>/dev/null || true)
        if printf '%s\\n' "$_dc_cur_pre" | grep -q "'hangul'"; then
          _dc_new_pre=$(printf '%s\\n' "$_dc_cur_pre" | sed -E \\
            -e "s/,[[:space:]]*'hangul'//g" \\
            -e "s/'hangul'[[:space:]]*,[[:space:]]*//g" \\
            -e "s/'hangul'//g")
          printf '%s\\n' "$_dc_new_pre" | grep -q "'" || _dc_new_pre="[]"
          run_user_gsettings "$_dc_user" "$_dc_uid" "$_dc_home" set org.freedesktop.ibus.general preload-engines "$_dc_new_pre" 2>/dev/null || true
          _dc_changed=true
        fi

        _dc_cur_trig=$(run_user_gsettings "$_dc_user" "$_dc_uid" "$_dc_home" get org.freedesktop.ibus.general.hotkey triggers 2>/dev/null || true)
        if printf '%s\\n' "$_dc_cur_trig" | grep -qE "(Hangul|space)"; then
          run_user_gsettings "$_dc_user" "$_dc_uid" "$_dc_home" set org.freedesktop.ibus.general.hotkey triggers "[]" 2>/dev/null || true
          _dc_changed=true
        fi

        _dc_cur_gtk=$(run_user_gsettings "$_dc_user" "$_dc_uid" "$_dc_home" get org.gnome.desktop.interface gtk-im-module 2>/dev/null || true)
        if [ "$_dc_cur_gtk" = "'ibus'" ]; then
          run_user_gsettings "$_dc_user" "$_dc_uid" "$_dc_home" reset org.gnome.desktop.interface gtk-im-module 2>/dev/null || true
          _dc_changed=true
        fi

        for _dc_kb in switch-input-source switch-input-source-backward; do
          _dc_cur_kb=$(run_user_gsettings "$_dc_user" "$_dc_uid" "$_dc_home" get org.gnome.desktop.wm.keybindings "$_dc_kb" 2>/dev/null || true)
          if [ -n "$_dc_cur_kb" ] && [ "$_dc_cur_kb" != "@as []" ] && [ "$_dc_cur_kb" != "[]" ]; then
            run_user_gsettings "$_dc_user" "$_dc_uid" "$_dc_home" set org.gnome.desktop.wm.keybindings "$_dc_kb" "[]" 2>/dev/null || true
            _dc_changed=true
          fi
        done
      fi

      if proc_running "$_dc_uid" "ibus-engine-hangul"; then
        proc_kill "$_dc_uid" "ibus-engine-hangul"
        _dc_changed=true
      fi
    fi
  fi
  sleep 1
  _dc_surv=""
  for _dc_hp in $_dc_procs; do
    if proc_running "$_dc_uid" "$_dc_hp"; then
      proc_kill "$_dc_uid" "$_dc_hp" "-9"
      _dc_surv="$_dc_surv $_dc_hp"
    fi
  done
  if [ "$_dc_target" != "ibus" ] && [ "$_dc_gnome" = "true" ] && proc_running "$_dc_uid" "ibus-engine-hangul"; then
    proc_kill "$_dc_uid" "ibus-engine-hangul" "-9"
    _dc_surv="$_dc_surv ibus-engine-hangul"
  fi
  if [ -n "$_dc_surv" ]; then
    warn "종료되지 않아 강제 종료한 입력기 프로세스:$_dc_surv"
    _dc_changed=true
  fi

  if [ "$_dc_target" != "ibus" ] && [ "$_dc_gnome" = "true" ]; then
    if proc_running "$_dc_uid" "ibus-daemon" || command -v ibus-daemon >/dev/null 2>&1; then
      info "GNOME 환경에서는 셸 안정성을 위해 ibus-daemon은 유지하고, ibus-hangul 입력 소스·엔진·환경변수·단축키 충돌만 비활성화했습니다."
    fi
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
  _pf_warn="\${2:-}"

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
  printf "%b\\n" "$_pf_pkg"
  echo " ⚙️  설정·파일 변경 예정:"
  printf "%b\\n" "$_pf_cfg"
  echo " • 설치 로그 파일 : $LOG_FILE"
  if [ -n "$_pf_warn" ]; then
    echo "------------------------------------------------------------"
    printf "%b\\n" "$_pf_warn"
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
`;

const SCRIPT_TEMPLATES = {
  // ─── Debian/Ubuntu/Mint/Pop/Zorin/elementary/KDE Neon ───
  "debian-family": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/debian-family/${params.scriptId}.sh | sudo bash
#       또는: sudo bash ${params.scriptId}.sh [-y|--yes]

set -euo pipefail

SCRIPT_VERSION="1.5.2"
LOG_FILE="/var/log/install-hangul-${params.scriptId}.log"
BACKUP_DIR="/root/hangul-backup-$(date +%Y%m%d-%H%M%S)"
${PREFLIGHT_COMMON_BASH}
require_root() { [[ $EUID -eq 0 ]] || err "root 권한 필요: sudo bash $0"; }

detect_user() {
  local u="\${SUDO_USER:-}"
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
  _kde_will=$(will_configure_kde "${params.editionKey.includes("kde") ? "true" : "false"}" "$TARGET_HOME" "$DESKTOP")
  local _kde6_wayland
  _kde6_wayland=$(is_kde6_wayland "$_kde_will" "$SESSION_TYPE")

  local _pkg_summary="   - apt-get update 후 레거시 fcitx(4.x) 제거 및 autoremove --purge\\n   - apt-get install: fcitx5, fcitx5-hangul, fcitx5-config-qt, fcitx5-configtool,\\n     fcitx5-frontend-gtk3/gtk4/qt5/qt6, fonts-noto-cjk"
  local _cfg_summary="   - im-config -n fcitx5 적용 및 데스크톱 단축키 충돌 해제(gsettings)\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/environment.d/fcitx5.conf, /etc/environment, $TARGET_HOME/.xsessionrc\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록"
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary" "$_kde6_wayland")
  local _extra_warn=" ⚠️  참고: 기존 fcitx 4.x 패키지 및 미사용 의존성(autoremove)이 제거됩니다."
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME" "$_extra_warn")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn" "$DESKTOP")

  confirm_before_changes \
    "${params.distroName} ${params.editionLabel}" \
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== ${params.distroName} ${params.editionLabel} 한글 입력기 설치 시작 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. 레거시 제거 & 업데이트
  log "[1/7] 레거시 fcitx4 제거 및 패키지 업데이트..."
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get purge -y -qq fcitx fcitx-bin fcitx-data fcitx-hangul fcitx-config-gtk \\
    fcitx-frontend-all fcitx-frontend-gtk2 fcitx-frontend-gtk3 fcitx-frontend-qt5 2>/dev/null || true
  apt-get autoremove --purge -y -qq
  ok "정리 완료"

  # 2. fcitx5 스택 + 한글 폰트 설치
  log "[2/7] fcitx5 + 한글 엔진 + 프론트엔드 + 한글 폰트 설치..."
  apt-get install -y -qq \\
    fcitx5 fcitx5-hangul fcitx5-config-qt fcitx5-configtool \\
    fcitx5-frontend-gtk3 fcitx5-frontend-gtk4 \\
    fcitx5-frontend-qt5 fcitx5-frontend-qt6 \\
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
        sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
          systemctl --user stop "$_svc" 2>/dev/null || true
        _fcitx5_svcs+=("$_svc")
      fi
    done < <(sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
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
  if [[ \${#_fcitx5_svcs[@]} -gt 0 && -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]]; then
    local _svc
    for _svc in "\${_fcitx5_svcs[@]}"; do
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
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
    for c in "\${cmds[@]}"; do sudo -u "$USER" DBUS_SESSION_BUS_ADDRESS="$bus" gsettings set $c 2>/dev/null || true; done
  else
    for c in "\${cmds[@]}"; do run_as_user_sh "$USER" "gsettings set $c 2>/dev/null || true"; done
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
${KDE_VIRTUAL_KEYBOARD_SNIPPET(params.editionKey.includes("kde"))}
${POST_LOGIN_GUIDE_SNIPPET(params.distroName, params.editionKey.includes("kde"))}
  echo
  echo "============================================================"
  echo " 🎉 설치 완료! 로그아웃 후 다시 로그인하세요."
  echo " 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space 로 전환"
  echo " 설정: fcitx5-configtool"
  echo " 로그: $LOG_FILE"
  echo "============================================================"
}
main "$@"
`,

  // ─── Fedora ───
  "fedora": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/fedora/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.5.2"
LOG_FILE="/var/log/install-hangul-${params.scriptId}.log"
${PREFLIGHT_COMMON_BASH}
require_root() { [[ $EUID -eq 0 ]] || err "root 권한 필요: sudo bash $0"; }

detect_user() {
  local u="\${SUDO_USER:-}"
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(logname 2>/dev/null || true)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(who | awk '{print $1}' | head -1)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  err "대상 사용자 탐지 실패";
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
  _kde_will=$(will_configure_kde "${params.editionKey.includes("kde") ? "true" : "false"}" "$TARGET_HOME" "$DESKTOP")
  local _kde6_wayland
  _kde6_wayland=$(is_kde6_wayland "$_kde_will" "$SESSION_TYPE" "$DESKTOP")

  local _pkg_summary="   - dnf install -y: fcitx5, fcitx5-hangul, fcitx5-configtool, fcitx5-gtk,\\n     fcitx5-qt, fcitx5-autostart, google-noto-sans-cjk-ttc-fonts (또는 google-noto-cjk-fonts)"
  local _cfg_summary="   - alternatives --set xinputrc, /etc/X11/xinit/xinput.d/fcitx5.conf 수정\\n   - ibus 사용자 서비스 비활성화(systemctl --user disable ibus)\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/environment.d/fcitx5.conf, /etc/environment, ~/.bash_profile (또는 ~/.profile) 환경변수 추가"
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary" "$_kde6_wayland")
  local _extra_warn
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn" "$DESKTOP")

  confirm_before_changes \
    "${params.distroName} ${params.editionLabel}" \
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== ${params.distroName} ${params.editionLabel} 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. 패키지 설치
  log "[1/5] fcitx5 및 한글 폰트 패키지 설치 (dnf)..."
  dnf install -y -q \\
    fcitx5 fcitx5-hangul fcitx5-configtool fcitx5-gtk fcitx5-qt \\
    fcitx5-autostart
  dnf install -y -q google-noto-sans-cjk-ttc-fonts 2>/dev/null || dnf install -y -q google-noto-cjk-fonts 2>/dev/null || true
  ok "패키지 설치 완료"
  disable_conflicting_imes "fcitx5" "$USER" "$TARGET_HOME" "$TARGET_UID" "$DESKTOP"

  # 2. 시스템 입력기 등록 (alternatives)
  log "[2/5] 시스템 입력기를 fcitx5로 등록..."
  alternatives --set xinputrc /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
  # Wayland 지원 활성화
  sed -i 's/IMSETTINGS_IGNORE_SESSION=\\*-wayland/#IMSETTINGS_IGNORE_SESSION=*-wayland/' /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
  sed -i 's/XIM=fcitx5/XIM=fcitx/' /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
  ok "시스템 입력기 설정 완료"

  # 3. ibus 자동시작 비활성화 (충돌 방지)
  log "[3/5] ibus 자동시작 비활성화..."
  run_as_user_sh "$USER" "systemctl --user disable ibus 2>/dev/null || true" || true
  ok "ibus 비활성화"

  # 4. 사용자 설정 (프로필/핫키/환경변수)
  log "[4/5] 사용자 설정 구성..."
  # 실행 중인 fcitx5가 종료 시 기존 프로필로 덮어쓰는 현상 방지
  local _fcitx5_uid _fcitx5_svcs=()
  _fcitx5_uid=$(id -u "$USER" 2>/dev/null || echo "")
  if [[ -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]] && command -v systemctl >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    local _svc
    while IFS= read -r _svc; do
      if [[ -n "$_svc" ]]; then
        sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
          systemctl --user stop "$_svc" 2>/dev/null || true
        _fcitx5_svcs+=("$_svc")
      fi
    done < <(sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
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
  # 환경변수 (KDE6 Wayland 안전 모드 또는 environment.d + /etc/environment + ~/.bash_profile / ~/.profile)
  if [[ "$_kde6_wayland" == "true" ]]; then
    write_fcitx5_env "$_kde6_wayland" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "true" "true" "$TARGET_HOME/.xprofile" "false"
    chown -R "$TARGET_UID:$TARGET_GID" "$FCITX5_DIR"
  else
    write_fcitx5_env "false" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "true" "true" "" "false" "false"
    local PROFILE_FILE="$TARGET_HOME/.bash_profile"
    [[ -f "$TARGET_HOME/.profile" && ! -f "$PROFILE_FILE" ]] && PROFILE_FILE="$TARGET_HOME/.profile"
    grep -q "GTK_IM_MODULE=fcitx" "$PROFILE_FILE" 2>/dev/null || cat >> "$PROFILE_FILE" <<'EOF'

# fcitx5 환경변수
export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx
EOF
    chown -R "$TARGET_UID:$TARGET_GID" "$FCITX5_DIR" "$PROFILE_FILE"
  fi
  if [[ \${#_fcitx5_svcs[@]} -gt 0 && -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]]; then
    local _svc
    for _svc in "\${_fcitx5_svcs[@]}"; do
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
        systemctl --user start "$_svc" 2>/dev/null || true
    done
  fi
  ok "사용자 설정 완료"

  # 5. KDE Plasma 가상 키보드(Fcitx 5) 자동 설정
  log "[5/5] 데스크톱별 마무리..."
${KDE_VIRTUAL_KEYBOARD_SNIPPET(params.editionKey.includes("kde"))}

  echo
  echo "============================================================"
  echo " 🎉 설치 완료! 재부팅 또는 재로그인 필요"
  echo " KDE: 가상 키보드(Fcitx 5) 자동 설정됨 (미적용 시 시스템설정 → 입력장치 → 가상키보드 확인)"
  echo " GNOME: 자동 적용 (환경변수 로드 후)"
  echo " 전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space"
  echo " 설정: fcitx5-configtool"
  echo " 진단: fcitx5-diagnose"
  echo "============================================================"
}
main "$@"
`,

  // ─── Arch/Manjaro/Endeavour/Garuda ───
  "arch-family": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/arch-family/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.5.2"
LOG_FILE="/var/log/install-hangul-${params.scriptId}.log"
${PREFLIGHT_COMMON_BASH}
require_root() { [[ $EUID -eq 0 ]] || err "root 권한 필요: sudo bash $0"; }

detect_user() {
  local u="\${SUDO_USER:-}"
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(logname 2>/dev/null || true)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(who | awk '{print $1}' | head -1)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  err "대상 사용자 탐지 실패";
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
  _kde_will=$(will_configure_kde "${params.editionKey.includes("kde") ? "true" : "false"}" "$TARGET_HOME" "$DESKTOP")
  local _kde6_wayland
  _kde6_wayland=$(is_kde6_wayland "$_kde_will" "$SESSION_TYPE")

  local _pkg_summary="   - pacman -Syu --needed --noconfirm: fcitx5-im, fcitx5-hangul,\\n     fcitx5-configtool, fcitx5-gtk, fcitx5-qt, noto-fonts-cjk (미설치 시 부분 업그레이드 방지)"
  local _cfg_summary="   - /etc/environment 환경변수 추가\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop, systemctl --user enable fcitx5\\n   - 첫 로그인 1회 안내 등록"
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary" "$_kde6_wayland")
  local _extra_warn
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn" "$DESKTOP")

  confirm_before_changes \
    "${params.distroName} ${params.editionLabel}" \
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== ${params.distroName} ${params.editionLabel} 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. 패키지 설치 (pacman)
  log "[1/5] fcitx5 및 한글 폰트 패키지 설치 (pacman)..."
  if pacman -T fcitx5 fcitx5-hangul fcitx5-configtool fcitx5-gtk fcitx5-qt noto-fonts-cjk >/dev/null 2>&1; then
    ok "필수 패키지가 이미 설치되어 있어 pacman 업그레이드를 건너뜁니다"
  else
    pacman -Syu --needed --noconfirm \\
      fcitx5-im fcitx5-hangul fcitx5-configtool \\
      fcitx5-gtk fcitx5-qt noto-fonts-cjk
  fi
  ok "패키지 설치 완료"
  disable_conflicting_imes "fcitx5" "$USER" "$TARGET_HOME" "$TARGET_UID" "$DESKTOP"

  # 2. 환경변수 설정
  log "[2/5] 환경변수 설정..."
  write_fcitx5_env "$_kde6_wayland" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "true" "true" "$TARGET_HOME/.xprofile" "false"
  ok "환경변수 설정 완료"

  # 3. 사용자 설정 (프로필/핫키)
  log "[3/5] 사용자 Fcitx5 설정..."
  # 실행 중인 fcitx5가 종료 시 기존 프로필로 덮어쓰는 현상 방지
  local _fcitx5_uid _fcitx5_svcs=()
  _fcitx5_uid=$(id -u "$USER" 2>/dev/null || echo "")
  if [[ -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]] && command -v systemctl >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    local _svc
    while IFS= read -r _svc; do
      if [[ -n "$_svc" ]]; then
        sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
          systemctl --user stop "$_svc" 2>/dev/null || true
        _fcitx5_svcs+=("$_svc")
      fi
    done < <(sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
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
  if [[ \${#_fcitx5_svcs[@]} -gt 0 && -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]]; then
    local _svc
    for _svc in "\${_fcitx5_svcs[@]}"; do
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
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
  chown -R "$TARGET_UID:$TARGET_GID" "$ADIR"

  # systemd user 서비스도 활성화 (Wayland 세션용)
  run_as_user_sh "$USER" "systemctl --user enable fcitx5 2>/dev/null || true" || true
  ok "자동시작 등록"

  # 5. KDE Plasma 가상 키보드 자동 설정 및 데스크톱별 안내
  log "[5/5] 데스크톱별 마무리..."
${KDE_VIRTUAL_KEYBOARD_SNIPPET(params.editionKey.includes("kde"))}
  if [[ "$DESKTOP" =~ [Gg][Nn][Oo][Mm][Ee] ]]; then
    info "GNOME: 재로그인 후 자동 적용 (환경변수 상속)"
  elif ! [[ "$DESKTOP" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]]; then
    info "타 WM/DE: ~/.xprofile 또는 ~/.xinitrc 에 환경변수 추가 후 재시작"
  fi

${POST_LOGIN_GUIDE_SNIPPET(params.distroName, params.editionKey.includes("kde"))}
  echo
  echo "============================================================"
  echo " 🎉 설치 완료! 재로그인 또는 재부팅 필요"
  echo " 전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space"
  echo " 설정: fcitx5-configtool"
  echo " 진단: fcitx5-diagnose"
  echo "============================================================"
}
main "$@"
`,

  // ─── openSUSE ───
  "opensuse": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/opensuse/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.5.2"
LOG_FILE="/var/log/install-hangul-${params.scriptId}.log"
${PREFLIGHT_COMMON_BASH}
require_root() { [[ $EUID -eq 0 ]] || err "root 권한 필요: sudo bash $0"; }

detect_user() {
  local u="\${SUDO_USER:-}"
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(logname 2>/dev/null || true)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(who | awk '{print $1}' | head -1)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  err "대상 사용자 탐지 실패";
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
  _kde_will=$(will_configure_kde "${params.editionKey.includes("kde") ? "true" : "false"}" "$TARGET_HOME" "$DESKTOP")
  local _kde6_wayland
  _kde6_wayland=$(is_kde6_wayland "$_kde_will" "$SESSION_TYPE" "$DESKTOP")

  local _is_transactional=false _pkg_summary="" _extra_warn=""
  if command -v transactional-update >/dev/null 2>&1; then
    _is_transactional=true
    _pkg_summary="   - transactional-update pkg install: fcitx5, fcitx5-hangul, fcitx5-configtool\\n     (+ 사용 가능한 fcitx5-gtk3/gtk4, fcitx5-qt5/qt6, google-noto-sans-cjk-fonts)"
    _extra_warn=" ⚠️  참고: Aeon / MicroOS(transactional-update) 감지 — 설치 후 재부팅이 필요합니다."
  else
    _pkg_summary="   - zypper install -y: fcitx5, fcitx5-hangul, fcitx5-configtool\\n     (+ 사용 가능한 fcitx5-gtk3/gtk4, fcitx5-qt5/qt6, google-noto-sans-cjk-fonts)"
  fi
  local _cfg_summary="   - alternatives --set xinputrc, /etc/X11/xinit/xinput.d/fcitx5.conf 수정\\n   - ibus 사용자 서비스 비활성화(systemctl --user disable ibus)\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/environment.d/fcitx5.conf, /etc/environment, ~/.profile (또는 ~/.bash_profile, INPUT_METHOD=fcitx 포함)\\n   - $TARGET_HOME/.config/autostart/org.fcitx.Fcitx5.desktop (비-KDE6-Wayland) 및 첫 로그인 1회 안내 등록"
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary" "$_kde6_wayland")
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME" "$_extra_warn")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn" "$DESKTOP")

  confirm_before_changes \
    "${params.distroName} ${params.editionLabel}" \
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== ${params.distroName} ${params.editionLabel} 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. 패키지 설치 (transactional-update / zypper)
  log "[1/5] fcitx5 및 한글 폰트 패키지 설치..."
  local _suse_pkgs=(fcitx5 fcitx5-hangul fcitx5-configtool)
  local _opt_pkg
  if command -v zypper >/dev/null 2>&1; then
    zypper --non-interactive --gpg-auto-import-keys refresh || true
    for _opt_pkg in fcitx5-gtk3 fcitx5-gtk4 fcitx5-qt5 fcitx5-qt6 google-noto-sans-cjk-fonts; do
      if zypper --non-interactive --no-refresh se -x -t package "$_opt_pkg" >/dev/null 2>&1; then
        _suse_pkgs+=("$_opt_pkg")
      fi
    done
  fi
  if [[ "$_is_transactional" == "true" ]]; then
    transactional-update --non-interactive pkg install "\${_suse_pkgs[@]}"
    info "Aeon / MicroOS 감지: transactional-update 적용을 위해 설치 후 재부팅이 필요합니다."
  else
    if ! zypper --non-interactive --gpg-auto-import-keys install -y "\${_suse_pkgs[@]}"; then
      warn "zypper 설치 실패 — 미러 메타데이터 강제 갱신(refresh -f) 후 재시도합니다..."
      zypper --non-interactive --gpg-auto-import-keys refresh -f || true
      zypper --non-interactive --gpg-auto-import-keys install -y "\${_suse_pkgs[@]}"
    fi
  fi
  ok "패키지 설치 완료"
  disable_conflicting_imes "fcitx5" "$USER" "$TARGET_HOME" "$TARGET_UID" "$DESKTOP"

  # 2. 시스템 입력기 설정 (alternatives)
  log "[2/5] 시스템 입력기 등록..."
  alternatives --set xinputrc /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
  sed -i 's/IMSETTINGS_IGNORE_SESSION=\\*-wayland/#IMSETTINGS_IGNORE_SESSION=*-wayland/' /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
  sed -i 's/XIM=fcitx5/XIM=fcitx/' /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
  ok "시스템 입력기 설정"

  # 3. ibus 비활성화
  log "[3/5] ibus 자동시작 비활성화..."
  run_as_user_sh "$USER" "systemctl --user disable ibus 2>/dev/null || true" || true
  ok "ibus 비활성화"

  # 4. 사용자 설정
  log "[4/5] 사용자 Fcitx5 설정..."
  # 실행 중인 fcitx5가 종료 시 기존 프로필로 덮어쓰는 현상 방지
  local _fcitx5_uid _fcitx5_svcs=()
  _fcitx5_uid=$(id -u "$USER" 2>/dev/null || echo "")
  if [[ -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]] && command -v systemctl >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    local _svc
    while IFS= read -r _svc; do
      if [[ -n "$_svc" ]]; then
        sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
          systemctl --user stop "$_svc" 2>/dev/null || true
        _fcitx5_svcs+=("$_svc")
      fi
    done < <(sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
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
  # 환경변수 및 자동시작
  local _o_pending="false"
  [[ "$_is_transactional" == "true" ]] && _o_pending="true"
  if [[ "$_kde6_wayland" == "true" ]]; then
    write_fcitx5_env "$_kde6_wayland" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "true" "true" "$TARGET_HOME/.xprofile" "$_o_pending" "false"
    chown -R "$TARGET_UID:$TARGET_GID" "$FCITX5_DIR"
  else
    write_fcitx5_env "false" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "true" "true" "" "$_o_pending" "true"
    local PROFILE_FILE="$TARGET_HOME/.profile"
    [[ ! -f "$PROFILE_FILE" && -f "$TARGET_HOME/.bash_profile" ]] && PROFILE_FILE="$TARGET_HOME/.bash_profile"
    if ! grep -q "GTK_IM_MODULE=fcitx" "$PROFILE_FILE" 2>/dev/null; then
      if [[ -s "$PROFILE_FILE" ]] && [[ -n "$(tail -c 1 "$PROFILE_FILE" 2>/dev/null | tr -d '\\n')" ]]; then
        printf '\\n' >> "$PROFILE_FILE"
      fi
      cat >> "$PROFILE_FILE" <<'EOF'

# fcitx5 환경변수
export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx
export INPUT_METHOD=fcitx
EOF
    elif ! grep -qE '^[[:space:]]*(export[[:space:]]+)?INPUT_METHOD=['\\''"]?fcitx5?['\\''"]?[[:space:]]*(#.*)?$' "$PROFILE_FILE" 2>/dev/null; then
      if [[ -s "$PROFILE_FILE" ]] && [[ -n "$(tail -c 1 "$PROFILE_FILE" 2>/dev/null | tr -d '\\n')" ]]; then
        printf '\\n' >> "$PROFILE_FILE"
      fi
      echo "export INPUT_METHOD=fcitx" >> "$PROFILE_FILE"
    fi
    local ADIR="$TARGET_HOME/.config/autostart"
    mkdir -p "$ADIR"
    cat > "$ADIR/org.fcitx.Fcitx5.desktop" <<'EOF'
[Desktop Entry]
Type=Application
Name=Fcitx 5
Exec=fcitx5 -d
X-GNOME-Autostart-enabled=true
Hidden=false
NoDisplay=false
EOF
    chown -R "$TARGET_UID:$TARGET_GID" "$FCITX5_DIR" "$PROFILE_FILE" "$ADIR"
    if command -v systemctl >/dev/null 2>&1 && [[ -S "/run/user/$TARGET_UID/bus" ]]; then
      run_as_user_sh "$USER" 'systemctl --user daemon-reload 2>/dev/null || true' || true
    fi
  fi
  if [[ \${#_fcitx5_svcs[@]} -gt 0 && -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]]; then
    local _svc
    for _svc in "\${_fcitx5_svcs[@]}"; do
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
        systemctl --user start "$_svc" 2>/dev/null || true
    done
  fi
  ok "사용자 설정 완료"

  # 5. KDE Plasma 가상 키보드(Fcitx 5) 자동 설정
  log "[5/5] 마무리..."
${KDE_VIRTUAL_KEYBOARD_SNIPPET(params.editionKey.includes("kde"))}
${POST_LOGIN_GUIDE_SNIPPET(params.distroName, params.editionKey.includes("kde"))}

  echo
  echo "============================================================"
  echo " 🎉 설치 완료! 재부팅 또는 재로그인"
  echo " 전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space"
  echo " 설정: fcitx5-configtool"
  echo " 진단: fcitx5-diagnose"
  echo "============================================================"
}
main "$@"
`,

  // ─── NixOS ───
  "nixos": (params) => `# ${params.distroName} ${params.editionLabel} - 한글 입력기 설정 (configuration.nix)
# 이 스크립트는 실행 파일이 아닙니다. configuration.nix 에 병합하세요.

# 1. fcitx5 패키지 및 한글 엔진 추가
{ config, pkgs, ... }:

{
  # fcitx5 활성화
  i18n.inputMethod = {
    enabled = "fcitx5";
    fcitx5 = {
      enable = true;
      engines = with pkgs; [ fcitx5-hangul ];  # 한국어
      # engines = with pkgs; [ fcitx5-hangul fcitx5-mozc fcitx5-chinese-addons ]; # 다국어
    };
  };

  # 2. 환경변수 (Wayland/X11 공통)
  environment.sessionVariables = {
    GTK_IM_MODULE = "fcitx";
    QT_IM_MODULE = "fcitx";
    XMODIFIERS = "@im=fcitx";
  };

  # 3. 자동시작 (플라즈마/그놈 등에서 자동 처리됨)
  # Wayland 세션용 추가 환경변수
  wayland = {
    enable = true;
    windowManager.fcitx5 = {
      enable = true;
    };
  };

  # 4. 사용자별 Fcitx5 설정 (홈 매니저 사용 시)
  # home-manager 옵션 예시:
  # programs.fcitx5 = {
  #   enable = true;
  #   engines = with pkgs; [ fcitx5-hangul ];
  #   configFile = {
  #     "profile" = ''
  #       [Groups/0]
  #       Name=Default
  #       Default Layout=us
  #       DefaultIM=keyboard-us
  #       [Groups/0/Items/0]
  #       Name=keyboard-us
  #       Layout=
  #       [Groups/0/Items/1]
  #       Name=hangul
  #       Layout=
  #       [GroupOrder]
  #       0=Default
  #     '';
  #     "config" = ''
  #       [Hotkey]
  #       EnumerateWithTriggerKeys=True
  #       SkipFirst=False
  #       [Hotkey/TriggerKeys]
  #       0=Hangul
  #       1=Control+space
  #     '';
  #   };
  # };

  # 5. 폰트 (한글 렌더링)
  fonts.packages = with pkgs; [ noto-fonts-cjk noto-fonts-emoji ];
}

# ─── 적용 방법 ───
# 1. 위 내용을 /etc/nixos/configuration.nix 에 병합
# 2. sudo nixos-rebuild switch
# 3. 재부팅 또는 재로그인
# 4. fcitx5-configtool 로 엔진 순서/핫키 확인
`,

  // ─── fcitx5-hangul (표준 범용) ───
  "fcitx5": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - fcitx5-hangul (표준 범용 한글 입력기) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/fcitx5/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.5.2"
LOG_FILE="/var/log/install-hangul-${params.scriptId}.log"
${PREFLIGHT_COMMON_BASH}
require_root() { [[ $EUID -eq 0 ]] || err "root 권한 필요: sudo bash $0"; }

detect_user() {
  local u="\${SUDO_USER:-}"
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

detect_fcitx5_family() {
  local _id="\${1,,}" _like="\${2,,}"
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
  if [[ "$_id" == "nixos" ]]; then
    err "NixOS는 선언적 OS이므로 스크립트로 패키지를 직접 설치하지 않습니다. scripts/nixos/ 설정 조각을 /etc/nixos/configuration.nix 에 병합하세요."
  fi
  if [[ "$_id" == "kaos" ]]; then
    echo "kaos"; return
  fi
  if [[ "$_id" == "altlinux" || -f /etc/altlinux-release ]]; then
    err "ALT Linux(apt-rpm)는 전용 스크립트(scripts/alt/alt-workstation.sh) 또는 만능 install.sh 사용을 권장합니다."
  fi
  case "$_id" in
    rhel|almalinux|rocky|centos|ol|oreon|eurolinux|scientific|springdale|virtuozzo|circle|navy|miraclelinux)
      if command -v dnf >/dev/null 2>&1; then
        echo "rhel"; return
      fi
      ;;
  esac
  case " $_like " in
    *" rhel "*|*" centos "*|*" rocky "*|*" almalinux "*)
      if command -v dnf >/dev/null 2>&1; then
        echo "rhel"; return
      fi
      ;;
  esac
  case "$_id" in
    mageia|openmandriva*)
      err "Mandriva 계열(\${_id})은 전용 스크립트(scripts/mandriva-family/) 또는 만능 install.sh 사용을 권장합니다."
      ;;
  esac
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
  err "지원하지 않는 배포판입니다 (ID=\${_id:-unknown}). Debian/Ubuntu, Fedora, Arch, openSUSE 계열에서 실행하거나 만능 install.sh를 사용하세요."
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

  local _os_id="" _os_like=""
  if [[ -f /etc/os-release ]]; then
    IFS='|' read -r _os_id _os_like < <(
      # shellcheck disable=SC1091
      . /etc/os-release
      printf '%s|%s\\n' "\${ID:-}" "\${ID_LIKE:-}"
    )
  fi

  local _fcitx5_family _ow_note _kde_will _kde6_wayland
  local _pkg_summary="" _cfg_summary="" _extra_warn="" _need_reboot=false
  _fcitx5_family=$(detect_fcitx5_family "$_os_id" "$_os_like")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")
  _kde_will=$(will_configure_kde "false" "$TARGET_HOME" "$DESKTOP")
  _kde6_wayland=$(is_kde6_wayland "$_kde_will" "$SESSION_TYPE" "$DESKTOP")

  case "$_fcitx5_family" in
    debian)
      _pkg_summary="   - apt-get update 후 레거시 fcitx(4.x) 제거 및 autoremove --purge\\n   - apt-get install: fcitx5, fcitx5-hangul, fcitx5-config-qt, fcitx5-configtool, fonts-noto-cjk (+ 사용 가능한 gtk3/gtk4/qt5/qt6 프론트엔드)"
      _cfg_summary="   - im-config -n fcitx5 적용 및 데스크톱 단축키 충돌 해제(gsettings)\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/environment.d/fcitx5.conf, /etc/environment, $TARGET_HOME/.xsessionrc\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 팝업 등록"
      _extra_warn=" ⚠️  참고: 기존 fcitx 4.x 패키지 및 미사용 의존성(autoremove)이 제거됩니다."
      ;;
    vanilla)
      _need_reboot=true
      _pkg_summary="   - abroot pkg add: fcitx5, fcitx5-hangul, fcitx5-config-qt, fcitx5-frontend-gtk3/gtk4/qt5/qt6, fonts-noto-cjk"
      _cfg_summary="   - 데스크톱 단축키 충돌 해제(gsettings)\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/environment.d/fcitx5.conf, $TARGET_HOME/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 팝업 등록"
      _extra_warn=" ⚠️  참고: 불변 OS(ABRoot)이므로 설치 완료 후 반드시 재부팅이 필요합니다."
      ;;
    fedora)
      _pkg_summary="   - dnf install -y: fcitx5, fcitx5-hangul, fcitx5-configtool, fcitx5-gtk, fcitx5-qt, fcitx5-autostart, google-noto-sans-cjk-ttc-fonts (또는 google-noto-cjk-fonts)"
      _cfg_summary="   - alternatives --set xinputrc, /etc/X11/xinit/xinput.d/fcitx5.conf 수정, ibus 사용자 서비스 비활성화\\n   - 데스크톱 단축키 충돌 해제(gsettings)\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/environment.d/fcitx5.conf, /etc/environment, ~/.bash_profile (또는 ~/.profile) 및 첫 로그인 1회 안내 팝업 등록"
      ;;
    rhel)
      if ! { rpm -q fcitx5 fcitx5-hangul >/dev/null 2>&1 || (dnf -q info fcitx5 >/dev/null 2>&1 && dnf -q info fcitx5-hangul >/dev/null 2>&1); }; then
        err "RHEL / Rocky / AlmaLinux 기본 및 EPEL 저장소에서는 fcitx5 / fcitx5-hangul 패키지를 기본 제공하지 않습니다. ibus-hangul (scripts/ibus/ibus-fedora.sh) 또는 kime (scripts/kime/kime-fedora.sh) 사용을 권장하며, fcitx5를 사용하려면 COPR 등 fcitx5 제공 저장소를 먼저 활성화한 뒤 다시 실행하세요."
      fi
      _pkg_summary="   - dnf install -y: fcitx5, fcitx5-hangul (+ 사용 가능한 fcitx5-configtool/gtk/qt/autostart 및 Noto CJK 폰트)"
      _cfg_summary="   - alternatives --set xinputrc, /etc/X11/xinit/xinput.d/fcitx5.conf 수정, ibus 사용자 서비스 비활성화\\n   - 데스크톱 단축키 충돌 해제(gsettings)\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/environment.d/fcitx5.conf, /etc/environment, ~/.bash_profile (또는 ~/.profile) 및 첫 로그인 1회 안내 팝업 등록"
      _extra_warn=" ⚠️  참고: RHEL 계열에서 활성화된 서드파티/COPR 저장소의 fcitx5 패키지로 설치합니다."
      ;;
    fedora-atomic)
      _need_reboot=true
      _pkg_summary="   - rpm-ostree install --idempotent --allow-inactive: fcitx5, fcitx5-hangul, fcitx5-gtk, fcitx5-qt, fcitx5-configtool, fcitx5-autostart, google-noto-sans-cjk-ttc-fonts"
      _cfg_summary="   - 데스크톱 단축키 충돌 해제(gsettings)\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/environment.d/fcitx5.conf 및 첫 로그인 1회 안내 팝업 등록"
      _extra_warn=" ⚠️  참고: 불변 OS(rpm-ostree)이므로 설치 완료 후 반드시 재부팅이 필요합니다."
      ;;
    arch)
      _pkg_summary="   - pacman -Syu --needed --noconfirm: fcitx5-im, fcitx5-hangul, fcitx5-configtool, fcitx5-gtk, fcitx5-qt, noto-fonts-cjk (미설치 시 부분 업그레이드 방지)"
      _cfg_summary="   - 데스크톱 단축키 충돌 해제(gsettings)\\n   - $TARGET_HOME/.config/environment.d/fcitx5.conf, /etc/environment, $TARGET_HOME/.xprofile\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop, systemctl --user enable fcitx5 및 첫 로그인 1회 안내 팝업 등록"
      ;;
    steamos)
      _pkg_summary="   - steamos-readonly disable → pacman-key init/populate → pacman -Sy --needed: fcitx5-im, fcitx5-hangul, fcitx5-configtool, fcitx5-gtk, fcitx5-qt, noto-fonts-cjk → steamos-readonly enable"
      _cfg_summary="   - $TARGET_HOME/.config/environment.d/fcitx5.conf, /etc/environment, $TARGET_HOME/.xprofile\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 팝업 등록"
      _extra_warn=" ⚠️  참고: SteamOS 루트 파일시스템 읽기 전용 상태를 일시 해제했다가 복구합니다."
      ;;
    kaos)
      _pkg_summary="   - pacman -Syu --needed --noconfirm: fcitx5, fcitx5-hangul, fcitx5-qt, fcitx5-configtool, noto-fonts-cjk (미설치 시 부분 업그레이드 방지)"
      _cfg_summary="   - $TARGET_HOME/.config/environment.d/fcitx5.conf, /etc/environment, $TARGET_HOME/.xprofile\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 팝업 등록"
      ;;
    opensuse|opensuse-transactional)
      if [[ "$_fcitx5_family" == "opensuse-transactional" ]]; then
        _need_reboot=true
        _pkg_summary="   - transactional-update --non-interactive pkg install: fcitx5, fcitx5-hangul, fcitx5-configtool (+ 사용 가능한 fcitx5-gtk3/gtk4, fcitx5-qt5/qt6, google-noto-sans-cjk-fonts)"
        _extra_warn=" ⚠️  참고: Transactional OS이므로 설치 완료 후 반드시 재부팅이 필요합니다."
      else
        _pkg_summary="   - zypper --non-interactive install -y: fcitx5, fcitx5-hangul, fcitx5-configtool (+ 사용 가능한 fcitx5-gtk3/gtk4, fcitx5-qt5/qt6, google-noto-sans-cjk-fonts)"
      fi
      _cfg_summary="   - alternatives --set xinputrc, /etc/X11/xinit/xinput.d/fcitx5.conf 수정, ibus 사용자 서비스 비활성화\\n   - 데스크톱 단축키 충돌 해제(gsettings)\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/environment.d/fcitx5.conf, /etc/environment, ~/.profile (또는 ~/.bash_profile, INPUT_METHOD=fcitx 포함)\\n   - $TARGET_HOME/.config/autostart/org.fcitx.Fcitx5.desktop (비-KDE6-Wayland) 및 첫 로그인 1회 안내 팝업 등록"
      ;;
  esac

  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary" "$_kde6_wayland")
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME" "$_extra_warn")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn" "$DESKTOP")

  confirm_before_changes \\
    "${params.distroName} ${params.editionLabel}" \\
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \\
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \\
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== ${params.distroName} ${params.editionLabel} 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME (family=$_fcitx5_family, id=\${_os_id:-unknown})"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. 배포판별 패키지 설치 및 충돌 입력기 비활성화
  case "$_fcitx5_family" in
    debian)
      log "[1/5] 레거시 fcitx4 제거, fcitx5 및 한글 폰트 설치 (apt-get)..."
      export DEBIAN_FRONTEND=noninteractive
      apt-get update -qq
      apt-get purge -y -qq fcitx fcitx-bin fcitx-data fcitx-hangul fcitx-config-gtk \\
        fcitx-frontend-all fcitx-frontend-gtk2 fcitx-frontend-gtk3 fcitx-frontend-qt5 2>/dev/null || true
      apt-get autoremove --purge -y -qq
      local _deb_pkgs=(fcitx5 fcitx5-hangul fcitx5-config-qt fcitx5-configtool fonts-noto-cjk)
      local _opt_pkg
      for _opt_pkg in fcitx5-frontend-gtk3 fcitx5-frontend-gtk4 fcitx5-frontend-qt5 fcitx5-frontend-qt6; do
        if apt-cache show "$_opt_pkg" >/dev/null 2>&1; then
          _deb_pkgs+=("$_opt_pkg")
        fi
      done
      apt-get install -y -qq "\${_deb_pkgs[@]}"
      ;;
    vanilla)
      log "[1/5] fcitx5 및 한글 폰트 추가 (abroot)..."
      abroot pkg add \\
        fcitx5 fcitx5-hangul fcitx5-config-qt \\
        fcitx5-frontend-gtk3 fcitx5-frontend-gtk4 \\
        fcitx5-frontend-qt5 fcitx5-frontend-qt6 fonts-noto-cjk
      ;;
    fedora)
      log "[1/5] fcitx5 및 한글 폰트 설치 (dnf)..."
      dnf install -y -q \\
        fcitx5 fcitx5-hangul fcitx5-configtool fcitx5-gtk fcitx5-qt \\
        fcitx5-autostart
      dnf install -y -q google-noto-sans-cjk-ttc-fonts 2>/dev/null || dnf install -y -q google-noto-cjk-fonts 2>/dev/null || true
      ;;
    rhel)
      log "[1/5] fcitx5 및 한글 폰트 설치 (dnf)..."
      local _rhel_pkgs=(fcitx5 fcitx5-hangul)
      local _opt_pkg
      for _opt_pkg in fcitx5-configtool fcitx5-gtk fcitx5-qt fcitx5-autostart; do
        if rpm -q "$_opt_pkg" >/dev/null 2>&1 || dnf -q info "$_opt_pkg" >/dev/null 2>&1; then
          _rhel_pkgs+=("$_opt_pkg")
        fi
      done
      dnf install -y -q "\${_rhel_pkgs[@]}"
      dnf install -y -q google-noto-sans-cjk-ttc-fonts 2>/dev/null || dnf install -y -q google-noto-cjk-fonts 2>/dev/null || true
      ;;
    fedora-atomic)
      log "[1/5] fcitx5 및 한글 폰트 레이어링 (rpm-ostree)..."
      rpm-ostree install --idempotent --allow-inactive \\
        fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool fcitx5-autostart \\
        google-noto-sans-cjk-ttc-fonts
      ;;
    arch)
      log "[1/5] fcitx5 및 한글 폰트 설치 (pacman)..."
      if pacman -T fcitx5 fcitx5-hangul fcitx5-configtool fcitx5-gtk fcitx5-qt noto-fonts-cjk >/dev/null 2>&1; then
        ok "필수 패키지가 이미 설치되어 있어 pacman 업그레이드를 건너뜁니다"
      else
        pacman -Syu --needed --noconfirm \\
          fcitx5-im fcitx5-hangul fcitx5-configtool \\
          fcitx5-gtk fcitx5-qt noto-fonts-cjk
      fi
      ;;
    steamos)
      trap steamos_cleanup EXIT
      log "[1/5] SteamOS 읽기 전용 해제 및 fcitx5 설치..."
      steamos-readonly disable
      pacman-key --init
      pacman-key --populate archlinux holo 2>/dev/null || pacman-key --populate
      # SteamOS Holo uses immutable A/B snapshot repos; avoid pacman -Syu
      pacman -Sy --needed --noconfirm \\
        fcitx5-im fcitx5-hangul fcitx5-configtool \\
        fcitx5-gtk fcitx5-qt noto-fonts-cjk
      steamos-readonly enable
      ;;
    kaos)
      log "[1/5] fcitx5 및 한글 폰트 설치 (KaOS pacman)..."
      if pacman -T fcitx5 fcitx5-hangul fcitx5-qt fcitx5-configtool noto-fonts-cjk >/dev/null 2>&1; then
        ok "필수 패키지가 이미 설치되어 있어 pacman 업그레이드를 건너뜁니다"
      else
        pacman -Syu --needed --noconfirm \\
          fcitx5 fcitx5-hangul fcitx5-qt fcitx5-configtool noto-fonts-cjk
      fi
      ;;
    opensuse|opensuse-transactional)
      local _suse_pkgs=(fcitx5 fcitx5-hangul fcitx5-configtool)
      local _opt_pkg
      if command -v zypper >/dev/null 2>&1; then
        zypper --non-interactive --gpg-auto-import-keys refresh || true
        for _opt_pkg in fcitx5-gtk3 fcitx5-gtk4 fcitx5-qt5 fcitx5-qt6 google-noto-sans-cjk-fonts; do
          if zypper --non-interactive --no-refresh se -x -t package "$_opt_pkg" >/dev/null 2>&1; then
            _suse_pkgs+=("$_opt_pkg")
          fi
        done
      fi
      if [[ "$_fcitx5_family" == "opensuse-transactional" ]]; then
        log "[1/5] fcitx5 및 한글 폰트 설치 (transactional-update)..."
        transactional-update --non-interactive pkg install "\${_suse_pkgs[@]}"
      else
        log "[1/5] fcitx5 및 한글 폰트 설치 (zypper)..."
        if ! zypper --non-interactive --gpg-auto-import-keys install -y "\${_suse_pkgs[@]}"; then
          warn "zypper 설치 실패 — 미러 메타데이터 강제 갱신(refresh -f) 후 재시도합니다..."
          zypper --non-interactive --gpg-auto-import-keys refresh -f || true
          zypper --non-interactive --gpg-auto-import-keys install -y "\${_suse_pkgs[@]}"
        fi
      fi
      ;;
  esac
  ok "패키지 설치 완료"
  disable_conflicting_imes "fcitx5" "$USER" "$TARGET_HOME" "$TARGET_UID" "$DESKTOP"

  # 2. 입력 프레임워크 등록 및 데스크톱 단축키 충돌 해제
  log "[2/5] 입력 프레임워크 등록 및 데스크톱 단축키 충돌 해제 ($DESKTOP)..."
  case "$_fcitx5_family" in
    debian)
      if command -v im-config >/dev/null 2>&1; then
        run_as_user_sh "$USER" "im-config -n fcitx5" 2>/dev/null || warn "im-config 실패 (수동 실행 필요)"
      fi
      ;;
    fedora|rhel|opensuse|opensuse-transactional)
      if [[ -f /etc/X11/xinit/xinput.d/fcitx5.conf ]] && command -v alternatives >/dev/null 2>&1; then
        alternatives --set xinputrc /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
      fi
      sed -i 's/IMSETTINGS_IGNORE_SESSION=\\*-wayland/#IMSETTINGS_IGNORE_SESSION=*-wayland/' /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
      sed -i 's/XIM=fcitx5/XIM=fcitx/' /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
      run_as_user_sh "$USER" "systemctl --user disable ibus 2>/dev/null || true" || true
      ;;
  esac

  if command -v gsettings >/dev/null 2>&1; then
    case "$DESKTOP" in
      *CINNAMON*|*cinnamon*)
        run_user_gsettings "$USER" "$TARGET_UID" "$TARGET_HOME" set org.cinnamon.desktop.keybindings.wm switch-input-source "[]" 2>/dev/null || true
        run_user_gsettings "$USER" "$TARGET_UID" "$TARGET_HOME" set org.cinnamon.desktop.keybindings.wm switch-input-source-backward "[]" 2>/dev/null || true
        run_user_gsettings "$USER" "$TARGET_UID" "$TARGET_HOME" set org.gnome.desktop.wm.keybindings switch-input-source "[]" 2>/dev/null || true
        run_user_gsettings "$USER" "$TARGET_UID" "$TARGET_HOME" set org.gnome.desktop.wm.keybindings switch-input-source-backward "[]" 2>/dev/null || true
        ;;
      *GNOME*|*gnome*|*UNITY*|*unity*|*PANTHEON*|*pantheon*|*BUDGIE*|*budgie*|*COSMIC*|*cosmic*)
        run_user_gsettings "$USER" "$TARGET_UID" "$TARGET_HOME" set org.gnome.desktop.wm.keybindings switch-input-source "[]" 2>/dev/null || true
        run_user_gsettings "$USER" "$TARGET_UID" "$TARGET_HOME" set org.gnome.desktop.wm.keybindings switch-input-source-backward "[]" 2>/dev/null || true
        ;;
      *XFCE*|*xfce*)
        run_user_gsettings "$USER" "$TARGET_UID" "$TARGET_HOME" set org.xfce.keyboard-shortcuts.commands.custom "<Super>space" "" 2>/dev/null || true
        run_user_gsettings "$USER" "$TARGET_UID" "$TARGET_HOME" set org.xfce.keyboard-shortcuts.commands.custom "<Shift><Super>space" "" 2>/dev/null || true
        ;;
      *MATE*|*mate*)
        run_user_gsettings "$USER" "$TARGET_UID" "$TARGET_HOME" set org.mate.Marco.global-keybindings switch-input-source "" 2>/dev/null || true
        run_user_gsettings "$USER" "$TARGET_UID" "$TARGET_HOME" set org.mate.Marco.global-keybindings switch-input-source-backward "" 2>/dev/null || true
        run_user_gsettings "$USER" "$TARGET_UID" "$TARGET_HOME" set org.gnome.desktop.wm.keybindings switch-input-source "[]" 2>/dev/null || true
        run_user_gsettings "$USER" "$TARGET_UID" "$TARGET_HOME" set org.gnome.desktop.wm.keybindings switch-input-source-backward "[]" 2>/dev/null || true
        ;;
      *KDE*|*kde*|*PLASMA*|*plasma*)
        ;;
      *)
        run_user_gsettings "$USER" "$TARGET_UID" "$TARGET_HOME" set org.gnome.desktop.wm.keybindings switch-input-source "[]" 2>/dev/null || true
        run_user_gsettings "$USER" "$TARGET_UID" "$TARGET_HOME" set org.gnome.desktop.wm.keybindings switch-input-source-backward "[]" 2>/dev/null || true
        ;;
    esac
  fi
  ok "프레임워크 및 단축키 정리 완료"

  # 3. Fcitx5 프로필/핫키 구성
  log "[3/5] Fcitx5 프로필·핫키 구성..."
  local _fcitx5_uid _fcitx5_svcs=()
  _fcitx5_uid=$(id -u "$USER" 2>/dev/null || echo "")
  if [[ -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]] && command -v systemctl >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    local _svc
    while IFS= read -r _svc; do
      if [[ -n "$_svc" ]]; then
        sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
          systemctl --user stop "$_svc" 2>/dev/null || true
        _fcitx5_svcs+=("$_svc")
      fi
    done < <(sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
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
  if [[ \${#_fcitx5_svcs[@]} -gt 0 && -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]]; then
    local _svc
    for _svc in "\${_fcitx5_svcs[@]}"; do
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
        systemctl --user start "$_svc" 2>/dev/null || true
    done
  fi
  ok "프로필·핫키 설정 완료"

  # 4. Wayland / X11 환경변수 설정
  log "[4/5] Wayland/X11 환경변수 설정..."
  case "$_fcitx5_family" in
    debian)
      write_fcitx5_env "$_kde6_wayland" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "true" "true" "$TARGET_HOME/.xsessionrc" "false"
      ;;
    vanilla)
      write_fcitx5_env "$_kde6_wayland" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "false" "true" "$TARGET_HOME/.xsessionrc" "true"
      ;;
    fedora-atomic)
      write_fcitx5_env "$_kde6_wayland" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "false" "true" "$TARGET_HOME/.xprofile" "true"
      ;;
    arch|steamos|kaos)
      write_fcitx5_env "$_kde6_wayland" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "true" "true" "$TARGET_HOME/.xprofile" "false"
      ;;
    fedora|rhel|opensuse|opensuse-transactional)
      local _allow_pending="false" _is_suse_im="false"
      [[ "$_fcitx5_family" == "opensuse-transactional" ]] && _allow_pending="true"
      [[ "$_fcitx5_family" == "opensuse" || "$_fcitx5_family" == "opensuse-transactional" ]] && _is_suse_im="true"
      if [[ "$_kde6_wayland" == "true" ]]; then
        write_fcitx5_env "$_kde6_wayland" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "true" "true" "$TARGET_HOME/.xprofile" "$_allow_pending" "false"
      else
        write_fcitx5_env "$_kde6_wayland" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "true" "true" "" "$_allow_pending" "$_is_suse_im"
        local PROFILE_FILE="$TARGET_HOME/.bash_profile"
        if [[ "$_is_suse_im" == "true" ]]; then
          PROFILE_FILE="$TARGET_HOME/.profile"
          [[ ! -f "$PROFILE_FILE" && -f "$TARGET_HOME/.bash_profile" ]] && PROFILE_FILE="$TARGET_HOME/.bash_profile"
        else
          [[ -f "$TARGET_HOME/.profile" && ! -f "$PROFILE_FILE" ]] && PROFILE_FILE="$TARGET_HOME/.profile"
        fi
        if ! grep -q "GTK_IM_MODULE=fcitx" "$PROFILE_FILE" 2>/dev/null; then
          if [[ -s "$PROFILE_FILE" ]] && [[ -n "$(tail -c 1 "$PROFILE_FILE" 2>/dev/null | tr -d '\\n')" ]]; then
            printf '\\n' >> "$PROFILE_FILE"
          fi
          cat >> "$PROFILE_FILE" <<'EOF'

# fcitx5 환경변수
export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx
EOF
          if [[ "$_is_suse_im" == "true" ]] && ! grep -qE '^[[:space:]]*(export[[:space:]]+)?INPUT_METHOD=['\\''"]?fcitx5?['\\''"]?[[:space:]]*(#.*)?$' "$PROFILE_FILE" 2>/dev/null; then
            echo "export INPUT_METHOD=fcitx" >> "$PROFILE_FILE"
          fi
        elif [[ "$_is_suse_im" == "true" ]] && ! grep -qE '^[[:space:]]*(export[[:space:]]+)?INPUT_METHOD=['\\''"]?fcitx5?['\\''"]?[[:space:]]*(#.*)?$' "$PROFILE_FILE" 2>/dev/null; then
          if [[ -s "$PROFILE_FILE" ]] && [[ -n "$(tail -c 1 "$PROFILE_FILE" 2>/dev/null | tr -d '\\n')" ]]; then
            printf '\\n' >> "$PROFILE_FILE"
          fi
          echo "export INPUT_METHOD=fcitx" >> "$PROFILE_FILE"
        fi
        chown "$TARGET_UID:$TARGET_GID" "$PROFILE_FILE"
      fi
      ;;
  esac
  ok "환경변수 설정 완료"

  # 5. 자동시작 등록 및 KDE / 첫 로그인 안내 마무리
  log "[5/5] 자동시작 등록 및 마무리..."
  if [[ ( "$_fcitx5_family" == "opensuse" || "$_fcitx5_family" == "opensuse-transactional" ) && "$_kde6_wayland" != "true" ]]; then
    local ADIR="$TARGET_HOME/.config/autostart"
    mkdir -p "$ADIR"
    cat > "$ADIR/org.fcitx.Fcitx5.desktop" <<'EOF'
[Desktop Entry]
Type=Application
Name=Fcitx 5
Exec=fcitx5 -d
X-GNOME-Autostart-enabled=true
Hidden=false
NoDisplay=false
EOF
    chown -R "$TARGET_UID:$TARGET_GID" "$ADIR"
    if command -v systemctl >/dev/null 2>&1 && [[ -S "/run/user/$TARGET_UID/bus" ]]; then
      run_as_user_sh "$USER" 'systemctl --user daemon-reload 2>/dev/null || true' || true
    fi
    ok "자동시작 등록"
  elif [[ "$_fcitx5_family" == "debian" || "$_fcitx5_family" == "vanilla" || "$_fcitx5_family" == "arch" || "$_fcitx5_family" == "steamos" || "$_fcitx5_family" == "kaos" ]] || \\
     { [[ "$_kde6_wayland" != "true" && ! -f /etc/xdg/autostart/org.fcitx.Fcitx5.desktop && ! -f /etc/xdg/autostart/fcitx5-wayland-launcher.desktop ]]; }; then
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
  fi
  if [[ "$_fcitx5_family" == "arch" ]]; then
    run_as_user_sh "$USER" "systemctl --user enable fcitx5 2>/dev/null || true" || true
  fi
${KDE_VIRTUAL_KEYBOARD_SNIPPET(false)}
${FCITX5_POST_LOGIN_GUIDE_SNIPPET(params.distroName, params.scriptId)}
  echo
  echo "============================================================"
  if [[ "$_need_reboot" == "true" ]]; then
    echo " 🎉 fcitx5-hangul 설치 완료! 불변 OS이므로 반드시 재부팅하세요 (systemctl reboot)."
  else
    echo " 🎉 fcitx5-hangul 설치 완료! 로그아웃 후 다시 로그인하세요."
  fi
  echo " 전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space"
  echo " 설정: fcitx5-configtool | 진단: fcitx5-diagnose"
  echo " 로그: $LOG_FILE"
  echo "============================================================"
}
main "$@"
`,

  // ─── ibus-hangul (GNOME 친화 대안) ───
  "ibus": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - ibus-hangul (GNOME 친화 대안 한글 입력기) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/ibus/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.5.2"
LOG_FILE="/var/log/install-ibus-${params.scriptId}.log"
${PREFLIGHT_COMMON_BASH}
require_root() { [[ $EUID -eq 0 ]] || err "root 권한 필요: sudo bash $0"; }

detect_user() {
  local u="\${SUDO_USER:-}"
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
  local _id="\${1,,}"
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
  err "지원하지 않는 배포판입니다 (ID=\${_id:-unknown}). Debian/Ubuntu, Fedora/RHEL, Arch, openSUSE 계열에서 실행하세요."
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
      echo "\${ID:-}"
    )
  fi

  local _ibus_family _pkg_summary="" _cfg_summary="" _extra_warn="" _need_reboot=false
  _ibus_family=$(detect_ibus_family "$_os_id")

  case "$_ibus_family" in
    debian)
      _pkg_summary="   - apt-get update && apt-get install: ibus, ibus-hangul, im-config, fonts-noto-cjk (+ ibus-gtk3/gtk4 사용 가능 시)"
      _cfg_summary="   - im-config -n ibus\\n   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\\n   - fcitx5 사용자 서비스 비활성화(있는 경우)\\n   - $TARGET_HOME/.config/environment.d/ibus.conf, $TARGET_HOME/.xsessionrc\\n   - 첫 로그인 1회 안내 팝업 등록"
      _cfg_summary="   - im-config -n ibus\\n   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\\n   - fcitx5 사용자 서비스 비활성화(있는 경우)\\n   - $TARGET_HOME/.config/environment.d/ibus.conf, $TARGET_HOME/.xsessionrc\\n   - 첫 로그인 1회 안내 팝업 등록"
      ;;
    vanilla)
      _need_reboot=true
      _pkg_summary="   - abroot pkg add: ibus, ibus-hangul, im-config, fonts-noto-cjk"
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\\n   - fcitx5 사용자 서비스 비활성화(있는 경우)\\n   - $TARGET_HOME/.config/environment.d/ibus.conf, $TARGET_HOME/.xsessionrc\\n   - 첫 로그인 1회 안내 팝업 등록"
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\\n   - fcitx5 사용자 서비스 비활성화(있는 경우)\\n   - $TARGET_HOME/.config/environment.d/ibus.conf, $TARGET_HOME/.xsessionrc\\n   - 첫 로그인 1회 안내 팝업 등록"
      _extra_warn=" ⚠️  참고: 불변 OS(ABRoot)이므로 설치 완료 후 반드시 재부팅이 필요합니다."
      ;;
    fedora)
      _pkg_summary="   - dnf install: ibus, ibus-hangul, ibus-setup, google-noto-sans-cjk-ttc-fonts (또는 google-noto-cjk-fonts)"
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\\n   - alternatives --set xinputrc (ibus.conf 있는 경우), systemctl --user enable ibus / disable fcitx5\\n   - $TARGET_HOME/.config/environment.d/ibus.conf, ~/.bash_profile (또는 ~/.profile)\\n   - 비-GNOME 데스크톱 시 $TARGET_HOME/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\\n   - 첫 로그인 1회 안내 팝업 등록"
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\\n   - alternatives --set xinputrc (ibus.conf 있는 경우), systemctl --user enable ibus / disable fcitx5\\n   - $TARGET_HOME/.config/environment.d/ibus.conf, ~/.bash_profile (또는 ~/.profile)\\n   - 비-GNOME 데스크톱 시 $TARGET_HOME/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\\n   - 첫 로그인 1회 안내 팝업 등록"
      ;;
    fedora-atomic)
      _need_reboot=true
      _pkg_summary="   - rpm-ostree install --idempotent --allow-inactive: ibus, ibus-hangul, ibus-setup, google-noto-sans-cjk-ttc-fonts"
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\\n   - fcitx5 사용자 서비스 비활성화(있는 경우)\\n   - $TARGET_HOME/.config/environment.d/ibus.conf, ~/.bash_profile (또는 ~/.profile)\\n   - 비-GNOME 데스크톱 시 $TARGET_HOME/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\\n   - 첫 로그인 1회 안내 팝업 등록"
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\\n   - fcitx5 사용자 서비스 비활성화(있는 경우)\\n   - $TARGET_HOME/.config/environment.d/ibus.conf, ~/.bash_profile (또는 ~/.profile)\\n   - 비-GNOME 데스크톱 시 $TARGET_HOME/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\\n   - 첫 로그인 1회 안내 팝업 등록"
      _extra_warn=" ⚠️  참고: 불변 OS(rpm-ostree)이므로 설치 완료 후 반드시 재부팅이 필요합니다."
      ;;
    arch)
      _pkg_summary="   - pacman -Syu --needed: ibus, ibus-hangul, noto-fonts-cjk (미설치 시 부분 업그레이드 방지)"
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\\n   - fcitx5 사용자 서비스 비활성화(있는 경우)\\n   - $TARGET_HOME/.config/environment.d/ibus.conf, $TARGET_HOME/.xprofile\\n   - 비-GNOME 데스크톱 시 $TARGET_HOME/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\\n   - 첫 로그인 1회 안내 팝업 등록"
      ;;
    steamos)
      _pkg_summary="   - steamos-readonly disable → pacman-key init/populate → pacman -Sy --needed: ibus, ibus-hangul, noto-fonts-cjk → steamos-readonly enable"
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\\n   - $TARGET_HOME/.config/environment.d/ibus.conf, $TARGET_HOME/.xprofile\\n   - 비-GNOME 데스크톱 시 $TARGET_HOME/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\\n   - 첫 로그인 1회 안내 팝업 등록"
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
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\\n   - alternatives --set xinputrc (ibus.conf 있는 경우), systemctl --user enable ibus / disable fcitx5\\n   - $TARGET_HOME/.config/environment.d/ibus.conf, ~/.bash_profile (또는 ~/.profile)\\n   - 비-GNOME 데스크톱 시 $TARGET_HOME/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\\n   - 첫 로그인 1회 안내 팝업 등록"
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\\n   - alternatives --set xinputrc (ibus.conf 있는 경우), systemctl --user enable ibus / disable fcitx5\\n   - $TARGET_HOME/.config/environment.d/ibus.conf, ~/.bash_profile (또는 ~/.profile)\\n   - 비-GNOME 데스크톱 시 $TARGET_HOME/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\\n   - 첫 로그인 1회 안내 팝업 등록"
      ;;
  esac

  _extra_warn=$(append_conflict_ime_warn "ibus" "$EXISTING_IME" "$_extra_warn" "$DESKTOP")
  if [[ "$DESKTOP" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] && "$SESSION_TYPE" == "wayland" ]]; then
    local _kde_warn=" ⚠️  참고: KDE Plasma Wayland 환경에서는 IBus보다 Fcitx 5가 더 안정적으로 권장됩니다."
    if [[ -n "$_extra_warn" ]]; then
      _extra_warn="\${_extra_warn}\\n\${_kde_warn}"
    else
      _extra_warn="$_kde_warn"
    fi
  fi

  confirm_before_changes \\
    "${params.distroName} ${params.editionLabel} (ibus-hangul)" \\
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \\
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \\
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== ${params.distroName} ${params.editionLabel} ibus-hangul 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME (family=$_ibus_family, id=\${_os_id:-unknown})"
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
      apt-get install -y -qq "\${_deb_pkgs[@]}"
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
      zypper --non-interactive install -y ibus ibus-hangul
      zypper --non-interactive install -y google-noto-sans-cjk-fonts 2>/dev/null || true
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
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
      gsettings set org.gnome.desktop.input-sources sources "$sources" 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
      gsettings set org.freedesktop.ibus.general preload-engines "$preload" 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
      gsettings set org.freedesktop.ibus.general.hotkey triggers "$triggers" 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
      gsettings set org.freedesktop.ibus.engine.hangul switch-keys "$hangul_switch_keys" 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
      gsettings set org.freedesktop.ibus.engine.hangul initial-input-mode 'latin' 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
      ibus write-cache 2>/dev/null || true
    if command -v systemctl >/dev/null 2>&1; then
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
        systemctl --user disable fcitx5 2>/dev/null || true
    fi
    if pgrep -u "$TARGET_UID" -x ibus-daemon >/dev/null 2>&1; then
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
        ibus restart 2>/dev/null || true
    fi
  else
    run_as_user_sh "$USER" "gsettings set org.gnome.desktop.input-sources sources \\"$sources\\"" 2>/dev/null || true
    run_as_user_sh "$USER" "gsettings set org.freedesktop.ibus.general preload-engines \\"$preload\\"" 2>/dev/null || true
    run_as_user_sh "$USER" "gsettings set org.freedesktop.ibus.general.hotkey triggers \\"$triggers\\"" 2>/dev/null || true
    run_as_user_sh "$USER" "gsettings set org.freedesktop.ibus.engine.hangul switch-keys \\"$hangul_switch_keys\\"" 2>/dev/null || true
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
        sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$TARGET_UID/bus" \\
          systemctl --user enable ibus 2>/dev/null || true
      else
        run_as_user_sh "$USER" "systemctl --user enable ibus 2>/dev/null || true" || true
      fi
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

  if [[ "$_ibus_family" != "debian" && "$_ibus_family" != "vanilla" && ! "\${DESKTOP,,}" == *"gnome"* ]]; then
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
${IBUS_POST_LOGIN_GUIDE_SNIPPET(params.distroName, params.scriptId)}
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
  echo "============================================================"
}
main "$@"
`,

  // ─── kime (대안) ───
  "kime": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - kime (Rust 기반 경량 한글 입력기) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/kime/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.5.2"
LOG_FILE="/var/log/install-kime-${params.scriptId}.log"
${PREFLIGHT_COMMON_BASH}
require_root() { [[ $EUID -eq 0 ]] || err "root 권한 필요: sudo bash $0"; }

detect_user() {
  local u="\${SUDO_USER:-}"
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
      echo "\${_eff##*/}"
    fi
  elif command -v wget >/dev/null 2>&1; then
    local _loc
    _loc=$(wget --spider -S "$_url" 2>&1 | awk '/^[[:space:]]*[Ll]ocation:/ {u=$2} END {gsub(/\\r/,"",u); print u}' || true)
    if [[ -n "$_loc" && "$_loc" == */tag/* ]]; then
      echo "\${_loc##*/}"
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
  local _id="\${1,,}" _like="\${2,,}" _deb_ver_file="\${3:-/etc/debian_version}"
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
  case "\${1,,}" in
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
  local _v="\${1,,}"
  _v=$(printf '%s' "$_v" | tr -d '[:space:]')
  _v="\${_v%%/*}"
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
      printf '%s|%s|%s\\n' "\${DISTRIB_ID:-}" "\${DISTRIB_RELEASE:-}" "\${DISTRIB_CODENAME:-}"
    )
  fi
}

resolve_kime_deb_target() {
  local _id="\${1,,}" _ver="$2" _os_cn="\${3,,}" _ubuntu_cn="\${4,,}" _debian_cn="\${5,,}"
  local _upstream_lsb="\${6:-/etc/upstream-release/lsb-release}"
  local _debian_ver_file="\${7:-/etc/debian_version}"
  local _uver="" _dcn="" _up_id="" _up_rel="" _up_cn=""

  if [[ "$_id" == "ubuntu" ]]; then
    if [[ "$_ver" =~ ^[0-9]+\\.[0-9]+$ ]]; then
      echo "ubuntu-\${_ver}"; return
    fi
    _uver=$(ubuntu_codename_to_ver "\${_ubuntu_cn:-$_os_cn}")
    if [[ -n "$_uver" ]]; then
      echo "ubuntu-\${_uver}"; return
    fi
  fi

  if [[ -n "$_ubuntu_cn" ]]; then
    if [[ -f "$_upstream_lsb" ]]; then
      IFS='|' read -r _up_id _up_rel _up_cn < <(read_upstream_lsb "$_upstream_lsb")
      if [[ "\${_up_id,,}" == "ubuntu" && "$_up_rel" =~ ^[0-9]+\\.[0-9]+$ ]]; then
        echo "ubuntu-\${_up_rel}"; return
      fi
    fi
    _uver=$(ubuntu_codename_to_ver "$_ubuntu_cn")
    if [[ -n "$_uver" ]]; then
      echo "ubuntu-\${_uver}"; return
    fi
  fi

  if [[ "$_id" == "debian" ]]; then
    if [[ -n "$_os_cn" ]]; then
      echo "debian-\${_os_cn}"; return
    fi
    _dcn=$(debian_ver_to_codename "$_ver")
    if [[ -z "$_dcn" && -f "$_debian_ver_file" ]]; then
      local _dv=""
      IFS= read -r _dv < "$_debian_ver_file" || true
      _dcn=$(debian_ver_to_codename "$_dv")
    fi
    if [[ -n "$_dcn" ]]; then
      echo "debian-\${_dcn}"; return
    fi
  fi

  if [[ -n "$_debian_cn" ]]; then
    echo "debian-\${_debian_cn}"; return
  fi

  if [[ -f "$_upstream_lsb" ]]; then
    IFS='|' read -r _up_id _up_rel _up_cn < <(read_upstream_lsb "$_upstream_lsb")
    if [[ "\${_up_id,,}" == "ubuntu" ]]; then
      if [[ "$_up_rel" =~ ^[0-9]+\\.[0-9]+$ ]]; then
        echo "ubuntu-\${_up_rel}"; return
      fi
      _uver=$(ubuntu_codename_to_ver "$_up_cn")
      if [[ -n "$_uver" ]]; then
        echo "ubuntu-\${_uver}"; return
      fi
    elif [[ "\${_up_id,,}" == "debian" && -n "$_up_cn" ]]; then
      echo "debian-\${_up_cn,,}"; return
    fi
  fi

  if [[ -f "$_debian_ver_file" ]]; then
    local _dv=""
    IFS= read -r _dv < "$_debian_ver_file" || true
    _dcn=$(debian_ver_to_codename "$_dv")
    if [[ -n "$_dcn" ]]; then
      echo "debian-\${_dcn}"; return
    fi
  fi

  if [[ -n "$_os_cn" ]]; then
    _dcn=$(debian_ver_to_codename "$_os_cn")
    if [[ -n "$_dcn" ]]; then
      echo "debian-\${_dcn}"; return
    fi
  fi

  echo ""
}

resolve_kime_deb_release() {
  local _deb_arch="$1" _deb_target="$2"
  local _api_url="\${KIME_RELEASE_API_URL:-https://api.github.com/repos/Riey/kime/releases/latest}"
  local _latest_url="\${KIME_RELEASE_LATEST_URL:-https://github.com/Riey/kime/releases/latest}"
  local _api_json="" _tag="" _urls="" _html="" _paths="" _matched="" _avail="" _u _fname _re

  _api_json=$(http_get "$_api_url" 2>/dev/null || true)
  if [[ -n "$_api_json" ]]; then
    _tag=$(printf '%s\\n' "$_api_json" | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\\([^"]*\\)".*/\\1/p' | head -n1 || true)
    _urls=$(printf '%s\\n' "$_api_json" | grep -oE 'https://github\\.com/Riey/kime/releases/download/[^"]+\\.deb' | sort -u || true)
  fi

  if [[ -z "$_urls" ]]; then
    _tag=$(http_latest_tag "$_latest_url" || true)
    if [[ -n "$_tag" ]]; then
      _html=$(http_get "https://github.com/Riey/kime/releases/expanded_assets/\${_tag}" 2>/dev/null || true)
      _paths=$(printf '%s\\n' "$_html" | grep -oE '/Riey/kime/releases/download/[^"]+\\.deb' | sort -u || true)
      if [[ -n "$_paths" ]]; then
        _urls=$(printf '%s\\n' "$_paths" | sed 's|^|https://github.com|')
      fi
    fi
  fi

  _re="(_\${_deb_arch}_\${_deb_target}\\.deb$|_\${_deb_target}_[^/]+_\${_deb_arch}\\.deb$)"
  for _u in $_urls; do
    _fname="\${_u##*/}"
    if [[ -n "$_avail" ]]; then
      _avail="\${_avail} \${_fname}"
    else
      _avail="$_fname"
    fi
    if [[ -z "$_matched" && "$_fname" =~ $_re ]]; then
      _matched="$_u"
    fi
  done

  printf '%s|%s|%s\\n' "$_tag" "$_matched" "$_avail"
}

check_fedora_copr_support() {
  local _ver="$1" _arch="$2" _pretty="$3"
  local _copr_url="\${KIME_COPR_API_URL:-https://copr.fedorainfracloud.org/api_3/project?ownername=toroidalfox&projectname=kime}"
  local _api_json="" _chroots="" _target_chroot _avail_line=""

  _api_json=$(http_get "$_copr_url" 2>/dev/null || true)
  if [[ -z "$_api_json" ]]; then
    warn "Fedora COPR API 조회 실패 — dnf로 직접 시도합니다." >&2
    return 0
  fi

  _chroots=$(printf '%s\\n' "$_api_json" | grep -oE '"fedora-[a-z0-9]+-[a-z0-9_]+"' | tr -d '"' | sort -u || true)
  if [[ -z "$_chroots" ]]; then
    warn "Fedora COPR 지원 목록 파싱 실패 — dnf로 직접 시도합니다." >&2
    return 0
  fi

  _target_chroot="fedora-\${_ver}-\${_arch}"
  if [[ "\${_pretty,,}" == *"rawhide"* ]]; then
    _target_chroot="fedora-rawhide-\${_arch}"
  fi

  if printf '%s\\n' "$_chroots" | grep -qxF "$_target_chroot"; then
    return 0
  fi

  _avail_line=$(printf '%s\\n' "$_chroots" | awk 'NR>1{printf ", "} {printf "%s", $0}' || true)
  echo "$_avail_line"
  return 1
}

_KIME_AUR_TMP=""

cleanup_kime_aur_tmp() {
  if [[ -n "\${_KIME_AUR_TMP:-}" && -d "$_KIME_AUR_TMP" ]]; then
    rm -rf "$_KIME_AUR_TMP"
    _KIME_AUR_TMP=""
  fi
}

run_as_target_user() {
  local _u="$1" _home="$2"
  shift 2
  if command -v runuser >/dev/null 2>&1; then
    runuser -u "$_u" -- env \\
      HOME="$_home" \\
      USER="$_u" \\
      LOGNAME="$_u" \\
      PATH="\${_home}/.cargo/bin:/usr/local/sbin:/usr/local/bin:/usr/bin:/bin" \\
      "$@" </dev/null
  else
    local _cmd=""
    printf -v _cmd '%q ' env \\
      "HOME=$_home" \\
      "USER=$_u" \\
      "LOGNAME=$_u" \\
      "PATH=\${_home}/.cargo/bin:/usr/local/sbin:/usr/local/bin:/usr/bin:/bin" \\
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
  local _aur_pkg="\${KIME_AUR_PKG:-kime}"
  local _aur_url="\${KIME_AUR_GIT_URL:-https://aur.archlinux.org/\${_aur_pkg}.git}"
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

  local _aur_src="\${_aur_tmp}/src"
  local _aur_out="\${_aur_tmp}/pkg"
  local _aur_build="\${_aur_tmp}/build"
  local _aur_log="\${_aur_tmp}/log"
  mkdir -p "$_aur_out" "$_aur_build" "$_aur_log"
  chown -R "\${_uid}:\${_gid}" "$_aur_tmp"

  log "   → AUR 저장소 클론 (\${_aur_pkg}, 사용자: \${_user})..."
  if ! run_as_target_user "$_user" "$_home" git clone --depth=1 "$_aur_url" "$_aur_src"; then
    err "AUR 저장소 클론 실패: $_aur_url"
  fi

  local _srcinfo=""
  _srcinfo=$(run_as_target_user "$_user" "$_home" env -C "$_aur_src" makepkg --printsrcinfo 2>/dev/null || true)
  if [[ -z "$_srcinfo" && -f "\${_aur_src}/.SRCINFO" ]]; then
    _srcinfo=$(cat "\${_aur_src}/.SRCINFO")
  fi

  local -a _aur_deps=()
  if [[ -n "$_srcinfo" ]]; then
    mapfile -t _aur_deps < <(printf '%s\\n' "$_srcinfo" | parse_srcinfo_deps | sort -u)
  fi

  if [[ \${#_aur_deps[@]} -gt 0 ]]; then
    local _missing_raw=""
    _missing_raw=$(pacman -T "\${_aur_deps[@]}" 2>/dev/null || true)
    if [[ -n "$_missing_raw" ]]; then
      local -a _missing_pkgs=()
      mapfile -t _missing_pkgs < <(printf '%s\\n' "$_missing_raw" | sed 's/[<>=].*$//' | awk 'NF' | sort -u)
      if [[ \${#_missing_pkgs[@]} -gt 0 ]]; then
        if [[ "$_pacman_synced" == "true" ]]; then
          log "   → AUR 빌드/런타임 의존성 설치 (pacman): \${_missing_pkgs[*]}"
          pacman -S --needed --noconfirm --asdeps "\${_missing_pkgs[@]}" </dev/null || err "kime 의존성 패키지 설치에 실패했습니다: \${_missing_pkgs[*]}"
        else
          log "   → 시스템 동기화/업그레이드 및 AUR 빌드/런타임 의존성 설치 (pacman -Syu): \${_missing_pkgs[*]}"
          pacman -Syu --needed --noconfirm --asdeps "\${_missing_pkgs[@]}" </dev/null || err "kime 의존성 패키지 설치에 실패했습니다: \${_missing_pkgs[*]}"
          _pacman_synced=true
        fi
      fi
    fi
  fi

  log "   → AUR 패키지 빌드 (makepkg, 사용자: \${_user})..."
  if ! run_as_target_user "$_user" "$_home" env -C "$_aur_src" \\
       makepkg --noconfirm --nosign --clean \\
       "PKGDEST=\${_aur_out}" \\
       "SRCDEST=\${_aur_src}" \\
       "BUILDDIR=\${_aur_build}" \\
       "LOGDEST=\${_aur_log}"; then
    err "makepkg를 통한 kime 빌드에 실패했습니다. 빌드 로그와 네트워크 상태를 확인하세요."
  fi

  local -a _pkg_files=()
  local _f
  shopt -s nullglob
  for _f in "\${_aur_out}"/*.pkg.tar*; do
    case "$_f" in
      *.sig|*-debug-*.pkg.tar*) continue ;;
      *) _pkg_files+=("$_f") ;;
    esac
  done
  shopt -u nullglob

  if [[ \${#_pkg_files[@]} -eq 0 ]]; then
    err "빌드된 kime 패키지 파일(.pkg.tar*)을 찾을 수 없습니다."
  fi

  log "   → 빌드된 패키지 설치 (pacman -U)..."
  pacman -U --noconfirm "\${_pkg_files[@]}" </dev/null || err "pacman -U를 통한 kime 패키지 설치에 실패했습니다."

  cleanup_kime_aur_tmp
  trap - EXIT
}

ver_ge() {
  local _v1="$1" _v2="$2"
  [[ "$(printf '%s\\n%s\\n' "$_v2" "$_v1" | sort -V | head -n1)" == "$_v2" ]]
}

resolve_kime_latest_tag() {
  if [[ -n "\${KIME_SOURCE_TAG:-}" ]]; then
    echo "$KIME_SOURCE_TAG"
    return 0
  fi
  local _api_url="\${KIME_RELEASE_API_URL:-https://api.github.com/repos/Riey/kime/releases/latest}"
  local _latest_url="\${KIME_RELEASE_LATEST_URL:-https://github.com/Riey/kime/releases/latest}"
  local _api_json="" _tag=""
  _api_json=$(http_get "$_api_url" 2>/dev/null || true)
  if [[ -n "$_api_json" ]]; then
    _tag=$(printf '%s\\n' "$_api_json" | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\\([^"]*\\)".*/\\1/p' | head -n1 || true)
  fi
  if [[ -z "$_tag" ]]; then
    _tag=$(http_latest_tag "$_latest_url" || true)
  fi
  echo "$_tag"
}

_KIME_SRC_TMP=""

cleanup_kime_src_tmp() {
  if [[ -n "\${_KIME_SRC_TMP:-}" && -d "$_KIME_SRC_TMP" ]]; then
    rm -rf "$_KIME_SRC_TMP"
    _KIME_SRC_TMP=""
  fi
}

enable_el_crb_repo() {
  if ! dnf config-manager --help >/dev/null 2>&1; then
    dnf install -y 'dnf-command(config-manager)' </dev/null 2>/dev/null || \\
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
      log "   → CRB/CodeReady 저장소 활성화 (\${_crb_repo})..."
      if command -v crb >/dev/null 2>&1 && [[ "\${_crb_repo,,}" == "crb" ]]; then
        crb enable >/dev/null 2>&1 || true
      fi
      if ! dnf repolist --enabled 2>/dev/null | awk '{print $1}' | grep -qxF "$_crb_repo"; then
        dnf config-manager --set-enabled "$_crb_repo" </dev/null 2>/dev/null || \\
          dnf config-manager setopt "\${_crb_repo}.enabled=1" </dev/null 2>/dev/null || \\
          warn "CRB 저장소(\${_crb_repo}) 자동 활성화 실패 — 기존 활성 저장소로 진행합니다."
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
  dnf install -y </dev/null \\
    gcc gcc-c++ clang-devel pkgconf-pkg-config ninja-build rust cargo tar gzip \\
    dbus-devel libxcb-devel fontconfig-devel freetype-devel libxkbcommon-devel wayland-devel \\
    || err "kime 소스 빌드에 필요한 기본 개발 패키지 설치에 실패했습니다."
  dnf install -y meson </dev/null 2>/dev/null || true

  local -a _opt_pkgs=()
  local _op
  for _op in gtk3-devel gtk4-devel qt6-qtbase-devel qt6-qtbase-private-devel qt5-qtbase-devel qt5-qtbase-private-devel; do
    if rpm -q "$_op" >/dev/null 2>&1 || dnf -q -C info "$_op" >/dev/null 2>&1 || dnf -q info "$_op" >/dev/null 2>&1; then
      _opt_pkgs+=("$_op")
    fi
  done
  if [[ \${#_opt_pkgs[@]} -gt 0 ]]; then
    log "   → GUI 프론트엔드 개발 패키지 설치 (dnf): \${_opt_pkgs[*]}"
    dnf install -y "\${_opt_pkgs[@]}" </dev/null || err "GUI 프론트엔드 개발 패키지 설치에 실패했습니다: \${_opt_pkgs[*]}"
  else
    warn "사용 가능한 GTK/Qt 개발 패키지를 찾지 못했습니다. Wayland/XIM 백엔드 위주로 빌드합니다."
  fi

  dnf install -y -q google-noto-sans-cjk-ttc-fonts </dev/null 2>/dev/null || \\
    dnf install -y -q google-noto-sans-cjk-fonts </dev/null 2>/dev/null || \\
    dnf install -y -q google-noto-cjk-fonts </dev/null 2>/dev/null || true

  local _src_tmp
  _src_tmp=$(mktemp -d /var/tmp/kime-src-build.XXXXXX)
  _KIME_SRC_TMP="$_src_tmp"
  trap cleanup_kime_src_tmp EXIT

  mkdir -p "\${_src_tmp}/extract"
  chown -R "\${_uid}:\${_gid}" "$_src_tmp"

  local _meson_bin="" _meson_ver="0"
  _meson_bin=$(command -v meson || true)
  if [[ -n "$_meson_bin" ]]; then
    _meson_ver=$("$_meson_bin" --version 2>/dev/null | head -n1 || echo "0")
  fi
  if [[ -z "$_meson_bin" ]] || ! ver_ge "$_meson_ver" "1.1"; then
    log "   → Meson 1.1+ 필요 (현재: \${_meson_ver:-미설치}) — 임시 venv에 meson 설치 중..."
    command -v python3 >/dev/null 2>&1 || err "Meson 1.1+ 및 python3가 없어 kime 빌드를 진행할 수 없습니다."
    run_as_target_user "$_user" "$_home" python3 -m venv "\${_src_tmp}/meson-venv" || err "임시 Python venv 생성 실패 (meson 설치 불가)"
    run_as_target_user "$_user" "$_home" "\${_src_tmp}/meson-venv/bin/pip" install --quiet 'meson>=1.1' || err "임시 venv에 meson>=1.1 설치 실패"
    _meson_bin="\${_src_tmp}/meson-venv/bin/meson"
  fi

  local _ninja_bin=""
  _ninja_bin=$(command -v ninja || command -v ninja-build || true)
  [[ -n "$_ninja_bin" ]] || err "ninja 빌드 도구를 찾을 수 없습니다."
  run_as_target_user "$_user" "$_home" sh -c 'command -v cargo >/dev/null 2>&1' || err "사용자($_user) 환경에서 cargo를 찾을 수 없습니다."

  local _tar_url="\${KIME_SOURCE_TARBALL_URL:-https://github.com/Riey/kime/archive/refs/tags/\${_tag}.tar.gz}"
  local _tar_path="\${_src_tmp}/kime-\${_tag}.tar.gz"
  log "   → kime 소스 아카이브 다운로드 (\${_tag})..."
  http_download "$_tar_url" "$_tar_path" || err "kime 소스 아카이브 다운로드 실패: $_tar_url"
  chown "\${_uid}:\${_gid}" "$_tar_path"

  run_as_target_user "$_user" "$_home" tar -xzf "$_tar_path" -C "\${_src_tmp}/extract" || err "kime 소스 아카이브 압축 해제 실패"
  local _src_dir=""
  _src_dir=$(find "\${_src_tmp}/extract" -mindepth 1 -maxdepth 1 -type d | head -n1 || true)
  [[ -n "$_src_dir" && -f "\${_src_dir}/meson.build" ]] || err "압축 해제된 kime 소스 디렉터리에서 meson.build를 찾을 수 없습니다."
  local _build_dir="\${_src_dir}/build"

  local _libdir="lib"
  [[ -d /usr/lib64 ]] && _libdir="lib64"

  local -a _build_env=("NINJA=\${_ninja_bin}")
  if [[ -x "\${_home}/.cargo/bin/cargo" ]]; then
    _build_env+=("CARGO_HOME=\${_home}/.cargo" "RUSTUP_HOME=\${_home}/.rustup")
  else
    mkdir -p "\${_src_tmp}/cargo-home"
    chown "\${_uid}:\${_gid}" "\${_src_tmp}/cargo-home"
    _build_env+=("CARGO_HOME=\${_src_tmp}/cargo-home")
  fi
  if [[ -n "\${LIBCLANG_PATH:-}" ]]; then
    _build_env+=("LIBCLANG_PATH=\${LIBCLANG_PATH}")
  elif [[ -d "/usr/\${_libdir}" ]] && compgen -G "/usr/\${_libdir}/libclang.so*" >/dev/null; then
    _build_env+=("LIBCLANG_PATH=/usr/\${_libdir}")
  fi

  log "   → Meson 빌드 구성 (사용자: \${_user}, libdir=\${_libdir})..."
  run_as_target_user "$_user" "$_home" env "\${_build_env[@]}" \\
    "$_meson_bin" setup "$_build_dir" "$_src_dir" \\
    --prefix=/usr \\
    --sysconfdir=/etc \\
    --libdir="$_libdir" \\
    --buildtype=release \\
    -Dcargo_profile=release \\
    -Dinstall_headers=true \\
    -Dinstall_docs=true \\
    || err "kime Meson 구성(meson setup)에 실패했습니다. 빌드 로그를 확인하세요."

  log "   → kime 컴파일 중 (Rust + C/C++, 수 분 소요될 수 있음)..."
  run_as_target_user "$_user" "$_home" env "\${_build_env[@]}" \\
    "$_ninja_bin" -C "$_build_dir" \\
    || err "kime 소스 빌드(ninja)에 실패했습니다."

  log "   → 빌드된 kime 시스템 설치 (meson install --no-rebuild)..."
  "$_meson_bin" install -C "$_build_dir" --no-rebuild \\
    || err "kime 설치(meson install)에 실패했습니다."

  ldconfig 2>/dev/null || true
  if command -v gtk-query-immodules-3.0-64 >/dev/null 2>&1; then
    gtk-query-immodules-3.0-64 --update-cache 2>/dev/null || true
  elif command -v gtk-query-immodules-3.0 >/dev/null 2>&1; then
    gtk-query-immodules-3.0 --update-cache 2>/dev/null || true
  fi
  if [[ -d "/usr/\${_libdir}/gtk-4.0/4.0.0/immodules" ]]; then
    if command -v gio-querymodules-64 >/dev/null 2>&1; then
      gio-querymodules-64 "/usr/\${_libdir}/gtk-4.0/4.0.0/immodules" 2>/dev/null || true
    elif command -v gio-querymodules >/dev/null 2>&1; then
      gio-querymodules "/usr/\${_libdir}/gtk-4.0/4.0.0/immodules" 2>/dev/null || true
    fi
  fi
  if command -v gtk-update-icon-cache >/dev/null 2>&1; then
    gtk-update-icon-cache -q /usr/share/icons/hicolor 2>/dev/null || true
  fi
  if command -v restorecon >/dev/null 2>&1; then
    local -a _rc_paths=()
    local _rc_p
    for _rc_p in \\
      /usr/bin/kime /usr/bin/kime-check /usr/bin/kime-indicator \\
      /usr/bin/kime-candidate-window /usr/bin/kime-xim /usr/bin/kime-wayland \\
      /usr/bin/kime-xdg-autostart \\
      "/usr/\${_libdir}/libkime_engine.so" \\
      "/usr/\${_libdir}/gtk-3.0/3.0.0/immodules" \\
      "/usr/\${_libdir}/gtk-4.0/4.0.0/immodules" \\
      "/usr/\${_libdir}/qt5/plugins/platforminputcontexts" \\
      "/usr/\${_libdir}/qt6/plugins/platforminputcontexts" \\
      /etc/xdg/autostart/kime.desktop \\
      /usr/share/applications/kime.desktop \\
      /usr/share/icons/hicolor/64x64/apps; do
      [[ -e "$_rc_p" ]] && _rc_paths+=("$_rc_p")
    done
    if [[ \${#_rc_paths[@]} -gt 0 ]]; then
      restorecon -RF "\${_rc_paths[@]}" 2>/dev/null || true
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
      printf '%s|%s|%s|%s|%s|%s\\n' \\
        "\${ID:-}" "\${ID_LIKE:-}" "\${VERSION_ID:-}" "\${VERSION_CODENAME:-}" \\
        "\${UBUNTU_CODENAME:-}" "\${DEBIAN_CODENAME:-}"
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
        _pkg_summary="   - 누락된 빌드 도구(base-devel, git) 또는 AUR 의존성이 있을 경우 pacman -Syu --needed --noconfirm 실행 (부분 업그레이드 방지)\\n   - AUR (kime): 일반 사용자($USER) 권한으로 git clone 및 makepkg 빌드 (sudo 재호출 없음)\\n   - pacman -U --noconfirm kime-*.pkg.tar.* (root, paru/yay 호환 — 별도 AUR 헬퍼 불필요)"
      fi
      ;;
    fedora)
      if [[ -e /run/ostree-booted ]]; then
        err "Fedora Atomic(Silverblue/Kinoite 등) 환경은 dnf/COPR 대신 rpm-ostree 레이어링이 필요합니다. 수동 설치: https://github.com/Riey/kime"
      fi
      local _fedora_arch _copr_target _copr_avail=""
      _fedora_arch=$(uname -m)
      _copr_target="fedora-\${_os_ver}-\${_fedora_arch}"
      if [[ "\${OS_NAME,,}" == *"rawhide"* ]]; then
        _copr_target="fedora-rawhide-\${_fedora_arch}"
      fi
      if ! _copr_avail=$(check_fedora_copr_support "$_os_ver" "$_fedora_arch" "$OS_NAME"); then
        err "Fedora COPR(toroidalfox/kime)에서 현재 버전(\${_copr_target})을 지원하지 않습니다. 지원 대상: \${_copr_avail:-없음} | 수동 빌드: https://github.com/Riey/kime"
      fi
      _pkg_summary="   - Fedora COPR (toroidalfox/kime, \${_copr_target}): dnf copr enable -y toroidalfox/kime && dnf install -y kime"
      ;;
    rhel)
      if [[ -e /run/ostree-booted ]]; then
        err "불변형 EL/Atomic 환경에서는 dnf 소스 자동 빌드를 지원하지 않습니다. 수동 확인: https://github.com/Riey/kime"
      fi
      if ! command -v dnf >/dev/null 2>&1; then
        err "dnf를 찾을 수 없습니다. RHEL/Rocky/AlmaLinux 계열에서만 실행할 수 있습니다."
      fi
      if [[ "\${KIME_FORCE_REBUILD:-0}" != "1" ]] && command -v kime >/dev/null 2>&1 && command -v kime-wayland >/dev/null 2>&1 && [[ -f /usr/share/applications/kime.desktop ]]; then
        _kime_rhel_installed="true"
        _pkg_summary="   - kime (EL 소스 빌드): 이미 설치됨 ($(kime --version 2>/dev/null | head -n1 || echo installed)) — 빌드·설치 건너뜀 (설정만 적용)"
      else
        _kime_tag=$(resolve_kime_latest_tag)
        if [[ -z "$_kime_tag" ]]; then
          err "Riey/kime 최신 릴리스 버전을 조회하지 못했습니다. 네트워크 연결을 확인하거나 수동 빌드를 진행하세요: https://github.com/Riey/kime"
        fi
        _pkg_summary="   - CRB(CodeReady Builder) 저장소 활성화 (미활성화 시) 및 빌드 의존성 설치 (dnf: gcc-c++, clang-devel, meson, ninja-build, rust, cargo, dbus/xcb/wayland/xkbcommon/fontconfig/freetype-devel)\\n   - 사용 가능한 GUI 프론트엔드 개발 패키지(gtk3-devel, gtk4-devel, qt6-qtbase-devel, qt6-qtbase-private-devel 등) 및 Noto CJK 폰트 설치\\n   - Riey/kime (\${_kime_tag}) 소스 다운로드 후 일반 사용자(\${USER}) 권한으로 /var/tmp 에서 Meson/Cargo 릴리스 빌드\\n   - /usr 설치 (meson install --no-rebuild) 및 ldconfig / GTK immodule 캐시 갱신 (임시 빌드 디렉터리 자동 정리)"
        _extra_warn=" ⚠️  참고: RHEL/Rocky/AlmaLinux 등 EL 계열은 공식 저장소 및 Fedora COPR에 kime 패키지가 없어 소스를 직접 컴파일합니다 (CPU/네트워크 환경에 따라 수 분 소요, 임시 빌드 파일은 설치 후 자동 삭제)."
      fi
      ;;
    opensuse)
      if [[ "$_os_id" == "opensuse-microos" || "$_os_id" == "opensuse-aeon" || "$_os_id" == "opensuse-kalpa" ]] || \\
         { [[ ! -w /usr ]] && command -v transactional-update >/dev/null 2>&1; }; then
        err "불변형 openSUSE(\${OS_NAME})는 일반 zypper 설치 대신 transactional-update가 필요합니다. 수동 확인: https://github.com/Riey/kime"
      fi
      if ! zypper --non-interactive se -x kime >/dev/null 2>&1; then
        err "현재 설정된 openSUSE 저장소(\${OS_NAME})에 kime 패키지가 없습니다. 공식 저장소에서는 openSUSE Tumbleweed만 kime을 기본 제공합니다. 수동 설치/OBS 저장소 확인: https://github.com/Riey/kime 또는 https://software.opensuse.org/package/kime"
      fi
      _pkg_summary="   - openSUSE (\${_os_id}): zypper --non-interactive install -y kime"
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
        err "현재 OS(\${OS_NAME})의 기반 Debian/Ubuntu 버전을 판별할 수 없습니다 (/etc/os-release, /etc/debian_version 확인 필요). 수동 설치: https://github.com/Riey/kime/releases"
      fi
      local _rel_info
      _rel_info=$(resolve_kime_deb_release "$_deb_arch" "$_deb_target")
      IFS='|' read -r _kime_tag _deb_url _deb_avail <<< "$_rel_info"
      if [[ -z "$_deb_url" ]]; then
        err "Riey/kime 최신 릴리스(\${_kime_tag:-unknown})에서 호환되는 .deb를 찾지 못했습니다 (감지된 OS: \${OS_NAME} -> 대상: \${_deb_target}, 아키텍처: \${_deb_arch}). 제공 중인 패키지: \${_deb_avail:-조회 실패} | 수동 확인: https://github.com/Riey/kime/releases"
      fi
      _deb_name="\${_deb_url##*/}"
      _pkg_summary="   - 감지된 패키지 대상: \${_deb_target} (\${_deb_arch}) / 최신 릴리스: \${_kime_tag:-latest}\\n   - 다운로드: \${_deb_name}\\n   - 설치: apt-get update && apt-get install -y \${_deb_name}"
      ;;
    *)
      err "지원하지 않는 배포판: \${_os_id:-unknown} (ID_LIKE=\${_os_like:-none}). 수동 설치: https://github.com/Riey/kime"
      ;;
  esac

  local _kde_will _kde6_wayland _cfg_summary
  _kde_will=$(will_configure_kde "false" "$TARGET_HOME" "$DESKTOP")
  _kde6_wayland=$(is_kde6_wayland "$_kde_will" "$SESSION_TYPE" "$DESKTOP")
  if [[ "$_kde6_wayland" == "true" ]]; then
    _cfg_summary="   - $TARGET_HOME/.config/environment.d/kime.conf (KDE Plasma 6 Wayland 안전 모드: QT_IM_MODULES=\\"wayland;kime\\", XMODIFIERS=@im=kime — 전역 QT_IM_MODULE/GTK_IM_MODULE 미설정)"
    if [[ "$_kime_family" == "debian" ]]; then
      _cfg_summary="\${_cfg_summary}\\n   - im-config -n none (Plasma 6 Wayland 전역 QT_IM_MODULE 충돌 방지)"
      _cfg_summary="\${_cfg_summary}\\n   - $TARGET_HOME/.xsessionrc (X11 세션 폴백)"
    else
      _cfg_summary="\${_cfg_summary}\\n   - $TARGET_HOME/.xprofile (X11 세션 호환)"
    fi
  else
    _cfg_summary="   - $TARGET_HOME/.config/environment.d/kime.conf, /etc/environment"
    if [[ "$_kime_family" == "debian" ]]; then
      _cfg_summary="\${_cfg_summary}\\n   - im-config -n kime (im-config 사용 가능 시)"
    else
      _cfg_summary="\${_cfg_summary}\\n   - ~/.bash_profile (또는 ~/.zprofile / ~/.profile), $TARGET_HOME/.xprofile"
    fi
  fi
  _cfg_summary="\${_cfg_summary}\\n   - /etc/xdg/autostart/kime.desktop 확인 (없을 경우 $TARGET_HOME/.config/autostart/kime.desktop 생성)"
  if [[ "$_kde_will" == "true" ]]; then
    _cfg_summary="\${_cfg_summary}\\n   - KDE Plasma 가상 키보드 설정: $TARGET_HOME/.config/kwinrc ([Wayland] InputMethod=/usr/share/applications/kime.desktop)"
  fi
  _cfg_summary="\${_cfg_summary}\\n   - 첫 로그인 1회 안내 팝업 등록 ($TARGET_HOME/.local/bin/hangul-first-login-guide.sh)"

  _extra_warn=$(append_conflict_ime_warn "kime" "$EXISTING_IME" "$_extra_warn" "$DESKTOP")
  if [[ "\${DESKTOP,,}" == *"gnome"* && "$SESSION_TYPE" == "wayland" ]]; then
    local _gnome_warn=" ⚠️  참고: GNOME Wayland(Mutter)는 zwp_input_method_v2를 지원하지 않아 Wayland 네이티브/샌드박스 앱에서 kime 동작이 제한될 수 있습니다 (GTK/Qt IM 모듈 앱은 정상 동작, 참고: https://github.com/Riey/kime/issues/422)."
    if [[ -n "$_extra_warn" ]]; then
      _extra_warn="\${_extra_warn}\\n\${_gnome_warn}"
    else
      _extra_warn="$_gnome_warn"
    fi
  fi

  confirm_before_changes \\
    "${params.distroName} ${params.editionLabel} (kime)" \\
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \\
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \\
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== ${params.distroName} ${params.editionLabel} kime 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME (family=$_kime_family, id=\${_os_id:-unknown})"
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
        log "[1/3] kime 설치 (EL 소스 빌드: Riey/kime \${_kime_tag})..."
        install_kime_source_rhel "$USER" "$TARGET_HOME" "$TARGET_UID" "$_kime_tag"
      fi
      ;;
    opensuse)
      log "[1/3] kime 설치 (zypper)..."
      zypper --non-interactive install -y kime
      ;;
    debian)
      log "[1/3] kime 설치 (\${_deb_target} / \${_deb_name} 다운로드)..."
      local _tmp_dir _deb_path
      _tmp_dir=$(mktemp -d)
      _deb_path="\${_tmp_dir}/\${_deb_name}"
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

    local _etc_kime_re="^[[:space:]]*(GTK|QT)_IM_MODULE=['\\"]?kime['\\"]?[[:space:]]*(#.*)?$"
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
        _env_k="\${_etc_pair%%=*}"
        _env_v="\${_etc_pair#*=}"
        if ! grep -qE "^[[:space:]]*\${_env_k}=['\\"]?\${_env_v}['\\"]?[[:space:]]*(#.*)?$" /etc/environment 2>/dev/null; then
          if [[ "$_etc_header_added" != "true" ]]; then
            if [[ -s /etc/environment ]]; then
              [[ -n "$(tail -c 1 /etc/environment 2>/dev/null | tr -d '\\n')" ]] && printf '\\n' >> /etc/environment
              printf '\\n# kime 환경변수\\n' >> /etc/environment
            else
              printf '# kime 환경변수\\n' >> /etc/environment
            fi
            _etc_header_added=true
          fi
          printf '%s\\n' "$_etc_pair" >> /etc/environment
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
        /^\\[Wayland\\]$/ { in_wayland=1; found_wayland=1; print; next }
        /^\\[/ {
          if (in_wayland && !updated) { print "InputMethod=" im; updated=1 }
          in_wayland=0; print; next
        }
        in_wayland && /^InputMethod(\\[\\$e\\])?=/ {
          if (!updated) { print "InputMethod=" im; updated=1 }
          next
        }
        { print }
        END {
          if (in_wayland && !updated) { print "InputMethod=" im }
          else if (!found_wayland) { print ""; print "[Wayland]"; print "InputMethod=" im }
        }
      ' "$_kwinrc" > "\${_kwinrc}.tmp" && mv "\${_kwinrc}.tmp" "$_kwinrc"
    else
      printf '[Wayland]\\nInputMethod=%s\\n' "$_kime_desktop" > "$_kwinrc"
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
        sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_kde_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_kde_uid/bus" \\
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
Exec=\${_kime_exec}
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
${KIME_POST_LOGIN_GUIDE_SNIPPET(params.distroName, params.scriptId)}
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
`,

  // ─── Fedora Atomic (Bazzite / Aurora / Silverblue / Kinoite) ───
  "fedora-atomic": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/fedora-atomic/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.5.2"
LOG_FILE="/var/log/install-hangul-${params.scriptId}.log"
${PREFLIGHT_COMMON_BASH}
require_root() { [[ $EUID -eq 0 ]] || err "root 권한 필요: sudo bash $0"; }

detect_user() {
  local u="\${SUDO_USER:-}"
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(logname 2>/dev/null || true)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(who | awk '{print $1}' | head -1)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  err "대상 사용자 탐지 실패"
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
  _kde_will=$(will_configure_kde "${params.editionKey.includes("kde") || params.distroKey === "bazzite" || params.distroKey === "aurora" ? "true" : "false"}" "$TARGET_HOME" "$DESKTOP")
  local _kde6_wayland
  _kde6_wayland=$(is_kde6_wayland "$_kde_will" "$SESSION_TYPE")

  local _pkg_summary="   - rpm-ostree install --idempotent --allow-inactive:\\n     fcitx5, fcitx5-hangul, fcitx5-gtk, fcitx5-qt, fcitx5-configtool, fcitx5-autostart, google-noto-sans-cjk-ttc-fonts"
  local _cfg_summary="   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/environment.d/fcitx5.conf"
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary" "$_kde6_wayland")
  local _extra_warn=" ⚠️  참고: 불변 OS(rpm-ostree)이므로 설치 완료 후 반드시 재부팅이 필요합니다."
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME" "$_extra_warn")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn" "$DESKTOP")

  confirm_before_changes \
    "${params.distroName} ${params.editionLabel}" \
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== ${params.distroName} ${params.editionLabel} 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. rpm-ostree 패키지 레이어링
  log "[1/3] fcitx5 및 한글 폰트 패키지 설치 (rpm-ostree)..."
  rpm-ostree install --idempotent --allow-inactive \\
    fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool fcitx5-autostart \\
    google-noto-sans-cjk-ttc-fonts
  ok "패키지 레이어링 요청 완료"
  disable_conflicting_imes "fcitx5" "$USER" "$TARGET_HOME" "$TARGET_UID" "$DESKTOP"

  # 2. Fcitx5 프로필/핫키 구성
  log "[2/3] 사용자 Fcitx5 설정..."
  # 실행 중인 fcitx5가 종료 시 기존 프로필로 덮어쓰는 현상 방지
  local _fcitx5_uid _fcitx5_svcs=()
  _fcitx5_uid=$(id -u "$USER" 2>/dev/null || echo "")
  if [[ -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]] && command -v systemctl >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    local _svc
    while IFS= read -r _svc; do
      if [[ -n "$_svc" ]]; then
        sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
          systemctl --user stop "$_svc" 2>/dev/null || true
        _fcitx5_svcs+=("$_svc")
      fi
    done < <(sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
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
  if [[ \${#_fcitx5_svcs[@]} -gt 0 && -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]]; then
    local _svc
    for _svc in "\${_fcitx5_svcs[@]}"; do
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
        systemctl --user start "$_svc" 2>/dev/null || true
    done
  fi

  # 3. Wayland/X11 환경변수
  log "[3/3] 환경변수 설정..."
  write_fcitx5_env "$_kde6_wayland" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "false" "true" "$TARGET_HOME/.xprofile" "true"
  ok "환경변수 설정 완료"
${KDE_VIRTUAL_KEYBOARD_SNIPPET(params.editionKey.includes("kde") || params.distroKey === "bazzite" || params.distroKey === "aurora")}

  echo
  echo "============================================================"
  echo " 🎉 Fedora Atomic 설정 완료! 반드시 재부팅하세요."
  echo " 재부팅 명령: systemctl reboot"
  echo " KDE(Bazzite/Aurora/Kinoite): 가상 키보드(Fcitx 5) 자동 설정됨 (미적용 시 시스템설정 → 입력장치 → 가상키보드 확인)"
  echo " 전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space"
  echo "============================================================"
}
main "$@"
`,

  // ─── SteamOS 3.x (Steam Deck) ───
  "steamos": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/steamos/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.5.2"
LOG_FILE="/var/log/install-hangul-${params.scriptId}.log"
${PREFLIGHT_COMMON_BASH}
require_root() { [[ $EUID -eq 0 ]] || err "root 권한 필요: sudo bash $0"; }

detect_user() {
  local u="\${SUDO_USER:-}"
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(logname 2>/dev/null || true)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  echo "deck"
}

cleanup() {
  if command -v steamos-readonly >/dev/null 2>&1; then
    steamos-readonly enable 2>/dev/null || true
  fi
}

main() {
  require_root

  local USER TARGET_HOME TARGET_UID TARGET_GID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME _ow_note
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  TARGET_GID=$(id -g "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID" "$DESKTOP")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")
  local _kde6_wayland
  _kde6_wayland=$(is_kde6_wayland "true" "$SESSION_TYPE")

  local _pkg_summary="   - steamos-readonly disable → pacman-key --init/--populate →\\n     pacman -Sy --needed: fcitx5-im, fcitx5-hangul, fcitx5-configtool, fcitx5-gtk, fcitx5-qt, noto-fonts-cjk\\n   - 설치 후 steamos-readonly enable 복구"
  local _cfg_summary="   - /etc/environment 환경변수 추가\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop\\n   - KDE Plasma 가상 키보드 설정: $TARGET_HOME/.config/kwinrc ([Wayland] InputMethod)"
  _cfg_summary=$(append_kde_cfg_line "false" "$TARGET_HOME" "$_cfg_summary" "$_kde6_wayland")
  local _extra_warn=" ⚠️  참고: SteamOS 루트 파일시스템 읽기 전용 상태를 일시 해제했다가 복구합니다."
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME" "$_extra_warn")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn" "$DESKTOP")

  confirm_before_changes \
    "${params.distroName} ${params.editionLabel}" \
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  trap cleanup EXIT
  log "=== ${params.distroName} ${params.editionLabel} 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. 읽기 전용 해제 및 pacman 키 초기화
  log "[1/4] steamos-readonly 해제 및 패키지 설치..."
  steamos-readonly disable
  pacman-key --init
  pacman-key --populate archlinux holo 2>/dev/null || pacman-key --populate
  # SteamOS Holo uses immutable A/B snapshot repos; avoid pacman -Syu
  pacman -Sy --needed --noconfirm \\
    fcitx5-im fcitx5-hangul fcitx5-configtool fcitx5-gtk fcitx5-qt noto-fonts-cjk
  ok "패키지 설치 완료"
  disable_conflicting_imes "fcitx5" "$USER" "$TARGET_HOME" "$TARGET_UID" "$DESKTOP"

  # 2. 시스템 환경변수
  log "[2/4] 시스템 환경변수 설정..."
  write_fcitx5_env "$_kde6_wayland" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "true" "true" "$TARGET_HOME/.xprofile" "false"
  ok "환경변수 추가"

  # 3. 사용자 Fcitx5 설정 및 자동시작
  log "[3/4] 사용자 설정 및 자동시작 등록..."
  # 실행 중인 fcitx5가 종료 시 기존 프로필로 덮어쓰는 현상 방지
  local _fcitx5_uid _fcitx5_svcs=()
  _fcitx5_uid=$(id -u "$USER" 2>/dev/null || echo "")
  if [[ -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]] && command -v systemctl >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    local _svc
    while IFS= read -r _svc; do
      if [[ -n "$_svc" ]]; then
        sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
          systemctl --user stop "$_svc" 2>/dev/null || true
        _fcitx5_svcs+=("$_svc")
      fi
    done < <(sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
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
  if [[ \${#_fcitx5_svcs[@]} -gt 0 && -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]]; then
    local _svc
    for _svc in "\${_fcitx5_svcs[@]}"; do
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
        systemctl --user start "$_svc" 2>/dev/null || true
    done
  fi

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
${KDE_VIRTUAL_KEYBOARD_SNIPPET(true)}
  ok "사용자 설정 완료"

  # 4. 읽기 전용 복구
  log "[4/4] steamos-readonly 복구..."
  steamos-readonly enable
  ok "읽기 전용 복구 완료"

  echo
  echo "============================================================"
  echo " 🎉 SteamOS 설치 완료! 재로그인 또는 재부팅 필요"
  echo " KDE: 가상 키보드(Fcitx 5) 자동 설정됨 (미적용 시 시스템설정 → 입력장치 → 가상키보드 확인)"
  echo " 참고: SteamOS 메이저 업데이트 시 루트 패키지가 초기화될 수 있습니다."
  echo "============================================================"
}
main "$@"
`,

  // ─── RHEL / AlmaLinux / Rocky Linux / CentOS Stream ───
  "rhel-family": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - 한글 입력기(ibus-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/rhel-family/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.5.2"
LOG_FILE="/var/log/install-hangul-${params.scriptId}.log"
${PREFLIGHT_COMMON_BASH}
require_root() { [[ $EUID -eq 0 ]] || err "root 권한 필요: sudo bash $0"; }

detect_user() {
  local u="\${SUDO_USER:-}"
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(logname 2>/dev/null || true)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(who | awk '{print $1}' | head -1)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  err "대상 사용자 탐지 실패"
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

  local _pkg_summary="   - dnf install -y: ibus-hangul, ibus-setup, google-noto-sans-cjk-ttc-fonts (또는 google-noto-cjk-fonts)"
  local _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\\n   - 실행 중인 ibus-daemon 재시작\\n   - $TARGET_HOME/.config/environment.d/ibus.conf, ~/.bash_profile (또는 ~/.profile)"
  local _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\\n   - 실행 중인 ibus-daemon 재시작\\n   - $TARGET_HOME/.config/environment.d/ibus.conf, ~/.bash_profile (또는 ~/.profile)"
  local _extra_warn
  _extra_warn=$(append_conflict_ime_warn "ibus" "$EXISTING_IME" "" "$DESKTOP")

  confirm_before_changes \
    "${params.distroName} ${params.editionLabel} (ibus-hangul)" \
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== ${params.distroName} ${params.editionLabel} 한글 입력기(ibus-hangul) 설치 (v$SCRIPT_VERSION) ==="
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
  local sources="[('ibus', 'hangul')]"
  local preload="['hangul']"
  local triggers="['<Control>space', 'Hangul']"
  local hangul_switch_keys="Hangul,Control+space"
  if [ -S "/run/user/$TARGET_UID/bus" ]; then
    local bus="unix:path=/run/user/$TARGET_UID/bus"
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
      gsettings set org.gnome.desktop.input-sources sources "$sources" 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
      gsettings set org.freedesktop.ibus.general preload-engines "$preload" 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
      gsettings set org.freedesktop.ibus.general.hotkey triggers "$triggers" 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
      gsettings set org.freedesktop.ibus.engine.hangul switch-keys "$hangul_switch_keys" 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
      gsettings set org.freedesktop.ibus.engine.hangul initial-input-mode 'latin' 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
      ibus write-cache 2>/dev/null || true
    if pgrep -u "$TARGET_UID" -x ibus-daemon >/dev/null 2>&1; then
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
        ibus restart 2>/dev/null || true
    fi
  else
    run_as_user_sh "$USER" "gsettings set org.gnome.desktop.input-sources sources \\"$sources\\"" 2>/dev/null || true
    run_as_user_sh "$USER" "gsettings set org.freedesktop.ibus.general preload-engines \\"$preload\\"" 2>/dev/null || true
    run_as_user_sh "$USER" "gsettings set org.freedesktop.ibus.general.hotkey triggers \\"$triggers\\"" 2>/dev/null || true
    run_as_user_sh "$USER" "gsettings set org.freedesktop.ibus.engine.hangul switch-keys \\"$hangul_switch_keys\\"" 2>/dev/null || true
    run_as_user_sh "$USER" "gsettings set org.freedesktop.ibus.engine.hangul initial-input-mode 'latin'" 2>/dev/null || true
    run_as_user_sh "$USER" "ibus write-cache" 2>/dev/null || true
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
  chown -R "$TARGET_UID:$TARGET_GID" "$(dirname "$ENV_FILE")"

  local PROFILE_FILE="$TARGET_HOME/.bash_profile"
  [[ -f "$TARGET_HOME/.profile" && ! -f "$PROFILE_FILE" ]] && PROFILE_FILE="$TARGET_HOME/.profile"
  grep -q "GTK_IM_MODULE=ibus" "$PROFILE_FILE" 2>/dev/null || cat >> "$PROFILE_FILE" <<'EOF'

# ibus 환경변수
export GTK_IM_MODULE=ibus
export QT_IM_MODULE=ibus
export XMODIFIERS=@im=ibus
EOF
  chown "$TARGET_UID:$TARGET_GID" "$PROFILE_FILE"
  ok "환경변수 설정 완료"

  echo
  echo "============================================================"
  echo " 🎉 ibus-hangul 설치 완료! 재로그인 또는 재부팅 필요"
  echo " 전환: Ctrl+Space 또는 한/영 키"
  echo " 세부 설정: ibus-setup"
  echo "============================================================"
}
main "$@"
`,

  // ─── Void Linux / AgarimOS ───
  "void": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/void/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.5.2"
LOG_FILE="/var/log/install-hangul-${params.scriptId}.log"
${PREFLIGHT_COMMON_BASH}
require_root() { [[ $EUID -eq 0 ]] || err "root 권한 필요: sudo bash $0"; }

detect_user() {
  local u="\${SUDO_USER:-}"
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(logname 2>/dev/null || true)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(who | awk '{print $1}' | head -1)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  err "대상 사용자 탐지 실패"
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
  _kde_will=$(will_configure_kde "${params.editionKey.includes("kde") ? "true" : "false"}" "$TARGET_HOME" "$DESKTOP")
  local _kde6_wayland
  _kde6_wayland=$(is_kde6_wayland "$_kde_will" "$SESSION_TYPE")

  local _pkg_summary="   - xbps-install -Sy: fcitx5, fcitx5-hangul, fcitx5-gtk+3, fcitx5-gtk4,\\n     fcitx5-qt5, fcitx5-qt6, fcitx5-configtool, noto-fonts-cjk"
  local _cfg_summary="   - /etc/environment, $TARGET_HOME/.xprofile\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록"
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary" "$_kde6_wayland")
  local _extra_warn
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn" "$DESKTOP")

  confirm_before_changes \
    "${params.distroName} ${params.editionLabel}" \
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== ${params.distroName} ${params.editionLabel} 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. 패키지 설치 (xbps)
  log "[1/4] fcitx5 및 한글 폰트 패키지 설치 (xbps-install)..."
  xbps-install -Sy fcitx5 fcitx5-hangul fcitx5-gtk+3 fcitx5-gtk4 fcitx5-qt5 fcitx5-qt6 fcitx5-configtool noto-fonts-cjk
  ok "패키지 설치 완료"
  disable_conflicting_imes "fcitx5" "$USER" "$TARGET_HOME" "$TARGET_UID" "$DESKTOP"

  # 2. 시스템 및 사용자 환경변수
  log "[2/4] 환경변수 설정..."
  write_fcitx5_env "$_kde6_wayland" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "true" "true" "$TARGET_HOME/.xprofile" "false"
  ok "환경변수 설정 완료"

  # 3. Fcitx5 프로필/핫키
  log "[3/4] Fcitx5 프로필·핫키 구성..."
  # 실행 중인 fcitx5가 종료 시 기존 프로필로 덮어쓰는 현상 방지
  local _fcitx5_uid _fcitx5_svcs=()
  _fcitx5_uid=$(id -u "$USER" 2>/dev/null || echo "")
  if [[ -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]] && command -v systemctl >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    local _svc
    while IFS= read -r _svc; do
      if [[ -n "$_svc" ]]; then
        sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
          systemctl --user stop "$_svc" 2>/dev/null || true
        _fcitx5_svcs+=("$_svc")
      fi
    done < <(sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
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
  if [[ \${#_fcitx5_svcs[@]} -gt 0 && -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]]; then
    local _svc
    for _svc in "\${_fcitx5_svcs[@]}"; do
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
        systemctl --user start "$_svc" 2>/dev/null || true
    done
  fi

  # 4. 자동시작
  log "[4/4] 자동시작 등록..."
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
  ok "자동시작 등록 완료"
${KDE_VIRTUAL_KEYBOARD_SNIPPET(params.editionKey.includes("kde"))}
${POST_LOGIN_GUIDE_SNIPPET(params.distroName, params.editionKey.includes("kde"))}
  echo
  echo "============================================================"
  echo " 🎉 Void Linux 설치 완료! 재로그인 필요"
  echo " 전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space"
  echo " 설정: fcitx5-configtool"
  echo "============================================================"
}
main "$@"
`,

  // ─── Alpine Linux ───
  "alpine": (params) => `#!/usr/bin/env sh
# ${params.distroName} ${params.editionLabel} - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/alpine/${params.scriptId}.sh | sudo sh

set -eu

SCRIPT_VERSION="1.5.2"
LOG_FILE="/var/log/install-hangul-${params.scriptId}.log"
${PREFLIGHT_COMMON_SH}
require_root() { [ "$(id -u)" -eq 0 ] || err "root 권한 필요: sudo sh $0"; }

detect_user() {
  u="\${SUDO_USER:-}"
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
  TARGET_GID=$(id -g "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID" "$DESKTOP")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")

  _pkg_summary="   - apk update && apk add: fcitx5, fcitx5-hangul, fcitx5-gtk,\\n     fcitx5-qt, fcitx5-configtool, font-noto-cjk"
  _cfg_summary="   - /etc/environment, $TARGET_HOME/.profile\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록"
  _extra_warn=""
  if [ -f "$TARGET_HOME/.config/fcitx5/profile" ] || [ -f "$TARGET_HOME/.config/fcitx5/config" ]; then
    _extra_warn=" ⚠️  참고: 기존 Fcitx5 설정 파일($TARGET_HOME/.config/fcitx5/profile, config)이 덮어써집니다."
  fi
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn" "$DESKTOP")

  confirm_before_changes \
    "${params.distroName} ${params.editionLabel}" \
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== ${params.distroName} ${params.editionLabel} 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
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
  chown "$TARGET_UID:$TARGET_GID" "$PROFILE_FILE"
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
EOF
  chown -R "$TARGET_UID:$TARGET_GID" "$FCITX5_DIR"

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
  chown -R "$TARGET_UID:$TARGET_GID" "$ADIR"
  ok "자동시작 등록 완료"

${POST_LOGIN_GUIDE_SNIPPET(params.distroName, params.editionKey.includes("kde"))}
  echo
  echo "============================================================"
  echo " 🎉 Alpine Linux 설치 완료! 재로그인 필요"
  echo " 전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space"
  echo " 설정: fcitx5-configtool"
  echo "============================================================"
}
main "$@"
`,

  // ─── Solus ───
  "solus": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/solus/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.5.2"
LOG_FILE="/var/log/install-hangul-${params.scriptId}.log"
${PREFLIGHT_COMMON_BASH}
require_root() { [[ $EUID -eq 0 ]] || err "root 권한 필요: sudo bash $0"; }

detect_user() {
  local u="\${SUDO_USER:-}"
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(logname 2>/dev/null || true)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(who | awk '{print $1}' | head -1)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  err "대상 사용자 탐지 실패"
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
  _kde_will=$(will_configure_kde "${params.editionKey.includes("kde") ? "true" : "false"}" "$TARGET_HOME" "$DESKTOP")
  local _kde6_wayland
  _kde6_wayland=$(is_kde6_wayland "$_kde_will" "$SESSION_TYPE")

  local _pkg_summary="   - eopkg install -y: fcitx5, fcitx5-hangul, fcitx5-gtk, fcitx5-qt5, fcitx5-configtool"
  local _cfg_summary="   - /etc/environment, $TARGET_HOME/.config/environment.d/fcitx5.conf\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록"
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary" "$_kde6_wayland")
  local _extra_warn
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn" "$DESKTOP")

  confirm_before_changes \
    "${params.distroName} ${params.editionLabel}" \
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== ${params.distroName} ${params.editionLabel} 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. eopkg 패키지 설치
  log "[1/4] fcitx5 패키지 설치 (eopkg)..."
  eopkg install -y fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt5 fcitx5-configtool
  ok "패키지 설치 완료"
  disable_conflicting_imes "fcitx5" "$USER" "$TARGET_HOME" "$TARGET_UID" "$DESKTOP"

  # 2. 환경변수 설정
  log "[2/4] 환경변수 설정..."
  write_fcitx5_env "$_kde6_wayland" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "true" "true" "$TARGET_HOME/.xprofile" "false"
  ok "환경변수 설정 완료"

  # 3. Fcitx5 설정
  log "[3/4] Fcitx5 프로필·핫키 구성..."
  # 실행 중인 fcitx5가 종료 시 기존 프로필로 덮어쓰는 현상 방지
  local _fcitx5_uid _fcitx5_svcs=()
  _fcitx5_uid=$(id -u "$USER" 2>/dev/null || echo "")
  if [[ -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]] && command -v systemctl >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    local _svc
    while IFS= read -r _svc; do
      if [[ -n "$_svc" ]]; then
        sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
          systemctl --user stop "$_svc" 2>/dev/null || true
        _fcitx5_svcs+=("$_svc")
      fi
    done < <(sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
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
  if [[ \${#_fcitx5_svcs[@]} -gt 0 && -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]]; then
    local _svc
    for _svc in "\${_fcitx5_svcs[@]}"; do
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
        systemctl --user start "$_svc" 2>/dev/null || true
    done
  fi

  # 4. 자동시작
  log "[4/4] 자동시작 등록..."
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
  ok "자동시작 등록 완료"
${KDE_VIRTUAL_KEYBOARD_SNIPPET(params.editionKey.includes("kde"))}
${POST_LOGIN_GUIDE_SNIPPET(params.distroName, params.editionKey.includes("kde"))}
  echo
  echo "============================================================"
  echo " 🎉 Solus 설치 완료! 재로그인 필요"
  echo " 전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space"
  echo " 설정: fcitx5-configtool"
  echo "============================================================"
}
main "$@"
`,

  // ─── Gentoo / CalamaroOS ───
  "gentoo": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/gentoo/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.5.2"
LOG_FILE="/var/log/install-hangul-${params.scriptId}.log"
${PREFLIGHT_COMMON_BASH}
require_root() { [[ $EUID -eq 0 ]] || err "root 권한 필요: sudo bash $0"; }

detect_user() {
  local u="\${SUDO_USER:-}"
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(logname 2>/dev/null || true)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(who | awk '{print $1}' | head -1)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  err "대상 사용자 탐지 실패"
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
  _kde_will=$(will_configure_kde "${params.editionKey.includes("kde") ? "true" : "false"}" "$TARGET_HOME" "$DESKTOP")
  local _kde6_wayland
  _kde6_wayland=$(is_kde6_wayland "$_kde_will" "$SESSION_TYPE")

  local _pkg_summary="   - emerge --noreplace: app-i18n/fcitx:5, app-i18n/fcitx-hangul:5,\\n     app-i18n/fcitx-gtk:5, app-i18n/fcitx-qt:5, app-i18n/fcitx-configtool:5"
  local _cfg_summary="   - /etc/environment, $TARGET_HOME/.xprofile\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록"
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary" "$_kde6_wayland")
  local _extra_warn
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn" "$DESKTOP")

  confirm_before_changes \
    "${params.distroName} ${params.editionLabel}" \
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== ${params.distroName} ${params.editionLabel} 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. Portage 패키지 설치
  log "[1/4] fcitx5 패키지 설치 (emerge)..."
  emerge --noreplace \\
    app-i18n/fcitx:5 app-i18n/fcitx-hangul:5 \\
    app-i18n/fcitx-gtk:5 app-i18n/fcitx-qt:5 app-i18n/fcitx-configtool:5
  ok "패키지 설치 완료"
  disable_conflicting_imes "fcitx5" "$USER" "$TARGET_HOME" "$TARGET_UID" "$DESKTOP"

  # 2. 환경변수 설정
  log "[2/4] 환경변수 설정..."
  write_fcitx5_env "$_kde6_wayland" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "true" "true" "$TARGET_HOME/.xprofile" "false"
  ok "환경변수 설정 완료"

  # 3. Fcitx5 설정
  log "[3/4] Fcitx5 프로필·핫키 구성..."
  # 실행 중인 fcitx5가 종료 시 기존 프로필로 덮어쓰는 현상 방지
  local _fcitx5_uid _fcitx5_svcs=()
  _fcitx5_uid=$(id -u "$USER" 2>/dev/null || echo "")
  if [[ -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]] && command -v systemctl >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    local _svc
    while IFS= read -r _svc; do
      if [[ -n "$_svc" ]]; then
        sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
          systemctl --user stop "$_svc" 2>/dev/null || true
        _fcitx5_svcs+=("$_svc")
      fi
    done < <(sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
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
  if [[ \${#_fcitx5_svcs[@]} -gt 0 && -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]]; then
    local _svc
    for _svc in "\${_fcitx5_svcs[@]}"; do
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
        systemctl --user start "$_svc" 2>/dev/null || true
    done
  fi

  # 4. 자동시작
  log "[4/4] 자동시작 등록..."
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
  ok "자동시작 등록 완료"
${KDE_VIRTUAL_KEYBOARD_SNIPPET(params.editionKey.includes("kde"))}
${POST_LOGIN_GUIDE_SNIPPET(params.distroName, params.editionKey.includes("kde"))}
  echo
  echo "============================================================"
  echo " 🎉 Gentoo 설치 완료! 재로그인 필요"
  echo " 전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space"
  echo " 설정: fcitx5-configtool"
  echo "============================================================"
}
main "$@"
`,

  // ─── Mandriva 계열 (Mageia / OpenMandriva / PCLinuxOS / MagOS) ───
  "mandriva-family": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/mandriva-family/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.5.2"
LOG_FILE="/var/log/install-hangul-${params.scriptId}.log"
${PREFLIGHT_COMMON_BASH}
require_root() { [[ $EUID -eq 0 ]] || err "root 권한 필요: sudo bash $0"; }

detect_user() {
  local u="\${SUDO_USER:-}"
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(logname 2>/dev/null || true)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(who | awk '{print $1}' | head -1)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  err "대상 사용자 탐지 실패"
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
  _kde_will=$(will_configure_kde "${params.editionKey.includes("kde") ? "true" : "false"}" "$TARGET_HOME" "$DESKTOP")
  local _kde6_wayland
  _kde6_wayland=$(is_kde6_wayland "$_kde_will" "$SESSION_TYPE")

  local _pkg_mgr="" _pkg_summary=""
  if command -v dnf >/dev/null 2>&1; then
    _pkg_mgr="dnf"
    _pkg_summary="   - dnf install -y: fcitx5, fcitx5-hangul, fcitx5-gtk, fcitx5-qt, fcitx5-configtool"
  elif command -v urpmi >/dev/null 2>&1; then
    _pkg_mgr="urpmi"
    _pkg_summary="   - urpmi --auto: fcitx5, fcitx5-hangul, fcitx5-gtk, fcitx5-qt, fcitx5-configtool"
  elif command -v apt-get >/dev/null 2>&1; then
    _pkg_mgr="apt-get"
    _pkg_summary="   - apt-get update && apt-get install -y: fcitx5, fcitx5-hangul, fcitx5-configtool"
  else
    err "지원되는 패키지 관리자(dnf / urpmi / apt-get)를 찾지 못했습니다."
  fi

  local _cfg_summary="   - /etc/environment, $TARGET_HOME/.xprofile\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop"
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary" "$_kde6_wayland")
  local _extra_warn
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn" "$DESKTOP")

  confirm_before_changes \
    "${params.distroName} ${params.editionLabel}" \
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== ${params.distroName} ${params.editionLabel} 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. 패키지 관리자 자동 분기 (dnf / urpmi / apt-get)
  log "[1/4] fcitx5 패키지 설치 ($_pkg_mgr)..."
  case "$_pkg_mgr" in
    dnf)
      dnf install -y fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool ;;
    urpmi)
      urpmi --auto fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool ;;
    apt-get)
      apt-get update && apt-get install -y fcitx5 fcitx5-hangul fcitx5-configtool ;;
  esac
  ok "패키지 설치 완료"
  disable_conflicting_imes "fcitx5" "$USER" "$TARGET_HOME" "$TARGET_UID" "$DESKTOP"

  # 2. 환경변수 설정
  log "[2/4] 환경변수 설정..."
  write_fcitx5_env "$_kde6_wayland" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "true" "true" "$TARGET_HOME/.xprofile" "false"
  ok "환경변수 설정 완료"

  # 3. Fcitx5 설정
  log "[3/4] Fcitx5 프로필·핫키 구성..."
  # 실행 중인 fcitx5가 종료 시 기존 프로필로 덮어쓰는 현상 방지
  local _fcitx5_uid _fcitx5_svcs=()
  _fcitx5_uid=$(id -u "$USER" 2>/dev/null || echo "")
  if [[ -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]] && command -v systemctl >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    local _svc
    while IFS= read -r _svc; do
      if [[ -n "$_svc" ]]; then
        sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
          systemctl --user stop "$_svc" 2>/dev/null || true
        _fcitx5_svcs+=("$_svc")
      fi
    done < <(sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
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
  if [[ \${#_fcitx5_svcs[@]} -gt 0 && -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]]; then
    local _svc
    for _svc in "\${_fcitx5_svcs[@]}"; do
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
        systemctl --user start "$_svc" 2>/dev/null || true
    done
  fi

  # 4. 자동시작
  log "[4/4] 자동시작 등록..."
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
  ok "자동시작 등록 완료"
${KDE_VIRTUAL_KEYBOARD_SNIPPET(params.editionKey.includes("kde"))}

  echo
  echo "============================================================"
  echo " 🎉 ${params.distroName} 설치 완료! 재로그인 필요"
  echo " 전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space"
  echo " 설정: fcitx5-configtool"
  echo "============================================================"
}
main "$@"
`,

  // ─── KaOS (KDE/Qt 전용) ───
  "kaos": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/kaos/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.5.2"
LOG_FILE="/var/log/install-hangul-${params.scriptId}.log"
${PREFLIGHT_COMMON_BASH}
require_root() { [[ $EUID -eq 0 ]] || err "root 권한 필요: sudo bash $0"; }

detect_user() {
  local u="\${SUDO_USER:-}"
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(logname 2>/dev/null || true)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(who | awk '{print $1}' | head -1)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  err "대상 사용자 탐지 실패"
}

main() {
  require_root

  local USER TARGET_HOME TARGET_UID TARGET_GID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME _ow_note
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  TARGET_GID=$(id -g "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID" "$DESKTOP")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")
  local _kde6_wayland
  _kde6_wayland=$(is_kde6_wayland "true" "$SESSION_TYPE")

  local _pkg_summary="   - pacman -Syu --needed --noconfirm: fcitx5, fcitx5-hangul, fcitx5-qt, fcitx5-configtool, noto-fonts-cjk (미설치 시 부분 업그레이드 방지)"
  local _cfg_summary="   - /etc/environment, $TARGET_HOME/.config/environment.d/fcitx5.conf\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop\\n   - KDE Plasma 가상 키보드 설정: $TARGET_HOME/.config/kwinrc ([Wayland] InputMethod)"
  _cfg_summary=$(append_kde_cfg_line "false" "$TARGET_HOME" "$_cfg_summary" "$_kde6_wayland")
  local _extra_warn
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn" "$DESKTOP")

  confirm_before_changes \
    "${params.distroName} ${params.editionLabel}" \
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== ${params.distroName} ${params.editionLabel} 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. pacman 패키지 설치 (KaOS Qt/KDE 전용 패키지 구성)
  log "[1/4] fcitx5 및 한글 폰트 패키지 설치 (pacman)..."
  if pacman -T fcitx5 fcitx5-hangul fcitx5-qt fcitx5-configtool noto-fonts-cjk >/dev/null 2>&1; then
    ok "필수 패키지가 이미 설치되어 있어 pacman 업그레이드를 건너뜁니다"
  else
    pacman -Syu --needed --noconfirm fcitx5 fcitx5-hangul fcitx5-qt fcitx5-configtool noto-fonts-cjk
  fi
  ok "패키지 설치 완료"
  disable_conflicting_imes "fcitx5" "$USER" "$TARGET_HOME" "$TARGET_UID" "$DESKTOP"

  # 2. 환경변수 설정
  log "[2/4] 환경변수 설정..."
  write_fcitx5_env "$_kde6_wayland" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "true" "true" "$TARGET_HOME/.xprofile" "false"
  ok "환경변수 설정 완료"

  # 3. Fcitx5 설정
  log "[3/4] Fcitx5 프로필·핫키 구성..."
  # 실행 중인 fcitx5가 종료 시 기존 프로필로 덮어쓰는 현상 방지
  local _fcitx5_uid _fcitx5_svcs=()
  _fcitx5_uid=$(id -u "$USER" 2>/dev/null || echo "")
  if [[ -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]] && command -v systemctl >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    local _svc
    while IFS= read -r _svc; do
      if [[ -n "$_svc" ]]; then
        sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
          systemctl --user stop "$_svc" 2>/dev/null || true
        _fcitx5_svcs+=("$_svc")
      fi
    done < <(sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
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
  if [[ \${#_fcitx5_svcs[@]} -gt 0 && -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]]; then
    local _svc
    for _svc in "\${_fcitx5_svcs[@]}"; do
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
        systemctl --user start "$_svc" 2>/dev/null || true
    done
  fi

  # 4. 자동시작
  log "[4/4] 자동시작 등록..."
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
  ok "자동시작 등록 완료"
${KDE_VIRTUAL_KEYBOARD_SNIPPET(true)}

  echo
  echo "============================================================"
  echo " 🎉 KaOS 설치 완료! 재로그인 필요"
  echo " KDE: 가상 키보드(Fcitx 5) 자동 설정됨 (미적용 시 시스템설정 → 입력장치 → 가상키보드 확인)"
  echo " 전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space"
  echo "============================================================"
}
main "$@"
`,

  // ─── Vanilla OS (ABRoot 불변 Debian) ───
  "vanilla": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/vanilla/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.5.2"
LOG_FILE="/var/log/install-hangul-${params.scriptId}.log"
${PREFLIGHT_COMMON_BASH}
require_root() { [[ $EUID -eq 0 ]] || err "root 권한 필요: sudo bash $0"; }

detect_user() {
  local u="\${SUDO_USER:-}"
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(logname 2>/dev/null || true)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(who | awk '{print $1}' | head -1)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  err "대상 사용자 탐지 실패"
}

main() {
  require_root

  local USER TARGET_HOME TARGET_UID TARGET_GID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME _ow_note
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  TARGET_GID=$(id -g "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID" "$DESKTOP")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")
  local _kde_will _kde6_wayland
  _kde_will=$(will_configure_kde "false" "$TARGET_HOME" "$DESKTOP")
  _kde6_wayland=$(is_kde6_wayland "$_kde_will" "$SESSION_TYPE" "$DESKTOP")

  local _pkg_summary="   - abroot pkg add: fcitx5, fcitx5-hangul, fcitx5-config-qt,\\n     fcitx5-frontend-gtk3, fcitx5-frontend-gtk4, fcitx5-frontend-qt5, fcitx5-frontend-qt6"
  local _cfg_summary="   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/environment.d/fcitx5.conf, $TARGET_HOME/.config/autostart/fcitx5.desktop"
  _cfg_summary=$(append_kde_cfg_line "false" "$TARGET_HOME" "$_cfg_summary" "$_kde6_wayland")
  local _extra_warn=" ⚠️  참고: 불변 OS(ABRoot)이므로 설치 완료 후 반드시 재부팅이 필요합니다."
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME" "$_extra_warn")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn" "$DESKTOP")

  confirm_before_changes \
    "${params.distroName} ${params.editionLabel}" \
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== ${params.distroName} ${params.editionLabel} 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. ABRoot 패키지 추가
  log "[1/4] fcitx5 패키지 추가 (abroot pkg add)..."
  abroot pkg add \\
    fcitx5 fcitx5-hangul fcitx5-config-qt \\
    fcitx5-frontend-gtk3 fcitx5-frontend-gtk4 \\
    fcitx5-frontend-qt5 fcitx5-frontend-qt6
  ok "패키지 추가 완료"
  disable_conflicting_imes "fcitx5" "$USER" "$TARGET_HOME" "$TARGET_UID" "$DESKTOP"

  # 2. Fcitx5 설정
  log "[2/4] Fcitx5 프로필·핫키 구성..."
  # 실행 중인 fcitx5가 종료 시 기존 프로필로 덮어쓰는 현상 방지
  local _fcitx5_uid _fcitx5_svcs=()
  _fcitx5_uid=$(id -u "$USER" 2>/dev/null || echo "")
  if [[ -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]] && command -v systemctl >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    local _svc
    while IFS= read -r _svc; do
      if [[ -n "$_svc" ]]; then
        sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
          systemctl --user stop "$_svc" 2>/dev/null || true
        _fcitx5_svcs+=("$_svc")
      fi
    done < <(sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
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
  if [[ \${#_fcitx5_svcs[@]} -gt 0 && -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]]; then
    local _svc
    for _svc in "\${_fcitx5_svcs[@]}"; do
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
        systemctl --user start "$_svc" 2>/dev/null || true
    done
  fi

  # 3. 환경변수 설정
  log "[3/4] 환경변수 설정..."
  write_fcitx5_env "$_kde6_wayland" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "false" "true" "$TARGET_HOME/.xsessionrc" "true"

  # 4. 자동시작
  log "[4/4] 자동시작 등록..."
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
  ok "자동시작 등록 완료"

  echo
  echo "============================================================"
  echo " 🎉 Vanilla OS 설정 완료! 반드시 재부팅하세요 (ABRoot 적용)."
  echo " 전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space"
  echo "============================================================"
}
main "$@"
`,

  // ─── ALT Linux (apt-rpm) ───
  "alt": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/alt/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.5.2"
LOG_FILE="/var/log/install-hangul-${params.scriptId}.log"
${PREFLIGHT_COMMON_BASH}
require_root() { [[ $EUID -eq 0 ]] || err "root 권한 필요: sudo bash $0"; }

detect_user() {
  local u="\${SUDO_USER:-}"
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(logname 2>/dev/null || true)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(who | awk '{print $1}' | head -1)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  err "대상 사용자 탐지 실패"
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
  _kde_will=$(will_configure_kde "${params.editionKey.includes("kde") ? "true" : "false"}" "$TARGET_HOME" "$DESKTOP")
  local _kde6_wayland
  _kde6_wayland=$(is_kde6_wayland "$_kde_will" "$SESSION_TYPE")

  local _pkg_summary="   - apt-get update && apt-get install -y: fcitx5, fcitx5-hangul, fcitx5-gtk, fcitx5-qt, fcitx5-configtool"
  local _cfg_summary="   - /etc/environment, $TARGET_HOME/.xprofile\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop"
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary" "$_kde6_wayland")
  local _extra_warn
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn" "$DESKTOP")

  confirm_before_changes \
    "${params.distroName} ${params.editionLabel}" \
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== ${params.distroName} ${params.editionLabel} 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. apt-rpm 패키지 설치
  log "[1/4] fcitx5 패키지 설치 (apt-get / apt-rpm)..."
  apt-get update
  apt-get install -y fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool
  ok "패키지 설치 완료"
  disable_conflicting_imes "fcitx5" "$USER" "$TARGET_HOME" "$TARGET_UID" "$DESKTOP"

  # 2. 환경변수 설정
  log "[2/4] 환경변수 설정..."
  write_fcitx5_env "$_kde6_wayland" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "true" "true" "$TARGET_HOME/.xprofile" "false"
  ok "환경변수 설정 완료"

  # 3. Fcitx5 설정
  log "[3/4] Fcitx5 프로필·핫키 구성..."
  # 실행 중인 fcitx5가 종료 시 기존 프로필로 덮어쓰는 현상 방지
  local _fcitx5_uid _fcitx5_svcs=()
  _fcitx5_uid=$(id -u "$USER" 2>/dev/null || echo "")
  if [[ -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]] && command -v systemctl >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    local _svc
    while IFS= read -r _svc; do
      if [[ -n "$_svc" ]]; then
        sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
          systemctl --user stop "$_svc" 2>/dev/null || true
        _fcitx5_svcs+=("$_svc")
      fi
    done < <(sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
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
  if [[ \${#_fcitx5_svcs[@]} -gt 0 && -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]]; then
    local _svc
    for _svc in "\${_fcitx5_svcs[@]}"; do
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
        systemctl --user start "$_svc" 2>/dev/null || true
    done
  fi

  # 4. 자동시작
  log "[4/4] 자동시작 등록..."
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
  ok "자동시작 등록 완료"
${KDE_VIRTUAL_KEYBOARD_SNIPPET(params.editionKey.includes("kde"))}

  echo
  echo "============================================================"
  echo " 🎉 ALT Linux 설치 완료! 재로그인 필요"
  echo " 전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space"
  echo " 설정: fcitx5-configtool"
  echo "============================================================"
}
main "$@"
`,

  // ─── Guix System (GNU Guix) ───
  "guix": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/guix/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.5.2"
LOG_FILE="/var/log/install-hangul-${params.scriptId}.log"
${PREFLIGHT_COMMON_BASH}
require_root() { [[ $EUID -eq 0 ]] || err "root 권한 필요: sudo bash $0"; }

detect_user() {
  local u="\${SUDO_USER:-}"
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(logname 2>/dev/null || true)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(who | awk '{print $1}' | head -1)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  err "대상 사용자 탐지 실패"
}

main() {
  require_root

  local USER TARGET_HOME TARGET_UID TARGET_GID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME _ow_note
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  TARGET_GID=$(id -g "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID" "$DESKTOP")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")

  local _pkg_summary="   - su - $USER: guix install fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool font-google-noto-sans-cjk"
  local _cfg_summary="   - ~/.bash_profile (또는 ~/.profile) GUIX_PROFILE 및 환경변수 추가\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop"
  local _extra_warn
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn" "$DESKTOP")

  confirm_before_changes \
    "${params.distroName} ${params.editionLabel}" \
    "$OS_NAME" "$USER" "$TARGET_UID" "$TARGET_HOME" \
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" \
    "$_pkg_summary" "$_cfg_summary" "$_extra_warn"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "=== ${params.distroName} ${params.editionLabel} 한글 입력기 설치 (v$SCRIPT_VERSION) ==="
  info "감지된 OS: $OS_NAME"
  info "사용자: $USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "데스크톱/세션: $DESKTOP / $SESSION_TYPE | 기존 입력기: $EXISTING_IME"

  # 1. 사용자 Guix 프로필에 패키지 설치
  log "[1/4] fcitx5 패키지 설치 (guix install)..."
  su -s /bin/sh - "$USER" -c "guix install fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool font-google-noto-sans-cjk"
  ok "패키지 설치 완료"
  disable_conflicting_imes "fcitx5" "$USER" "$TARGET_HOME" "$TARGET_UID" "$DESKTOP"

  # 2. 환경변수 설정 (~/.bash_profile)
  log "[2/4] 환경변수 설정..."
  local PROFILE_FILE="$TARGET_HOME/.bash_profile"
  [[ -f "$TARGET_HOME/.profile" && ! -f "$PROFILE_FILE" ]] && PROFILE_FILE="$TARGET_HOME/.profile"
  grep -q "GTK_IM_MODULE=fcitx" "$PROFILE_FILE" 2>/dev/null || cat >> "$PROFILE_FILE" <<'EOF'

# fcitx5 환경변수 (Guix)
export GUIX_PROFILE="$HOME/.guix-profile"
export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx
EOF
  chown "$TARGET_UID:$TARGET_GID" "$PROFILE_FILE"
  ok "환경변수 설정 완료"

  # 3. Fcitx5 설정
  log "[3/4] Fcitx5 프로필·핫키 구성..."
  # 실행 중인 fcitx5가 종료 시 기존 프로필로 덮어쓰는 현상 방지
  local _fcitx5_uid _fcitx5_svcs=()
  _fcitx5_uid=$(id -u "$USER" 2>/dev/null || echo "")
  if [[ -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]] && command -v systemctl >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    local _svc
    while IFS= read -r _svc; do
      if [[ -n "$_svc" ]]; then
        sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
          systemctl --user stop "$_svc" 2>/dev/null || true
        _fcitx5_svcs+=("$_svc")
      fi
    done < <(sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
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
  if [[ \${#_fcitx5_svcs[@]} -gt 0 && -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]]; then
    local _svc
    for _svc in "\${_fcitx5_svcs[@]}"; do
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
        systemctl --user start "$_svc" 2>/dev/null || true
    done
  fi

  # 4. 자동시작
  log "[4/4] 자동시작 등록..."
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
  ok "자동시작 등록 완료"

  echo
  echo "============================================================"
  echo " 🎉 Guix System 설치 완료! 재로그인 필요"
  echo " 선언적 설정을 원할 경우 /etc/config.scm 의 %desktop-services / home-environment 에도 추가하세요."
  echo " 전환: 한/영 키, 오른쪽 Alt(Alt_R), Ctrl+Space"
  echo "============================================================"
}
main "$@"
`
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SCRIPT_TEMPLATES };
}
