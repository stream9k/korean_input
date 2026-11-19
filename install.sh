#!/usr/bin/env bash
# Linux Korean Input Method (fcitx5-hangul / RHEL: ibus-hangul) Auto-Detect Installer
# Supports 18 distro families with automatic KO/EN terminal output & Noto CJK Korean font install.
# Usage (no git / chmod required):
#   curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input/main/install.sh | sudo bash
#   or wget: wget -qO- https://raw.githubusercontent.com/stream9k/korean_input/main/install.sh | sudo bash
#   or local: sudo bash install.sh [--lang=ko|--lang=en]

set -euo pipefail

SCRIPT_VERSION="1.1.0"
LOG_FILE="/var/log/install-hangul-auto.log"

IS_KO=false
if [[ "${LC_ALL:-${LANG:-}}" == ko* ]]; then
  IS_KO=true
fi
for arg in "$@"; do
  case "$arg" in
    --lang=ko) IS_KO=true ;;
    --lang=en) IS_KO=false ;;
  esac
done

msg() {
  if [[ "$IS_KO" == "true" ]]; then
    echo "$1"
  else
    echo "$2"
  fi
}

log()  { echo "[$(date '+%F %T')] $*" | tee -a "$LOG_FILE"; }
err()  { log "❌ $*"; exit 1; }
warn() { log "⚠️  $*"; }
ok()   { log "✅ $*"; }
info() { log "ℹ️  $*"; }

require_root() {
  if [[ $EUID -ne 0 ]]; then
    err "$(msg "root 권한이 필요합니다. 'sudo bash $0' 또는 '... | sudo bash'로 실행하세요." "Root privileges required. Run with 'sudo bash $0' or '... | sudo bash'.")"
  fi
}

detect_user() {
  local u="${SUDO_USER:-}"
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(logname 2>/dev/null || true)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  u=$(who | awk '{print $1}' | head -n1 || true)
  [[ -n "$u" && "$u" != "root" ]] && { echo "$u"; return; }
  if id -u deck >/dev/null 2>&1; then
    echo "deck"
    return
  fi
  err "$(msg "대상 데스크톱 사용자를 자동으로 찾지 못했습니다. 'sudo -E SUDO_USER=<사용자명> bash $0'로 실행하세요." "Could not detect target desktop user. Run with 'sudo -E SUDO_USER=<username> bash $0'.")"
}

detect_desktop() {
  local user="$1"
  local d="${XDG_CURRENT_DESKTOP:-}"
  [[ -n "$d" ]] && { echo "$d"; return; }
  d=$(su - "$user" -c 'echo ${XDG_CURRENT_DESKTOP:-}' 2>/dev/null || true)
  [[ -n "$d" ]] && { echo "$d"; return; }
  d=$(su - "$user" -c 'echo ${DESKTOP_SESSION:-}' 2>/dev/null || true)
  [[ -n "$d" ]] && { echo "$d"; return; }
  echo "unknown"
}

detect_family() {
  local os_id=""
  local os_like=""
  if [[ -f /etc/os-release ]]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    os_id="${ID:-}"
    os_like="${ID_LIKE:-}"
  fi

  if command -v steamos-readonly >/dev/null 2>&1 || [[ "$os_id" == "steamos" ]]; then
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
  if [[ "$os_id" == "nixos" ]]; then
    echo "nixos"; return
  fi
  if command -v guix >/dev/null 2>&1 || [[ "$os_id" == "guix" ]]; then
    echo "guix"; return
  fi
  case "$os_id" in
    rhel|almalinux|rocky|centos|oreon)
      echo "rhel-family"; return ;;
    kaos)
      echo "kaos"; return ;;
    altlinux)
      echo "alt"; return ;;
  esac
  if [[ -f /etc/altlinux-release ]]; then
    echo "alt"; return
  fi
  if command -v pacman >/dev/null 2>&1; then
    echo "arch-family"; return
  fi
  if command -v apt-get >/dev/null 2>&1; then
    echo "debian-family"; return
  fi
  if command -v dnf >/dev/null 2>&1; then
    case "$os_id" in
      mageia|openmandriva*)
        echo "mandriva-family"; return ;;
      *)
        echo "fedora"; return ;;
    esac
  fi
  if command -v zypper >/dev/null 2>&1; then
    echo "opensuse"; return
  fi
  if command -v xbps-install >/dev/null 2>&1; then
    echo "void"; return
  fi
  if command -v apk >/dev/null 2>&1; then
    echo "alpine"; return
  fi
  if command -v eopkg >/dev/null 2>&1; then
    echo "solus"; return
  fi
  if command -v emerge >/dev/null 2>&1; then
    echo "gentoo"; return
  fi
  if command -v urpmi >/dev/null 2>&1; then
    echo "mandriva-family"; return
  fi

  err "$(msg "지원되는 리눅스 배포판/패키지 관리자를 감지하지 못했습니다 (ID=$os_id, ID_LIKE=$os_like)." "Unsupported Linux distro/package manager (ID=$os_id, ID_LIKE=$os_like).")"
}

write_fcitx5_user_config() {
  local target_home="$1"
  local uid="$2"
  local gid="$3"
  local user
  user=$(id -nu "$uid" 2>/dev/null || echo "")

  # 실행 중인 fcitx5가 종료 시 메모리의 기존 프로필로 덮어쓰는 현상 방지 (Omarchy 등 기본 탑재 환경 대응)
  local stopped_svcs=()
  if [[ -n "$user" && -S "/run/user/$uid/bus" ]] && command -v systemctl >/dev/null 2>&1 && command -v sudo >/dev/null 2>&1; then
    local bus="unix:path=/run/user/$uid/bus"
    local svc
    while IFS= read -r svc; do
      if [[ -n "$svc" ]]; then
        sudo -u "$user" XDG_RUNTIME_DIR="/run/user/$uid" DBUS_SESSION_BUS_ADDRESS="$bus" \
          systemctl --user stop "$svc" 2>/dev/null || true
        stopped_svcs+=("$svc")
      fi
    done < <(sudo -u "$user" XDG_RUNTIME_DIR="/run/user/$uid" DBUS_SESSION_BUS_ADDRESS="$bus" \
      systemctl --user list-units --type=service --state=running --no-legend '*fcitx5*' 2>/dev/null | awk '{print $1}' || true)
  fi

  if command -v pkill >/dev/null 2>&1; then
    pkill -u "$uid" -x fcitx5 2>/dev/null || true
  elif [[ -n "$user" ]] && command -v killall >/dev/null 2>&1; then
    killall -u "$user" fcitx5 2>/dev/null || true
  fi

  if command -v pgrep >/dev/null 2>&1; then
    local wait_i=0
    while pgrep -u "$uid" -x fcitx5 >/dev/null 2>&1 && [[ $wait_i -lt 20 ]]; do
      sleep 0.1 2>/dev/null || sleep 1
      wait_i=$((wait_i + 1))
    done
    if pgrep -u "$uid" -x fcitx5 >/dev/null 2>&1; then
      pkill -9 -u "$uid" -x fcitx5 2>/dev/null || true
      sleep 0.2 2>/dev/null || sleep 1
    fi
  else
    sleep 1
  fi

  local fcitx5_dir="$target_home/.config/fcitx5"
  mkdir -p "$fcitx5_dir"

  cat > "$fcitx5_dir/profile" <<'EOF'
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

  cat > "$fcitx5_dir/config" <<'EOF'
[Hotkey]
EnumerateWithTriggerKeys=True
SkipFirst=False
[Hotkey/TriggerKeys]
0=Hangul
1=Control+space
2=Shift+space
EOF

  chown -R "$uid:$gid" "$fcitx5_dir"

  if [[ ${#stopped_svcs[@]} -gt 0 && -n "$user" && -S "/run/user/$uid/bus" ]]; then
    local bus="unix:path=/run/user/$uid/bus"
    local svc
    for svc in "${stopped_svcs[@]}"; do
      sudo -u "$user" XDG_RUNTIME_DIR="/run/user/$uid" DBUS_SESSION_BUS_ADDRESS="$bus" \
        systemctl --user start "$svc" 2>/dev/null || true
    done
  fi

  ok "$(msg "Fcitx5 프로필 및 한/영 전환 핫키 설정 완료" "Configured Fcitx5 profile and Hangul toggle hotkeys")"
}

write_autostart_fcitx5() {
  local target_home="$1"
  local uid="$2"
  local gid="$3"
  local adir="$target_home/.config/autostart"
  mkdir -p "$adir"
  cat > "$adir/fcitx5.desktop" <<'EOF'
[Desktop Entry]
Type=Application
Name=Fcitx 5
Exec=fcitx5 -d
X-GNOME-Autostart-enabled=true
Hidden=false
NoDisplay=false
EOF
  chown -R "$uid:$gid" "$adir"
  ok "$(msg "Fcitx5 자동시작 등록 완료" "Registered Fcitx5 autostart entry")"
}

register_first_login_guide() {
  local target_home="$1"
  local target_uid="$2"
  local target_gid="$3"
  local is_ko="$4"
  local family="$5"
  local desktop="$6"

  local autostart_dir="$target_home/.config/autostart"
  local bin_dir="$target_home/.local/bin"
  local guide_bin="$bin_dir/hangul-first-login-guide.sh"
  local desktop_file="$autostart_dir/hangul-first-login-guide.desktop"

  mkdir -p "$autostart_dir" "$bin_dir"

  local title msg
  if [[ "$is_ko" == "true" ]]; then
    title="리눅스 한글 입력기 안내"
    msg="🎉 리눅스 한글 입력기 설정이 완료되었습니다!\n\n"
    if [[ "$desktop" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]]; then
      msg+="🖥️  KDE Plasma 추가 설정: 시스템 설정 → 입력 장치 → 가상 키보드 → Fcitx 5 선택\n"
    fi
    if [[ "$family" == "rhel-family" ]]; then
      msg+="⌨️  전환 단축키: Super+Space 또는 한/영 키\n"
      msg+="⚙️  설정: ibus-setup\n"
    else
      msg+="⌨️  전환 단축키: 한/영 키, Ctrl+Space, Shift+Space\n"
      msg+="💡 영문 키보드 사용 시: fcitx5-configtool 에서 오른쪽 Alt(Alt_R) 등록 가능\n"
      msg+="   (Firefox 메뉴와 Alt키 충돌 시: 설정→키보드→키바인딩→키보드옵션에서 '오른쪽 ALT를 한/영키로 만들기' 체크)\n"
      msg+="⚙️  설정: fcitx5-configtool | 진단: fcitx5-diagnose\n"
    fi
    msg+="📝 로그: $LOG_FILE\n\n"
    msg+="(💡 이 안내창은 재부팅 후 1회만 표시되며 자동으로 삭제됩니다.)"
  else
    title="Linux Korean Input Guide"
    msg="🎉 Korean Input Method setup complete!\n\n"
    if [[ "$desktop" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]]; then
      msg+="🖥️  KDE Plasma Extra Step: System Settings -> Input Devices -> Virtual Keyboard -> Select Fcitx 5\n"
    fi
    if [[ "$family" == "rhel-family" ]]; then
      msg+="⌨️  Toggle: Super+Space or Hangul key\n"
      msg+="⚙️  Config: ibus-setup\n"
    else
      msg+="⌨️  Toggle keys: Hangul key, Ctrl+Space, Shift+Space\n"
      msg+="💡 US Keyboard tip: You can bind Right Alt (Alt_R) in fcitx5-configtool\n"
      msg+="⚙️  Config: fcitx5-configtool | Diagnose: fcitx5-diagnose\n"
    fi
    msg+="📝 Log: $LOG_FILE\n\n"
    msg+="(💡 This notification is shown only once upon reboot and self-deletes.)"
  fi

  cat > "$guide_bin" <<EOF
#!/usr/bin/env bash
# One-shot first-login welcome notification (self-deleting)
sleep 2

TITLE="$title"
MSG=\$(printf "%b" "$msg")

if command -v kdialog >/dev/null 2>&1; then
  kdialog --title "\$TITLE" --msgbox "\$MSG" 2>/dev/null
elif command -v zenity >/dev/null 2>&1; then
  zenity --info --title="\$TITLE" --text="\$MSG" --width=480 2>/dev/null
elif command -v notify-send >/dev/null 2>&1; then
  notify-send -u critical -t 20000 "\$TITLE" "\$MSG" 2>/dev/null
fi

# Self-delete
rm -f "$desktop_file"
rm -f "$guide_bin"
EOF

  chmod +x "$guide_bin"

  cat > "$desktop_file" <<EOF
[Desktop Entry]
Type=Application
Name=Hangul First Login Guide
Exec=$guide_bin
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

  chown -R "$target_uid:$target_gid" "$autostart_dir" "$bin_dir"
  ok "$(msg "재부팅 후 1회성 안내 팝업 등록 완료 (다음 로그인 시 1회 표시 후 자폭)" "Registered one-shot first-login welcome notification (self-deletes after display)")"
}

write_env_etc_and_envd() {
  local target_home="$1"
  local uid="$2"
  local gid="$3"

  local env_file="$target_home/.config/environment.d/fcitx5.conf"
  mkdir -p "$(dirname "$env_file")"
  cat > "$env_file" <<'EOF'
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
  chown -R "$uid:$gid" "$(dirname "$env_file")"

  if ! grep -q "GTK_IM_MODULE=fcitx" /etc/environment 2>/dev/null; then
    cat >> /etc/environment <<'EOF'

# fcitx5 environment variables
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
  fi
}

append_profile_env() {
  local file="$1"
  local uid="$2"
  local gid="$3"
  local im="$4"
  if ! grep -q "GTK_IM_MODULE=$im" "$file" 2>/dev/null; then
    cat >> "$file" <<EOF

# $im environment variables
export GTK_IM_MODULE=$im
export QT_IM_MODULE=$im
export XMODIFIERS=@im=$im
EOF
  fi
  chown "$uid:$gid" "$file"
}

clear_desktop_shortcut_conflicts() {
  local user="$1"
  local uid="$2"
  local desktop="$3"
  local cmds=()

  case "$desktop" in
    *CINNAMON*|*cinnamon*)
      cmds=(
        "org.cinnamon.desktop.keybindings.wm switch-input-source []"
        "org.cinnamon.desktop.keybindings.wm switch-input-source-backward []"
        "org.gnome.desktop.wm.keybindings switch-input-source []"
        "org.gnome.desktop.wm.keybindings switch-input-source-backward []"
      )
      ;;
    *GNOME*|*gnome*|*UNITY*|*unity*|*PANTHEON*|*pantheon*|*BUDGIE*|*budgie*|*COSMIC*|*cosmic*)
      cmds=(
        "org.gnome.desktop.wm.keybindings switch-input-source []"
        "org.gnome.desktop.wm.keybindings switch-input-source-backward []"
      )
      ;;
    *XFCE*|*xfce*)
      cmds=(
        "org.xfce.keyboard-shortcuts.commands.custom '<Super>space' ''"
        "org.xfce.keyboard-shortcuts.commands.custom '<Shift><Super>space' ''"
      )
      ;;
    *MATE*|*mate*)
      cmds=(
        "org.mate.Marco.global-keybindings switch-input-source ''"
        "org.mate.Marco.global-keybindings switch-input-source-backward ''"
        "org.gnome.desktop.wm.keybindings switch-input-source []"
        "org.gnome.desktop.wm.keybindings switch-input-source-backward []"
      )
      ;;
    *KDE*|*kde*|*PLASMA*|*plasma*)
      cmds=()
      ;;
    *)
      cmds=(
        "org.gnome.desktop.wm.keybindings switch-input-source []"
        "org.gnome.desktop.wm.keybindings switch-input-source-backward []"
      )
      ;;
  esac

  if [[ ${#cmds[@]} -eq 0 ]]; then
    return
  fi

  if [[ -S "/run/user/$uid/bus" ]]; then
    local bus="unix:path=/run/user/$uid/bus"
    for c in "${cmds[@]}"; do
      sudo -u "$user" DBUS_SESSION_BUS_ADDRESS="$bus" gsettings set $c 2>/dev/null || true
    done
  else
    for c in "${cmds[@]}"; do
      su - "$user" -c "gsettings set $c 2>/dev/null || true"
    done
  fi
  ok "$(msg "데스크톱 단축키 충돌 해제 완료 ($desktop)" "Cleared desktop shortcut conflicts ($desktop)")"
}

steamos_cleanup() {
  if command -v steamos-readonly >/dev/null 2>&1; then
    steamos-readonly enable 2>/dev/null || true
  fi
}

main() {
  require_root
  mkdir -p "$(dirname "$LOG_FILE")"
  log "$(msg "=== 리눅스 한글 입력기 자동 감지 설치 시작 (v$SCRIPT_VERSION) ===" "=== Starting Linux Korean Input Method Auto-Installer (v$SCRIPT_VERSION) ===")"

  local pretty_name="Unknown Linux"
  if [[ -f /etc/os-release ]]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    pretty_name="${PRETTY_NAME:-${NAME:-Unknown Linux}}"
  fi

  local FAMILY
  FAMILY=$(detect_family)
  info "$(msg "감지된 배포판: $pretty_name" "Detected distro: $pretty_name")"
  info "$(msg "선택된 설치 패밀리: $FAMILY" "Selected family: $FAMILY")"

  if [[ "$FAMILY" == "nixos" ]]; then
    echo
    echo "============================================================"
    if [[ "$IS_KO" == "true" ]]; then
      echo " ℹ️  NixOS는 선언적 OS이므로 스크립트로 패키지를 직접 설치하지 않습니다."
      echo " /etc/nixos/configuration.nix 에 아래 설정을 병합하세요:"
    else
      echo " ℹ️  NixOS uses declarative configuration. Merge the following into /etc/nixos/configuration.nix:"
    fi
    echo "   i18n.inputMethod.enabled = \"fcitx5\";"
    echo "   i18n.inputMethod.fcitx5.enable = true;"
    echo "   i18n.inputMethod.fcitx5.engines = with pkgs; [ fcitx5-hangul ];"
    echo "   fonts.packages = with pkgs; [ noto-fonts-cjk ];"
    if [[ "$IS_KO" == "true" ]]; then
      echo " 상세 예시: https://github.com/stream9k/korean_input/tree/main/scripts/nixos"
      echo " 적용: sudo nixos-rebuild switch"
    else
      echo " Examples: https://github.com/stream9k/korean_input/tree/main/scripts/nixos"
      echo " Apply: sudo nixos-rebuild switch"
    fi
    echo "============================================================"
    exit 0
  fi

  local TARGET_USER TARGET_HOME TARGET_UID TARGET_GID DESKTOP
  TARGET_USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$TARGET_USER" 2>/dev/null | cut -d: -f6 || awk -F: -v u="$TARGET_USER" '$1==u {print $6}' /etc/passwd)
  TARGET_UID=$(id -u "$TARGET_USER")
  TARGET_GID=$(id -g "$TARGET_USER")
  DESKTOP=$(detect_desktop "$TARGET_USER")

  info "$(msg "대상 사용자: $TARGET_USER (UID=$TARGET_UID, HOME=$TARGET_HOME)" "Target user: $TARGET_USER (UID=$TARGET_UID, HOME=$TARGET_HOME)")"
  info "$(msg "감지된 데스크톱: $DESKTOP" "Detected desktop: $DESKTOP")"

  local need_reboot=false

  case "$FAMILY" in
    debian-family)
      log "$(msg "[1/5] 레거시 fcitx4 정리, fcitx5 및 한글 폰트 설치 (apt-get)..." "[1/5] Purging legacy fcitx4 and installing fcitx5 + Korean fonts (apt-get)...")"
      export DEBIAN_FRONTEND=noninteractive
      apt-get update -qq
      apt-get purge -y -qq fcitx fcitx-bin fcitx-data fcitx-hangul fcitx-config-gtk \
        fcitx-frontend-all fcitx-frontend-gtk2 fcitx-frontend-gtk3 fcitx-frontend-qt5 2>/dev/null || true
      apt-get autoremove --purge -y -qq
      apt-get install -y -qq \
        fcitx5 fcitx5-hangul fcitx5-config-qt fcitx5-configtool \
        fcitx5-frontend-gtk3 fcitx5-frontend-gtk4 \
        fcitx5-frontend-qt5 fcitx5-frontend-qt6 \
        fonts-noto-cjk
      ok "$(msg "패키지 설치 완료" "Packages installed")"

      log "$(msg "[2/5] 입력 프레임워크 전환 (im-config)..." "[2/5] Switching input framework to fcitx5 (im-config)...")"
      su - "$TARGET_USER" -c "im-config -n fcitx5" 2>/dev/null || warn "$(msg "im-config 실패 (필요시 수동 실행)" "im-config failed (run manually if needed)")"

      log "$(msg "[3/5] Fcitx5 프로필·핫키 구성..." "[3/5] Configuring Fcitx5 profile and hotkeys...")"
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "$(msg "[4/5] 단축키 충돌 해제 및 환경변수 설정..." "[4/5] Clearing shortcut conflicts and setting env vars...")"
      clear_desktop_shortcut_conflicts "$TARGET_USER" "$TARGET_UID" "$DESKTOP"
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      append_profile_env "$TARGET_HOME/.xsessionrc" "$TARGET_UID" "$TARGET_GID" "fcitx"

      log "$(msg "[5/5] 자동시작 등록..." "[5/5] Registering autostart...")"
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      ;;

    arch-family)
      log "$(msg "[1/4] fcitx5 및 한글 폰트 패키지 설치 (pacman)..." "[1/4] Installing fcitx5 + Korean fonts (pacman)...")"
      pacman -Sy --needed --noconfirm \
        fcitx5-im fcitx5-hangul fcitx5-configtool fcitx5-gtk fcitx5-qt noto-fonts-cjk
      ok "$(msg "패키지 설치 완료" "Packages installed")"

      log "$(msg "[2/4] 환경변수 설정..." "[2/4] Configuring environment variables...")"
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "$(msg "[3/4] Fcitx5 프로필·핫키 구성..." "[3/4] Configuring Fcitx5 profile and hotkeys...")"
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "$(msg "[4/4] 자동시작 및 systemd 서비스 등록..." "[4/4] Registering autostart and systemd user service...")"
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      su - "$TARGET_USER" -c "XDG_RUNTIME_DIR=/run/user/$TARGET_UID systemctl --user enable fcitx5 2>/dev/null || true" || true
      ;;

    kaos)
      log "$(msg "[1/4] fcitx5 및 한글 폰트 패키지 설치 (KaOS pacman)..." "[1/4] Installing fcitx5 + Korean fonts (KaOS pacman)...")"
      pacman -Sy --needed --noconfirm fcitx5 fcitx5-hangul fcitx5-qt fcitx5-configtool noto-fonts-cjk
      ok "$(msg "패키지 설치 완료" "Packages installed")"

      log "$(msg "[2/4] 환경변수 설정..." "[2/4] Configuring environment variables...")"
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "$(msg "[3/4] Fcitx5 프로필·핫키 구성..." "[3/4] Configuring Fcitx5 profile and hotkeys...")"
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "$(msg "[4/4] 자동시작 등록..." "[4/4] Registering autostart...")"
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      ;;

    steamos)
      trap steamos_cleanup EXIT
      log "$(msg "[1/4] SteamOS 읽기 전용 해제 및 패키지 설치..." "[1/4] Disabling steamos-readonly and installing fcitx5 + Korean fonts...")"
      steamos-readonly disable
      pacman-key --init
      pacman-key --populate archlinux holo 2>/dev/null || pacman-key --populate
      pacman -Sy --needed --noconfirm fcitx5-im fcitx5-hangul fcitx5-configtool fcitx5-gtk fcitx5-qt noto-fonts-cjk

      log "$(msg "[2/4] 환경변수 설정..." "[2/4] Configuring environment variables...")"
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "$(msg "[3/4] Fcitx5 설정 및 자동시작 등록..." "[3/4] Configuring Fcitx5 and autostart...")"
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "$(msg "[4/4] SteamOS 읽기 전용 복구..." "[4/4] Re-enabling steamos-readonly...")"
      steamos-readonly enable
      ;;

    fedora)
      log "$(msg "[1/4] fcitx5 및 한글 폰트 패키지 설치 (dnf)..." "[1/4] Installing fcitx5 + Korean fonts (dnf)...")"
      dnf install -y -q fcitx5 fcitx5-hangul fcitx5-configtool fcitx5-gtk fcitx5-qt fcitx5-autostart
      dnf install -y -q google-noto-sans-cjk-ttc-fonts 2>/dev/null || dnf install -y -q google-noto-cjk-fonts 2>/dev/null || true
      ok "$(msg "패키지 설치 완료" "Packages installed")"

      log "$(msg "[2/4] 시스템 입력기 설정 및 ibus 비활성화..." "[2/4] Configuring alternatives and disabling ibus...")"
      alternatives --set xinputrc /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
      sed -i 's/IMSETTINGS_IGNORE_SESSION=\*-wayland/#IMSETTINGS_IGNORE_SESSION=*-wayland/' /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
      sed -i 's/XIM=fcitx5/XIM=fcitx/' /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
      su - "$TARGET_USER" -c "XDG_RUNTIME_DIR=/run/user/$TARGET_UID systemctl --user disable ibus 2>/dev/null || true" || true

      log "$(msg "[3/4] Fcitx5 프로필·핫키 구성..." "[3/4] Configuring Fcitx5 profile and hotkeys...")"
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "$(msg "[4/4] 환경변수 설정..." "[4/4] Configuring environment variables...")"
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      local profile_file="$TARGET_HOME/.bash_profile"
      [[ -f "$TARGET_HOME/.profile" && ! -f "$profile_file" ]] && profile_file="$TARGET_HOME/.profile"
      append_profile_env "$profile_file" "$TARGET_UID" "$TARGET_GID" "fcitx"
      ;;

    fedora-atomic)
      need_reboot=true
      log "$(msg "[1/3] fcitx5 및 한글 폰트 패키지 레이어링 (rpm-ostree)..." "[1/3] Layering fcitx5 + Korean fonts (rpm-ostree)...")"
      rpm-ostree install --idempotent --allow-inactive \
        fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool fcitx5-autostart \
        google-noto-sans-cjk-ttc-fonts
      ok "$(msg "패키지 레이어링 완료" "Package layering complete")"

      log "$(msg "[2/3] Fcitx5 프로필·핫키 구성..." "[2/3] Configuring Fcitx5 profile and hotkeys...")"
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "$(msg "[3/3] 환경변수 설정..." "[3/3] Configuring environment variables...")"
      local env_file="$TARGET_HOME/.config/environment.d/fcitx5.conf"
      mkdir -p "$(dirname "$env_file")"
      cat > "$env_file" <<'EOF'
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
      chown -R "$TARGET_UID:$TARGET_GID" "$(dirname "$env_file")"
      ;;

    vanilla)
      need_reboot=true
      log "$(msg "[1/4] fcitx5 및 한글 폰트 패키지 추가 (abroot)..." "[1/4] Adding fcitx5 + Korean fonts (abroot)...")"
      abroot pkg add \
        fcitx5 fcitx5-hangul fcitx5-config-qt \
        fcitx5-frontend-gtk3 fcitx5-frontend-gtk4 \
        fcitx5-frontend-qt5 fcitx5-frontend-qt6 fonts-noto-cjk
      ok "$(msg "패키지 추가 완료" "Packages added")"

      log "$(msg "[2/4] Fcitx5 프로필·핫키 구성..." "[2/4] Configuring Fcitx5 profile and hotkeys...")"
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "$(msg "[3/4] 환경변수 설정..." "[3/4] Configuring environment variables...")"
      local venv_file="$TARGET_HOME/.config/environment.d/fcitx5.conf"
      mkdir -p "$(dirname "$venv_file")"
      cat > "$venv_file" <<'EOF'
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
      chown -R "$TARGET_UID:$TARGET_GID" "$(dirname "$venv_file")"

      log "$(msg "[4/4] 자동시작 등록..." "[4/4] Registering autostart...")"
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      ;;

    opensuse|opensuse-transactional)
      log "$(msg "[1/4] fcitx5 및 한글 폰트 패키지 설치 ($FAMILY)..." "[1/4] Installing fcitx5 + Korean fonts ($FAMILY)...")"
      if [[ "$FAMILY" == "opensuse-transactional" ]]; then
        need_reboot=true
        transactional-update --non-interactive pkg install \
          fcitx5 fcitx5-hangul fcitx5-configtool \
          fcitx5-gtk fcitx5-qt fcitx5-qt5 fcitx5-qt6 fcitx5-autostart \
          google-noto-sans-cjk-fonts
      else
        zypper --non-interactive install -y \
          fcitx5 fcitx5-hangul fcitx5-configtool \
          fcitx5-gtk fcitx5-qt fcitx5-qt5 fcitx5-qt6 fcitx5-autostart
        zypper --non-interactive install -y google-noto-sans-cjk-fonts 2>/dev/null || true
      fi
      ok "$(msg "패키지 설치 완료" "Packages installed")"

      log "$(msg "[2/4] 시스템 입력기 등록 및 ibus 비활성화..." "[2/4] Configuring alternatives and disabling ibus...")"
      alternatives --set xinputrc /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
      sed -i 's/IMSETTINGS_IGNORE_SESSION=\*-wayland/#IMSETTINGS_IGNORE_SESSION=*-wayland/' /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
      sed -i 's/XIM=fcitx5/XIM=fcitx/' /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
      su - "$TARGET_USER" -c "XDG_RUNTIME_DIR=/run/user/$TARGET_UID systemctl --user disable ibus 2>/dev/null || true" || true

      log "$(msg "[3/4] Fcitx5 프로필·핫키 구성..." "[3/4] Configuring Fcitx5 profile and hotkeys...")"
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "$(msg "[4/4] 환경변수 설정..." "[4/4] Configuring environment variables...")"
      local oprofile="$TARGET_HOME/.bash_profile"
      [[ -f "$TARGET_HOME/.profile" && ! -f "$oprofile" ]] && oprofile="$TARGET_HOME/.profile"
      append_profile_env "$oprofile" "$TARGET_UID" "$TARGET_GID" "fcitx"
      ;;

    rhel-family)
      log "$(msg "[1/3] ibus-hangul 및 한글 폰트 패키지 설치 (dnf)..." "[1/3] Installing ibus-hangul + Korean fonts (dnf)...")"
      dnf install -y -q ibus-hangul ibus-setup
      dnf install -y -q google-noto-sans-cjk-ttc-fonts 2>/dev/null || dnf install -y -q google-noto-cjk-fonts 2>/dev/null || true
      ok "$(msg "패키지 설치 완료" "Packages installed")"

      log "$(msg "[2/3] 입력 소스 및 ibus 엔진 캐시 등록 (Hangul)..." "[2/3] Registering Hangul input source and refreshing ibus cache...")"
      ibus write-cache --system 2>/dev/null || true
      local sources="[('xkb', 'us'), ('ibus', 'hangul')]"
      local preload="['xkb:us::eng', 'hangul']"
      if [[ -S "/run/user/$TARGET_UID/bus" ]]; then
        local bus="unix:path=/run/user/$TARGET_UID/bus"
        sudo -u "$TARGET_USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \
          gsettings set org.gnome.desktop.input-sources sources "$sources" 2>/dev/null || true
        sudo -u "$TARGET_USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \
          gsettings set org.freedesktop.ibus.general preload-engines "$preload" 2>/dev/null || true
        sudo -u "$TARGET_USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \
          ibus write-cache 2>/dev/null || true
        if pgrep -u "$TARGET_UID" -x ibus-daemon >/dev/null 2>&1; then
          sudo -u "$TARGET_USER" XDG_RUNTIME_DIR="/run/user/$TARGET_UID" DBUS_SESSION_BUS_ADDRESS="$bus" \
            ibus restart 2>/dev/null || true
        fi
      else
        su - "$TARGET_USER" -c "gsettings set org.gnome.desktop.input-sources sources \"$sources\"" 2>/dev/null || true
        su - "$TARGET_USER" -c "gsettings set org.freedesktop.ibus.general preload-engines \"$preload\"" 2>/dev/null || true
        su - "$TARGET_USER" -c "ibus write-cache" 2>/dev/null || true
      fi

      log "$(msg "[3/3] ibus 환경변수 설정..." "[3/3] Configuring ibus environment variables...")"
      local rhel_env="$TARGET_HOME/.config/environment.d/ibus.conf"
      mkdir -p "$(dirname "$rhel_env")"
      cat > "$rhel_env" <<'EOF'
GTK_IM_MODULE=ibus
QT_IM_MODULE=ibus
XMODIFIERS=@im=ibus
EOF
      chown -R "$TARGET_UID:$TARGET_GID" "$(dirname "$rhel_env")"
      local rhel_prof="$TARGET_HOME/.bash_profile"
      [[ -f "$TARGET_HOME/.profile" && ! -f "$rhel_prof" ]] && rhel_prof="$TARGET_HOME/.profile"
      append_profile_env "$rhel_prof" "$TARGET_UID" "$TARGET_GID" "ibus"
      ;;

    void)
      log "$(msg "[1/4] fcitx5 및 한글 폰트 패키지 설치 (xbps-install)..." "[1/4] Installing fcitx5 + Korean fonts (xbps-install)...")"
      xbps-install -Sy fcitx5 fcitx5-hangul fcitx5-gtk+3 fcitx5-gtk4 fcitx5-qt5 fcitx5-qt6 fcitx5-configtool noto-fonts-cjk
      log "$(msg "[2/4] 환경변수 설정..." "[2/4] Configuring environment variables...")"
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      append_profile_env "$TARGET_HOME/.xprofile" "$TARGET_UID" "$TARGET_GID" "fcitx"
      log "$(msg "[3/4] Fcitx5 프로필·핫키 구성..." "[3/4] Configuring Fcitx5 profile and hotkeys...")"
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      log "$(msg "[4/4] 자동시작 등록..." "[4/4] Registering autostart...")"
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      ;;

    alpine)
      log "$(msg "[1/4] fcitx5 및 한글 폰트 패키지 설치 (apk)..." "[1/4] Installing fcitx5 + Korean fonts (apk)...")"
      apk update
      apk add fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool font-noto-cjk
      log "$(msg "[2/4] 환경변수 설정..." "[2/4] Configuring environment variables...")"
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      append_profile_env "$TARGET_HOME/.profile" "$TARGET_UID" "$TARGET_GID" "fcitx"
      log "$(msg "[3/4] Fcitx5 프로필·핫키 구성..." "[3/4] Configuring Fcitx5 profile and hotkeys...")"
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      log "$(msg "[4/4] 자동시작 등록..." "[4/4] Registering autostart...")"
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      ;;

    solus)
      log "$(msg "[1/4] fcitx5 패키지 설치 (eopkg)..." "[1/4] Installing fcitx5 (eopkg)...")"
      eopkg install -y fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt5 fcitx5-configtool
      log "$(msg "[2/4] 환경변수 설정..." "[2/4] Configuring environment variables...")"
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      log "$(msg "[3/4] Fcitx5 프로필·핫키 구성..." "[3/4] Configuring Fcitx5 profile and hotkeys...")"
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      log "$(msg "[4/4] 자동시작 등록..." "[4/4] Registering autostart...")"
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      ;;

    gentoo)
      log "$(msg "[1/4] fcitx5 패키지 설치 (emerge)..." "[1/4] Installing fcitx5 (emerge)...")"
      emerge --noreplace \
        app-i18n/fcitx:5 app-i18n/fcitx-hangul:5 \
        app-i18n/fcitx-gtk:5 app-i18n/fcitx-qt:5 app-i18n/fcitx-configtool:5
      log "$(msg "[2/4] 환경변수 설정..." "[2/4] Configuring environment variables...")"
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      append_profile_env "$TARGET_HOME/.xprofile" "$TARGET_UID" "$TARGET_GID" "fcitx"
      log "$(msg "[3/4] Fcitx5 프로필·핫키 구성..." "[3/4] Configuring Fcitx5 profile and hotkeys...")"
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      log "$(msg "[4/4] 자동시작 등록..." "[4/4] Registering autostart...")"
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      ;;

    mandriva-family)
      log "$(msg "[1/4] fcitx5 패키지 설치 (Mandriva 계열)..." "[1/4] Installing fcitx5 (Mandriva family)...")"
      if command -v dnf >/dev/null 2>&1; then
        dnf install -y fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool
      elif command -v urpmi >/dev/null 2>&1; then
        urpmi --auto fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool
      elif command -v apt-get >/dev/null 2>&1; then
        apt-get update && apt-get install -y fcitx5 fcitx5-hangul fcitx5-configtool
      fi
      log "$(msg "[2/4] 환경변수 설정..." "[2/4] Configuring environment variables...")"
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      append_profile_env "$TARGET_HOME/.xprofile" "$TARGET_UID" "$TARGET_GID" "fcitx"
      log "$(msg "[3/4] Fcitx5 프로필·핫키 구성..." "[3/4] Configuring Fcitx5 profile and hotkeys...")"
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      log "$(msg "[4/4] 자동시작 등록..." "[4/4] Registering autostart...")"
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      ;;

    alt)
      log "$(msg "[1/4] fcitx5 패키지 설치 (ALT Linux apt-rpm)..." "[1/4] Installing fcitx5 (ALT Linux apt-rpm)...")"
      apt-get update
      apt-get install -y fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool
      log "$(msg "[2/4] 환경변수 설정..." "[2/4] Configuring environment variables...")"
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      append_profile_env "$TARGET_HOME/.xprofile" "$TARGET_UID" "$TARGET_GID" "fcitx"
      log "$(msg "[3/4] Fcitx5 프로필·핫키 구성..." "[3/4] Configuring Fcitx5 profile and hotkeys...")"
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      log "$(msg "[4/4] 자동시작 등록..." "[4/4] Registering autostart...")"
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      ;;

    guix)
      log "$(msg "[1/4] fcitx5 패키지 설치 (guix install)..." "[1/4] Installing fcitx5 + Korean fonts (guix install)...")"
      su - "$TARGET_USER" -c "guix install fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool font-google-noto-sans-cjk"
      log "$(msg "[2/4] 환경변수 설정..." "[2/4] Configuring environment variables...")"
      local gprof="$TARGET_HOME/.bash_profile"
      [[ -f "$TARGET_HOME/.profile" && ! -f "$gprof" ]] && gprof="$TARGET_HOME/.profile"
      if ! grep -q "GUIX_PROFILE=" "$gprof" 2>/dev/null; then
        echo 'export GUIX_PROFILE="$HOME/.guix-profile"' >> "$gprof"
      fi
      append_profile_env "$gprof" "$TARGET_UID" "$TARGET_GID" "fcitx"
      log "$(msg "[3/4] Fcitx5 프로필·핫키 구성..." "[3/4] Configuring Fcitx5 profile and hotkeys...")"
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      log "$(msg "[4/4] 자동시작 등록..." "[4/4] Registering autostart...")"
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      ;;

    *)
      err "$(msg "지원되지 않는 패밀리입니다: $FAMILY" "Unsupported family: $FAMILY")"
      ;;
  esac

  # 재부팅/재로그인 후 1회성 안내 팝업 자동시작 등록
  register_first_login_guide "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "$IS_KO" "$FAMILY" "$DESKTOP" 

  echo
  echo "============================================================"
  if [[ "$IS_KO" == "true" ]]; then
    echo " 🎉 한글 입력기 및 한글 폰트 설치 완료! ($pretty_name / $FAMILY)"
    if [[ "$need_reboot" == "true" ]]; then
      echo " ⚠️  불변 OS 감지: 변경 사항 적용을 위해 반드시 재부팅하세요 (systemctl reboot)."
    else
      echo " 👉 로그아웃 후 다시 로그인(또는 재부팅)하면 적용됩니다."
    fi
    if [[ "$FAMILY" == "rhel-family" ]]; then
      echo " ⌨️  전환: Super+Space 또는 한/영 키 | 세부 설정: ibus-setup"
    else
      if [[ "$DESKTOP" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]]; then
        echo " 🖥️  KDE Plasma 추가 설정: 시스템 설정 → 입력 장치 → 가상 키보드 → Fcitx 5 선택"
      fi
      echo " ⌨️  전환: 한/영 키, Ctrl+Space, Shift+Space"
      echo " 💡 영문 키보드 사용 시: fcitx5-configtool 에서 오른쪽 Alt(Alt_R)를 전환키로 추가할 수 있습니다."
      echo "    (Firefox 메뉴바와 충돌 시: 설정 → 키보드 → 키바인딩 → 키보드 옵션에서 '오른쪽 ALT를 한/영키로 만들기' 체크)"
      echo " ⚙️  설정: fcitx5-configtool | 진단: fcitx5-diagnose"
    fi
    echo " 📝 로그: $LOG_FILE"
  else
    echo " 🎉 Korean Input Method & Noto CJK Fonts Installed! ($pretty_name / $FAMILY)"
    if [[ "$need_reboot" == "true" ]]; then
      echo " ⚠️  Immutable OS detected: REBOOT required to apply changes (systemctl reboot)."
    else
      echo " 👉 Please log out and log back in (or reboot) to activate."
    fi
    if [[ "$FAMILY" == "rhel-family" ]]; then
      echo " ⌨️  Toggle: Super+Space or Hangul key | Config: ibus-setup"
    else
      if [[ "$DESKTOP" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]]; then
        echo " 🖥️  KDE Plasma Extra Step: System Settings -> Input Devices -> Virtual Keyboard -> Select 'Fcitx 5'"
      fi
      echo " ⌨️  Toggle keys: Hangul key, Ctrl+Space, Shift+Space"
      echo " 💡 US Keyboard tip: You can bind Right Alt (Alt_R) in 'fcitx5-configtool' -> Global Options."
      echo " ⚙️  Config: fcitx5-configtool | Diagnose: fcitx5-diagnose"
    fi
    echo " 📝 Log: $LOG_FILE"
  fi
  echo "============================================================"
}

main "$@"
