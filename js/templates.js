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

${isKde ? "🖥️  KDE Plasma 가상 키보드(Fcitx 5) 자동 설정됨 (미적용 시: 시스템 설정 → 입력 장치 → 가상 키보드 확인)\n\n" : ""}⌨️  전환: 한/영 키, Ctrl+Space, Shift+Space
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

⌨️  전환: 한/영 키, 오른쪽 Alt(Alt_R), Super+Space
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
  chown -R "$USER:$USER" "$TARGET_HOME/.config/autostart" "$GUIDE_DIR"
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

⌨️  전환: Shift+Space / Ctrl+Space 또는 한/영 키
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
  chown -R "$USER:$USER" "$TARGET_HOME/.config/autostart" "$GUIDE_DIR"
`;

// ──────────────────────────────────────────────────────────────
// KDE Plasma 가상 키보드(Fcitx 5) 자동 설정 스니펫 (~/.config/kwinrc)
// ──────────────────────────────────────────────────────────────
const KDE_VIRTUAL_KEYBOARD_SNIPPET = (forceKde = false) => `
  # KDE Plasma 가상 키보드(Fcitx 5) 자동 설정
  local _kde_detected=${forceKde ? "true" : "false"}
  if [[ "\${XDG_CURRENT_DESKTOP:-}" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]] || \\
     command -v kwriteconfig6 >/dev/null 2>&1 || \\
     command -v kwriteconfig5 >/dev/null 2>&1 || \\
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
    chown "$USER:$USER" "$TARGET_HOME/.config" "$_kwinrc" 2>/dev/null || true
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

detect_desktop() {
  local _u="$1"
  local _d="\${XDG_CURRENT_DESKTOP:-}"
  [[ -n "$_d" ]] && { echo "$_d"; return; }
  _d=$(su - "$_u" -c 'echo \${XDG_CURRENT_DESKTOP:-}' </dev/null 2>/dev/null || true)
  [[ -n "$_d" ]] && { echo "$_d"; return; }
  _d=$(su - "$_u" -c 'echo \${DESKTOP_SESSION:-}' </dev/null 2>/dev/null || true)
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
  local _w=""
  if has_conflicting_ime "$_target_ime" "$_existing_ime"; then
    _w=" ⚠️  참고: 기존 입력기(\${_existing_ime})가 감지되었습니다. 기존 입력기가 새 입력기와 충돌할 수 있으므로 기존 입력기 설정(자동시작·서비스·환경변수)을 자동으로 비활성화하겠습니다."
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
  local _is_gnome=false
  [[ "\${_desktop,,}" == *"gnome"* ]] && _is_gnome=true

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
  for _td in "\${_target_desktops[@]}"; do
    if [[ -f "$_autostart_dir/$_td" ]] && grep -q '^Hidden=true$' "$_autostart_dir/$_td" 2>/dev/null; then
      rm -f "$_autostart_dir/$_td"
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
        if su - "$_user" -c "systemctl --user is-enabled $_svc >/dev/null 2>&1" 2>/dev/null; then
          su - "$_user" -c "systemctl --user disable $_svc 2>/dev/null || true" || true
          _changed=true
        fi
      done
    fi
  fi

  local _p
  for _p in "\${_procs[@]}"; do
    if command -v pgrep >/dev/null 2>&1 && pgrep -u "$_uid" -x "$_p" >/dev/null 2>&1; then
      pkill -u "$_uid" -x "$_p" 2>/dev/null || true
      _changed=true
    fi
  done

  local _desk
  for _desk in "\${_desktops[@]}"; do
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
      mv -f "$_autostart_dir/$_desk" "$_autostart_dir/\${_desk}.disabled"
      chown "$_uid:$_gid" "$_autostart_dir/\${_desk}.disabled" 2>/dev/null || true
      _changed=true
    fi
  done

  local _econf
  for _econf in "\${_env_confs[@]}"; do
    if [[ -f "$_env_dir/$_econf" ]]; then
      mv -f "$_env_dir/$_econf" "$_env_dir/\${_econf}.disabled"
      chown "$_uid:$_gid" "$_env_dir/\${_econf}.disabled" 2>/dev/null || true
      _changed=true
    fi
  done

  local _env_line_re="^[[:space:]]*(export[[:space:]]+)?((GTK|QT|SDL|GLFW)_IM_MODULE=['\\"]?\${_im_re}['\\"]?|XMODIFIERS=['\\"]?@im=\${_im_re}['\\"]?)[[:space:]]*(#.*)?$"
  local _ef
  for _ef in /etc/environment "$_home/.xsessionrc" "$_home/.xprofile" "$_home/.bash_profile" "$_home/.profile"; do
    if [[ -f "$_ef" && -w "$_ef" ]] && grep -qE "$_env_line_re" "$_ef" 2>/dev/null; then
      grep -Ev "$_env_line_re" "$_ef" > "\${_ef}.tmp" || true
      cat "\${_ef}.tmp" > "$_ef"
      rm -f "\${_ef}.tmp"
      if [[ "$_ef" != "/etc/environment" ]]; then
        chown "$_uid:$_gid" "$_ef" 2>/dev/null || true
      fi
      _changed=true
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
     [[ "\${XDG_CURRENT_DESKTOP:-}" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]] || \\
     command -v kwriteconfig6 >/dev/null 2>&1 || \\
     command -v kwriteconfig5 >/dev/null 2>&1 || \\
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
    printf '%s\\n   - KDE Plasma 가상 키보드 설정: %s/.config/kwinrc ([Wayland] InputMethod)' "$_cfg" "$_home"
  else
    printf '%s' "$_cfg"
  fi
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

detect_desktop() {
  _pf_u="$1"
  _pf_d="\${XDG_CURRENT_DESKTOP:-}"
  [ -n "$_pf_d" ] && { echo "$_pf_d"; return; }
  _pf_d=$(su - "$_pf_u" -c 'echo \${XDG_CURRENT_DESKTOP:-}' </dev/null 2>/dev/null || true)
  [ -n "$_pf_d" ] && { echo "$_pf_d"; return; }
  _pf_d=$(su - "$_pf_u" -c 'echo \${DESKTOP_SESSION:-}' </dev/null 2>/dev/null || true)
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
  _pf_found=""
  _pf_sep=""
  for _pf_im in fcitx5 fcitx ibus-daemon kime; do
    _pf_running=false
    if command -v pgrep >/dev/null 2>&1 && pgrep -u "$_pf_uid" -x "$_pf_im" >/dev/null 2>&1; then
      _pf_running=true
    fi
    if command -v "$_pf_im" >/dev/null 2>&1 || [ "$_pf_running" = "true" ]; then
      if [ "$_pf_running" = "true" ]; then
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
  _cw_w=""
  if has_conflicting_ime "$_cw_target" "$_cw_existing"; then
    _cw_w=" ⚠️  참고: 기존 입력기(\${_cw_existing})가 감지되었습니다. 기존 입력기가 새 입력기와 충돌할 수 있으므로 기존 입력기 설정(자동시작·서비스·환경변수)을 자동으로 비활성화하겠습니다."
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
        if sudo -u "$_dc_user" XDG_RUNTIME_DIR="/run/user/$_dc_uid" DBUS_SESSION_BUS_ADDRESS="$_dc_bus" \
             systemctl --user is-enabled "$_dc_s" >/dev/null 2>&1 || \
           sudo -u "$_dc_user" XDG_RUNTIME_DIR="/run/user/$_dc_uid" DBUS_SESSION_BUS_ADDRESS="$_dc_bus" \
             systemctl --user is-active "$_dc_s" >/dev/null 2>&1; then
          sudo -u "$_dc_user" XDG_RUNTIME_DIR="/run/user/$_dc_uid" DBUS_SESSION_BUS_ADDRESS="$_dc_bus" \
            systemctl --user disable --now "$_dc_s" 2>/dev/null || true
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
      mv -f "$_dc_adir/$_dc_d" "$_dc_adir/\${_dc_d}.disabled"
      chown "$_dc_uid:$_dc_gid" "$_dc_adir/\${_dc_d}.disabled" 2>/dev/null || true
      _dc_changed=true
    fi
  done

  for _dc_ec in $_dc_econfs; do
    if [ -f "$_dc_edir/$_dc_ec" ]; then
      mv -f "$_dc_edir/$_dc_ec" "$_dc_edir/\${_dc_ec}.disabled"
      chown "$_dc_uid:$_dc_gid" "$_dc_edir/\${_dc_ec}.disabled" 2>/dev/null || true
      _dc_changed=true
    fi
  done

  _dc_env_re="^[[:space:]]*(export[[:space:]]+)?((GTK|QT|SDL|GLFW)_IM_MODULE=['\\"]?\${_dc_im_re}['\\"]?|XMODIFIERS=['\\"]?@im=\${_dc_im_re}['\\"]?)[[:space:]]*(#.*)?$"
  for _dc_ef in /etc/environment "$_dc_home/.xsessionrc" "$_dc_home/.xprofile" "$_dc_home/.bash_profile" "$_dc_home/.profile"; do
    if [ -f "$_dc_ef" ] && [ -w "$_dc_ef" ] && grep -qE "$_dc_env_re" "$_dc_ef" 2>/dev/null; then
      grep -Ev "$_dc_env_re" "$_dc_ef" > "\${_dc_ef}.tmp" || true
      cat "\${_dc_ef}.tmp" > "$_dc_ef"
      rm -f "\${_dc_ef}.tmp"
      if [ "$_dc_ef" != "/etc/environment" ]; then
        chown "$_dc_uid:$_dc_gid" "$_dc_ef" 2>/dev/null || true
      fi
      _dc_changed=true
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

SCRIPT_VERSION="1.3.2"
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

  local USER TARGET_HOME TARGET_UID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME _ow_note _kde_will
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")
  _kde_will=$(will_configure_kde "${params.editionKey.includes("kde") ? "true" : "false"}" "$TARGET_HOME" "$DESKTOP")

  local _pkg_summary="   - apt-get update 후 레거시 fcitx(4.x) 제거 및 autoremove --purge\\n   - apt-get install: fcitx5, fcitx5-hangul, fcitx5-config-qt, fcitx5-configtool,\\n     fcitx5-frontend-gtk3/gtk4/qt5/qt6, fonts-noto-cjk"
  local _cfg_summary="   - im-config -n fcitx5 적용 및 데스크톱 단축키 충돌 해제(gsettings)\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/environment.d/fcitx5.conf, /etc/environment, $TARGET_HOME/.xsessionrc\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록"
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary")
  local _extra_warn=" ⚠️  참고: 기존 fcitx 4.x 패키지 및 미사용 의존성(autoremove)이 제거됩니다."
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME" "$_extra_warn")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn")

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
  su - "$USER" -c "im-config -n fcitx5" 2>/dev/null || warn "im-config 실패 (수동 실행 필요)"
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
2=Shift+space
EOF
  chown -R "$USER:$USER" "$FCITX5_DIR"
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
    for c in "\${cmds[@]}"; do su - "$USER" -c "gsettings set $c 2>/dev/null || true"; done
  fi
  ok "단축키 해제 완료"

  # 6. Wayland / X11 / Non-systemd 환경변수
  log "[6/7] Wayland/X11 환경변수 설정..."
  local ENV_FILE="$TARGET_HOME/.config/environment.d/fcitx5.conf"
  mkdir -p "$(dirname "$ENV_FILE")"
  cat > "$ENV_FILE" <<'EOF'
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
  chown -R "$USER:$USER" "$(dirname "$ENV_FILE")"
  grep -q "GTK_IM_MODULE=fcitx" /etc/environment 2>/dev/null || cat >> /etc/environment <<'EOF'

# fcitx5 환경변수
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
  local XSESSION_FILE="$TARGET_HOME/.xsessionrc"
  grep -q "GTK_IM_MODULE=fcitx" "$XSESSION_FILE" 2>/dev/null || cat >> "$XSESSION_FILE" <<'EOF'

# fcitx5 환경변수 (Non-systemd / X11 세션 호환)
export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx
EOF
  chown "$USER:$USER" "$XSESSION_FILE"
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
  chown -R "$USER:$USER" "$ADIR"
  ok "자동시작 등록"
${KDE_VIRTUAL_KEYBOARD_SNIPPET(params.editionKey.includes("kde"))}
${POST_LOGIN_GUIDE_SNIPPET(params.distroName, params.editionKey.includes("kde"))}
  echo
  echo "============================================================"
  echo " 🎉 설치 완료! 로그아웃 후 다시 로그인하세요."
  echo " 한/영 키, Ctrl+Space, Shift+Space 로 전환"
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

SCRIPT_VERSION="1.3.2"
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

  local USER TARGET_HOME TARGET_UID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME _ow_note _kde_will
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")
  _kde_will=$(will_configure_kde "${params.editionKey.includes("kde") ? "true" : "false"}" "$TARGET_HOME" "$DESKTOP")

  local _pkg_summary="   - dnf install -y: fcitx5, fcitx5-hangul, fcitx5-configtool, fcitx5-gtk,\\n     fcitx5-qt, fcitx5-autostart, google-noto-sans-cjk-ttc-fonts (또는 google-noto-cjk-fonts)"
  local _cfg_summary="   - alternatives --set xinputrc, /etc/X11/xinit/xinput.d/fcitx5.conf 수정\\n   - ibus 사용자 서비스 비활성화(systemctl --user disable ibus)\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - ~/.bash_profile (또는 ~/.profile) 환경변수 추가"
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary")
  local _extra_warn
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn")

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
  su - "$USER" -c "systemctl --user disable ibus 2>/dev/null || true" || true
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
2=Shift+space
EOF
  # 환경변수 (~/.bash_profile 또는 ~/.profile)
  local PROFILE_FILE="$TARGET_HOME/.bash_profile"
  [[ -f "$TARGET_HOME/.profile" && ! -f "$PROFILE_FILE" ]] && PROFILE_FILE="$TARGET_HOME/.profile"
  grep -q "GTK_IM_MODULE=fcitx" "$PROFILE_FILE" 2>/dev/null || cat >> "$PROFILE_FILE" <<'EOF'

# fcitx5 환경변수
export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx
EOF
  chown -R "$USER:$USER" "$FCITX5_DIR" "$PROFILE_FILE"
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
  echo " 전환: 한/영 키, Ctrl+Space"
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

SCRIPT_VERSION="1.3.2"
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

  local USER TARGET_HOME TARGET_UID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME _ow_note _kde_will
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")
  _kde_will=$(will_configure_kde "${params.editionKey.includes("kde") ? "true" : "false"}" "$TARGET_HOME" "$DESKTOP")

  local _pkg_summary="   - pacman -Sy --needed --noconfirm: fcitx5-im, fcitx5-hangul,\\n     fcitx5-configtool, fcitx5-gtk, fcitx5-qt, noto-fonts-cjk"
  local _cfg_summary="   - /etc/environment 환경변수 추가\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop, systemctl --user enable fcitx5\\n   - 첫 로그인 1회 안내 등록"
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary")
  local _extra_warn
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn")

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
  pacman -Sy --needed --noconfirm \\
    fcitx5-im fcitx5-hangul fcitx5-configtool \\
    fcitx5-gtk fcitx5-qt noto-fonts-cjk
  ok "패키지 설치 완료"
  disable_conflicting_imes "fcitx5" "$USER" "$TARGET_HOME" "$TARGET_UID" "$DESKTOP"

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
2=Shift+space
EOF
  chown -R "$USER:$USER" "$FCITX5_DIR"
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
  chown -R "$USER:$USER" "$ADIR"

  # systemd user 서비스도 활성화 (Wayland 세션용)
  su - "$USER" -c "systemctl --user enable fcitx5 2>/dev/null || true" || true
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
  echo " 전환: 한/영 키, Ctrl+Space, Shift+Space"
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

SCRIPT_VERSION="1.3.2"
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

  local USER TARGET_HOME TARGET_UID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME _ow_note _kde_will
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")
  _kde_will=$(will_configure_kde "${params.editionKey.includes("kde") ? "true" : "false"}" "$TARGET_HOME" "$DESKTOP")

  local _is_transactional=false _pkg_summary="" _extra_warn=""
  if command -v transactional-update >/dev/null 2>&1; then
    _is_transactional=true
    _pkg_summary="   - transactional-update pkg install: fcitx5, fcitx5-hangul, fcitx5-configtool,\\n     fcitx5-gtk, fcitx5-qt, fcitx5-qt5, fcitx5-qt6, fcitx5-autostart, google-noto-sans-cjk-fonts"
    _extra_warn=" ⚠️  참고: Aeon / MicroOS(transactional-update) 감지 — 설치 후 재부팅이 필요합니다."
  else
    _pkg_summary="   - zypper install -y: fcitx5, fcitx5-hangul, fcitx5-configtool,\\n     fcitx5-gtk, fcitx5-qt, fcitx5-qt5, fcitx5-qt6, fcitx5-autostart, google-noto-sans-cjk-fonts"
  fi
  local _cfg_summary="   - alternatives --set xinputrc, /etc/X11/xinit/xinput.d/fcitx5.conf 수정\\n   - ibus 사용자 서비스 비활성화(systemctl --user disable ibus)\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - ~/.bash_profile (또는 ~/.profile) 환경변수 추가"
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary")
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME" "$_extra_warn")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn")

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
  if [[ "$_is_transactional" == "true" ]]; then
    transactional-update --non-interactive pkg install \\
      fcitx5 fcitx5-hangul fcitx5-configtool \\
      fcitx5-gtk fcitx5-qt fcitx5-qt5 fcitx5-qt6 \\
      fcitx5-autostart google-noto-sans-cjk-fonts
    info "Aeon / MicroOS 감지: transactional-update 적용을 위해 설치 후 재부팅이 필요합니다."
  else
    zypper --non-interactive install -y \\
      fcitx5 fcitx5-hangul fcitx5-configtool \\
      fcitx5-gtk fcitx5-qt fcitx5-qt5 fcitx5-qt6 \\
      fcitx5-autostart
    zypper --non-interactive install -y google-noto-sans-cjk-fonts 2>/dev/null || true
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
  su - "$USER" -c "systemctl --user disable ibus 2>/dev/null || true" || true
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
2=Shift+space
EOF
  # 환경변수
  local PROFILE_FILE="$TARGET_HOME/.bash_profile"
  [[ -f "$TARGET_HOME/.profile" && ! -f "$PROFILE_FILE" ]] && PROFILE_FILE="$TARGET_HOME/.profile"
  grep -q "GTK_IM_MODULE=fcitx" "$PROFILE_FILE" 2>/dev/null || cat >> "$PROFILE_FILE" <<'EOF'

# fcitx5 환경변수
export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx
EOF
  chown -R "$USER:$USER" "$FCITX5_DIR" "$PROFILE_FILE"
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

  echo
  echo "============================================================"
  echo " 🎉 설치 완료! 재부팅 또는 재로그인"
  echo " 전환: 한/영 키, Ctrl+Space"
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
  #       2=Shift+space
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

  // ─── ibus-hangul (GNOME 친화 대안) ───
  "ibus": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - ibus-hangul (GNOME 친화 대안 한글 입력기) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/ibus/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.3.2"
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

  local USER TARGET_HOME TARGET_UID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID")

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
      _pkg_summary="   - pacman -Sy --needed: ibus, ibus-hangul, noto-fonts-cjk"
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\\n   - fcitx5 사용자 서비스 비활성화(있는 경우)\\n   - $TARGET_HOME/.config/environment.d/ibus.conf, $TARGET_HOME/.xprofile\\n   - 비-GNOME 데스크톱 시 $TARGET_HOME/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\\n   - 첫 로그인 1회 안내 팝업 등록"
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\\n   - fcitx5 사용자 서비스 비활성화(있는 경우)\\n   - $TARGET_HOME/.config/environment.d/ibus.conf, $TARGET_HOME/.xprofile\\n   - 비-GNOME 데스크톱 시 $TARGET_HOME/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\\n   - 첫 로그인 1회 안내 팝업 등록"
      ;;
    steamos)
      _pkg_summary="   - steamos-readonly disable → pacman-key init/populate → pacman -Sy --needed: ibus, ibus-hangul, noto-fonts-cjk → steamos-readonly enable"
      _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\\n   - $TARGET_HOME/.config/environment.d/ibus.conf, $TARGET_HOME/.xprofile\\n   - 비-GNOME 데스크톱 시 $TARGET_HOME/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\\n   - 첫 로그인 1회 안내 팝업 등록"
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

  _extra_warn=$(append_conflict_ime_warn "ibus" "$EXISTING_IME" "$_extra_warn")
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
      pacman -Sy --needed --noconfirm ibus ibus-hangul noto-fonts-cjk
      ;;
    steamos)
      trap steamos_cleanup EXIT
      log "[1/3] SteamOS 읽기 전용 해제 및 ibus-hangul 설치..."
      steamos-readonly disable
      pacman-key --init
      pacman-key --populate archlinux holo 2>/dev/null || pacman-key --populate
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
  local sources="[('xkb', 'us'), ('ibus', 'hangul')]"
  local preload="['xkb:us::eng', 'hangul']"
  local triggers="['<Shift>space', '<Control>space', 'Hangul']"
  if [[ -S "/run/user/$TARGET_UID/bus" ]]; then
    local bus="unix:path=/run/user/$TARGET_UID/bus"
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
      gsettings set org.gnome.desktop.input-sources sources "$sources" 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
      gsettings set org.freedesktop.ibus.general preload-engines "$preload" 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
      gsettings set org.freedesktop.ibus.general.hotkey triggers "$triggers" 2>/dev/null || true
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
    su - "$USER" -c "gsettings set org.gnome.desktop.input-sources sources \\"$sources\\"" 2>/dev/null || true
    su - "$USER" -c "gsettings set org.freedesktop.ibus.general preload-engines \\"$preload\\"" 2>/dev/null || true
    su - "$USER" -c "gsettings set org.freedesktop.ibus.general.hotkey triggers \\"$triggers\\"" 2>/dev/null || true
    su - "$USER" -c "ibus write-cache" 2>/dev/null || true
    su - "$USER" -c "systemctl --user disable fcitx5 2>/dev/null || true" || true
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
  chown -R "$USER:$USER" "$(dirname "$ENV_FILE")"

  case "$_ibus_family" in
    debian|vanilla)
      if [[ "$_ibus_family" == "debian" ]] && command -v im-config >/dev/null 2>&1; then
        su - "$USER" -c "im-config -n ibus" 2>/dev/null || warn "im-config -n ibus 실패 (수동으로 입력기를 ibus로 선택하세요)"
      fi
      local XSESSION_FILE="$TARGET_HOME/.xsessionrc"
      if ! grep -q "GTK_IM_MODULE=ibus" "$XSESSION_FILE" 2>/dev/null; then
        cat >> "$XSESSION_FILE" <<'EOF'

# ibus 환경변수
export GTK_IM_MODULE=ibus
export QT_IM_MODULE=ibus
export XMODIFIERS=@im=ibus
EOF
        chown "$USER:$USER" "$XSESSION_FILE"
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
        su - "$USER" -c "systemctl --user enable ibus 2>/dev/null || true" || true
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
        chown "$USER:$USER" "$PROFILE_FILE"
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
        chown "$USER:$USER" "$PROFILE_FILE"
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
        chown "$USER:$USER" "$XPROFILE_FILE"
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
    chown -R "$USER:$USER" "$ADIR"
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
  echo " 전환: Shift+Space / Ctrl+Space 또는 한/영 키"
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

SCRIPT_VERSION="1.3.2"
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

  _avail_line=$(printf '%s\\n' "$_chroots" | paste -sd ', ' - || true)
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
      printf '%s|%s|%s|%s|%s|%s\\n' \\
        "\${ID:-}" "\${ID_LIKE:-}" "\${VERSION_ID:-}" "\${VERSION_CODENAME:-}" \\
        "\${UBUNTU_CODENAME:-}" "\${DEBIAN_CODENAME:-}"
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
        _pkg_summary="   - AUR (yay): su - $USER -c \\"yay -S --noconfirm kime\\""
      elif command -v paru >/dev/null 2>&1 || su - "$USER" -c 'command -v paru >/dev/null 2>&1'; then
        _aur_helper="paru"
        _pkg_summary="   - AUR (paru): su - $USER -c \\"paru -S --noconfirm kime\\""
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
      _copr_target="fedora-\${_os_ver}-\${_fedora_arch}"
      if [[ "\${OS_NAME,,}" == *"rawhide"* ]]; then
        _copr_target="fedora-rawhide-\${_fedora_arch}"
      fi
      if ! _copr_avail=$(check_fedora_copr_support "$_os_ver" "$_fedora_arch" "$OS_NAME"); then
        err "Fedora COPR(toroidalfox/kime)에서 현재 버전(\${_copr_target})을 지원하지 않습니다. 지원 대상: \${_copr_avail:-없음} | 수동 빌드: https://github.com/Riey/kime"
      fi
      _pkg_summary="   - Fedora COPR (toroidalfox/kime, \${_copr_target}): dnf copr enable -y toroidalfox/kime && dnf install -y kime"
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

  local _kde_will _cfg_summary _extra_warn=""
  _kde_will=$(will_configure_kde "false" "$TARGET_HOME" "$DESKTOP")
  _cfg_summary="   - $TARGET_HOME/.config/environment.d/kime.conf"
  if [[ "$_kime_family" == "debian" ]]; then
    _cfg_summary="\${_cfg_summary}\\n   - im-config -n kime (im-config 사용 가능 시)"
  else
    _cfg_summary="\${_cfg_summary}\\n   - $TARGET_HOME/.xprofile (X11 세션 호환)"
  fi
  _cfg_summary="\${_cfg_summary}\\n   - /etc/xdg/autostart/kime.desktop 확인 (없을 경우 $TARGET_HOME/.config/autostart/kime.desktop 생성)"
  if [[ "$_kde_will" == "true" ]]; then
    _cfg_summary="\${_cfg_summary}\\n   - KDE Plasma 가상 키보드 설정: $TARGET_HOME/.config/kwinrc ([Wayland] InputMethod=/usr/share/applications/kime.desktop)"
  fi
  _cfg_summary="\${_cfg_summary}\\n   - 첫 로그인 1회 안내 팝업 등록 ($TARGET_HOME/.local/bin/hangul-first-login-guide.sh)"

  _extra_warn=$(append_conflict_ime_warn "kime" "$EXISTING_IME" "$_extra_warn")
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
    chown "$USER:$USER" "$TARGET_HOME/.config" "$_kwinrc" 2>/dev/null || true
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
    chown -R "$USER:$USER" "$ADIR"
    ok "자동시작 등록 ($_kime_exec)"
  fi
${KIME_POST_LOGIN_GUIDE_SNIPPET(params.distroName, params.scriptId)}
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
`,

  // ─── Fedora Atomic (Bazzite / Aurora / Silverblue / Kinoite) ───
  "fedora-atomic": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/fedora-atomic/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.3.2"
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

  local USER TARGET_HOME TARGET_UID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME _ow_note _kde_will
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")
  _kde_will=$(will_configure_kde "${params.editionKey.includes("kde") || params.distroKey === "bazzite" || params.distroKey === "aurora" ? "true" : "false"}" "$TARGET_HOME" "$DESKTOP")

  local _pkg_summary="   - rpm-ostree install --idempotent --allow-inactive:\\n     fcitx5, fcitx5-hangul, fcitx5-gtk, fcitx5-qt, fcitx5-configtool, fcitx5-autostart, google-noto-sans-cjk-ttc-fonts"
  local _cfg_summary="   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/environment.d/fcitx5.conf"
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary")
  local _extra_warn=" ⚠️  참고: 불변 OS(rpm-ostree)이므로 설치 완료 후 반드시 재부팅이 필요합니다."
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME" "$_extra_warn")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn")

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
2=Shift+space
EOF
  chown -R "$USER:$USER" "$FCITX5_DIR"
  if [[ \${#_fcitx5_svcs[@]} -gt 0 && -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]]; then
    local _svc
    for _svc in "\${_fcitx5_svcs[@]}"; do
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
        systemctl --user start "$_svc" 2>/dev/null || true
    done
  fi

  # 3. Wayland/X11 환경변수
  log "[3/3] 환경변수 설정..."
  local ENV_FILE="$TARGET_HOME/.config/environment.d/fcitx5.conf"
  mkdir -p "$(dirname "$ENV_FILE")"
  cat > "$ENV_FILE" <<'EOF'
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
  chown -R "$USER:$USER" "$(dirname "$ENV_FILE")"
  ok "환경변수 설정 완료"
${KDE_VIRTUAL_KEYBOARD_SNIPPET(params.editionKey.includes("kde") || params.distroKey === "bazzite" || params.distroKey === "aurora")}

  echo
  echo "============================================================"
  echo " 🎉 Fedora Atomic 설정 완료! 반드시 재부팅하세요."
  echo " 재부팅 명령: systemctl reboot"
  echo " KDE(Bazzite/Aurora/Kinoite): 가상 키보드(Fcitx 5) 자동 설정됨 (미적용 시 시스템설정 → 입력장치 → 가상키보드 확인)"
  echo " 전환: 한/영 키, Ctrl+Space, Shift+Space"
  echo "============================================================"
}
main "$@"
`,

  // ─── SteamOS 3.x (Steam Deck) ───
  "steamos": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/steamos/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.3.2"
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

  local USER TARGET_HOME TARGET_UID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME _ow_note
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")

  local _pkg_summary="   - steamos-readonly disable → pacman-key --init/--populate →\\n     pacman -Sy --needed: fcitx5-im, fcitx5-hangul, fcitx5-configtool, fcitx5-gtk, fcitx5-qt, noto-fonts-cjk\\n   - 설치 후 steamos-readonly enable 복구"
  local _cfg_summary="   - /etc/environment 환경변수 추가\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop\\n   - KDE Plasma 가상 키보드 설정: $TARGET_HOME/.config/kwinrc ([Wayland] InputMethod)"
  local _extra_warn=" ⚠️  참고: SteamOS 루트 파일시스템 읽기 전용 상태를 일시 해제했다가 복구합니다."
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME" "$_extra_warn")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn")

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
  pacman -Sy --needed --noconfirm \\
    fcitx5-im fcitx5-hangul fcitx5-configtool fcitx5-gtk fcitx5-qt noto-fonts-cjk
  ok "패키지 설치 완료"
  disable_conflicting_imes "fcitx5" "$USER" "$TARGET_HOME" "$TARGET_UID" "$DESKTOP"

  # 2. 시스템 환경변수
  log "[2/4] 시스템 환경변수 설정..."
  grep -q "GTK_IM_MODULE=fcitx" /etc/environment 2>/dev/null || cat >> /etc/environment <<'EOF'

# fcitx5 환경변수
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
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
2=Shift+space
EOF
  chown -R "$USER:$USER" "$FCITX5_DIR"
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
  chown -R "$USER:$USER" "$ADIR"
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

SCRIPT_VERSION="1.3.2"
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

  local USER TARGET_HOME TARGET_UID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID")

  local _pkg_summary="   - dnf install -y: ibus-hangul, ibus-setup, google-noto-sans-cjk-ttc-fonts (또는 google-noto-cjk-fonts)"
  local _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\\n   - 실행 중인 ibus-daemon 재시작\\n   - $TARGET_HOME/.config/environment.d/ibus.conf, ~/.bash_profile (또는 ~/.profile)"
  local _cfg_summary="   - ibus write-cache 및 GNOME 입력 소스('hangul')/preload-engines 등록(gsettings)\\n   - 실행 중인 ibus-daemon 재시작\\n   - $TARGET_HOME/.config/environment.d/ibus.conf, ~/.bash_profile (또는 ~/.profile)"
  local _extra_warn
  _extra_warn=$(append_conflict_ime_warn "ibus" "$EXISTING_IME")

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
  local sources="[('xkb', 'us'), ('ibus', 'hangul')]"
  local preload="['xkb:us::eng', 'hangul']"
  local triggers="['<Shift>space', '<Control>space', 'Hangul']"
  if [ -S "/run/user/$TARGET_UID/bus" ]; then
    local bus="unix:path=/run/user/$TARGET_UID/bus"
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
      gsettings set org.gnome.desktop.input-sources sources "$sources" 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
      gsettings set org.freedesktop.ibus.general preload-engines "$preload" 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
      gsettings set org.freedesktop.ibus.general.hotkey triggers "$triggers" 2>/dev/null || true
    sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
      ibus write-cache 2>/dev/null || true
    if pgrep -u "$TARGET_UID" -x ibus-daemon >/dev/null 2>&1; then
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \\
        ibus restart 2>/dev/null || true
    fi
  else
    su - "$USER" -c "gsettings set org.gnome.desktop.input-sources sources \\"$sources\\"" 2>/dev/null || true
    su - "$USER" -c "gsettings set org.freedesktop.ibus.general preload-engines \\"$preload\\"" 2>/dev/null || true
    su - "$USER" -c "gsettings set org.freedesktop.ibus.general.hotkey triggers \\"$triggers\\"" 2>/dev/null || true
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
  echo " 전환: Shift+Space / Ctrl+Space 또는 한/영 키"
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

SCRIPT_VERSION="1.3.2"
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

  local USER TARGET_HOME TARGET_UID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME _ow_note _kde_will
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")
  _kde_will=$(will_configure_kde "${params.editionKey.includes("kde") ? "true" : "false"}" "$TARGET_HOME" "$DESKTOP")

  local _pkg_summary="   - xbps-install -Sy: fcitx5, fcitx5-hangul, fcitx5-gtk+3, fcitx5-gtk4,\\n     fcitx5-qt5, fcitx5-qt6, fcitx5-configtool, noto-fonts-cjk"
  local _cfg_summary="   - /etc/environment, $TARGET_HOME/.xprofile\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록"
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary")
  local _extra_warn
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn")

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
  grep -q "GTK_IM_MODULE=fcitx" /etc/environment 2>/dev/null || cat >> /etc/environment <<'EOF'

# fcitx5 환경변수
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
  local XPROFILE="$TARGET_HOME/.xprofile"
  grep -q "GTK_IM_MODULE=fcitx" "$XPROFILE" 2>/dev/null || cat >> "$XPROFILE" <<'EOF'

# fcitx5 환경변수
export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx
EOF
  chown "$USER:$USER" "$XPROFILE"
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
2=Shift+space
EOF
  chown -R "$USER:$USER" "$FCITX5_DIR"
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
  chown -R "$USER:$USER" "$ADIR"
  ok "자동시작 등록 완료"
${KDE_VIRTUAL_KEYBOARD_SNIPPET(params.editionKey.includes("kde"))}
${POST_LOGIN_GUIDE_SNIPPET(params.distroName, params.editionKey.includes("kde"))}
  echo
  echo "============================================================"
  echo " 🎉 Void Linux 설치 완료! 재로그인 필요"
  echo " 전환: 한/영 키, Ctrl+Space, Shift+Space"
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

SCRIPT_VERSION="1.3.2"
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
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")

  _pkg_summary="   - apk update && apk add: fcitx5, fcitx5-hangul, fcitx5-gtk,\\n     fcitx5-qt, fcitx5-configtool, font-noto-cjk"
  _cfg_summary="   - /etc/environment, $TARGET_HOME/.profile\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록"
  _extra_warn=""
  if [ -f "$TARGET_HOME/.config/fcitx5/profile" ] || [ -f "$TARGET_HOME/.config/fcitx5/config" ]; then
    _extra_warn=" ⚠️  참고: 기존 Fcitx5 설정 파일($TARGET_HOME/.config/fcitx5/profile, config)이 덮어써집니다."
  fi
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn")

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

${POST_LOGIN_GUIDE_SNIPPET(params.distroName, params.editionKey.includes("kde"))}
  echo
  echo "============================================================"
  echo " 🎉 Alpine Linux 설치 완료! 재로그인 필요"
  echo " 전환: 한/영 키, Ctrl+Space, Shift+Space"
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

SCRIPT_VERSION="1.3.2"
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

  local USER TARGET_HOME TARGET_UID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME _ow_note _kde_will
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")
  _kde_will=$(will_configure_kde "${params.editionKey.includes("kde") ? "true" : "false"}" "$TARGET_HOME" "$DESKTOP")

  local _pkg_summary="   - eopkg install -y: fcitx5, fcitx5-hangul, fcitx5-gtk, fcitx5-qt5, fcitx5-configtool"
  local _cfg_summary="   - /etc/environment, $TARGET_HOME/.config/environment.d/fcitx5.conf\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록"
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary")
  local _extra_warn
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn")

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
  grep -q "GTK_IM_MODULE=fcitx" /etc/environment 2>/dev/null || cat >> /etc/environment <<'EOF'

# fcitx5 환경변수
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
  local ENV_FILE="$TARGET_HOME/.config/environment.d/fcitx5.conf"
  mkdir -p "$(dirname "$ENV_FILE")"
  cat > "$ENV_FILE" <<'EOF'
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
  chown -R "$USER:$USER" "$(dirname "$ENV_FILE")"
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
2=Shift+space
EOF
  chown -R "$USER:$USER" "$FCITX5_DIR"
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
  chown -R "$USER:$USER" "$ADIR"
  ok "자동시작 등록 완료"
${KDE_VIRTUAL_KEYBOARD_SNIPPET(params.editionKey.includes("kde"))}
${POST_LOGIN_GUIDE_SNIPPET(params.distroName, params.editionKey.includes("kde"))}
  echo
  echo "============================================================"
  echo " 🎉 Solus 설치 완료! 재로그인 필요"
  echo " 전환: 한/영 키, Ctrl+Space, Shift+Space"
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

SCRIPT_VERSION="1.3.2"
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

  local USER TARGET_HOME TARGET_UID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME _ow_note _kde_will
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")
  _kde_will=$(will_configure_kde "${params.editionKey.includes("kde") ? "true" : "false"}" "$TARGET_HOME" "$DESKTOP")

  local _pkg_summary="   - emerge --noreplace: app-i18n/fcitx:5, app-i18n/fcitx-hangul:5,\\n     app-i18n/fcitx-gtk:5, app-i18n/fcitx-qt:5, app-i18n/fcitx-configtool:5"
  local _cfg_summary="   - /etc/environment, $TARGET_HOME/.xprofile\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록"
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary")
  local _extra_warn
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn")

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
  grep -q "GTK_IM_MODULE=fcitx" /etc/environment 2>/dev/null || cat >> /etc/environment <<'EOF'

# fcitx5 환경변수
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
  local XPROFILE="$TARGET_HOME/.xprofile"
  grep -q "GTK_IM_MODULE=fcitx" "$XPROFILE" 2>/dev/null || cat >> "$XPROFILE" <<'EOF'

# fcitx5 환경변수
export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx
EOF
  chown "$USER:$USER" "$XPROFILE"
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
2=Shift+space
EOF
  chown -R "$USER:$USER" "$FCITX5_DIR"
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
  chown -R "$USER:$USER" "$ADIR"
  ok "자동시작 등록 완료"
${KDE_VIRTUAL_KEYBOARD_SNIPPET(params.editionKey.includes("kde"))}
${POST_LOGIN_GUIDE_SNIPPET(params.distroName, params.editionKey.includes("kde"))}
  echo
  echo "============================================================"
  echo " 🎉 Gentoo 설치 완료! 재로그인 필요"
  echo " 전환: 한/영 키, Ctrl+Space, Shift+Space"
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

SCRIPT_VERSION="1.3.2"
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

  local USER TARGET_HOME TARGET_UID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME _ow_note _kde_will
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")
  _kde_will=$(will_configure_kde "${params.editionKey.includes("kde") ? "true" : "false"}" "$TARGET_HOME" "$DESKTOP")

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
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary")
  local _extra_warn
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn")

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
  grep -q "GTK_IM_MODULE=fcitx" /etc/environment 2>/dev/null || cat >> /etc/environment <<'EOF'

# fcitx5 환경변수
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
  local XPROFILE="$TARGET_HOME/.xprofile"
  grep -q "GTK_IM_MODULE=fcitx" "$XPROFILE" 2>/dev/null || cat >> "$XPROFILE" <<'EOF'

# fcitx5 환경변수
export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx
EOF
  chown "$USER:$USER" "$XPROFILE"
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
2=Shift+space
EOF
  chown -R "$USER:$USER" "$FCITX5_DIR"
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
  chown -R "$USER:$USER" "$ADIR"
  ok "자동시작 등록 완료"
${KDE_VIRTUAL_KEYBOARD_SNIPPET(params.editionKey.includes("kde"))}

  echo
  echo "============================================================"
  echo " 🎉 ${params.distroName} 설치 완료! 재로그인 필요"
  echo " 전환: 한/영 키, Ctrl+Space, Shift+Space"
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

SCRIPT_VERSION="1.3.2"
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

  local USER TARGET_HOME TARGET_UID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME _ow_note
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")

  local _pkg_summary="   - pacman -Sy --needed --noconfirm: fcitx5, fcitx5-hangul, fcitx5-qt, fcitx5-configtool, noto-fonts-cjk"
  local _cfg_summary="   - /etc/environment, $TARGET_HOME/.config/environment.d/fcitx5.conf\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop\\n   - KDE Plasma 가상 키보드 설정: $TARGET_HOME/.config/kwinrc ([Wayland] InputMethod)"
  local _extra_warn
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn")

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
  pacman -Sy --needed --noconfirm fcitx5 fcitx5-hangul fcitx5-qt fcitx5-configtool noto-fonts-cjk
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
  local ENV_FILE="$TARGET_HOME/.config/environment.d/fcitx5.conf"
  mkdir -p "$(dirname "$ENV_FILE")"
  cat > "$ENV_FILE" <<'EOF'
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
  chown -R "$USER:$USER" "$(dirname "$ENV_FILE")"
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
2=Shift+space
EOF
  chown -R "$USER:$USER" "$FCITX5_DIR"
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
  chown -R "$USER:$USER" "$ADIR"
  ok "자동시작 등록 완료"
${KDE_VIRTUAL_KEYBOARD_SNIPPET(true)}

  echo
  echo "============================================================"
  echo " 🎉 KaOS 설치 완료! 재로그인 필요"
  echo " KDE: 가상 키보드(Fcitx 5) 자동 설정됨 (미적용 시 시스템설정 → 입력장치 → 가상키보드 확인)"
  echo " 전환: 한/영 키, Ctrl+Space, Shift+Space"
  echo "============================================================"
}
main "$@"
`,

  // ─── Vanilla OS (ABRoot 불변 Debian) ───
  "vanilla": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/vanilla/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.3.2"
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

  local USER TARGET_HOME TARGET_UID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME _ow_note
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")

  local _pkg_summary="   - abroot pkg add: fcitx5, fcitx5-hangul, fcitx5-config-qt,\\n     fcitx5-frontend-gtk3, fcitx5-frontend-gtk4, fcitx5-frontend-qt5, fcitx5-frontend-qt6"
  local _cfg_summary="   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/environment.d/fcitx5.conf, $TARGET_HOME/.config/autostart/fcitx5.desktop"
  local _extra_warn=" ⚠️  참고: 불변 OS(ABRoot)이므로 설치 완료 후 반드시 재부팅이 필요합니다."
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME" "$_extra_warn")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn")

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
2=Shift+space
EOF
  chown -R "$USER:$USER" "$FCITX5_DIR"
  if [[ \${#_fcitx5_svcs[@]} -gt 0 && -n "$_fcitx5_uid" && -S "/run/user/$_fcitx5_uid/bus" ]]; then
    local _svc
    for _svc in "\${_fcitx5_svcs[@]}"; do
      sudo -u "$USER" XDG_RUNTIME_DIR="/run/user/$_fcitx5_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$_fcitx5_uid/bus" \\
        systemctl --user start "$_svc" 2>/dev/null || true
    done
  fi

  # 3. 환경변수 설정
  log "[3/4] 환경변수 설정..."
  local ENV_FILE="$TARGET_HOME/.config/environment.d/fcitx5.conf"
  mkdir -p "$(dirname "$ENV_FILE")"
  cat > "$ENV_FILE" <<'EOF'
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
  chown -R "$USER:$USER" "$(dirname "$ENV_FILE")"

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
  chown -R "$USER:$USER" "$ADIR"
  ok "자동시작 등록 완료"

  echo
  echo "============================================================"
  echo " 🎉 Vanilla OS 설정 완료! 반드시 재부팅하세요 (ABRoot 적용)."
  echo " 전환: 한/영 키, Ctrl+Space, Shift+Space"
  echo "============================================================"
}
main "$@"
`,

  // ─── ALT Linux (apt-rpm) ───
  "alt": (params) => `#!/usr/bin/env bash
# ${params.distroName} ${params.editionLabel} - 한글 입력기(fcitx5-hangul) 자동 설치
# 실행: curl -sL https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/alt/${params.scriptId}.sh | sudo bash

set -euo pipefail

SCRIPT_VERSION="1.3.2"
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

  local USER TARGET_HOME TARGET_UID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME _ow_note _kde_will
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")
  _kde_will=$(will_configure_kde "${params.editionKey.includes("kde") ? "true" : "false"}" "$TARGET_HOME" "$DESKTOP")

  local _pkg_summary="   - apt-get update && apt-get install -y: fcitx5, fcitx5-hangul, fcitx5-gtk, fcitx5-qt, fcitx5-configtool"
  local _cfg_summary="   - /etc/environment, $TARGET_HOME/.xprofile\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop"
  _cfg_summary=$(append_kde_cfg_line "$_kde_will" "$TARGET_HOME" "$_cfg_summary")
  local _extra_warn
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn")

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
  grep -q "GTK_IM_MODULE=fcitx" /etc/environment 2>/dev/null || cat >> /etc/environment <<'EOF'

# fcitx5 환경변수
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
  local XPROFILE="$TARGET_HOME/.xprofile"
  grep -q "GTK_IM_MODULE=fcitx" "$XPROFILE" 2>/dev/null || cat >> "$XPROFILE" <<'EOF'

# fcitx5 환경변수
export GTK_IM_MODULE=fcitx
export QT_IM_MODULE=fcitx
export XMODIFIERS=@im=fcitx
EOF
  chown "$USER:$USER" "$XPROFILE"
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
2=Shift+space
EOF
  chown -R "$USER:$USER" "$FCITX5_DIR"
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
  chown -R "$USER:$USER" "$ADIR"
  ok "자동시작 등록 완료"
${KDE_VIRTUAL_KEYBOARD_SNIPPET(params.editionKey.includes("kde"))}

  echo
  echo "============================================================"
  echo " 🎉 ALT Linux 설치 완료! 재로그인 필요"
  echo " 전환: 한/영 키, Ctrl+Space, Shift+Space"
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

SCRIPT_VERSION="1.3.2"
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

  local USER TARGET_HOME TARGET_UID OS_NAME DESKTOP SESSION_TYPE EXISTING_IME _ow_note
  USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$USER" | cut -d: -f6)
  TARGET_UID=$(id -u "$USER")
  OS_NAME=$(detect_os_pretty)
  DESKTOP=$(detect_desktop "$USER")
  SESSION_TYPE=$(detect_session_type "$USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID")
  _ow_note=$(fcitx5_overwrite_note "$TARGET_HOME")

  local _pkg_summary="   - su - $USER: guix install fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool font-google-noto-sans-cjk"
  local _cfg_summary="   - ~/.bash_profile (또는 ~/.profile) GUIX_PROFILE 및 환경변수 추가\\n   - $TARGET_HOME/.config/fcitx5/{profile,config}$_ow_note\\n   - $TARGET_HOME/.config/autostart/fcitx5.desktop"
  local _extra_warn
  _extra_warn=$(append_fcitx5_overwrite_warn "$TARGET_HOME")
  _extra_warn=$(append_conflict_ime_warn "fcitx5" "$EXISTING_IME" "$_extra_warn")

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
  su - "$USER" -c "guix install fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool font-google-noto-sans-cjk"
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
  chown "$USER:$USER" "$PROFILE_FILE"
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
2=Shift+space
EOF
  chown -R "$USER:$USER" "$FCITX5_DIR"
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
  chown -R "$USER:$USER" "$ADIR"
  ok "자동시작 등록 완료"

  echo
  echo "============================================================"
  echo " 🎉 Guix System 설치 완료! 재로그인 필요"
  echo " 선언적 설정을 원할 경우 /etc/config.scm 의 %desktop-services / home-environment 에도 추가하세요."
  echo " 전환: 한/영 키, Ctrl+Space, Shift+Space"
  echo "============================================================"
}
main "$@"
`
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SCRIPT_TEMPLATES };
}
