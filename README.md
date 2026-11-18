# 리눅스 한글 입력기 자동 설치 스크립트 (`fcitx5-hangul` / `kime`)

리눅스를 처음 설치한 뒤 복잡한 한글 입력기 설정 때문에 고생하고 계신가요?  
이 프로젝트는 사용 중인 **리눅스 배포판과 데스크톱 환경(Cinnamon, GNOME, KDE Plasma, Xfce 등)을 선택**하면, 해당 환경에 맞는 **`fcitx5-hangul` 또는 `kime` 자동 설치 스크립트**를 바로 생성하고 실행할 수 있는 도구입니다.

> 🔧 **프로젝트 운영·개발 로드맵 및 아키텍처 문서**는 [PROJECT_HANGUL_INSTALLER.md](PROJECT_HANGUL_INSTALLER.md)를 참고하세요. 이 문서는 **신규 사용자 안내서**입니다.

---

## 📌 이 도구가 자동으로 처리해 주는 작업

배포판별로 차이가 있지만, 일반적으로 아래 과정을 한 번에 자동으로 구성합니다.

1. **충돌 입력기 정리**: 구버전 `fcitx`(fcitx4) 잔여 패키지 제거 또는 기본 `ibus` 자동실행 충돌 방지
2. **입력기 풀스택 설치**: `fcitx5`, `fcitx5-hangul`, GTK3/GTK4, Qt5/Qt6 프론트엔드 및 `fcitx5-configtool` 설치
3. **시스템 입력 프레임워크 전환**: 배포판에 맞게 `im-config`(Debian/Ubuntu 계열), `alternatives`(Fedora/openSUSE) 또는 환경변수 적용
4. **기본 키보드·단축키 사전 설정**: 영문(`keyboard-us`) + 한글(`hangul`) 프로필과 전환키(`한/영`, `Ctrl+Space`, `Shift+Space`) 자동 작성
5. **데스크톱 단축키 충돌 해제**: Cinnamon, GNOME, Xfce, MATE의 기본 `Super+Space` 등 입력 소스 전환 충돌 해제 (`gsettings`)
6. **X11 / Wayland 환경변수 구성**: `~/.config/environment.d/fcitx5.conf`, `/etc/environment`, 또는 `~/.bash_profile` 설정
7. **자동시작 등록**: 로그인 시 `fcitx5`가 자동으로 실행되도록 `~/.config/autostart/`(및 필요한 경우 `systemd --user`) 등록

---

## 🚀 빠른 시작 (Quick Start)

본인에게 가장 편한 방법 한 가지를 선택해 진행하세요.

### 방법 1: 웹 생성기(`index.html`)로 내 환경 맞춤 스크립트 만들기 (가장 추천)

- **온라인 웹 생성기**: `https://stream9k.github.io/korean_input_method_installer/` *(GitHub Pages 배포 후 접속)*
- **오프라인 / 로컬 실행**: 이 저장소의 [`index.html`](index.html) 파일을 웹 브라우저로 직접 열면 인터넷 없이도 스크립트를 바로 생성·복사·다운로드할 수 있습니다.

1. **배포판**을 선택합니다. (예: `Linux Mint`, `Ubuntu`, `Fedora`, `Arch Linux` 등)
2. **에디션 / 데스크톱**을 선택합니다. (예: `Cinnamon`, `GNOME`, `KDE Plasma`, `Xfce` 등)
3. 화면에 표시된 **원라인 설치 명령어**를 복사해 터미널에 붙여넣거나, `.sh` 파일을 다운로드해 실행합니다.

---

### 방법 2: 주요 배포판 터미널 원라인 설치 (한 줄 복사 & 실행)

터미널(`Ctrl + Alt + T`)을 열고 본인의 배포판과 데스크톱 환경에 맞는 명령어 한 줄을 붙여넣은 뒤, 비밀번호(sudo)를 입력하면 설치가 진행됩니다.

> ⚠️ **안내**: 원라인 명령어는 GitHub 저장소(`stream9k/korean_input_method_installer`)에 파일이 업로드되어 있을 때 동작합니다. 아직 저장소를 클론해서 로컬로 쓰시려면 아래 **방법 3**을 이용하세요.

| 배포판 | 데스크톱 / 에디션 | 원라인 설치 명령어 |
|---|---|---|
| **Linux Mint** | Cinnamon (기본) | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input_method_installer/main/scripts/debian-family/mint-cinnamon.sh \| sudo bash` |
| **Linux Mint** | Xfce | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input_method_installer/main/scripts/debian-family/mint-xfce.sh \| sudo bash` |
| **Linux Mint** | MATE | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input_method_installer/main/scripts/debian-family/mint-mate.sh \| sudo bash` |
| **Ubuntu** | GNOME (기본) | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input_method_installer/main/scripts/debian-family/ubuntu-gnome.sh \| sudo bash` |
| **Kubuntu** | KDE Plasma | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input_method_installer/main/scripts/debian-family/ubuntu-kde.sh \| sudo bash` |
| **Debian** | GNOME (기본) | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input_method_installer/main/scripts/debian-family/debian-gnome.sh \| sudo bash` |
| **Fedora** | KDE Plasma | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input_method_installer/main/scripts/fedora/fedora-kde.sh \| sudo bash` |
| **Fedora** | GNOME (Workstation) | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input_method_installer/main/scripts/fedora/fedora-gnome.sh \| sudo bash` |
| **Arch Linux** | Base | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input_method_installer/main/scripts/arch-family/arch-base.sh \| sudo bash` |
| **Manjaro** | KDE Plasma | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input_method_installer/main/scripts/arch-family/manjaro-kde.sh \| sudo bash` |
| **openSUSE** | Tumbleweed KDE | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input_method_installer/main/scripts/opensuse/opensuse-tumbleweed-kde.sh \| sudo bash` |

---

### 방법 3: 저장소 다운로드 후 로컬에서 직접 실행

인터넷에서 바로 파이프(`| sudo bash`)로 실행하기보다 스크립트 내용을 먼저 읽어보고 직접 실행하고 싶다면 아래처럼 진행하세요.

```bash
# 1. 저장소 클론
git clone https://github.com/stream9k/korean_input_method_installer.git
cd korean_input_method_installer

# 2. 실행할 스크립트 내용 확인 (예: Linux Mint Cinnamon)
less scripts/debian-family/mint-cinnamon.sh

# 3. 스크립트 실행
sudo bash scripts/debian-family/mint-cinnamon.sh
```

> 💡 **Linux Mint 사용자 참고**: 백업 기능(`BACKUP_DIR`)이 포함된 통합 PoC 스크립트 [`install-hangul-mint.sh`](install-hangul-mint.sh)를 직접 실행할 수도 있습니다.
> ```bash
> sudo bash install-hangul-mint.sh
> ```

---

## 🧭 초보자 가이드: 내 리눅스 환경 확인하는 법

내가 어떤 배포판과 데스크톱 환경을 쓰고 있는지 잘 모르겠다면 아래 순서대로 확인해 보세요.

1. **터미널 열기**: 바탕화면이나 아무 창에서 `Ctrl + Alt + T` 단축키를 누르거나, 앱 메뉴에서 `터미널(Terminal)` / `Konsole`을 실행합니다.
2. **배포판 확인**:
   ```bash
   cat /etc/os-release
   ```
   `NAME=` 또는 `PRETTY_NAME=` 줄에서 배포판 이름과 버전을 확인할 수 있습니다. (예: `"Linux Mint 22"`, `"Ubuntu 24.04 LTS"`, `"Fedora Linux 41"`)
3. **데스크톱 환경(DE) 확인**:
   ```bash
   echo $XDG_CURRENT_DESKTOP
   ```
   출력 예시: `X-Cinnamon`, `ubuntu:GNOME`, `KDE`, `XFCE`, `MATE`, `Hyprland` 등
4. **세션 종류(X11 / Wayland) 확인**:
   ```bash
   echo $XDG_SESSION_TYPE
   ```
   `wayland` 또는 `x11`이 출력됩니다. (문제가 발생해 질문할 때 이 정보를 함께 알려주시면 원인 파악이 빠릅니다.)

---

## ✅ 설치 후 필수 확인 사항 & 한/영 전환 방법

### 1. 반드시 **로그아웃 후 다시 로그인** (또는 재부팅) 하세요
입력기 프레임워크와 환경변수는 새 데스크톱 세션을 시작할 때 적용됩니다. 설치 직후 바로 한글이 입력되지 않는 것은 정상이며, **재로그인 또는 재부팅** 후 정상 동작합니다.

### 2. 기본 한/영 전환 단축키
스크립트는 아래 3가지 전환 키를 미리 등록합니다. 키보드에 맞는 키를 눌러 전환해 보세요.

- `한/영` 키 (`Hangul`)
- `Ctrl + Space`
- `Shift + Space`

세부 설정(자판 종류: 두벌식/세벌식, 테마, 추가 단축키 등)을 변경하려면 터미널이나 앱 메뉴에서 **`fcitx5-configtool`**을 실행하세요.

### 3. KDE Plasma 사용자 필수 추가 설정
Fedora KDE, Kubuntu, Manjaro KDE, openSUSE KDE 등 **KDE Plasma (특히 Wayland 세션)**를 사용하는 경우, 설치 후 재로그인 전에 또는 직후에 아래 설정을 한 번 지정해 주세요.

1. **시스템 설정(System Settings)** 열기
2. **입력 장치(Input Devices)** → **가상 키보드(Virtual Keyboard)** 이동
3. **Fcitx 5** (kime 사용 시 **Kime**) 선택 후 적용
4. 로그아웃 후 재로그인

### 4. NixOS 사용자 적용 방법
NixOS는 명령형 설치 스크립트(`.sh`)가 아닌 선언형 설정 조각(`.nix`)을 제공합니다.

1. `scripts/nixos/` 폴더에서 본인의 환경에 맞는 `.nix` 파일(예: `scripts/nixos/nixos-gnome.nix`)을 확인합니다.
2. 해당 블록을 `/etc/nixos/configuration.nix`에 병합합니다.
3. 아래 명령어로 시스템을 재빌드하고 재로그인합니다.
   ```bash
   sudo nixos-rebuild switch
   ```

---

## 📋 지원 배포판 및 에디션 전체 목록

이 저장소는 총 15개 리눅스 배포판(55개 이상 에디션 변형)과 대안 입력기 `kime`을 지원하며, `scripts/` 폴더 아래에 **76개의 생성된 스크립트/설정 파일**이 준비되어 있습니다.

### 1. Debian / Ubuntu 계열 (`scripts/debian-family/`, 29개)
- **Linux Mint**: `mint-cinnamon.sh`, `mint-xfce.sh`, `mint-mate.sh`, `mint-edge.sh`
- **LMDE**: `lmde-cinnamon.sh`
- **Ubuntu**: `ubuntu-gnome.sh`, `ubuntu-kde.sh`, `ubuntu-xfce.sh`, `ubuntu-mate.sh`, `ubuntu-budgie.sh`, `ubuntu-cinnamon.sh`, `ubuntu-lxqt.sh`, `ubuntu-studio.sh`
- **Debian**: `debian-gnome.sh`, `debian-kde.sh`, `debian-xfce.sh`, `debian-mate.sh`, `debian-cinnamon.sh`, `debian-lxqt.sh`
- **Pop!_OS**: `pop-gnome.sh`, `pop-nvidia.sh`
- **elementary OS**: `elementary-pantheon.sh`
- **Zorin OS**: `zorin-core.sh`, `zorin-pro.sh`, `zorin-lite.sh`, `zorin-education.sh`
- **KDE Neon**: `kde-neon-user.sh`, `kde-neon-testing.sh`, `kde-neon-unstable.sh`

### 2. Fedora 계열 (`scripts/fedora/`, 8개)
- `fedora-kde.sh`, `fedora-gnome.sh`, `fedora-xfce.sh`, `fedora-mate.sh`, `fedora-cinnamon.sh`, `fedora-lxqt.sh`, `fedora-i3.sh`, `fedora-sway.sh`

### 3. Arch 계열 (`scripts/arch-family/`, 24개)
- **Arch Linux**: `arch-base.sh`, `arch-endeavour.sh`, `arch-manjaro.sh`, `arch-garuda.sh`, `arch-cachyos.sh`
- **Manjaro**: `manjaro-kde.sh`, `manjaro-gnome.sh`, `manjaro-xfce.sh`, `manjaro-cinnamon.sh`, `manjaro-mate.sh`, `manjaro-i3.sh`, `manjaro-sway.sh`
- **EndeavourOS**: `endeavour-kde.sh`, `endeavour-gnome.sh`, `endeavour-xfce.sh`, `endeavour-i3wm.sh`, `endeavour-sway.sh`, `endeavour-bspwm.sh`
- **Garuda Linux**: `garuda-kde.sh`, `garuda-gnome.sh`, `garuda-xfce.sh`, `garuda-wayfire.sh`, `garuda-hyprland.sh`, `garuda-qtile.sh`

### 4. openSUSE 계열 (`scripts/opensuse/`, 6개)
- `opensuse-tumbleweed-kde.sh`, `opensuse-tumbleweed-gnome.sh`, `opensuse-leap-kde.sh`, `opensuse-leap-gnome.sh`, `opensuse-microos.sh`, `opensuse-slowroll.sh`

### 5. NixOS (`scripts/nixos/`, 5개)
- `nixos-gnome.nix`, `nixos-kde.nix`, `nixos-hyprland.nix`, `nixos-sway.nix`, `nixos-minimal.nix`

### 6. kime 대안 입력기 (`scripts/kime/`, 4개)
Rust 기반의 경량·Wayland 친화적인 한글 입력기 `kime`을 설치하고 싶다면 아래 스크립트를 사용하세요.
- `kime-debian.sh` (Debian / Ubuntu / Linux Mint 등 `.deb` 기반)
- `kime-fedora.sh` (Fedora COPR 기반)
- `kime-arch.sh` (Arch / Manjaro / EndeavourOS AUR 헬퍼 `yay`/`paru` 필요)
- `kime-opensuse.sh` (openSUSE `zypper` 기반)

---

## ❓ 자주 묻는 질문 & 문제 해결 (FAQ / Troubleshooting)

### Q1. 설치하고 재로그인까지 했는데 한/영 전환이 안 됩니다.
터미널에서 아래 명령어를 순서대로 입력해 상태를 진단해 보세요.

```bash
# 1. fcitx5 프로세스가 실행 중인지 확인
pgrep -af fcitx5

# 2. 실행 중이 아니라면 재시작
fcitx5 -r -d

# 3. 환경변수 확인 (fcitx 가 출력되어야 함)
env | grep -i -E "im_module|xmodifiers"

# 4. 상세 진단 도구 실행 (경고/에러 메시지 확인)
fcitx5-diagnose
```

### Q2. 노트북이나 일반 키보드에서 `한/영` 키를 눌러도 전환이 안 됩니다 (`Alt_R`로 인식됨).
일부 한국어 배열이 아닌 키보드에서는 오른쪽 `Alt` 키가 `Hangul` 키코드 대신 `Alt_R`로 동작합니다.

1. 터미널에서 `fcitx5-configtool`을 실행합니다.
2. 상단 **전역 옵션(Global Options)** 탭으로 이동합니다.
3. **입력기 전환(Trigger Input Method)** 항목을 클릭한 뒤, 실제로 누르고 싶은 **한/영 키(또는 오른쪽 Alt)**를 눌러 단축키를 추가합니다.
4. 우측 하단 **적용(Apply)**을 누릅니다.

### Q3. 특정 앱(크롬/일렉트론/Flatpak 앱 등)에서만 한글이 입력되지 않습니다.
- **Chrome / Chromium / VS Code / Slack 등 Electron 앱(Wayland 환경)**: 앱 실행 옵션에 `--enable-wayland-ime` 플래그가 필요할 수 있습니다. (예: `~/.config/code-flags.conf` 또는 `~/.config/chrome-flags.conf`에 `--enable-wayland-ime` 추가)
- **Flatpak 앱**: Flatpak 권한에 Wayland/X11 소켓 및 D-Bus 접근 권한이 제한된 경우 `Flatseal` 등으로 입력기 D-Bus(`org.freedesktop.portal.Fcitx` 등) 접근을 허용해 보세요.

### Q4. 설치 과정에서 오류가 났습니다. 로그는 어디서 보나요?
모든 스크립트는 실행 로그를 `/var/log/` 아래에 저장합니다.

```bash
# fcitx5 설치 로그 확인
ls -l /var/log/install-hangul-*.log
sudo cat /var/log/install-hangul-*.log

# kime 설치 로그 확인
ls -l /var/log/install-kime-*.log
```

`install-hangul-mint.sh`를 실행한 경우, 기존 설정 백업은 `/root/hangul-setup-backup-*` 디렉터리에 보관됩니다.

### Q5. `fcitx5`와 `kime` 중 어떤 것을 쓰면 좋을까요?
- **`fcitx5-hangul` (기본 추천)**: 거의 모든 리눅스 배포판 공식 저장소에서 안정적으로 지원하며, 다양한 데스크톱 환경과 앱 호환성이 검증되어 있습니다.
- **`kime`**: Rust로 작성된 한국어 전용 입력기로 빠르고 가벼우며 Wayland 지원이 깔끔하지만, 배포판별 패키지 제공 방식(AUR/COPR/릴리스 바이너리)에 따라 설치 환경 차이가 있을 수 있습니다.

---

## 🤝 기여 및 참고 프로젝트

### 기존 자동화 프로젝트 및 참고 출처
이 프로젝트들의 패키지 구성·설정 순서·예외 처리 로직을 참고해 템플릿을 만들었습니다.

| 프로젝트 | 용도 | 라이선스 | 출처 |
|---|---|---|---|
| `linuxmint-fcitx5-cjk-fix` | Linux Mint Cinnamon fcitx5 완전 마이그레이션 (가장 완성도 높음) | MIT | https://github.com/kylechoidev/linuxmint-fcitx5-cjk-fix |
| `linux-hangul-input-setup` | LMDE 7 / 데비안 계열 fcitx5 설치 스크립트 모음 | MIT | https://github.com/ppugend/linux-hangul-input-setup |
| `fedora42-fcitx5-guide` | Fedora 42 KDE Plasma fcitx5 설정 가이드 + install-fcitx5.sh | MIT | https://github.com/StrKare/fedora42-fcitx5-guide |
| `Hangul-fixer` | 크로스 디스트로 치트시트 + kime 대안 소개 | MIT | https://github.com/kernalix7/Hangul-fixer |
| `ArchWiki Localization/Korean` | fcitx5-hangul 공식 설정 문서 (환경변수, 프로필, 핫키) | CC BY-SA 4.0 | https://wiki.archlinux.org/title/Localization/Korean |
| `Fedora Wiki I18N/Fcitx5` | Fedora 공식 패키지 목록 및 alternatives 설정 방식 | CC BY-SA 4.0 | https://fedoraproject.org/wiki/I18N/Fcitx5 |
| `Omarchy PR #11719` | omarchy-setup-input-hangul - D-Bus로 fcitx5 엔진 동적 추가 방식 | MIT | https://github.com/omacom/omarchy/pull/11719 |

### 스크립트 재생성 (개발자용)
[`index.html`](index.html)의 템플릿을 수정한 뒤에는 아래 명령어로 `scripts/` 하위 모든 스크립트를 일괄 재생성할 수 있습니다.

```bash
node generate_scripts.js
```

### 라이선스
이 프로젝트는 **MIT License**를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 확인하세요.
