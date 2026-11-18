#!/usr/bin/env bash
# Linux Mint 한글 입력기(fcitx5-hangul) 완전 자동 설치 스크립트
# 대상: Linux Mint 21.x/22.x (Cinnamon, Xfce, MATE), LMDE 6/7
# 실행: curl -sL https://raw.githubusercontent.com/.../install-hangul-mint.sh | sudo bash
#       또는: sudo bash install-hangul-mint.sh

set -euo pipefail

# ──────────────────────────────────────────────────────────────
# 설정값 (필요시 수정)
# ──────────────────────────────────────────────────────────────
SCRIPT_VERSION="1.0.0"
LOG_FILE="/var/log/install-hangul-mint.log"
BACKUP_DIR="/root/hangul-setup-backup-$(date +%Y%m%d-%H%M%S)"

# ──────────────────────────────────────────────────────────────
# 유틸리티 함수
# ──────────────────────────────────────────────────────────────
log() { echo "[$(date '+%F %T')] $*" | tee -a "$LOG_FILE"; }
err() { log "❌ $*"; exit 1; }
warn() { log "⚠️  $*"; }
ok() { log "✅ $*"; }
info() { log "ℹ️  $*"; }

require_root() {
    [[ $EUID -eq 0 ]] || err "root 권한 필요: sudo bash $0"
}

detect_target_user() {
    local user="${SUDO_USER:-}"
    [[ -n "$user" && "$user" != "root" ]] && { echo "$user"; return; }
    user=$(logname 2>/dev/null || true)
    [[ -n "$user" && "$user" != "root" ]] && { echo "$user"; return; }
    user=$(who | awk '{print $1}' | head -1)
    [[ -n "$user" && "$user" != "root" ]] && { echo "$user"; return; }
    err "대상 데스크톱 사용자 자동 탐지 실패. SUDO_USER 환경변수로 실행하세요."
}

detect_desktop() {
    local user="$1"
    local desktop="${XDG_CURRENT_DESKTOP:-}"
    [[ -n "$desktop" ]] && { echo "$desktop"; return; }
    desktop=$(su - "$user" -c 'echo ${XDG_CURRENT_DESKTOP:-}' 2>/dev/null || true)
    [[ -n "$desktop" ]] && { echo "$desktop"; return; }
    desktop=$(su - "$user" -c 'echo ${DESKTOP_SESSION:-}' 2>/dev/null || true)
    [[ -n "$desktop" ]] && { echo "$desktop"; return; }
    echo "unknown"
}

backup_file() {
    local src="$1"
    [[ -f "$src" ]] || return 0
    mkdir -p "$BACKUP_DIR"
    cp -a "$src" "$BACKUP_DIR/$(basename "$src").bak"
    info "백업: $src → $BACKUP_DIR/"
}

# ──────────────────────────────────────────────────────────────
# 메인 로직
# ──────────────────────────────────────────────────────────────
main() {
    require_root
    mkdir -p "$(dirname "$LOG_FILE")"
    log "=== Linux Mint 한글 입력기 자동 설치 시작 (v$SCRIPT_VERSION) ==="

    local TARGET_USER
    TARGET_USER=$(detect_target_user)
    local TARGET_HOME
    TARGET_HOME=$(getent passwd "$TARGET_USER" | cut -d: -f6)
    local TARGET_UID
    TARGET_UID=$(id -u "$TARGET_USER")
    local DESKTOP
    DESKTOP=$(detect_desktop "$TARGET_USER")

    info "대상 사용자: $TARGET_USER (UID=$TARGET_UID, HOME=$TARGET_HOME)"
    info "감지된 데스크톱: $DESKTOP"

    # 1. 시스템 업데이트 & 레거시 fcitx4 완전 제거
    log "[1/7] 패키지 인덱스 업데이트 및 레거시 fcitx4 제거..."
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get purge -y -qq \
        fcitx fcitx-bin fcitx-data fcitx-hangul fcitx-config-gtk \
        fcitx-frontend-all fcitx-frontend-gtk2 fcitx-frontend-gtk3 fcitx-frontend-qt5 \
        2>/dev/null || true
    apt-get autoremove --purge -y -qq
    ok "레거시 패키지 정리 완료"

    # 2. fcitx5 + 한글 엔진 + 툴킷 프론트엔드 설치
    log "[2/7] fcitx5 스택 및 한글 엔진 설치..."
    apt-get install -y -qq \
        fcitx5 \
        fcitx5-hangul \
        fcitx5-frontend-gtk3 \
        fcitx5-frontend-gtk4 \
        fcitx5-frontend-qt5 \
        fcitx5-frontend-qt6 \
        fcitx5-config-qt \
        fcitx5-configtool
    ok "패키지 설치 완료"

    # 3. 입력 프레임워크를 fcitx5로 전환 (im-config)
    log "[3/7] 시스템 입력 프레임워크를 fcitx5로 설정..."
    su - "$TARGET_USER" -c "im-config -n fcitx5" 2>/dev/null || \
        warn "im-config 전환 실패(수동으로 'im-config' 실행 후 fcitx5 선택 필요)"
    ok "입력 프레임워크 설정 완료"

    # 4. Fcitx5 프로필·핫키 선작성 (키보드-US + Hangul, 한/영키·Ctrl+Space·Shift+Space)
    log "[4/7] Fcitx5 프로필 및 핫키 사전 구성..."
    local FCITX5_DIR="$TARGET_HOME/.config/fcitx5"
    mkdir -p "$FCITX5_DIR"

    # profile
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

    # config (핫키)
    cat > "$FCITX5_DIR/config" <<'EOF'
[Hotkey]
EnumerateWithTriggerKeys=True
SkipFirst=False
[Hotkey/TriggerKeys]
0=Hangul
1=Control+space
2=Shift+space
EOF

    chown -R "$TARGET_USER:$TARGET_USER" "$FCITX5_DIR"
    ok "Fcitx5 설정 파일 생성 완료"

    # 5. 데스크톱별 단축키 충돌 해제 (Super+Space 등)
    log "[5/7] 데스크톱 단축키 충돌 해제 ($DESKTOP)..."
    local gsettings_cmd=()
    case "$DESKTOP" in
        *CINNAMON*|*cinnamon*)
            gsettings_cmd=(
                "org.cinnamon.desktop.keybindings.wm switch-input-source []"
                "org.cinnamon.desktop.keybindings.wm switch-input-source-backward []"
                "org.gnome.desktop.wm.keybindings switch-input-source []"
                "org.gnome.desktop.wm.keybindings switch-input-source-backward []"
            )
            ;;
        *XFCE*|*xfce*)
            gsettings_cmd=(
                "org.xfce.keyboard-shortcuts.commands.custom '<Super>space' ''"
                "org.xfce.keyboard-shortcuts.commands.custom '<Shift><Super>space' ''"
            )
            ;;
        *MATE*|*mate*)
            gsettings_cmd=(
                "org.mate.Marco.global-keybindings switch-input-source ''"
                "org.mate.Marco.global-keybindings switch-input-source-backward ''"
                "org.gnome.desktop.wm.keybindings switch-input-source []"
                "org.gnome.desktop.wm.keybindings switch-input-source-backward []"
            )
            ;;
        *)
            # GNOME/기타 fallback
            gsettings_cmd=(
                "org.gnome.desktop.wm.keybindings switch-input-source []"
                "org.gnome.desktop.wm.keybindings switch-input-source-backward []"
            )
            ;;
    esac

    if [ -S "/run/user/$TARGET_UID/bus" ]; then
        local bus="unix:path=/run/user/$TARGET_UID/bus"
        for cmd in "${gsettings_cmd[@]}"; do
            sudo -u "$TARGET_USER" DBUS_SESSION_BUS_ADDRESS="$bus" gsettings set $cmd 2>/dev/null || true
        done
    else
        for cmd in "${gsettings_cmd[@]}"; do
            su - "$TARGET_USER" -c "gsettings set $cmd 2>/dev/null || true"
        done
    fi
    ok "단축키 충돌 해제 완료"

    # 6. Wayland 세션용 환경변수 (systemd user 환경)
    log "[6/7] Wayland 세션용 환경변수 설정..."
    local ENV_FILE="$TARGET_HOME/.config/environment.d/fcitx5.conf"
    mkdir -p "$(dirname "$ENV_FILE")"
    cat > "$ENV_FILE" <<'EOF'
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
EOF
    chown -R "$TARGET_USER:$TARGET_USER" "$(dirname "$ENV_FILE")"
    ok "환경변수 파일 생성: $ENV_FILE"

    # 7. 자동시작 엔트리 (X11/Wayland 공통)
    log "[7/7] 자동시작 등록..."
    local AUTOSTART_DIR="$TARGET_HOME/.config/autostart"
    mkdir -p "$AUTOSTART_DIR"
    cat > "$AUTOSTART_DIR/fcitx5.desktop" <<'EOF'
[Desktop Entry]
Type=Application
Name=Fcitx 5
Exec=fcitx5 -d
X-GNOME-Autostart-enabled=true
Hidden=false
NoDisplay=false
EOF
    chown -R "$TARGET_USER:$TARGET_USER" "$AUTOSTART_DIR"
    ok "자동시작 등록 완료"

    # ──────────────────────────────────────────────────────────────
    # 완료 안내
    # ──────────────────────────────────────────────────────────────
    echo
    echo "============================================================"
    echo " 🎉 한글 입력기 설치 완료!"
    echo "============================================================"
    echo " 다음 단계:"
    echo "  1) 로그아웃 후 다시 로그인 (또는 재부팅)"
    echo "  2) 한/영 키, Ctrl+Space, Shift+Space 로 전환 확인"
    echo "  3) 필요시: fcitx5-configtool 로 세부 설정 조정"
    echo
    echo " 설치 로그: $LOG_FILE"
    echo " 백업 디렉터리: $BACKUP_DIR"
    echo "============================================================"
}

main "$@"