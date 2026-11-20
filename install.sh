#!/usr/bin/env bash
# Linux Korean Input Method (fcitx5-hangul / ibus-hangul) Auto-Detect Installer
# Supports 18 distro families with automatic KO/EN terminal output & Noto CJK Korean font install.
# Usage (no git / chmod required):
#   curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input/main/install.sh | sudo bash
#   or wget: wget -qO- https://raw.githubusercontent.com/stream9k/korean_input/main/install.sh | sudo bash
#   or local: sudo bash install.sh [--lang=ko|--lang=en] [--ibus|--fcitx5|--ime=ibus|fcitx5] [-y|--yes]

set -euo pipefail

SCRIPT_VERSION="1.3.1"
LOG_FILE="/var/log/install-hangul-auto.log"
LOG_ENABLED=false
AUTO_YES=false
CLI_IME=""
RECOMMENDED_IME=""
SELECTED_IME=""
CAN_SWITCH_IME="false"

IS_KO=false
if [[ "${LC_ALL:-${LANG:-}}" == ko* ]]; then
  IS_KO=true
fi
for arg in "$@"; do
  case "$arg" in
    --lang=ko) IS_KO=true ;;
    --lang=en) IS_KO=false ;;
    --ibus|--ime=ibus) CLI_IME="ibus" ;;
    --fcitx5|--ime=fcitx5) CLI_IME="fcitx5" ;;
    --ime=*)
      echo "❌ $( [[ "$IS_KO" == "true" ]] && echo "지원하지 않는 --ime 값입니다: ${arg#--ime=} (ibus 또는 fcitx5만 지원)" || echo "Unsupported --ime value: ${arg#--ime=} (use ibus or fcitx5)" )" >&2
      exit 1
      ;;
    -y|--yes) AUTO_YES=true ;;
  esac
done

msg() {
  if [[ "$IS_KO" == "true" ]]; then
    echo "$1"
  else
    echo "$2"
  fi
}

log() {
  local line="[$(date '+%F %T')] $*"
  if [[ "$LOG_ENABLED" == "true" ]]; then
    echo "$line" | tee -a "$LOG_FILE"
  else
    echo "$line"
  fi
}
err() {
  local line="[$(date '+%F %T')] ❌ $*"
  if [[ "$LOG_ENABLED" == "true" ]]; then
    echo "$line" | tee -a "$LOG_FILE" >&2
  else
    echo "$line" >&2
  fi
  exit 1
}
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
  d=$(su - "$user" -c 'echo ${XDG_CURRENT_DESKTOP:-}' </dev/null 2>/dev/null || true)
  [[ -n "$d" ]] && { echo "$d"; return; }
  d=$(su - "$user" -c 'echo ${DESKTOP_SESSION:-}' </dev/null 2>/dev/null || true)
  [[ -n "$d" ]] && { echo "$d"; return; }
  echo "unknown"
}

detect_session_type() {
  local user="$1"
  local uid="$2"
  local st="${XDG_SESSION_TYPE:-}"
  if [[ -n "$st" && "$st" != "unspecified" && "$st" != "tty" ]]; then
    echo "$st"
    return
  fi
  if command -v loginctl >/dev/null 2>&1; then
    local sid
    for sid in $(loginctl list-sessions --no-legend 2>/dev/null | awk -v u="$user" '$3==u {print $1}' || true); do
      st=$(loginctl show-session "$sid" -p Type --value 2>/dev/null || true)
      if [[ "$st" == "wayland" || "$st" == "x11" || "$st" == "mir" ]]; then
        echo "$st"
        return
      fi
    done
  fi
  if ls "/run/user/$uid"/wayland-* >/dev/null 2>&1 || [[ -n "${WAYLAND_DISPLAY:-}" ]]; then
    echo "wayland"
    return
  fi
  if [[ -n "${DISPLAY:-}" ]]; then
    echo "x11"
    return
  fi
  echo "unknown"
}

detect_existing_ime() {
  local uid="$1"
  local found=()
  local im status is_running
  for im in fcitx5 fcitx ibus-daemon kime; do
    is_running=false
    if command -v pgrep >/dev/null 2>&1 && pgrep -u "$uid" -x "$im" >/dev/null 2>&1; then
      is_running=true
    fi
    if command -v "$im" >/dev/null 2>&1 || [[ "$is_running" == "true" ]]; then
      if [[ "$is_running" == "true" ]]; then
        status=$(msg "실행 중" "running")
      else
        status=$(msg "설치됨" "installed")
      fi
      found+=("$im ($status)")
    fi
  done
  if [[ ${#found[@]} -eq 0 ]]; then
    msg "감지된 입력기 없음" "none detected"
  else
    local out="" item
    for item in "${found[@]}"; do
      out="${out:+$out, }$item"
    done
    echo "$out"
  fi
}

has_conflicting_ime() {
  local target_ime="$1"
  local existing_ime="$2"
  case "$target_ime" in
    fcitx5)
      [[ "$existing_ime" == *"ibus-daemon"* || "$existing_ime" == *"kime"* || "$existing_ime" == *"fcitx ("* ]] && return 0
      ;;
    ibus)
      [[ "$existing_ime" == *"fcitx5"* || "$existing_ime" == *"fcitx ("* || "$existing_ime" == *"kime"* ]] && return 0
      ;;
    kime)
      [[ "$existing_ime" == *"fcitx5"* || "$existing_ime" == *"fcitx ("* || "$existing_ime" == *"ibus-daemon"* ]] && return 0
      ;;
  esac
  return 1
}

will_configure_kde() {
  local target_home="$1"
  local desktop="$2"
  if [[ "$desktop" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]] || \
     command -v kwriteconfig6 >/dev/null 2>&1 || \
     command -v kwriteconfig5 >/dev/null 2>&1 || \
     [[ -f "$target_home/.config/kwinrc" ]]; then
    echo "true"
  else
    echo "false"
  fi
}

detect_mandriva_pkg_mgr() {
  if command -v dnf >/dev/null 2>&1; then
    echo "dnf"
  elif command -v urpmi >/dev/null 2>&1; then
    echo "urpmi"
  elif command -v apt-get >/dev/null 2>&1; then
    echo "apt-get"
  else
    err "$(msg "지원되는 패키지 관리자(dnf / urpmi / apt-get)를 찾지 못했습니다." "No supported package manager found (dnf / urpmi / apt-get).")"
  fi
}

print_preflight_summary_and_confirm() {
  local pretty_name="$1"
  local family="$2"
  local target_user="$3"
  local target_uid="$4"
  local target_home="$5"
  local desktop="$6"
  local session_type="$7"
  local existing_ime="$8"
  local mandriva_pkg_mgr="${9:-}"

  while true; do
    local fcitx5_note=""
    if [[ -f "$target_home/.config/fcitx5/profile" || -f "$target_home/.config/fcitx5/config" ]]; then
      fcitx5_note=$(msg " (기존 파일 덮어쓰기)" " (will overwrite existing)")
    else
      fcitx5_note=$(msg " (신규 생성)" " (new)")
    fi

    local ime_display=""
    if [[ "$SELECTED_IME" == "ibus" ]]; then
      if [[ "$RECOMMENDED_IME" == "ibus" ]]; then
        ime_display=$(msg "ibus-hangul (RHEL 계열 권장)" "ibus-hangul (recommended for RHEL)")
      else
        ime_display=$(msg "ibus-hangul (사용자 선택 / 기본 권장: fcitx5-hangul)" "ibus-hangul (user selected / recommended: fcitx5-hangul)")
      fi
    else
      if [[ "$CAN_SWITCH_IME" == "true" ]]; then
        ime_display=$(msg "fcitx5-hangul (이 환경 권장 / ibus 변경 가능)" "fcitx5-hangul (recommended / switchable to ibus)")
      else
        ime_display=$(msg "fcitx5-hangul (권장)" "fcitx5-hangul (recommended)")
      fi
    fi

    local kde_will_cfg="false"
    local pkg_summary=""
    local cfg_summary=""
    local extra_warn=""

    if [[ "$SELECTED_IME" == "ibus" ]]; then
      case "$family" in
        debian-family)
          pkg_summary=$(msg \
            "   - apt-get update && apt-get install: ibus, ibus-hangul, im-config, fonts-noto-cjk (+ ibus-gtk3/gtk4 사용 가능 시)" \
            "   - apt-get update && apt-get install: ibus, ibus-hangul, im-config, fonts-noto-cjk (+ ibus-gtk3/gtk4 if available)")
          cfg_summary=$(msg \
            "   - im-config -n ibus 적용 및 ibus write-cache\n   - GNOME 입력 소스('hangul') 및 preload-engines 등록(gsettings), fcitx5 사용자 서비스 비활성화\n   - $target_home/.config/environment.d/ibus.conf, $target_home/.xsessionrc\n   - 첫 로그인 1회 안내 등록" \
            "   - Run im-config -n ibus and ibus write-cache\n   - Configure GNOME input sources ('hangul') & preload-engines (gsettings), disable fcitx5 user service\n   - $target_home/.config/environment.d/ibus.conf, $target_home/.xsessionrc\n   - One-shot first-login guide")
          ;;
        vanilla)
          pkg_summary="   - abroot pkg add: ibus, ibus-hangul, im-config, fonts-noto-cjk"
          cfg_summary=$(msg \
            "   - ibus write-cache, GNOME 입력 소스('hangul') 및 preload-engines 등록(gsettings)\n   - $target_home/.config/environment.d/ibus.conf, $target_home/.xsessionrc\n   - 첫 로그인 1회 안내 등록" \
            "   - ibus write-cache, configure GNOME input sources ('hangul') & preload-engines (gsettings)\n   - $target_home/.config/environment.d/ibus.conf, $target_home/.xsessionrc\n   - One-shot first-login guide")
          extra_warn=$(msg \
            " ⚠️  참고: 불변 OS(ABRoot)이므로 설치 완료 후 반드시 재부팅이 필요합니다." \
            " ⚠️  Note: Immutable OS (ABRoot) — a system reboot will be required after installation.")
          ;;
        arch-family)
          pkg_summary="   - pacman -Sy --needed: ibus, ibus-hangul, noto-fonts-cjk"
          cfg_summary=$(msg \
            "   - ibus write-cache, GNOME/ibus 입력 소스 등록(gsettings), fcitx5 사용자 서비스 비활성화\n   - $target_home/.config/environment.d/ibus.conf, $target_home/.xprofile\n   - 비-GNOME 데스크톱 시 $target_home/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - 첫 로그인 1회 안내 등록" \
            "   - ibus write-cache, configure GNOME/ibus input sources (gsettings), disable fcitx5 user service\n   - $target_home/.config/environment.d/ibus.conf, $target_home/.xprofile\n   - Non-GNOME desktop: $target_home/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - One-shot first-login guide")
          ;;
        steamos)
          pkg_summary=$(msg \
            "   - steamos-readonly 임시 해제 → pacman-key init/populate →\n     pacman -Sy --needed: ibus, ibus-hangul, noto-fonts-cjk\n   - 설치 후 steamos-readonly 다시 활성화" \
            "   - Temporarily run steamos-readonly disable → pacman-key init/populate →\n     pacman -Sy --needed: ibus, ibus-hangul, noto-fonts-cjk\n   - Re-enable steamos-readonly after completion")
          cfg_summary=$(msg \
            "   - ibus write-cache, GNOME/ibus 입력 소스 등록(gsettings)\n   - $target_home/.config/environment.d/ibus.conf, $target_home/.xprofile\n   - 비-GNOME 데스크톱 시 $target_home/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - 첫 로그인 1회 안내 등록" \
            "   - ibus write-cache, configure GNOME/ibus input sources (gsettings)\n   - $target_home/.config/environment.d/ibus.conf, $target_home/.xprofile\n   - Non-GNOME desktop: $target_home/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - One-shot first-login guide")
          extra_warn=$(msg \
            " ⚠️  참고: SteamOS 루트 파일시스템 읽기 전용 상태를 일시 해제했다가 복구합니다." \
            " ⚠️  Note: SteamOS read-only rootfs will be temporarily unlocked and restored.")
          ;;
        fedora)
          pkg_summary=$(msg \
            "   - dnf install: ibus, ibus-hangul, ibus-setup, google-noto-sans-cjk-ttc-fonts (또는 google-noto-cjk-fonts)" \
            "   - dnf install: ibus, ibus-hangul, ibus-setup, google-noto-sans-cjk-ttc-fonts (or google-noto-cjk-fonts)")
          cfg_summary=$(msg \
            "   - ibus write-cache, GNOME/ibus 입력 소스 등록(gsettings)\n   - alternatives --set xinputrc (ibus.conf 있는 경우), ibus 서비스 활성화 / fcitx5 비활성화\n   - $target_home/.config/environment.d/ibus.conf, ~/.bash_profile(또는 ~/.profile)\n   - 비-GNOME 데스크톱 시 $target_home/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - 첫 로그인 1회 안내 등록" \
            "   - ibus write-cache, configure GNOME/ibus input sources (gsettings)\n   - alternatives --set xinputrc (if ibus.conf exists), enable ibus / disable fcitx5 user service\n   - $target_home/.config/environment.d/ibus.conf, ~/.bash_profile (or ~/.profile)\n   - Non-GNOME desktop: $target_home/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - One-shot first-login guide")
          ;;
        fedora-atomic)
          pkg_summary="   - rpm-ostree install --idempotent --allow-inactive: ibus, ibus-hangul, ibus-setup, google-noto-sans-cjk-ttc-fonts"
          cfg_summary=$(msg \
            "   - ibus write-cache, GNOME/ibus 입력 소스 등록(gsettings), fcitx5 사용자 서비스 비활성화\n   - $target_home/.config/environment.d/ibus.conf, ~/.bash_profile(또는 ~/.profile)\n   - 비-GNOME 데스크톱 시 $target_home/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - 첫 로그인 1회 안내 등록" \
            "   - ibus write-cache, configure GNOME/ibus input sources (gsettings), disable fcitx5 user service\n   - $target_home/.config/environment.d/ibus.conf, ~/.bash_profile (or ~/.profile)\n   - Non-GNOME desktop: $target_home/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - One-shot first-login guide")
          extra_warn=$(msg \
            " ⚠️  참고: 불변 OS(rpm-ostree)이므로 설치 완료 후 반드시 재부팅이 필요합니다." \
            " ⚠️  Note: Immutable OS (rpm-ostree) — a system reboot will be required after installation.")
          ;;
        opensuse|opensuse-transactional)
          if [[ "$family" == "opensuse-transactional" ]]; then
            pkg_summary="   - transactional-update pkg install: ibus, ibus-hangul, google-noto-sans-cjk-fonts"
            extra_warn=$(msg \
              " ⚠️  참고: Transactional OS이므로 설치 완료 후 반드시 재부팅이 필요합니다." \
              " ⚠️  Note: Transactional OS — a system reboot will be required after installation.")
          else
            pkg_summary="   - zypper install: ibus, ibus-hangul, google-noto-sans-cjk-fonts"
          fi
          cfg_summary=$(msg \
            "   - ibus write-cache, GNOME/ibus 입력 소스 등록(gsettings)\n   - alternatives --set xinputrc (ibus.conf 있는 경우), ibus 서비스 활성화 / fcitx5 비활성화\n   - $target_home/.config/environment.d/ibus.conf, ~/.bash_profile(또는 ~/.profile)\n   - 비-GNOME 데스크톱 시 $target_home/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - 첫 로그인 1회 안내 등록" \
            "   - ibus write-cache, configure GNOME/ibus input sources (gsettings)\n   - alternatives --set xinputrc (if ibus.conf exists), enable ibus / disable fcitx5 user service\n   - $target_home/.config/environment.d/ibus.conf, ~/.bash_profile (or ~/.profile)\n   - Non-GNOME desktop: $target_home/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - One-shot first-login guide")
          ;;
        rhel-family)
          pkg_summary=$(msg \
            "   - dnf install: ibus-hangul, ibus-setup, google-noto-sans-cjk-ttc-fonts (또는 google-noto-cjk-fonts)" \
            "   - dnf install: ibus-hangul, ibus-setup, google-noto-sans-cjk-ttc-fonts (or google-noto-cjk-fonts)")
          cfg_summary=$(msg \
            "   - ibus write-cache, GNOME 입력 소스('hangul') 및 preload-engines 등록(gsettings), ibus-daemon 재시작\n   - $target_home/.config/environment.d/ibus.conf, ~/.bash_profile(또는 ~/.profile)\n   - 첫 로그인 1회 안내 등록" \
            "   - ibus write-cache, configure GNOME input sources ('hangul') & preload-engines (gsettings), restart ibus-daemon\n   - $target_home/.config/environment.d/ibus.conf, ~/.bash_profile (or ~/.profile)\n   - One-shot first-login guide")
          ;;
        void)
          pkg_summary="   - xbps-install -Sy: ibus, ibus-hangul, noto-fonts-cjk"
          cfg_summary=$(msg \
            "   - ibus write-cache, GNOME/ibus 입력 소스 등록(gsettings)\n   - $target_home/.config/environment.d/ibus.conf, $target_home/.xprofile\n   - 비-GNOME 데스크톱 시 $target_home/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - 첫 로그인 1회 안내 등록" \
            "   - ibus write-cache, configure GNOME/ibus input sources (gsettings)\n   - $target_home/.config/environment.d/ibus.conf, $target_home/.xprofile\n   - Non-GNOME desktop: $target_home/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - One-shot first-login guide")
          ;;
        solus)
          pkg_summary="   - eopkg install -y: ibus, ibus-hangul"
          cfg_summary=$(msg \
            "   - ibus write-cache, GNOME/ibus 입력 소스 등록(gsettings)\n   - $target_home/.config/environment.d/ibus.conf, /etc/environment\n   - 비-GNOME 데스크톱 시 $target_home/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - 첫 로그인 1회 안내 등록" \
            "   - ibus write-cache, configure GNOME/ibus input sources (gsettings)\n   - $target_home/.config/environment.d/ibus.conf, /etc/environment\n   - Non-GNOME desktop: $target_home/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - One-shot first-login guide")
          ;;
        gentoo)
          pkg_summary="   - emerge --noreplace: app-i18n/ibus, app-i18n/ibus-hangul"
          cfg_summary=$(msg \
            "   - ibus write-cache, GNOME/ibus 입력 소스 등록(gsettings)\n   - $target_home/.config/environment.d/ibus.conf, $target_home/.xprofile\n   - 비-GNOME 데스크톱 시 $target_home/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - 첫 로그인 1회 안내 등록" \
            "   - ibus write-cache, configure GNOME/ibus input sources (gsettings)\n   - $target_home/.config/environment.d/ibus.conf, $target_home/.xprofile\n   - Non-GNOME desktop: $target_home/.config/autostart/ibus-daemon.desktop (NotShowIn=GNOME;)\n   - One-shot first-login guide")
          ;;
      esac

      if has_conflicting_ime "ibus" "$existing_ime"; then
        local ime_conflict_msg
        ime_conflict_msg=$(msg \
          " ⚠️  참고: 기존 입력기($existing_ime)가 감지되었습니다. 기존 입력기가 새 입력기와 충돌할 수 있으므로 기존 입력기 설정(자동시작·서비스·환경변수)을 자동으로 비활성화하겠습니다." \
          " ⚠️  Note: Existing IME ($existing_ime) detected. Since existing IMEs may conflict with the new input method, conflicting IME settings (autostart, user services, and environment variables) will be automatically disabled.")
        if [[ -n "$extra_warn" ]]; then
          extra_warn+="\n$ime_conflict_msg"
        else
          extra_warn="$ime_conflict_msg"
        fi
      fi
      if [[ "$desktop" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] && "$session_type" == "wayland" ]]; then
        local kde_ibus_warn
        kde_ibus_warn=$(msg \
          " ⚠️  참고: KDE Plasma Wayland 환경에서는 IBus보다 Fcitx 5가 더 안정적으로 권장됩니다." \
          " ⚠️  Note: On KDE Plasma Wayland, Fcitx 5 is generally recommended over IBus.")
        if [[ -n "$extra_warn" ]]; then
          extra_warn+="\n$kde_ibus_warn"
        else
          extra_warn="$kde_ibus_warn"
        fi
      fi
    else
      kde_will_cfg=$(will_configure_kde "$target_home" "$desktop")
      case "$family" in
        debian-family)
          pkg_summary=$(msg \
            "   - apt-get update 실행 후 레거시 fcitx(4.x) 제거 및 autoremove --purge\n   - apt-get install: fcitx5, fcitx5-hangul, fcitx5-config-qt, fcitx5-configtool,\n     fcitx5-frontend-gtk3/gtk4/qt5/qt6, fonts-noto-cjk" \
            "   - apt-get update, purge legacy fcitx(4.x) + autoremove --purge\n   - apt-get install: fcitx5, fcitx5-hangul, fcitx5-config-qt, fcitx5-configtool,\n     fcitx5-frontend-gtk3/gtk4/qt5/qt6, fonts-noto-cjk")
          cfg_summary=$(msg \
            "   - im-config -n fcitx5 적용 및 데스크톱 단축키 충돌 해제(gsettings)\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment, $target_home/.xsessionrc\n   - $target_home/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록" \
            "   - Run im-config -n fcitx5 and clear desktop input-source shortcut conflicts (gsettings)\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment, $target_home/.xsessionrc\n   - $target_home/.config/autostart/fcitx5.desktop and one-shot first-login guide")
          extra_warn=$(msg \
            " ⚠️  참고: 기존 fcitx 4.x 패키지 및 미사용 의존성(autoremove)이 제거됩니다." \
            " ⚠️  Note: Legacy fcitx 4.x packages and unused dependencies (autoremove) will be removed.")
          ;;
        arch-family)
          pkg_summary=$(msg \
            "   - pacman -Sy --needed: fcitx5-im, fcitx5-hangul, fcitx5-configtool,\n     fcitx5-gtk, fcitx5-qt, noto-fonts-cjk" \
            "   - pacman -Sy --needed: fcitx5-im, fcitx5-hangul, fcitx5-configtool,\n     fcitx5-gtk, fcitx5-qt, noto-fonts-cjk")
          cfg_summary=$(msg \
            "   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/autostart/fcitx5.desktop, systemctl --user enable fcitx5\n   - 첫 로그인 1회 안내 등록" \
            "   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/autostart/fcitx5.desktop, systemctl --user enable fcitx5\n   - One-shot first-login guide")
          ;;
        kaos)
          pkg_summary="   - pacman -Sy --needed: fcitx5, fcitx5-hangul, fcitx5-qt, fcitx5-configtool, noto-fonts-cjk"
          cfg_summary=$(msg \
            "   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록" \
            "   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/autostart/fcitx5.desktop and one-shot first-login guide")
          ;;
        steamos)
          pkg_summary=$(msg \
            "   - steamos-readonly 임시 해제 → pacman-key init/populate →\n     pacman -Sy --needed: fcitx5-im, fcitx5-hangul, fcitx5-configtool, fcitx5-gtk, fcitx5-qt, noto-fonts-cjk\n   - 설치 후 steamos-readonly 다시 활성화" \
            "   - Temporarily run steamos-readonly disable → pacman-key init/populate →\n     pacman -Sy --needed: fcitx5-im, fcitx5-hangul, fcitx5-configtool, fcitx5-gtk, fcitx5-qt, noto-fonts-cjk\n   - Re-enable steamos-readonly after completion")
          cfg_summary=$(msg \
            "   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록" \
            "   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/autostart/fcitx5.desktop and one-shot first-login guide")
          extra_warn=$(msg \
            " ⚠️  참고: SteamOS 루트 파일시스템 읽기 전용 상태를 일시 해제했다가 복구합니다." \
            " ⚠️  Note: SteamOS read-only rootfs will be temporarily unlocked and restored.")
          ;;
        fedora)
          pkg_summary=$(msg \
            "   - dnf install: fcitx5, fcitx5-hangul, fcitx5-configtool, fcitx5-gtk, fcitx5-qt,\n     fcitx5-autostart, google-noto-sans-cjk-ttc-fonts (또는 google-noto-cjk-fonts)" \
            "   - dnf install: fcitx5, fcitx5-hangul, fcitx5-configtool, fcitx5-gtk, fcitx5-qt,\n     fcitx5-autostart, google-noto-sans-cjk-ttc-fonts (or google-noto-cjk-fonts)")
          cfg_summary=$(msg \
            "   - alternatives --set xinputrc, /etc/X11/xinit/xinput.d/fcitx5.conf 수정, ibus 사용자 서비스 비활성화\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment, ~/.bash_profile(또는 ~/.profile)\n   - 첫 로그인 1회 안내 등록" \
            "   - alternatives --set xinputrc, patch /etc/X11/xinit/xinput.d/fcitx5.conf, disable ibus user service\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment, ~/.bash_profile (or ~/.profile)\n   - One-shot first-login guide")
          ;;
        fedora-atomic)
          pkg_summary=$(msg \
            "   - rpm-ostree install --idempotent --allow-inactive:\n     fcitx5, fcitx5-hangul, fcitx5-gtk, fcitx5-qt, fcitx5-configtool, fcitx5-autostart, google-noto-sans-cjk-ttc-fonts" \
            "   - rpm-ostree install --idempotent --allow-inactive:\n     fcitx5, fcitx5-hangul, fcitx5-gtk, fcitx5-qt, fcitx5-configtool, fcitx5-autostart, google-noto-sans-cjk-ttc-fonts")
          cfg_summary=$(msg \
            "   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/environment.d/fcitx5.conf 및 첫 로그인 1회 안내 등록" \
            "   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/environment.d/fcitx5.conf and one-shot first-login guide")
          extra_warn=$(msg \
            " ⚠️  참고: 불변 OS(rpm-ostree)이므로 설치 완료 후 반드시 재부팅이 필요합니다." \
            " ⚠️  Note: Immutable OS (rpm-ostree) — a system reboot will be required after installation.")
          ;;
        vanilla)
          pkg_summary=$(msg \
            "   - abroot pkg add: fcitx5, fcitx5-hangul, fcitx5-config-qt,\n     fcitx5-frontend-gtk3/gtk4/qt5/qt6, fonts-noto-cjk" \
            "   - abroot pkg add: fcitx5, fcitx5-hangul, fcitx5-config-qt,\n     fcitx5-frontend-gtk3/gtk4/qt5/qt6, fonts-noto-cjk")
          cfg_summary=$(msg \
            "   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/environment.d/fcitx5.conf, $target_home/.config/autostart/fcitx5.desktop\n   - 첫 로그인 1회 안내 등록" \
            "   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/environment.d/fcitx5.conf, $target_home/.config/autostart/fcitx5.desktop\n   - One-shot first-login guide")
          extra_warn=$(msg \
            " ⚠️  참고: 불변 OS(ABRoot)이므로 설치 완료 후 반드시 재부팅이 필요합니다." \
            " ⚠️  Note: Immutable OS (ABRoot) — a system reboot will be required after installation.")
          ;;
        opensuse-transactional)
          pkg_summary=$(msg \
            "   - transactional-update pkg install: fcitx5, fcitx5-hangul, fcitx5-configtool,\n     fcitx5-gtk, fcitx5-qt, fcitx5-qt5, fcitx5-qt6, fcitx5-autostart, google-noto-sans-cjk-fonts" \
            "   - transactional-update pkg install: fcitx5, fcitx5-hangul, fcitx5-configtool,\n     fcitx5-gtk, fcitx5-qt, fcitx5-qt5, fcitx5-qt6, fcitx5-autostart, google-noto-sans-cjk-fonts")
          cfg_summary=$(msg \
            "   - alternatives --set xinputrc, /etc/X11/xinit/xinput.d/fcitx5.conf 수정, ibus 사용자 서비스 비활성화\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - ~/.bash_profile(또는 ~/.profile) 및 첫 로그인 1회 안내 등록" \
            "   - alternatives --set xinputrc, patch /etc/X11/xinit/xinput.d/fcitx5.conf, disable ibus user service\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - ~/.bash_profile (or ~/.profile) and one-shot first-login guide")
          extra_warn=$(msg \
            " ⚠️  참고: Transactional OS이므로 설치 완료 후 반드시 재부팅이 필요합니다." \
            " ⚠️  Note: Transactional OS — a system reboot will be required after installation.")
          ;;
        opensuse)
          pkg_summary="   - zypper install: fcitx5, fcitx5-hangul, fcitx5-configtool, fcitx5-gtk, fcitx5-qt, fcitx5-qt5, fcitx5-qt6, fcitx5-autostart, google-noto-sans-cjk-fonts"
          cfg_summary=$(msg \
            "   - alternatives --set xinputrc, /etc/X11/xinit/xinput.d/fcitx5.conf 수정, ibus 사용자 서비스 비활성화\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - ~/.bash_profile(또는 ~/.profile) 및 첫 로그인 1회 안내 등록" \
            "   - alternatives --set xinputrc, patch /etc/X11/xinit/xinput.d/fcitx5.conf, disable ibus user service\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - ~/.bash_profile (or ~/.profile) and one-shot first-login guide")
          ;;
        void)
          pkg_summary="   - xbps-install -Sy: fcitx5, fcitx5-hangul, fcitx5-gtk+3, fcitx5-gtk4, fcitx5-qt5, fcitx5-qt6, fcitx5-configtool, noto-fonts-cjk"
          cfg_summary=$(msg \
            "   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment, $target_home/.xprofile\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록" \
            "   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment, $target_home/.xprofile\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/autostart/fcitx5.desktop and one-shot first-login guide")
          ;;
        alpine)
          pkg_summary="   - apk update && apk add: fcitx5, fcitx5-hangul, fcitx5-gtk, fcitx5-qt, fcitx5-configtool, font-noto-cjk"
          cfg_summary=$(msg \
            "   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment, $target_home/.profile\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록" \
            "   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment, $target_home/.profile\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/autostart/fcitx5.desktop and one-shot first-login guide")
          ;;
        solus)
          pkg_summary="   - eopkg install -y: fcitx5, fcitx5-hangul, fcitx5-gtk, fcitx5-qt5, fcitx5-configtool"
          cfg_summary=$(msg \
            "   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록" \
            "   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/autostart/fcitx5.desktop and one-shot first-login guide")
          ;;
        gentoo)
          pkg_summary="   - emerge --noreplace: app-i18n/fcitx:5, fcitx-hangul:5, fcitx-gtk:5, fcitx-qt:5, fcitx-configtool:5"
          cfg_summary=$(msg \
            "   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment, $target_home/.xprofile\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록" \
            "   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment, $target_home/.xprofile\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/autostart/fcitx5.desktop and one-shot first-login guide")
          ;;
        mandriva-family)
          if [[ "$mandriva_pkg_mgr" == "apt-get" ]]; then
            pkg_summary="   - apt-get update && apt-get install -y: fcitx5, fcitx5-hangul, fcitx5-configtool"
          elif [[ "$mandriva_pkg_mgr" == "urpmi" ]]; then
            pkg_summary="   - urpmi --auto: fcitx5, fcitx5-hangul, fcitx5-gtk, fcitx5-qt, fcitx5-configtool"
          else
            pkg_summary="   - dnf install -y: fcitx5, fcitx5-hangul, fcitx5-gtk, fcitx5-qt, fcitx5-configtool"
          fi
          cfg_summary=$(msg \
            "   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment, $target_home/.xprofile\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록" \
            "   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment, $target_home/.xprofile\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/autostart/fcitx5.desktop and one-shot first-login guide")
          ;;
        alt)
          pkg_summary="   - apt-get update && apt-get install -y: fcitx5, fcitx5-hangul, fcitx5-gtk, fcitx5-qt, fcitx5-configtool"
          cfg_summary=$(msg \
            "   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment, $target_home/.xprofile\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록" \
            "   - $target_home/.config/environment.d/fcitx5.conf, /etc/environment, $target_home/.xprofile\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/autostart/fcitx5.desktop and one-shot first-login guide")
          ;;
        guix)
          pkg_summary="   - su - $target_user: guix install fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool font-google-noto-sans-cjk"
          cfg_summary=$(msg \
            "   - ~/.bash_profile (또는 ~/.profile) GUIX_PROFILE 및 환경변수 추가\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/autostart/fcitx5.desktop 및 첫 로그인 1회 안내 등록" \
            "   - Append GUIX_PROFILE & env vars to ~/.bash_profile (or ~/.profile)\n   - $target_home/.config/fcitx5/{profile,config}${fcitx5_note}\n   - $target_home/.config/autostart/fcitx5.desktop and one-shot first-login guide")
          ;;
      esac

      if [[ "$kde_will_cfg" == "true" ]]; then
        cfg_summary+="\n"$(msg \
          "   - KDE Plasma 가상 키보드 설정: $target_home/.config/kwinrc ([Wayland] InputMethod)" \
          "   - KDE Plasma Virtual Keyboard: $target_home/.config/kwinrc ([Wayland] InputMethod)")
      fi

      if [[ -f "$target_home/.config/fcitx5/profile" || -f "$target_home/.config/fcitx5/config" ]]; then
        local ow_msg
        ow_msg=$(msg \
          " ⚠️  참고: 기존 Fcitx5 설정 파일($target_home/.config/fcitx5/profile, config)이 덮어써집니다." \
          " ⚠️  Note: Existing Fcitx5 config ($target_home/.config/fcitx5/profile, config) will be overwritten.")
        if [[ -n "$extra_warn" ]]; then
          extra_warn+="\n$ow_msg"
        else
          extra_warn="$ow_msg"
        fi
      fi

      if has_conflicting_ime "fcitx5" "$existing_ime"; then
        local ime_conflict_msg
        ime_conflict_msg=$(msg \
          " ⚠️  참고: 기존 입력기($existing_ime)가 감지되었습니다. 기존 입력기가 새 입력기와 충돌할 수 있으므로 기존 입력기 설정(자동시작·서비스·환경변수)을 자동으로 비활성화하겠습니다." \
          " ⚠️  Note: Existing IME ($existing_ime) detected. Since existing IMEs may conflict with the new input method, conflicting IME settings (autostart, user services, and environment variables) will be automatically disabled.")
        if [[ -n "$extra_warn" ]]; then
          extra_warn+="\n$ime_conflict_msg"
        else
          extra_warn="$ime_conflict_msg"
        fi
      fi
    fi

    echo
    echo "============================================================"
    echo " $(msg "🔍 설치 전 시스템 조사 및 변경 예정 내역" "🔍 Pre-flight System Inspection & Planned Changes")"
    echo "============================================================"
    echo " • $(msg "감지된 OS     " "Detected OS   ") : $pretty_name ($family)"
    echo " • $(msg "선택된 입력기 " "Selected IME  ") : $ime_display"
    echo " • $(msg "대상 사용자   " "Target User   ") : $target_user (UID=$target_uid, HOME=$target_home)"
    echo " • $(msg "데스크톱/세션 " "Desktop/Session") : $desktop / $session_type"
    echo " • $(msg "기존 입력기   " "Existing IME  ") : $existing_ime"
    echo "------------------------------------------------------------"
    echo " $(msg "📦 패키지 변경 예정:" "📦 Package Changes:")"
    printf "%b\n" "$pkg_summary"
    echo " $(msg "⚙️  설정·파일 변경 예정:" "⚙️  Config & File Changes:")"
    printf "%b\n" "$cfg_summary"
    echo " • $(msg "설치 로그 파일" "Install Log   ") : $LOG_FILE"
    if [[ -n "$extra_warn" ]]; then
      echo "------------------------------------------------------------"
      printf "%b\n" "$extra_warn"
    fi
    echo "============================================================"
    echo " $(msg "⚠️  경고: 계속 진행하면 위 패키지와 시스템/사용자 설정이 실제로 변경됩니다." "⚠️  Warning: Proceeding will install/modify system packages and configuration files listed above.")"

    if [[ "$AUTO_YES" == "true" ]]; then
      echo " $(msg "ℹ️  --yes (-y) 옵션이 지정되어 확인 절차를 건너뛰고 진행합니다." "ℹ️  --yes (-y) flag detected; proceeding without interactive prompt.")"
      echo
      return 0
    fi

    if ! ( : </dev/tty ) 2>/dev/null; then
      echo " $(msg "❌ 대화형 터미널(/dev/tty)이 없어 사용자 확인을 받을 수 없습니다." "❌ No interactive terminal (/dev/tty) available for confirmation.")" >&2
      echo "    $(msg "대화형 터미널에서 실행하거나 --yes (-y) 옵션을 전달하세요." "Run interactively or pass --yes (-y).")" >&2
      exit 1
    fi

    local prompt_text
    if [[ "$CAN_SWITCH_IME" == "true" && "$SELECTED_IME" == "fcitx5" ]]; then
      prompt_text=$(msg "이대로 설치를 진행하시겠습니까? [y/N/ibus] (권장: y): " "Proceed with installation? [y/N/ibus] (recommended: y): ")
    elif [[ "$CAN_SWITCH_IME" == "true" && "$SELECTED_IME" == "ibus" ]]; then
      prompt_text=$(msg "이대로 설치를 진행하시겠습니까? [y/N/fcitx5] (현재: ibus): " "Proceed with installation? [y/N/fcitx5] (current: ibus): ")
    else
      prompt_text=$(msg "이대로 설치를 진행하시겠습니까? [y/N]: " "Proceed with installation? [y/N]: ")
    fi

    local reply=""
    printf " %s" "$prompt_text"
    IFS= read -r reply </dev/tty || reply=""
    case "$reply" in
      y|Y|yes|YES)
        echo
        return 0
        ;;
      ibus|IBUS)
        if [[ "$CAN_SWITCH_IME" == "true" && "$SELECTED_IME" != "ibus" ]]; then
          SELECTED_IME="ibus"
          echo " $(msg "🔄 입력기를 ibus-hangul로 전환했습니다. 변경 예정 내역을 다시 확인하세요." "🔄 Switched IME to ibus-hangul. Please review the updated plan below.")"
          continue
        fi
        echo " $(msg "🛑 설치를 취소했습니다. 시스템에 아무런 변경도 적용되지 않았습니다." "🛑 Installation cancelled. No changes were made to your system.")"
        exit 0
        ;;
      fcitx|fcitx5|FCITX|FCITX5)
        if [[ "$CAN_SWITCH_IME" == "true" && "$SELECTED_IME" != "fcitx5" ]]; then
          SELECTED_IME="fcitx5"
          echo " $(msg "🔄 입력기를 fcitx5-hangul(권장)로 전환했습니다. 변경 예정 내역을 다시 확인하세요." "🔄 Switched IME to fcitx5-hangul (recommended). Please review the updated plan below.")"
          continue
        fi
        echo " $(msg "🛑 설치를 취소했습니다. 시스템에 아무런 변경도 적용되지 않았습니다." "🛑 Installation cancelled. No changes were made to your system.")"
        exit 0
        ;;
      *)
        echo " $(msg "🛑 설치를 취소했습니다. 시스템에 아무런 변경도 적용되지 않았습니다." "🛑 Installation cancelled. No changes were made to your system.")"
        exit 0
        ;;
    esac
  done
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

family_supports_ibus() {
  case "$1" in
    rhel-family|debian-family|arch-family|fedora|fedora-atomic|opensuse|opensuse-transactional|vanilla|steamos|void|solus|gentoo|nixos)
      return 0 ;;
    *)
      return 1 ;;
  esac
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

configure_kde_virtual_keyboard() {
  local target_home="$1"
  local uid="$2"
  local gid="$3"
  local user="$4"
  local desktop="$5"

  local is_kde=false
  if [[ "$desktop" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]]; then
    is_kde=true
  elif command -v kwriteconfig6 >/dev/null 2>&1 || command -v kwriteconfig5 >/dev/null 2>&1 || [[ -f "$target_home/.config/kwinrc" ]]; then
    is_kde=true
  fi

  if [[ "$is_kde" != "true" ]]; then
    return 0
  fi

  local fcitx5_desktop=""
  if [[ -f /usr/share/applications/fcitx5-wayland-launcher.desktop ]]; then
    fcitx5_desktop="/usr/share/applications/fcitx5-wayland-launcher.desktop"
  elif [[ -f /usr/share/applications/org.fcitx.Fcitx5.desktop ]]; then
    fcitx5_desktop="/usr/share/applications/org.fcitx.Fcitx5.desktop"
  else
    fcitx5_desktop="/usr/share/applications/org.fcitx.Fcitx5.desktop"
  fi

  local config_dir="$target_home/.config"
  local kwinrc="$config_dir/kwinrc"
  mkdir -p "$config_dir"

  if command -v kwriteconfig6 >/dev/null 2>&1; then
    kwriteconfig6 --file "$kwinrc" --group Wayland --key InputMethod "$fcitx5_desktop" 2>/dev/null || true
  elif command -v kwriteconfig5 >/dev/null 2>&1; then
    kwriteconfig5 --file "$kwinrc" --group Wayland --key InputMethod "$fcitx5_desktop" 2>/dev/null || true
  elif [[ -f "$kwinrc" ]]; then
    awk -v im="$fcitx5_desktop" '
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
    ' "$kwinrc" > "${kwinrc}.tmp" && mv "${kwinrc}.tmp" "$kwinrc"
  else
    printf '[Wayland]\nInputMethod=%s\n' "$fcitx5_desktop" > "$kwinrc"
  fi

  chown "$uid:$gid" "$config_dir" "$kwinrc" 2>/dev/null || true

  # 실행 중인 KDE 세션이 있으면 KWin 설정 즉시 리로드 시도
  if [[ -n "$user" && -S "/run/user/$uid/bus" ]] && command -v sudo >/dev/null 2>&1; then
    local qdbus_cmd=""
    if command -v qdbus6 >/dev/null 2>&1; then
      qdbus_cmd="qdbus6"
    elif command -v qdbus >/dev/null 2>&1; then
      qdbus_cmd="qdbus"
    fi
    if [[ -n "$qdbus_cmd" ]]; then
      sudo -u "$user" XDG_RUNTIME_DIR="/run/user/$uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$uid/bus" \
        "$qdbus_cmd" org.kde.KWin /KWin reconfigure 2>/dev/null || true
    fi
  fi

  ok "$(msg "KDE Plasma 가상 키보드(Fcitx 5) 자동 설정 완료 ($fcitx5_desktop)" "Auto-configured KDE Plasma Virtual Keyboard to Fcitx 5 ($fcitx5_desktop)")"
}

register_first_login_guide() {
  local target_home="$1"
  local target_uid="$2"
  local target_gid="$3"
  local is_ko="$4"
  local selected_ime="$5"
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
    if [[ "$selected_ime" != "ibus" && "$desktop" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]]; then
      msg+="🖥️  KDE Plasma 가상 키보드(Fcitx 5) 자동 설정됨 (미적용 시: 시스템 설정 → 입력 장치 → 가상 키보드에서 확인)\n"
    fi
    if [[ "$selected_ime" == "ibus" ]]; then
      msg+="⌨️  전환 단축키: Super+Space 또는 한/영 키\n"
      msg+="⚙️  설정: ibus-setup (GNOME: 설정 → 키보드 → 입력 소스)\n"
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
    if [[ "$selected_ime" != "ibus" && "$desktop" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]]; then
      msg+="🖥️  KDE Plasma Virtual Keyboard (Fcitx 5) auto-configured (if inactive, check System Settings -> Input Devices -> Virtual Keyboard)\n"
    fi
    if [[ "$selected_ime" == "ibus" ]]; then
      msg+="⌨️  Toggle: Super+Space or Hangul key\n"
      msg+="⚙️  Config: ibus-setup (GNOME: Settings -> Keyboard -> Input Sources)\n"
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

disable_conflicting_imes() {
  local target_ime="$1"
  local target_user="$2"
  local target_home="$3"
  local target_uid="$4"
  local target_gid="$5"
  local desktop="$6"
  local changed=false
  local is_gnome=false
  [[ "${desktop,,}" == *"gnome"* ]] && is_gnome=true

  local autostart_dir="$target_home/.config/autostart"
  local env_dir="$target_home/.config/environment.d"
  local target_desktops=() svcs=() procs=() desktops=() env_confs=()
  local im_re="" kwin_re=""

  case "$target_ime" in
    fcitx5)
      target_desktops=(org.fcitx.Fcitx5.desktop fcitx5-wayland-launcher.desktop fcitx5.desktop fcitx5-autostart.desktop)
      svcs=(ibus kime kime-daemon fcitx)
      procs=(fcitx kime kime-daemon kime-indicator kime-wayland kime-xim)
      [[ "$is_gnome" != "true" ]] && procs+=(ibus-daemon)
      desktops=(ibus.desktop ibus-daemon.desktop kime.desktop fcitx.desktop fcitx-autostart.desktop)
      env_confs=(ibus.conf kime.conf fcitx.conf)
      im_re="(ibus|kime)"
      kwin_re="(ibus|kime)"
      ;;
    ibus)
      target_desktops=(ibus.desktop ibus-daemon.desktop org.freedesktop.IBus.Panel.Wayland.Gtk3.desktop)
      svcs=(fcitx5 fcitx kime kime-daemon)
      procs=(fcitx5 fcitx kime kime-daemon kime-indicator kime-wayland kime-xim)
      desktops=(fcitx5.desktop org.fcitx.Fcitx5.desktop fcitx5-wayland-launcher.desktop fcitx5-autostart.desktop fcitx.desktop fcitx-autostart.desktop kime.desktop)
      env_confs=(fcitx5.conf fcitx.conf kime.conf)
      im_re="(fcitx5|fcitx|kime)"
      kwin_re="(fcitx|kime)"
      ;;
    kime)
      target_desktops=(kime.desktop)
      svcs=(fcitx5 fcitx ibus)
      procs=(fcitx5 fcitx)
      [[ "$is_gnome" != "true" ]] && procs+=(ibus-daemon)
      desktops=(fcitx5.desktop org.fcitx.Fcitx5.desktop fcitx5-wayland-launcher.desktop fcitx5-autostart.desktop fcitx.desktop fcitx-autostart.desktop ibus.desktop ibus-daemon.desktop)
      env_confs=(fcitx5.conf fcitx.conf ibus.conf)
      im_re="(fcitx5|fcitx|ibus)"
      kwin_re="(fcitx|ibus)"
      ;;
    *)
      return 0
      ;;
  esac

  # 0. 대상 입력기의 이전 Hidden=true 마스크가 남아있다면 제거
  local td
  for td in "${target_desktops[@]}"; do
    if [[ -f "$autostart_dir/$td" ]] && grep -q '^Hidden=true$' "$autostart_dir/$td" 2>/dev/null; then
      rm -f "$autostart_dir/$td"
    fi
  done

  # 1. 충돌 systemd 사용자 서비스 중지 및 비활성화
  local svc
  if command -v systemctl >/dev/null 2>&1; then
    if [[ -S "/run/user/$target_uid/bus" ]] && command -v sudo >/dev/null 2>&1; then
      local bus="unix:path=/run/user/$target_uid/bus"
      for svc in "${svcs[@]}"; do
        if sudo -u "$target_user" XDG_RUNTIME_DIR="/run/user/$target_uid" DBUS_SESSION_BUS_ADDRESS="$bus" \
             systemctl --user is-enabled "$svc" >/dev/null 2>&1 || \
           sudo -u "$target_user" XDG_RUNTIME_DIR="/run/user/$target_uid" DBUS_SESSION_BUS_ADDRESS="$bus" \
             systemctl --user is-active "$svc" >/dev/null 2>&1; then
          sudo -u "$target_user" XDG_RUNTIME_DIR="/run/user/$target_uid" DBUS_SESSION_BUS_ADDRESS="$bus" \
            systemctl --user disable --now "$svc" 2>/dev/null || true
          changed=true
        fi
      done
    else
      for svc in "${svcs[@]}"; do
        if su - "$target_user" -c "systemctl --user is-enabled $svc >/dev/null 2>&1" 2>/dev/null; then
          su - "$target_user" -c "systemctl --user disable $svc 2>/dev/null || true" || true
          changed=true
        fi
      done
    fi
  fi

  # 2. 실행 중인 충돌 입력기 프로세스 종료
  local p
  for p in "${procs[@]}"; do
    if command -v pgrep >/dev/null 2>&1 && pgrep -u "$target_uid" -x "$p" >/dev/null 2>&1; then
      pkill -u "$target_uid" -x "$p" 2>/dev/null || true
      changed=true
    fi
  done

  # 3. XDG autostart 비활성화 (시스템 파일은 Hidden=true 마스킹, 사용자 파일은 .disabled 백업)
  local desk
  for desk in "${desktops[@]}"; do
    if [[ -f "/etc/xdg/autostart/$desk" ]]; then
      if [[ ! -f "$autostart_dir/$desk" ]] || ! grep -q '^Hidden=true$' "$autostart_dir/$desk" 2>/dev/null; then
        mkdir -p "$autostart_dir"
        cat > "$autostart_dir/$desk" <<'EOF'
[Desktop Entry]
Type=Application
Name=Disabled IME
Hidden=true
X-GNOME-Autostart-enabled=false
EOF
        chown "$target_uid:$target_gid" "$autostart_dir" "$autostart_dir/$desk" 2>/dev/null || true
        changed=true
      fi
    elif [[ -f "$autostart_dir/$desk" ]]; then
      mv -f "$autostart_dir/$desk" "$autostart_dir/${desk}.disabled"
      chown "$target_uid:$target_gid" "$autostart_dir/${desk}.disabled" 2>/dev/null || true
      changed=true
    fi
  done

  # 4. environment.d 충돌 파일 비활성화 (.conf.disabled 백업)
  local econf
  for econf in "${env_confs[@]}"; do
    if [[ -f "$env_dir/$econf" ]]; then
      mv -f "$env_dir/$econf" "$env_dir/${econf}.disabled"
      chown "$target_uid:$target_gid" "$env_dir/${econf}.disabled" 2>/dev/null || true
      changed=true
    fi
  done

  # 5. /etc/environment 및 사용자 셸/세션 프로필에서 충돌 IM 환경변수 줄 정리
  local env_line_re="^[[:space:]]*(export[[:space:]]+)?((GTK|QT|SDL|GLFW)_IM_MODULE=['\"]?${im_re}['\"]?|XMODIFIERS=['\"]?@im=${im_re}['\"]?)[[:space:]]*(#.*)?$"
  local ef
  for ef in /etc/environment "$target_home/.xsessionrc" "$target_home/.xprofile" "$target_home/.bash_profile" "$target_home/.profile"; do
    if [[ -f "$ef" && -w "$ef" ]] && grep -qE "$env_line_re" "$ef" 2>/dev/null; then
      grep -Ev "$env_line_re" "$ef" > "${ef}.tmp" || true
      cat "${ef}.tmp" > "$ef"
      rm -f "${ef}.tmp"
      if [[ "$ef" != "/etc/environment" ]]; then
        chown "$target_uid:$target_gid" "$ef" 2>/dev/null || true
      fi
      changed=true
    fi
  done

  # 6. KDE Plasma kwinrc 충돌 InputMethod 정리
  local kwinrc="$target_home/.config/kwinrc"
  if [[ -f "$kwinrc" ]] && grep -qE '^InputMethod(\[\$e\])?=.*'"${kwin_re}" "$kwinrc" 2>/dev/null; then
    if command -v kwriteconfig6 >/dev/null 2>&1; then
      kwriteconfig6 --file "$kwinrc" --group Wayland --key InputMethod --delete 2>/dev/null || true
    elif command -v kwriteconfig5 >/dev/null 2>&1; then
      kwriteconfig5 --file "$kwinrc" --group Wayland --key InputMethod --delete 2>/dev/null || true
    else
      awk '
        BEGIN { in_wayland=0 }
        /^\[Wayland\]$/ { in_wayland=1; print; next }
        /^\[/ { in_wayland=0; print; next }
        in_wayland && /^InputMethod(\[\$e\])?=/ { next }
        { print }
      ' "$kwinrc" > "${kwinrc}.tmp" && cat "${kwinrc}.tmp" > "$kwinrc" && rm -f "${kwinrc}.tmp"
    fi
    chown "$target_uid:$target_gid" "$kwinrc" 2>/dev/null || true
    if [[ -S "/run/user/$target_uid/bus" ]] && command -v sudo >/dev/null 2>&1; then
      local qdbus_cmd=""
      if command -v qdbus6 >/dev/null 2>&1; then qdbus_cmd="qdbus6"
      elif command -v qdbus >/dev/null 2>&1; then qdbus_cmd="qdbus"
      fi
      if [[ -n "$qdbus_cmd" ]]; then
        sudo -u "$target_user" XDG_RUNTIME_DIR="/run/user/$target_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$target_uid/bus" \
          "$qdbus_cmd" org.kde.KWin /KWin reconfigure 2>/dev/null || true
      fi
    fi
    changed=true
  fi

  if [[ "$changed" == "true" ]]; then
    ok "$(msg "기존 충돌 입력기 설정 자동 비활성화 완료 (대상: $target_ime)" "Automatically disabled conflicting IME settings (target: $target_ime)")"
  fi
}

configure_ibus_user_session() {
  local family="$1"
  local target_user="$2"
  local target_home="$3"
  local target_uid="$4"
  local target_gid="$5"
  local desktop="$6"

  disable_conflicting_imes "ibus" "$target_user" "$target_home" "$target_uid" "$target_gid" "$desktop"
  log "$(msg "[2/3] 입력 소스 및 ibus 엔진 캐시 등록 (Hangul)..." "[2/3] Registering Hangul input source and refreshing ibus cache...")"
  ibus write-cache --system 2>/dev/null || true
  local sources="[('xkb', 'us'), ('ibus', 'hangul')]"
  local preload="['xkb:us::eng', 'hangul']"
  if [[ -S "/run/user/$target_uid/bus" ]]; then
    local bus="unix:path=/run/user/$target_uid/bus"
    sudo -u "$target_user" XDG_RUNTIME_DIR="/run/user/$target_uid" DBUS_SESSION_BUS_ADDRESS="$bus" \
      gsettings set org.gnome.desktop.input-sources sources "$sources" 2>/dev/null || true
    sudo -u "$target_user" XDG_RUNTIME_DIR="/run/user/$target_uid" DBUS_SESSION_BUS_ADDRESS="$bus" \
      gsettings set org.freedesktop.ibus.general preload-engines "$preload" 2>/dev/null || true
    sudo -u "$target_user" XDG_RUNTIME_DIR="/run/user/$target_uid" DBUS_SESSION_BUS_ADDRESS="$bus" \
      ibus write-cache 2>/dev/null || true
    if command -v systemctl >/dev/null 2>&1; then
      sudo -u "$target_user" XDG_RUNTIME_DIR="/run/user/$target_uid" DBUS_SESSION_BUS_ADDRESS="$bus" \
        systemctl --user disable fcitx5 2>/dev/null || true
    fi
    if pgrep -u "$target_uid" -x ibus-daemon >/dev/null 2>&1; then
      sudo -u "$target_user" XDG_RUNTIME_DIR="/run/user/$target_uid" DBUS_SESSION_BUS_ADDRESS="$bus" \
        ibus restart 2>/dev/null || true
    fi
  else
    su - "$target_user" -c "gsettings set org.gnome.desktop.input-sources sources \"$sources\"" 2>/dev/null || true
    su - "$target_user" -c "gsettings set org.freedesktop.ibus.general preload-engines \"$preload\"" 2>/dev/null || true
    su - "$target_user" -c "ibus write-cache" 2>/dev/null || true
    su - "$target_user" -c "systemctl --user disable fcitx5 2>/dev/null || true" || true
  fi

  log "$(msg "[3/3] ibus 프레임워크 및 환경변수 설정..." "[3/3] Configuring ibus framework and environment variables...")"
  local ibus_env="$target_home/.config/environment.d/ibus.conf"
  mkdir -p "$(dirname "$ibus_env")"
  cat > "$ibus_env" <<'EOF'
GTK_IM_MODULE=ibus
QT_IM_MODULE=ibus
XMODIFIERS=@im=ibus
EOF
  chown -R "$target_uid:$target_gid" "$(dirname "$ibus_env")"

  case "$family" in
    debian-family|vanilla)
      if [[ "$family" == "debian-family" ]] && command -v im-config >/dev/null 2>&1; then
        su - "$target_user" -c "im-config -n ibus" 2>/dev/null || warn "$(msg "im-config -n ibus 실패 (필요시 수동 실행)" "im-config -n ibus failed (run manually if needed)")"
      fi
      append_profile_env "$target_home/.xsessionrc" "$target_uid" "$target_gid" "ibus"
      ;;
    fedora|opensuse|opensuse-transactional)
      if [[ -f /etc/X11/xinit/xinput.d/ibus.conf ]] && command -v alternatives >/dev/null 2>&1; then
        alternatives --set xinputrc /etc/X11/xinit/xinput.d/ibus.conf 2>/dev/null || true
      fi
      if [[ -S "/run/user/$target_uid/bus" ]] && command -v systemctl >/dev/null 2>&1; then
        sudo -u "$target_user" XDG_RUNTIME_DIR="/run/user/$target_uid" DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$target_uid/bus" \
          systemctl --user enable ibus 2>/dev/null || true
      else
        su - "$target_user" -c "systemctl --user enable ibus 2>/dev/null || true" || true
      fi
      local ibus_prof="$target_home/.bash_profile"
      [[ -f "$target_home/.profile" && ! -f "$ibus_prof" ]] && ibus_prof="$target_home/.profile"
      append_profile_env "$ibus_prof" "$target_uid" "$target_gid" "ibus"
      ;;
    rhel-family|fedora-atomic)
      local ibus_prof="$target_home/.bash_profile"
      [[ -f "$target_home/.profile" && ! -f "$ibus_prof" ]] && ibus_prof="$target_home/.profile"
      append_profile_env "$ibus_prof" "$target_uid" "$target_gid" "ibus"
      ;;
    arch-family|steamos|void|gentoo)
      append_profile_env "$target_home/.xprofile" "$target_uid" "$target_gid" "ibus"
      ;;
    solus)
      if ! grep -q "GTK_IM_MODULE=ibus" /etc/environment 2>/dev/null; then
        cat >> /etc/environment <<'EOF'

# ibus environment variables
GTK_IM_MODULE=ibus
QT_IM_MODULE=ibus
XMODIFIERS=@im=ibus
EOF
      fi
      ;;
  esac

  if [[ "$family" != "debian-family" && "$family" != "vanilla" && "$family" != "rhel-family" && ! "${desktop,,}" == *"gnome"* ]]; then
    local adir="$target_home/.config/autostart"
    mkdir -p "$adir"
    cat > "$adir/ibus-daemon.desktop" <<'EOF'
[Desktop Entry]
Type=Application
Name=IBus Daemon
Exec=ibus-daemon -drxR
NotShowIn=GNOME;
X-GNOME-Autostart-enabled=true
Hidden=false
NoDisplay=false
EOF
    chown -R "$target_uid:$target_gid" "$adir"
    ok "$(msg "비-GNOME 데스크톱용 ibus-daemon 자동시작 등록 (NotShowIn=GNOME;)" "Registered ibus-daemon autostart for non-GNOME (NotShowIn=GNOME;)")"
  fi
}

install_ibus_for_family() {
  local family="$1"
  case "$family" in
    debian-family)
      log "$(msg "[1/3] ibus-hangul 및 한글 폰트 패키지 설치 (apt-get)..." "[1/3] Installing ibus-hangul + Korean fonts (apt-get)...")"
      export DEBIAN_FRONTEND=noninteractive
      apt-get update -qq
      local deb_pkgs=(ibus ibus-hangul im-config fonts-noto-cjk)
      local opt_pkg
      for opt_pkg in ibus-gtk3 ibus-gtk4; do
        if apt-cache show "$opt_pkg" >/dev/null 2>&1; then
          deb_pkgs+=("$opt_pkg")
        fi
      done
      apt-get install -y -qq "${deb_pkgs[@]}"
      ;;
    vanilla)
      need_reboot=true
      log "$(msg "[1/3] ibus-hangul 및 한글 폰트 패키지 추가 (abroot)..." "[1/3] Adding ibus-hangul + Korean fonts (abroot)...")"
      abroot pkg add ibus ibus-hangul im-config fonts-noto-cjk
      ;;
    arch-family)
      log "$(msg "[1/3] ibus-hangul 및 한글 폰트 패키지 설치 (pacman)..." "[1/3] Installing ibus-hangul + Korean fonts (pacman)...")"
      pacman -Sy --needed --noconfirm ibus ibus-hangul noto-fonts-cjk
      ;;
    steamos)
      trap steamos_cleanup EXIT
      log "$(msg "[1/3] SteamOS 읽기 전용 해제 및 ibus-hangul 설치..." "[1/3] Disabling steamos-readonly and installing ibus-hangul + Korean fonts...")"
      steamos-readonly disable
      pacman-key --init
      pacman-key --populate archlinux holo 2>/dev/null || pacman-key --populate
      pacman -Sy --needed --noconfirm ibus ibus-hangul noto-fonts-cjk
      steamos-readonly enable
      ;;
    fedora)
      log "$(msg "[1/3] ibus-hangul 및 한글 폰트 패키지 설치 (dnf)..." "[1/3] Installing ibus-hangul + Korean fonts (dnf)...")"
      dnf install -y -q ibus ibus-hangul ibus-setup
      dnf install -y -q google-noto-sans-cjk-ttc-fonts 2>/dev/null || dnf install -y -q google-noto-cjk-fonts 2>/dev/null || true
      ;;
    fedora-atomic)
      need_reboot=true
      log "$(msg "[1/3] ibus-hangul 및 한글 폰트 패키지 레이어링 (rpm-ostree)..." "[1/3] Layering ibus-hangul + Korean fonts (rpm-ostree)...")"
      rpm-ostree install --idempotent --allow-inactive ibus ibus-hangul ibus-setup google-noto-sans-cjk-ttc-fonts
      ;;
    opensuse)
      log "$(msg "[1/3] ibus-hangul 및 한글 폰트 패키지 설치 (zypper)..." "[1/3] Installing ibus-hangul + Korean fonts (zypper)...")"
      zypper --non-interactive install -y ibus ibus-hangul
      zypper --non-interactive install -y google-noto-sans-cjk-fonts 2>/dev/null || true
      ;;
    opensuse-transactional)
      need_reboot=true
      log "$(msg "[1/3] ibus-hangul 및 한글 폰트 패키지 설치 (transactional-update)..." "[1/3] Installing ibus-hangul + Korean fonts (transactional-update)...")"
      transactional-update --non-interactive pkg install ibus ibus-hangul google-noto-sans-cjk-fonts
      ;;
    rhel-family)
      log "$(msg "[1/3] ibus-hangul 및 한글 폰트 패키지 설치 (dnf)..." "[1/3] Installing ibus-hangul + Korean fonts (dnf)...")"
      dnf install -y -q ibus-hangul ibus-setup
      dnf install -y -q google-noto-sans-cjk-ttc-fonts 2>/dev/null || dnf install -y -q google-noto-cjk-fonts 2>/dev/null || true
      ;;
    void)
      log "$(msg "[1/3] ibus-hangul 및 한글 폰트 패키지 설치 (xbps-install)..." "[1/3] Installing ibus-hangul + Korean fonts (xbps-install)...")"
      xbps-install -Sy ibus ibus-hangul noto-fonts-cjk
      ;;
    solus)
      log "$(msg "[1/3] ibus-hangul 패키지 설치 (eopkg)..." "[1/3] Installing ibus-hangul (eopkg)...")"
      eopkg install -y ibus ibus-hangul
      ;;
    gentoo)
      log "$(msg "[1/3] ibus-hangul 패키지 설치 (emerge)..." "[1/3] Installing ibus-hangul (emerge)...")"
      emerge --noreplace app-i18n/ibus app-i18n/ibus-hangul
      ;;
    *)
      err "$(msg "이 패밀리는 ibus 자동 설치를 지원하지 않습니다: $family" "Automatic ibus installation is not supported for family: $family")"
      ;;
  esac
  ok "$(msg "패키지 설치 완료" "Packages installed")"
}

main() {
  require_root

  local pretty_name="Unknown Linux"
  if [[ -f /etc/os-release ]]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    pretty_name="${PRETTY_NAME:-${NAME:-Unknown Linux}}"
  fi

  local FAMILY
  FAMILY=$(detect_family)

  if [[ "$FAMILY" == "rhel-family" ]]; then
    RECOMMENDED_IME="ibus"
  else
    RECOMMENDED_IME="fcitx5"
  fi

  if [[ "$FAMILY" == "rhel-family" && "$CLI_IME" == "fcitx5" ]]; then
    err "$(msg "RHEL 계열 공식 저장소는 fcitx5를 기본 제공하지 않아 ibus-hangul만 지원합니다." "RHEL family official repositories do not ship fcitx5; only ibus-hangul is supported.")"
  fi
  if [[ "$CLI_IME" == "ibus" ]] && ! family_supports_ibus "$FAMILY"; then
    err "$(msg "감지된 패밀리($FAMILY)는 ibus 자동 설치를 지원하지 않습니다. 기본 fcitx5를 사용하세요." "Automatic ibus installation is not supported for detected family ($FAMILY). Use the default fcitx5.")"
  fi

  SELECTED_IME="${CLI_IME:-$RECOMMENDED_IME}"
  if [[ "$FAMILY" != "rhel-family" ]] && family_supports_ibus "$FAMILY"; then
    CAN_SWITCH_IME="true"
  else
    CAN_SWITCH_IME="false"
  fi

  if [[ "$FAMILY" == "nixos" ]]; then
    echo
    echo "============================================================"
    if [[ "$IS_KO" == "true" ]]; then
      echo " ℹ️  NixOS는 선언적 OS이므로 스크립트로 패키지를 직접 설치하지 않습니다."
      echo " /etc/nixos/configuration.nix 에 아래 설정을 병합하세요:"
    else
      echo " ℹ️  NixOS uses declarative configuration. Merge the following into /etc/nixos/configuration.nix:"
    fi
    if [[ "$SELECTED_IME" == "ibus" ]]; then
      echo "   i18n.inputMethod.enable = true;"
      echo "   i18n.inputMethod.type = \"ibus\";"
      echo "   i18n.inputMethod.ibus.engines = with pkgs.ibus-engines; [ hangul ];"
      echo "   fonts.packages = with pkgs; [ noto-fonts-cjk ];"
    else
      echo "   i18n.inputMethod.enabled = \"fcitx5\";"
      echo "   i18n.inputMethod.fcitx5.enable = true;"
      echo "   i18n.inputMethod.fcitx5.engines = with pkgs; [ fcitx5-hangul ];"
      echo "   fonts.packages = with pkgs; [ noto-fonts-cjk ];"
    fi
    if [[ "$IS_KO" == "true" ]]; then
      [[ "$SELECTED_IME" == "fcitx5" ]] && echo " 💡 IBus 설정 예시를 보려면 '--ibus' 옵션을 전달하세요."
      echo " 상세 예시: https://github.com/stream9k/korean_input/tree/main/scripts/nixos"
      echo " 적용: sudo nixos-rebuild switch"
    else
      [[ "$SELECTED_IME" == "fcitx5" ]] && echo " 💡 Pass '--ibus' to print the IBus declarative snippet instead."
      echo " Examples: https://github.com/stream9k/korean_input/tree/main/scripts/nixos"
      echo " Apply: sudo nixos-rebuild switch"
    fi
    echo "============================================================"
    exit 0
  fi

  local TARGET_USER TARGET_HOME TARGET_UID TARGET_GID DESKTOP SESSION_TYPE EXISTING_IME MANDRIVA_PKG_MGR=""
  TARGET_USER=$(detect_user)
  TARGET_HOME=$(getent passwd "$TARGET_USER" 2>/dev/null | cut -d: -f6 || awk -F: -v u="$TARGET_USER" '$1==u {print $6}' /etc/passwd)
  TARGET_UID=$(id -u "$TARGET_USER")
  TARGET_GID=$(id -g "$TARGET_USER")
  DESKTOP=$(detect_desktop "$TARGET_USER")
  SESSION_TYPE=$(detect_session_type "$TARGET_USER" "$TARGET_UID")
  EXISTING_IME=$(detect_existing_ime "$TARGET_UID")
  if [[ "$FAMILY" == "mandriva-family" ]]; then
    MANDRIVA_PKG_MGR=$(detect_mandriva_pkg_mgr)
  fi

  print_preflight_summary_and_confirm \
    "$pretty_name" "$FAMILY" "$TARGET_USER" "$TARGET_UID" "$TARGET_HOME" \
    "$DESKTOP" "$SESSION_TYPE" "$EXISTING_IME" "$MANDRIVA_PKG_MGR"

  mkdir -p "$(dirname "$LOG_FILE")"
  LOG_ENABLED=true
  log "$(msg "=== 리눅스 한글 입력기 자동 감지 설치 시작 (v$SCRIPT_VERSION) ===" "=== Starting Linux Korean Input Method Auto-Installer (v$SCRIPT_VERSION) ===")"
  info "$(msg "감지된 배포판: $pretty_name" "Detected distro: $pretty_name")"
  info "$(msg "선택된 설치 패밀리: $FAMILY | 입력기: $SELECTED_IME" "Selected family: $FAMILY | IME: $SELECTED_IME")"
  info "$(msg "대상 사용자: $TARGET_USER (UID=$TARGET_UID, HOME=$TARGET_HOME)" "Target user: $TARGET_USER (UID=$TARGET_UID, HOME=$TARGET_HOME)")"
  info "$(msg "감지된 데스크톱/세션: $DESKTOP / $SESSION_TYPE" "Detected desktop/session: $DESKTOP / $SESSION_TYPE")"
  info "$(msg "기존 입력기: $EXISTING_IME" "Existing IME: $EXISTING_IME")"

  local need_reboot=false

  if [[ "$SELECTED_IME" == "ibus" ]]; then
    install_ibus_for_family "$FAMILY"
    configure_ibus_user_session "$FAMILY" "$TARGET_USER" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "$DESKTOP"
  else
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
      disable_conflicting_imes "fcitx5" "$TARGET_USER" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "$DESKTOP"

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
      disable_conflicting_imes "fcitx5" "$TARGET_USER" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "$DESKTOP"

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
      disable_conflicting_imes "fcitx5" "$TARGET_USER" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "$DESKTOP"

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
      disable_conflicting_imes "fcitx5" "$TARGET_USER" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "$DESKTOP"

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
      disable_conflicting_imes "fcitx5" "$TARGET_USER" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "$DESKTOP"

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
      disable_conflicting_imes "fcitx5" "$TARGET_USER" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "$DESKTOP"

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
      disable_conflicting_imes "fcitx5" "$TARGET_USER" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "$DESKTOP"

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
      disable_conflicting_imes "fcitx5" "$TARGET_USER" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "$DESKTOP"

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

    void)
      log "$(msg "[1/4] fcitx5 및 한글 폰트 패키지 설치 (xbps-install)..." "[1/4] Installing fcitx5 + Korean fonts (xbps-install)...")"
      xbps-install -Sy fcitx5 fcitx5-hangul fcitx5-gtk+3 fcitx5-gtk4 fcitx5-qt5 fcitx5-qt6 fcitx5-configtool noto-fonts-cjk
      disable_conflicting_imes "fcitx5" "$TARGET_USER" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "$DESKTOP"
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
      disable_conflicting_imes "fcitx5" "$TARGET_USER" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "$DESKTOP"
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
      disable_conflicting_imes "fcitx5" "$TARGET_USER" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "$DESKTOP"
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
      disable_conflicting_imes "fcitx5" "$TARGET_USER" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "$DESKTOP"
      log "$(msg "[2/4] 환경변수 설정..." "[2/4] Configuring environment variables...")"
      write_env_etc_and_envd "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      append_profile_env "$TARGET_HOME/.xprofile" "$TARGET_UID" "$TARGET_GID" "fcitx"
      log "$(msg "[3/4] Fcitx5 프로필·핫키 구성..." "[3/4] Configuring Fcitx5 profile and hotkeys...")"
      write_fcitx5_user_config "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      log "$(msg "[4/4] 자동시작 등록..." "[4/4] Registering autostart...")"
      write_autostart_fcitx5 "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID"
      ;;

    mandriva-family)
      log "$(msg "[1/4] fcitx5 패키지 설치 (Mandriva 계열: $MANDRIVA_PKG_MGR)..." "[1/4] Installing fcitx5 (Mandriva family: $MANDRIVA_PKG_MGR)...")"
      case "$MANDRIVA_PKG_MGR" in
        dnf)
          dnf install -y fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool ;;
        urpmi)
          urpmi --auto fcitx5 fcitx5-hangul fcitx5-gtk fcitx5-qt fcitx5-configtool ;;
        apt-get)
          apt-get update && apt-get install -y fcitx5 fcitx5-hangul fcitx5-configtool ;;
      esac
      disable_conflicting_imes "fcitx5" "$TARGET_USER" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "$DESKTOP"
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
      disable_conflicting_imes "fcitx5" "$TARGET_USER" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "$DESKTOP"
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
      disable_conflicting_imes "fcitx5" "$TARGET_USER" "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "$DESKTOP"
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
  fi

  # KDE Plasma 가상 키보드(Fcitx 5) 자동 설정 (IBus 제외)
  if [[ "$SELECTED_IME" != "ibus" ]]; then
    configure_kde_virtual_keyboard "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "$TARGET_USER" "$DESKTOP"
  fi

  # 재부팅/재로그인 후 1회성 안내 팝업 자동시작 등록
  register_first_login_guide "$TARGET_HOME" "$TARGET_UID" "$TARGET_GID" "$IS_KO" "$SELECTED_IME" "$DESKTOP"

  echo
  echo "============================================================"
  if [[ "$IS_KO" == "true" ]]; then
    echo " 🎉 한글 입력기 및 한글 폰트 설치 완료! ($pretty_name / $FAMILY / $SELECTED_IME)"
    if [[ "$need_reboot" == "true" ]]; then
      echo " ⚠️  불변 OS 감지: 변경 사항 적용을 위해 반드시 재부팅하세요 (systemctl reboot)."
    else
      echo " 👉 로그아웃 후 다시 로그인(또는 재부팅)하면 적용됩니다."
    fi
    if [[ "$SELECTED_IME" == "ibus" ]]; then
      echo " ⌨️  전환: Super+Space 또는 한/영 키 | 세부 설정: ibus-setup"
    else
      if [[ "$DESKTOP" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]]; then
        echo " 🖥️  KDE Plasma 가상 키보드(Fcitx 5) 자동 설정 완료 (미적용 시: 시스템 설정 → 입력 장치 → 가상 키보드 확인)"
      fi
      echo " ⌨️  전환: 한/영 키, Ctrl+Space, Shift+Space"
      echo " 💡 영문 키보드 사용 시: fcitx5-configtool 에서 오른쪽 Alt(Alt_R)를 전환키로 추가할 수 있습니다."
      echo "    (Firefox 메뉴바와 충돌 시: 설정 → 키보드 → 키바인딩 → 키보드 옵션에서 '오른쪽 ALT를 한/영키로 만들기' 체크)"
      echo " ⚙️  설정: fcitx5-configtool | 진단: fcitx5-diagnose"
    fi
    echo " 📝 로그: $LOG_FILE"
  else
    echo " 🎉 Korean Input Method & Noto CJK Fonts Installed! ($pretty_name / $FAMILY / $SELECTED_IME)"
    if [[ "$need_reboot" == "true" ]]; then
      echo " ⚠️  Immutable OS detected: REBOOT required to apply changes (systemctl reboot)."
    else
      echo " 👉 Please log out and log back in (or reboot) to activate."
    fi
    if [[ "$SELECTED_IME" == "ibus" ]]; then
      echo " ⌨️  Toggle: Super+Space or Hangul key | Config: ibus-setup"
    else
      if [[ "$DESKTOP" =~ [Kk][Dd][Ee]|[Pp][Ll][Aa][Ss][Mm][Aa] ]]; then
        echo " 🖥️  KDE Plasma Virtual Keyboard (Fcitx 5) auto-configured (if inactive, check System Settings -> Input Devices -> Virtual Keyboard)"
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
