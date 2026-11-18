# 리눅스 한글 입력기 자동 설치 스크립트 (`fcitx5-hangul` / `kime`)

🌐 **🇰🇷 한국어** | [🇺🇸 English Guide Below ↓](#english-guide) | [English Docs (README.en.md)](README.en.md) | [웹 생성기 (한/영 자동 인식)](https://stream9k.github.io/korean_input/) | [English Web Page](https://stream9k.github.io/korean_input/index-en.html)

리눅스를 처음 설치한 뒤 복잡한 한글 입력기 설정 때문에 고생하고 계신가요?  
이 프로젝트는 사용 중인 **리눅스 배포판과 데스크톱 환경(Cinnamon, GNOME, KDE Plasma, Xfce 등)을 선택**하면, 해당 환경에 맞는 **`fcitx5-hangul` 또는 `kime` 자동 설치 스크립트**를 바로 생성하고 실행할 수 있는 도구입니다.

> 🔧 **프로젝트 운영·개발 로드맵 및 아키텍처 문서**는 [PROJECT_HANGUL_INSTALLER.md](PROJECT_HANGUL_INSTALLER.md)를 참고하세요. 이 문서는 **신규 사용자 안내서**입니다.

---

## ⚡ 10초 요약: 가장 간단한 설치법

`git` 설치도, 실행 권한(`chmod +x`) 변경도, 배포판을 고를 필요도 없습니다.

1. 터미널(`Ctrl + Alt + T`)을 엽니다.
2. 아래 **한 줄**을 복사해 붙여넣고 `Enter` → 비밀번호를 입력합니다.
   ```bash
   curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input/main/install.sh | sudo bash
   ```
3. 설치가 끝나면 **로그아웃 후 다시 로그인(또는 재부팅)** 한 뒤 `한/영` 키나 `Ctrl+Space`로 한글 입력을 시작하세요!
   - *(KDE Plasma 사용자는 재로그인 전/후 `시스템 설정 → 입력 장치 → 가상 키보드 → Fcitx 5` 선택 필요)*
   - *(웹에서 배포판을 직접 고르고 싶다면 [웹 생성기](https://stream9k.github.io/korean_input/)를 열어보세요)*

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

`git`이 설치되어 있지 않아도, 파일 실행 권한(`chmod +x`)을 따로 주지 않아도 바로 설치할 수 있습니다.

### 방법 1: 배포판 선택 없이 한 줄 자동 설치 (가장 추천 — `git`·`chmod` 불필요)

터미널(`Ctrl + Alt + T`)을 열고 아래 **한 줄**을 복사해 붙여넣으세요. Garuda, Arch, Linux Mint, Ubuntu, Fedora 등 실행 중인 리눅스를 **자동으로 감지**해 알맞은 입력기를 설치합니다.

```bash
# curl 사용 (대부분의 배포판 기본 포함)
curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input/main/install.sh | sudo bash
```

> `curl`이 없는 환경이라면 `wget`을 사용하세요:
> ```bash
> wget -qO- https://raw.githubusercontent.com/stream9k/korean_input/main/install.sh | sudo bash
> ```

---

### 방법 2: 스크립트 파일을 직접 받아서 실행 (`chmod +x` 없이 실행하기)

웹 브라우저나 [`index.html`](index.html) 생성기에서 `.sh` 파일을 직접 다운로드한 경우, 리눅스 보안 정책상 다운로드 폴더의 파일에는 실행 권한이 없습니다. 이때 `./파일명.sh`로 실행하면 권한 오류가 나지만, 아래처럼 **`sudo bash`로 실행하면 `chmod +x` 없이 바로 실행**됩니다.

```bash
# 예시 1: 만능 자동 감지 스크립트 다운로드 후 바로 실행
curl -fsSLO https://raw.githubusercontent.com/stream9k/korean_input/main/install.sh
sudo bash install.sh

# 예시 2: 브라우저로 다운로드 폴더에 받은 경우
sudo bash ~/Downloads/install.sh
# 또는 특정 배포판 스크립트를 받은 경우:
sudo bash ~/Downloads/garuda-kde.sh
```

- **웹 생성기 활용**: 온라인 웹 생성기(`https://stream9k.github.io/korean_input/`) 또는 로컬의 [`index.html`](index.html)을 브라우저로 열면 원하는 배포판·에디션별 스크립트를 확인하고 다운로드할 수 있습니다.

---

### 방법 3: 주요 배포판별 직접 원라인 설치

자동 감지 대신 본인 배포판에 맞는 전용 스크립트를 바로 실행하고 싶다면 아래 명령어를 사용하세요.

| 배포판 | 데스크톱 / 에디션 | 원라인 설치 명령어 |
|---|---|---|
| **Garuda Linux** | KDE Plasma (Dragonized) | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/arch-family/garuda-kde.sh \| sudo bash` |
| **Linux Mint** | Cinnamon (기본) | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/mint-cinnamon.sh \| sudo bash` |
| **Linux Mint** | Xfce | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/mint-xfce.sh \| sudo bash` |
| **Linux Mint** | MATE | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/mint-mate.sh \| sudo bash` |
| **Ubuntu** | GNOME (기본) | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/ubuntu-gnome.sh \| sudo bash` |
| **Kubuntu** | KDE Plasma | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/ubuntu-kde.sh \| sudo bash` |
| **Debian** | GNOME (기본) | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/debian-gnome.sh \| sudo bash` |
| **Fedora** | KDE Plasma | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/fedora/fedora-kde.sh \| sudo bash` |
| **Fedora** | GNOME (Workstation) | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/fedora/fedora-gnome.sh \| sudo bash` |
| **Arch Linux** | Base | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/arch-family/arch-base.sh \| sudo bash` |
| **Manjaro** | KDE Plasma | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/arch-family/manjaro-kde.sh \| sudo bash` |
| **openSUSE** | Tumbleweed KDE | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/opensuse/opensuse-tumbleweed-kde.sh \| sudo bash` |
| **MX Linux** | Xfce (기본) | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/mx-xfce.sh \| sudo bash` |
| **Bazzite** | KDE / Deck (불변 OS) | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/fedora-atomic/bazzite-kde.sh \| sudo bash` |
| **AlmaLinux** | GNOME (`ibus-hangul`) | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/rhel-family/almalinux.sh \| sudo bash` |
| **Void Linux** | glibc | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/void/void-glibc.sh \| sudo bash` |

---

### 방법 4: 단일 바이너리 실행 파일(`hangul-installer`) 사용

외부 의존성 없이 `install.sh`가 내장된 단일 Go 바이너리([`cmd/hangul-installer/main.go`](cmd/hangul-installer/main.go))가 [GitHub Releases 최신 버전](https://github.com/stream9k/korean_input/releases/latest)에 미리 빌드되어 있습니다.

- **Intel / AMD 64비트 (일반 PC·노트북)**: [`hangul-installer-linux-amd64`](https://github.com/stream9k/korean_input/releases/latest/download/hangul-installer-linux-amd64)
- **ARM64 (Raspberry Pi·ARM 노트북 등)**: [`hangul-installer-linux-arm64`](https://github.com/stream9k/korean_input/releases/latest/download/hangul-installer-linux-arm64)

리눅스에서는 바이너리 파일도 다운로드 시 실행 비트가 제거되므로 최초 1회 실행 권한을 부여한 뒤 실행하세요(실행 시 root가 아니면 자동으로 `sudo` 권한을 요청합니다):

```bash
curl -fsSLO https://github.com/stream9k/korean_input/releases/latest/download/hangul-installer-linux-amd64
chmod +x hangul-installer-linux-amd64
./hangul-installer-linux-amd64
```

<details>
<summary>🛠️ (개발자/기여자 참고) 전체 저장소 클론 후 실행하기 (git 설치 환경)</summary>

모든 `.sh` 파일에는 Git 실행 권한(`100755`)이 부여되어 있으므로 `git clone` 후 별도 `chmod +x` 없이 바로 `./` 실행이 가능합니다.

```bash
git clone https://github.com/stream9k/korean_input.git
cd korean_input
sudo ./install.sh
# 또는 개별 스크립트 직접 실행:
sudo ./scripts/arch-family/garuda-kde.sh
# Linux Mint 통합 PoC (백업 기능 포함):
sudo ./install-hangul-mint.sh
```

</details>

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

이 저장소는 **18개 템플릿 패밀리**를 통해 주요 리눅스 배포판과 파생판(DistroWatch Top 200 기준 일반 리눅스 데스크톱 176종 중 **160종, 90.9%** / 전체 200종 중 **80.0%** 커버)을 지원하며, `scripts/` 폴더 아래에 **168개의 생성된 스크립트/설정 파일**이 준비되어 있습니다.

> ⚠️ **테스트 상태 안내**: 모든 배포판을 실기기/VM에서 전수 테스트한 상태는 아닙니다. 일부 신규·독자 배포판은 공식 패키징 규약에 따라 작성된 **베타(⚠️) / 실험적(🧪)** 스크립트이므로 실행 전 스크립트 내용을 확인하시기 바랍니다.

### 1. Debian / Ubuntu 계열 (`scripts/debian-family/`, 62개)
- **Linux Mint**: `mint-cinnamon.sh`, `mint-xfce.sh`, `mint-mate.sh`, `mint-edge.sh`
- **LMDE**: `lmde-cinnamon.sh`
- **Ubuntu**: `ubuntu-gnome.sh`, `ubuntu-kde.sh`, `ubuntu-xfce.sh`, `ubuntu-mate.sh`, `ubuntu-budgie.sh`, `ubuntu-cinnamon.sh`, `ubuntu-lxqt.sh`, `ubuntu-studio.sh`, `ubuntu-sway.sh`, `ubuntu-unity.sh`
- **Debian**: `debian-gnome.sh`, `debian-kde.sh`, `debian-xfce.sh`, `debian-mate.sh`, `debian-cinnamon.sh`, `debian-lxqt.sh`
- **Pop!_OS**: `pop-gnome.sh`, `pop-nvidia.sh`
- **elementary OS**: `elementary-pantheon.sh`
- **Zorin OS**: `zorin-core.sh`, `zorin-pro.sh`, `zorin-lite.sh`, `zorin-education.sh`
- **KDE Neon**: `kde-neon-user.sh`, `kde-neon-testing.sh`, `kde-neon-unstable.sh`
- **MX Linux / antiX / Devuan (Non-systemd 포함)**: `mx-xfce.sh`, `mx-kde.sh`, `mx-fluxbox.sh`, `antix.sh`, `devuan.sh`, `expirion.sh`, `lcos.sh`, `superlite.sh`
- **Kali / Parrot / 보안 데비안**: `kali-xfce.sh`, `kali-gnome.sh`, `kali-kde.sh`, `parrot.sh`, `kodachi.sh`, `gnoppix.sh`, `osintvm.sh`, `nethydra.sh`
- **Ubuntu/Debian 주요 파생**: `tuxedo-os.sh`, `q4os.sh`, `linux-lite.sh`, `deepin.sh`, `pikaos.sh`, `anduinos.sh`, `pureos.sh`, `slimbook-os.sh`, `emmabuntus.sh`, `siduction.sh`, `solydxk.sh`, `raspios.sh`, `dietpi.sh`, `makulu.sh`, `cuerdos.sh`

### 2. Fedora 계열 (`scripts/fedora/`, 14개)
- `fedora-kde.sh`, `fedora-gnome.sh`, `fedora-xfce.sh`, `fedora-mate.sh`, `fedora-cinnamon.sh`, `fedora-lxqt.sh`, `fedora-i3.sh`, `fedora-sway.sh`
- **파생 / 특수**: `fedora-nobara.sh`, `fedora-ultramarine.sh`, `fedora-rakuos.sh`, `fedora-qubes.sh` *(Qubes OS Fedora TemplateVM 내부에서 실행)*, `fedora-capivaraos.sh`, `fedora-ludora.sh`

### 3. Arch 계열 (`scripts/arch-family/`, 37개)
- **Arch Linux 및 파생**: `arch-base.sh`, `arch-endeavour.sh`, `arch-manjaro.sh`, `arch-garuda.sh`, `arch-cachyos.sh`, `arch-omarchy.sh`, `arch-artix.sh`, `arch-biglinux.sh`, `arch-pearos.sh`, `arch-bluestar.sh`, `arch-ml4w.sh`, `arch-archcraft.sh`, `arch-tromjaro.sh`, `arch-blendos.sh`, `arch-prismlinux.sh`, `arch-kiro.sh`, `arch-stratos.sh`, `arch-ezarcher.sh`
- **Manjaro**: `manjaro-kde.sh`, `manjaro-gnome.sh`, `manjaro-xfce.sh`, `manjaro-cinnamon.sh`, `manjaro-mate.sh`, `manjaro-i3.sh`, `manjaro-sway.sh`
- **EndeavourOS**: `endeavour-kde.sh`, `endeavour-gnome.sh`, `endeavour-xfce.sh`, `endeavour-i3wm.sh`, `endeavour-sway.sh`, `endeavour-bspwm.sh`
- **Garuda Linux**: `garuda-kde.sh`, `garuda-gnome.sh`, `garuda-xfce.sh`, `garuda-wayfire.sh`, `garuda-hyprland.sh`, `garuda-qtile.sh`

### 4. openSUSE 계열 (`scripts/opensuse/`, 7개)
- `opensuse-tumbleweed-kde.sh`, `opensuse-tumbleweed-gnome.sh`, `opensuse-leap-kde.sh`, `opensuse-leap-gnome.sh`, `opensuse-microos.sh`, `opensuse-slowroll.sh`, `opensuse-aeon.sh` *(`transactional-update` 자동 분기)*

### 5. NixOS (`scripts/nixos/`, 6개)
- `nixos-gnome.nix`, `nixos-kde.nix`, `nixos-hyprland.nix`, `nixos-sway.nix`, `nixos-minimal.nix`, `nixos-glf.nix`

### 6. 불변(Immutable) OS 계열 (9개)
- **Fedora Atomic (`scripts/fedora-atomic/`, 7개, 설치 후 재부팅 필수)**: `bazzite-kde.sh`, `bazzite-gnome.sh`, `aurora.sh`, `fedora-silverblue.sh`, `fedora-kinoite.sh`, `butrelinux.sh`, `margine.sh`
- **SteamOS 3.x (`scripts/steamos/`, 1개)**: `steamos-holo.sh` *(`steamos-readonly disable/enable` 포함)*
- **Vanilla OS (`scripts/vanilla/`, 1개, 설치 후 재부팅 필수)**: `vanilla-gnome.sh` *(`abroot pkg add` 사용)*

### 7. 엔터프라이즈 RHEL 계열 (`scripts/rhel-family/`, 5개)
- `almalinux.sh`, `rocky-linux.sh`, `rhel.sh`, `centos-stream.sh`, `oreon.sh` *(공식 저장소 표준인 `ibus-hangul` 설치 및 GNOME 입력 소스 등록)*

### 8. 독립 / 독자 패키지 관리자 계열 (20개)
- **Void Linux / 파생 (`scripts/void/`, 6개)**: `void-glibc.sh`, `void-musl.sh`, `agarimos.sh`, `lazylinux.sh`, `nekovoid.sh`, `d77void.sh`
- **Alpine / Chimera / Nura (`scripts/alpine/`, 3개)**: `alpine-desktop.sh`, `chimera-linux.sh`, `nura-linux.sh` *(`apk` 기반 — `| sudo sh` 실행 권장)*
- **Solus (`scripts/solus/`, 4개)**: `solus-budgie.sh`, `solus-gnome.sh`, `solus-kde.sh`, `solus-xfce.sh`
- **Gentoo / Calculate / CalamaroOS (`scripts/gentoo/`, 4개)**: `gentoo-openrc.sh`, `gentoo-systemd.sh`, `calculate-linux.sh`, `calamaroos.sh` *(Portage `emerge` 사용)*
- **Mandriva 계열 (`scripts/mandriva-family/`, 4개)**: `mageia.sh`, `openmandriva.sh`, `pclinuxos.sh`, `magos.sh` *(`dnf`/`urpmi`/`apt-get` 자동 분기)*
- **KaOS (`scripts/kaos/`, 1개)**: `kaos-kde.sh` *(KDE/Qt 전용 패키지 구성)*
- **ALT Linux (`scripts/alt/`, 1개)**: `alt-workstation.sh` *(`apt-rpm` 기반)*
- **Guix System (`scripts/guix/`, 1개)**: `guix-desktop.sh` *(GNU Guix 패키지 관리자)*

### 9. kime 대안 입력기 (`scripts/kime/`, 4개)
Rust 기반의 경량·Wayland 친화적인 한글 입력기 `kime`을 설치하고 싶다면 아래 스크립트를 사용하세요.
- `kime-debian.sh` (Debian / Ubuntu / Linux Mint 등 `.deb` 기반)
- `kime-fedora.sh` (Fedora COPR 기반)
- `kime-arch.sh` (Arch / Manjaro / EndeavourOS AUR 헬퍼 `yay`/`paru` 필요)
- `kime-opensuse.sh` (openSUSE `zypper` 기반)

---

## 🚫 DistroWatch Top 200 중 미지원(제외) OS 목록 및 사유

기술적 구조나 OS 성격상 원라인 자동 설치 스크립트가 부적합하거나 제외된 40종입니다.

| 분류 | 대상 OS | 제외 사유 |
|---|---|---|
| **비(非) 리눅스 OS (12종)** | FreeBSD, GhostBSD, NetBSD, OpenBSD, MidnightBSD, SmartOS, OpenIndiana, ChromeOS, FydeOS, ReactOS, Haiku, CalyxOS | 리눅스 커널/패키지 생태계가 아님 (BSD 계열은 `pkg install ko-fcitx5-hangul` 등 각 OS별 수동 설치 필요) |
| **특수 목적 / 서버 / NAS / 유틸리티 리눅스 (12종)** | Talos Linux, ZimaOS, Tails, HAOS (Home Assistant OS), umbrelOS, StartOS, TrueNAS, ShredOS, Clonezilla, Flatcar, Univention, Koozali | 쿠버네티스/컨테이너/NAS/복구/서버 어플라이언스 전용이거나 휘발성 라이브 OS로 일반 데스크톱 한글 입력기 설치 대상이 아님 |
| **독자 포맷 / 수동 빌드 / 미성숙 데스크톱 (16종)** | Puppy Linux, EasyOS, Tiny Core, 4MLinux, Slackware, PorteuX, Zenwalk, AUSTRUMI, Slackel, T2 Linux, Nitrux, aerynOS, GNOME OS, KDE Linux, MocaccinoOS, Netdeep | `.pet`/`.sfs`/`.tcz` 등 독자 구조, 공식 바이너리 의존성 부재(`SlackBuilds` 소스 빌드 필요), `apt` 제거 불변 구조(Nitrux), 알파 단계 패키지 레포(`moss`), 개발용 Nightly 이미지 등 |

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

---

<a id="english-guide"></a>

## 🇺🇸 English Guide (For English-Only Linux Systems)

Just installed an English-only Linux distro (Ubuntu, Mint, Arch, Garuda, Fedora, openSUSE, Void, Alpine, etc.) and need Korean input + Korean fonts right away?

> 📘 Full standalone English documentation is also available in **[README.en.md](README.en.md)**, and the English Web Generator is live at **[https://stream9k.github.io/korean_input/index-en.html](https://stream9k.github.io/korean_input/index-en.html)**.

### ⚡ 10-Second Quick Start (Auto-Detect)

Run **one command** in your terminal — no `git`, no manual distro lookup, and no `chmod +x` needed:

```bash
curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input/main/install.sh | sudo bash
```

If `curl` is not installed (e.g., fresh Ubuntu or Debian), use `wget`:

```bash
wget -qO- https://raw.githubusercontent.com/stream9k/korean_input/main/install.sh | sudo bash
```

- **Auto-Detected English Output**: `install.sh` reads your `LANG` / `LC_*` locale and prints prompts in English automatically on English systems. You can also force a language with `--lang=en` or `--lang=ko`:
  ```bash
  curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input/main/install.sh | sudo bash -s -- --lang=en
  ```
- **Korean Fonts Included**: Installs Noto CJK Korean fonts (`fonts-noto-cjk`, `noto-fonts-cjk`, or distro equivalents) alongside `fcitx5-hangul` (or `ibus-hangul` on RHEL-family distros) so Korean text renders cleanly in browsers and terminals instead of broken boxes (`□`).

### 📄 Running a Downloaded `.sh` File Without `chmod +x`

Files downloaded with a web browser or `curl -O` do not have execute permission by default. Instead of running `./install.sh`, pass the file directly to `bash`:

```bash
sudo bash ~/Downloads/install.sh
```

### 🌐 Web Generator & Distro-Specific One-Liners

Prefer picking your exact distribution and desktop environment? Use the interactive Web Generator (auto-detects your browser language, or open the English page directly):

- **Web Generator (Auto-Detect)**: [https://stream9k.github.io/korean_input/](https://stream9k.github.io/korean_input/)
- **English Web Page**: [https://stream9k.github.io/korean_input/index-en.html](https://stream9k.github.io/korean_input/index-en.html)

Representative distro-specific one-liners (168 scripts covering 18 distro families in [`scripts/`](scripts/)):

| Distro Family | Representative Distro | One-Line Command |
| :--- | :--- | :--- |
| **Debian / Ubuntu** | Ubuntu (GNOME) | `curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/ubuntu-gnome.sh \| sudo bash` |
| **Debian / Ubuntu** | Linux Mint (Cinnamon) | `curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/mint-cinnamon.sh \| sudo bash` |
| **Arch-based** | Arch Linux | `curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/arch-family/arch-base.sh \| sudo bash` |
| **Arch-based** | Garuda Linux (KDE) | `curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/arch-family/garuda-kde.sh \| sudo bash` |
| **Fedora** | Fedora (GNOME / KDE) | `curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/fedora/fedora-gnome.sh \| sudo bash` |
| **openSUSE** | Tumbleweed (KDE) | `curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/opensuse/opensuse-tumbleweed-kde.sh \| sudo bash` |
| **RHEL-family** | Rocky Linux (`ibus-hangul`) | `curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/rhel-family/rocky-linux.sh \| sudo bash` |
| **Void Linux** | Void (glibc) | `curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/void/void-glibc.sh \| sudo bash` |
| **Alpine Linux** | Alpine Desktop | `curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/alpine/alpine-desktop.sh \| sudo sh` |
| **Gentoo** | Gentoo (systemd) | `curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/gentoo/gentoo-systemd.sh \| sudo bash` |
| **Solus** | Solus (Budgie) | `curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/solus/solus-budgie.sh \| sudo bash` |
| **NixOS** | NixOS (GNOME) | Add [`scripts/nixos/nixos-gnome.nix`](scripts/nixos/nixos-gnome.nix) to `/etc/nixos/configuration.nix` |

### 📦 Single Static Binary (`hangul-installer`)

If you prefer a standalone Linux executable with the auto-detect installer embedded inside (no `curl`/`bash` pipeline needed after download), grab it from **[GitHub Releases](https://github.com/stream9k/korean_input/releases/latest)**:

- **x86_64 (`amd64`)**:
  ```bash
  curl -LO https://github.com/stream9k/korean_input/releases/latest/download/hangul-installer-linux-amd64
  chmod +x hangul-installer-linux-amd64
  ./hangul-installer-linux-amd64
  ```
- **ARM64 (`aarch64`)**:
  ```bash
  curl -LO https://github.com/stream9k/korean_input/releases/latest/download/hangul-installer-linux-arm64
  chmod +x hangul-installer-linux-arm64
  ./hangul-installer-linux-arm64
  ```

### ✅ Post-Install Checklist (US Keyboard & Wayland Tips)

1. **Log out and log back in** (or reboot) after installation so environment variables (`GTK_IM_MODULE`, `QT_IM_MODULE`, `XMODIFIERS`) take effect.
2. **US Keyboard Toggle Key (`Right Alt` / `Alt_R`)**: Standard US keyboards have no physical `Hangul` key. Run `fcitx5-configtool`:
   - Under **Input Method**, confirm **Hangul** is in the **Current Input Method** list.
   - Under **Global Options** -> **Trigger Input Method**, add **`Right Alt` (`Alt_R`)** (or `Ctrl+Space` / `Shift+Space`) as your toggle shortcut.
3. **KDE Plasma (Wayland — Kubuntu, Fedora KDE, Garuda KDE, etc.)**: Open **System Settings** -> **Keyboard** -> **Virtual Keyboard**, choose **Fcitx 5**, and click **Apply**.
4. **NixOS (Declarative)**: Copy the generated snippet (for example, [`scripts/nixos/nixos-gnome.nix`](scripts/nixos/nixos-gnome.nix)) into `/etc/nixos/configuration.nix` and run `sudo nixos-rebuild switch`.
