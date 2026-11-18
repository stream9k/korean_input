#!/usr/bin/env bash
# 리눅스 한글 입력기(fcitx5-hangul / RHEL: ibus-hangul) 배포판 자동 감지 올인원 설치 스크립트
# 실행 (git·다운로드·chmod 불필요):
#   curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input_method_installer/main/install.sh | sudo bash
#   또는 wget: wget -qO- https://raw.githubusercontent.com/stream9k/korean_input_method_installer/main/install.sh | sudo bash
#   또는 로컬 파일: sudo bash install.sh

set -euo pipefail

SCRIPT_VERSION="1.0.0"
LOG_FILE="/var/log/install-hangul-auto.log"

log()  { echo "[$(date '+%F %T')] $*" | tee -a "$LOG_FILE"; }
err()  { log "❌ $*"; exit 1; }
warn() { log "⚠️  $*"; }
ok()   { log "✅ $*"; }
info() { log "ℹ️  $*"; }

require_root() {
  [[ $EUID -eq 0 ]] || err "root 권한이 필요합니다. 'sudo bash $0' 또는 '... | sudo bash'로 실행하세요."
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
  err "대상 데스크톱 사용자를 자동으로 찾지 못했습니다. 'sudo -E SUDO_USER=<사용자명> bash $0'로 실행하세요."
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

  err "지원되는 리눅스 배포판/패키지 관리자를 감지하지 못했습니다 (ID=$os_id, ID_LIKE=$os_like)."
}

write_fcitx5_user_config() {
  local target_home="$1"
  local uid="$2"
  local gid="$3"

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
  ok "Fcitx5 프로필 및 한/영 전환 핫키 설정 완료"
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
  ok "Fcitx5 자동시작 등록 완료"
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

# fcitx5 환경변수
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

# $im 환경변수
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
  ok "데스크톱 단축키 충돌 해제 완료 ($desktop)"
}

steamos_cleanup() {
  if command -v steamos-readonly >/dev/null 2>&1; then
    steamos-readonly enable 2>/dev/null || true
  fi
}

main() {
  require_root
  mkdir -p "$(dirname "$LOG_FILE")"
  log "=== 리눅스 한글 입력기 자동 감지 설치 시작 (v$SCRIPT_VERSION) ==="

  local pretty_name="Unknown Linux"
  if [[ -f /etc/os-release ]]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    pretty_name="${PRETTY_NAME:-${NAME:-Unknown Linux}}"
  fi

  local FAMILY
  FAMILY=$(detect_family)
  info "감지된 배포판: $pretty_name"
  info "선택된 설치 패밀리: $FAMILY"

  if [[ "$FAMILY" == "nixos" ]]; then
    echo
    echo "============================================================"
    echo " ℹ️  NixOS는 선언적 OS이므로 스크립트로 패키지를 직접 설치하지 않습니다."
    echo " /etc/nixos/configuration.nix 에 아래 설정을 병합하세요:"
    echo "   i18n.inputMethod.enabled = \"fcitx5\";"
    echo "   i18n.inputMethod.fcitx5.enable = true;"
    echo "   i18n.inputMethod.fcitx5.engines = with pkgs; [ fcitx5-hangul ];"
    echo " 상세 예시: https://github.com/stream9k/korean_input_method_installer/tree/main/scripts/nixos"
    echo " 적용: sudo nixos-rebuild switch"
    echo "============================================================"
    exit 0
  fi

  local TARGET_USER TARGET_HOME TARGET_UID TARGET_GID DESKTOP
  TARGET_USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$TARGET_USER" 2>/dev/null | cut -d: -f6 || awk -F: -v u="$TARGET_USER" '$1==u {print $6}' /etc/passwd)
  TARGET_UID=$(id -u "$TARGET_USER")
  TARGET_GID=$(id -g "$TARGET_USER")
  DESKTOP=$(detect_desktop "$TARGET_USER")

  info "대상 사용자: $TARGET_USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
  info "감지된 데스크톱: $DESKTOP"

  local need_reboot=false

  case "$FAMILY" in
    debian-family)
      log "[1/5] 레거시 fcitx4 정리 및 fcitx5 설치 (apt-get)..."
      export DEBIAN_FRONTEND=noninteractive
      apt-get update -qq
      apt-get purge -y -qq fcitx fcitx-bin fcitx-data fcitx-hangul fcitx-config-gtk \
        fcitx-frontend-all fcitx-frontend-gtk2 fcitx-frontend-gtk3 fcitx-frontend-qt5 2>/dev/null || true
      apt-get autoremove --purge -y -qq
      apt-get install -y -qq \
        fcitx5 fcitx5-hangul fcitx5-config-qt fcitx5-configtool \
        fcitx5-frontend-gtk3 fcitx5-frontend-gtk4 \
        fcitx5-frontend-qt5 fcitx5-frontend-qt6
      ok "패키지 설치 완료"

      log "[2/5] 입력 프레임워크 전환 (im-config)..."
      su - "$TARGET_USER" -c "im-config -n fcitx5" 2>/dev/null || warn "im-config 실패 (필요시 수동 실행)"

      log "[3/5] Fcitx5 프로필·핫키 구성..."
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "[4/5] 단축키 충돌 해제 및 환경변수 설정..."
      clear_desktop_shortcut_conflicts "$TARGET_USER" "$TARGET_UID" "$DESKTOP"
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      append_profile_env "$TARGET_HOME/.xsessionrc" "$TARGET_UID" "$TARGET_GID" "fcitx"

      log "[5/5] 자동시작 등록..."
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      ;;

    arch-family)
      log "[1/4] fcitx5 패키지 설치 (pacman)..."
      pacman -Sy --needed --noconfirm \
        fcitx5-im fcitx5-hangul fcitx5-configtool fcitx5-gtk fcitx5-qt
      ok "패키지 설치 완료"

      log "[2/4] 환경변수 설정..."
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "[3/4] Fcitx5 프로필·핫키 구성..."
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "[4/4] 자동시작 및 systemd 서비스 등록..."
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      su - "$TARGET_USER" -c "XDG_RUNTIME_DIR=/run/user/$TARGET_UID systemctl --user enable fcitx5 2>/dev/null || true" || true
      ;;

    kaos)
      log "[1/4] fcitx5 패키지 설치 (KaOS pacman)..."
      pacman -Sy --needed --noconfirm fcitx5 fcitx5-hangul fcitx5-qt fcitx5-configtool
      ok "패키지 설치 완료"

      log "[2/4] 환경변수 설정..."
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "[3/4] Fcitx5 프로필·핫키 구성..."
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "[4/4] 자동시작 등록..."
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      ;;

    steamos)
      trap steamos_cleanup EXIT
      log "[1/4] SteamOS 읽기 전용 해제 및 패키지 설치..."
      steamos-readonly disable
      pacman-key --init
      pacman-key --populate archlinux holo 2>/dev/null || pacman-key --populate
      pacman -Sy --needed --noconfirm fcitx5-im fcitx5-hangul fcitx5-configtool fcitx5-gtk fcitx5-qt

      log "[2/4] 환경변수 설정..."
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "[3/4] Fcitx5 설정 및 자동시작 등록..."
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "[4/4] SteamOS 읽기 전용 복구..."
      steamos-readonly enable
      ;;

    fedora)
      log "[1/4] fcitx5 패키지 설치 (dnf)..."
      dnf install -y -q fcitx5 fcitx5-hangul fcitx5-configtool fcitx5-gtk fcitx5-qt fcitx5-autostart
      ok "패키지 설치 완료"

      log "[2/4] 시스템 입력기 설정 및 ibus 비활성화..."
      alternatives --set xinputrc /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
      sed -i 's/IMSETTINGS_IGNORE_SESSION=\*-wayland/#IMSETTINGS_IGNORE_SESSION=*-wayland/' /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
      sed -i 's/XIM=fcitx5/XIM=fcitx/' /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
      su - "$TARGET_USER" -c "XDG_RUNTIME_DIR=/run/user/$TARGET_UID systemctl --user disable ibus 2>/dev/null || true" || true

      log "[3/4] Fcitx5 프로필·핫키 구성..."
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "[4/4] 환경변수 설정..."
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      local profile_file="$TARGET_HOME/.bash_profile"
      [[ -f "$TARGET_HOME/.profile" && ! -f "$profile_file" ]] && profile_file="$TARGET_HOME/.profile"
      append_profile_env "$profile_file" "$TARGET_UID" "$TARGET_GID" "fcitx"
      ;;

    fedora-atomic)
      need_reboot=true
      log "[1/3] fcitx5 패키지 레이어링 (rpm-ostree)..."
      rpm-ostree install --idempotent --allow-inactive \
        fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool fcitx5-autostart
      ok "패키지 레이어링 완료"

      log "[2/3] Fcitx5 프로필·핫키 구성..."
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "[3/3] 환경변수 설정..."
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
      log "[1/4] fcitx5 패키지 추가 (abroot)..."
      abroot pkg add \
        fcitx5 fcitx5-hangul fcitx5-config-qt \
        fcitx5-frontend-gtk3 fcitx5-frontend-gtk4 \
        fcitx5-frontend-qt5 fcitx5-frontend-qt6
      ok "패키지 추가 완료"

      log "[2/4] Fcitx5 프로필·핫키 구성..."
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "[3/4] 환경변수 설정..."
      local venv_file="$TARGET_HOME/.config/environment.d/fcitx5.conf"
      mkdir -p "$(dirname "$venv_file")"
      cat > "$venv_file" <<'EOF'
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
      chown -R "$TARGET_UID:$TARGET_GID" "$(dirname "$venv_file")"

      log "[4/4] 자동시작 등록..."
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      ;;

    opensuse|opensuse-transactional)
      log "[1/4] fcitx5 패키지 설치 ($FAMILY)..."
      if [[ "$FAMILY" == "opensuse-transactional" ]]; then
        need_reboot=true
        transactional-update --non-interactive pkg install \
          fcitx5 fcitx5-hangul fcitx5-configtool \
          fcitx5-gtk fcitx5-qt fcitx5-qt5 fcitx5-qt6 fcitx5-autostart
      else
        zypper --non-interactive install -y \
          fcitx5 fcitx5-hangul fcitx5-configtool \
          fcitx5-gtk fcitx5-qt fcitx5-qt5 fcitx5-qt6 fcitx5-autostart
      fi
      ok "패키지 설치 완료"

      log "[2/4] 시스템 입력기 등록 및 ibus 비활성화..."
      alternatives --set xinputrc /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
      sed -i 's/IMSETTINGS_IGNORE_SESSION=\*-wayland/#IMSETTINGS_IGNORE_SESSION=*-wayland/' /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
      sed -i 's/XIM=fcitx5/XIM=fcitx/' /etc/X11/xinit/xinput.d/fcitx5.conf 2>/dev/null || true
      su - "$TARGET_USER" -c "XDG_RUNTIME_DIR=/run/user/$TARGET_UID systemctl --user disable ibus 2>/dev/null || true" || true

      log "[3/4] Fcitx5 프로필·핫키 구성..."
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"

      log "[4/4] 환경변수 설정..."
      local oprofile="$TARGET_HOME/.bash_profile"
      [[ -f "$TARGET_HOME/.profile" && ! -f "$oprofile" ]] && oprofile="$TARGET_HOME/.profile"
      append_profile_env "$oprofile" "$TARGET_UID" "$TARGET_GID" "fcitx"
      ;;

    rhel-family)
      log "[1/3] ibus-hangul 패키지 설치 (dnf)..."
      dnf install -y -q ibus-hangul ibus-setup
      ok "패키지 설치 완료"

      log "[2/3] GNOME 입력 소스에 한국어(Hangul) 등록..."
      local sources="[('xkb', 'us'), ('ibus', 'hangul')]"
      if [[ -S "/run/user/$TARGET_UID/bus" ]]; then
        local bus="unix:path=/run/user/$TARGET_UID/bus"
        sudo -u "$TARGET_USER" DBUS_SESSION_BUS_ADDRESS="$bus" gsettings set org.gnome.desktop.input-sources sources "$sources" 2>/dev/null || true
      else
        su - "$TARGET_USER" -c "gsettings set org.gnome.desktop.input-sources sources \"$sources\"" 2>/dev/null || true
      fi

      log "[3/3] ibus 환경변수 설정..."
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
      log "[1/4] fcitx5 패키지 설치 (xbps-install)..."
      xbps-install -Sy fcitx5 fcitx5-hangul fcitx5-gtk+3 fcitx5-gtk4 fcitx5-qt5 fcitx5-qt6 fcitx5-configtool
      log "[2/4] 환경변수 설정..."
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      append_profile_env "$TARGET_HOME/.xprofile" "$TARGET_UID" "$TARGET_GID" "fcitx"
      log "[3/4] Fcitx5 프로필·핫키 구성..."
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      log "[4/4] 자동시작 등록..."
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      ;;

    alpine)
      log "[1/4] fcitx5 패키지 설치 (apk)..."
      apk update
      apk add fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool font-noto-cjk
      log "[2/4] 환경변수 설정..."
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      append_profile_env "$TARGET_HOME/.profile" "$TARGET_UID" "$TARGET_GID" "fcitx"
      log "[3/4] Fcitx5 프로필·핫키 구성..."
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      log "[4/4] 자동시작 등록..."
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      ;;

    solus)
      log "[1/4] fcitx5 패키지 설치 (eopkg)..."
      eopkg install -y fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt5 fcitx5-configtool
      log "[2/4] 환경변수 설정..."
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      log "[3/4] Fcitx5 프로필·핫키 구성..."
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      log "[4/4] 자동시작 등록..."
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      ;;

    gentoo)
      log "[1/4] fcitx5 패키지 설치 (emerge)..."
      emerge --noreplace \
        app-i18n/fcitx:5 app-i18n/fcitx-hangul:5 \
        app-i18n/fcitx-gtk:5 app-i18n/fcitx-qt:5 app-i18n/fcitx-configtool:5
      log "[2/4] 환경변수 설정..."
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      append_profile_env "$TARGET_HOME/.xprofile" "$TARGET_UID" "$TARGET_GID" "fcitx"
      log "[3/4] Fcitx5 프로필·핫키 구성..."
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      log "[4/4] 자동시작 등록..."
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      ;;

    mandriva-family)
      log "[1/4] fcitx5 패키지 설치 (Mandriva 계열)..."
      if command -v dnf >/dev/null 2>&1; then
        dnf install -y fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool
      elif command -v urpmi >/dev/null 2>&1; then
        urpmi --auto fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool
      elif command -v apt-get >/dev/null 2>&1; then
        apt-get update && apt-get install -y fcitx5 fcitx5-hangul fcitx5-configtool
      fi
      log "[2/4] 환경변수 설정..."
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      append_profile_env "$TARGET_HOME/.xprofile" "$TARGET_UID" "$TARGET_GID" "fcitx"
      log "[3/4] Fcitx5 프로필·핫키 구성..."
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      log "[4/4] 자동시작 등록..."
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      ;;

    alt)
      log "[1/4] fcitx5 패키지 설치 (ALT Linux apt-rpm)..."
      apt-get update
      apt-get install -y fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool
      log "[2/4] 환경변수 설정..."
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      append_profile_env "$TARGET_HOME/.xprofile" "$TARGET_UID" "$TARGET_GID" "fcitx"
      log "[3/4] Fcitx5 프로필·핫키 구성..."
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      log "[4/4] 자동시작 등록..."
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      ;;

    guix)
      log "[1/4] fcitx5 패키지 설치 (guix install)..."
      su - "$TARGET_USER" -c "guix install fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool font-google-noto-sans-cjk"
      log "[2/4] 환경변수 설정..."
      local gprof="$TARGET_HOME/.bash_profile"
      [[ -f "$TARGET_HOME/.profile" && ! -f "$gprof" ]] && gprof="$TARGET_HOME/.profile"
      if ! grep -q "GUIX_PROFILE=" "$gprof" 2>/dev/null; then
        echo 'export GUIX_PROFILE="$HOME/.guix-profile"' >> "$gprof"
      fi
      append_profile_env "$gprof" "$TARGET_UID" "$TARGET_GID" "fcitx"
      log "[3/4] Fcitx5 프로필·핫키 구성..."
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      log "[4/4] 자동시작 등록..."
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      ;;

    *)
      err "지원되지 않는 패밀리입니다: $FAMILY"
      ;;
  esac

  echo
  echo "============================================================"
  echo " 🎉 한글 입력기 설치 완료! ($pretty_name / $FAMILY)"
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
    echo " ⚙️  설정: fcitx5-configtool | 진단: fcitx5-diagnose"
  fi
  echo " 📝 로그: $LOG_FILE"
  echo "============================================================"
}

main "$@"
