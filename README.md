# 리눅스 한글 입력기 자동 설치 스크립트 (`fcitx5-hangul` / `ibus-hangul` / `kime`)

🌐 **🇰🇷 한국어** | [🇺🇸 English Docs (README.en.md)](README.en.md) | [🌐 웹 생성기 (is.gd/korean_input)](https://is.gd/korean_input)

리눅스 설치 후 번거로운 한글 입력기(`fcitx5-hangul`, `ibus-hangul`, `kime`)와 한글 폰트를 **단 한 줄의 명령어로 자동 감지 및 설치**해 주는 도구입니다.

> 💡 **대부분의 사용자는 아래 '원라인 자동 설치' 명령어 하나로 모든 설정이 끝납니다.** 

---

## ⚡ 빠른 시작: 원라인 자동 설치 (가장 추천)

배포판을 찾거나 `git`, `chmod +x`를 실행할 필요가 없습니다. 터미널(`Ctrl + Alt + T`)을 열고 아래 명령어를 붙여넣으세요.

```bash
# curl 사용 (권장)
curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input/main/install.sh | sudo bash
```

```bash
# curl이 없는 환경인 경우 (wget 사용)
wget -qO- https://raw.githubusercontent.com/stream9k/korean_input/main/install.sh | sudo bash
```

> 🛡️ **실행 전 변경 내역 확인**: 스크립트는 시스템을 먼저 조사해 감지된 환경(OS·데스크톱·기존 입력기)과 권장 입력기(`fcitx5-hangul`, RHEL 계열은 `ibus-hangul`), 설치/수정할 패키지·설정 파일을 출력한 뒤 `[y/N/ibus]`(또는 `[y/N]`) 확인을 받습니다.
> * IBus를 원하시면 확인 프롬프트에서 **`ibus`** 를 입력하거나 `--ibus` 옵션(`... | sudo bash -s -- --ibus`)으로 바로 전환할 수 있습니다.
> * 무인 실행 시에는 `-s -- --yes`(로컬 실행 시 `--yes` 또는 `-y`) 옵션을 추가하세요.

### 설치 완료 후
1. **로그아웃 후 다시 로그인 (또는 재부팅)**합니다.
2. `한/영` 키 또는 `Ctrl + Space`를 눌러 한글 입력을 시작합니다.
   * 🖥 **KDE Plasma 사용자**: 설치 스크립트가 `~/.config/kwinrc`의 가상 키보드를 **Fcitx 5**로 자동 설정합니다. (재로그인 후에도 적용되지 않은 경우에만 `시스템 설정 → 입력 장치 → 가상 키보드 → Fcitx 5`를 직접 확인하세요.)
   * ⌨️ **영문 키보드 사용자 (오른쪽 Alt 키)**: `fcitx5-configtool`을 열고 전역 옵션에서 `오른쪽 Alt(Alt_R)`를 전환키로 추가하세요.
   * 💡 **오른쪽 Alt 누를 때 Firefox 메뉴바(풀다운)와 한/영 전환이 동시에 일어나는 경우 해결법**:
     * 일부 노트북이나 키보드에서 오른쪽 Alt 키가 웹 브라우저의 상단 메뉴바 호출과 한영 전환을 동시에 유발할 수 있습니다. 시스템 레이아웃 옵션에서 오른쪽 Alt를 순수 한/영 키로 매핑하면 해결됩니다.
     * **해결 경로**: **시스템 설정** → **키보드** → **키바인딩(또는 레이아웃)** → **키보드 옵션 설정** → **한국어 한/영키 한자키** → **오른쪽 ALT키를 한/영키로 만들기** 체크 후 **적용**

---

## 🌐 웹 생성기 안내 (배포판 직접 선택)

웹 브라우저에서 내 배포판과 데스크톱 환경(GNOME, KDE, Xfce 등)에 딱 맞춘 전용 스크립트를 생성하고 싶다면 웹 생성기를 이용하세요.

* 🔗 **웹 생성기 주소**: **[https://is.gd/korean_input](https://is.gd/korean_input)** (또는 [GitHub Pages](https://stream9k.github.io/korean_input/))

웹 생성기에서는 두 가지 방식 중 편한 방법을 선택할 수 있습니다:
* **방법 A (원라인 명령어)**: 터미널에 복사·붙여넣기하여 즉시 설치 (다운로드 불필요)
* **방법 B (파일 다운로드)**: 스크립트 코드를 직접 검토하거나 파일로 저장 후 `sudo bash ~/Downloads/파일명.sh` 로 실행

---

## 📌 주요 배포판별 전용 명령어

자동 감지 대신 특정 배포판 전용 스크립트를 바로 실행하려면 아래 명령어를 사용하세요. (전체 20개 패밀리, 198개 스크립트 지원)

| 배포판 | 데스크톱 / 에디션 | 입력기 | 전용 원라인 명령어 |
|:---|:---|:---|:---|
| **Ubuntu** | GNOME (기본) | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/ubuntu-gnome.sh \| sudo bash` |
| **Linux Mint** | Cinnamon (기본) | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/mint-cinnamon.sh \| sudo bash` |
| **LMDE** | Cinnamon | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/lmde-cinnamon.sh \| sudo bash` |
| **Debian** | GNOME | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/debian-gnome.sh \| sudo bash` |
| **Fedora** | KDE Plasma | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/fedora/fedora-kde.sh \| sudo bash` |
| **Fedora** | GNOME (Workstation) | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/fedora/fedora-gnome.sh \| sudo bash` |
| **Arch Linux** | Base | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/arch-family/arch-base.sh \| sudo bash` |
| **Garuda Linux** | KDE Plasma | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/arch-family/garuda-kde.sh \| sudo bash` |
| **Manjaro** | KDE Plasma | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/arch-family/manjaro-kde.sh \| sudo bash` |
| **openSUSE** | Tumbleweed KDE | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/opensuse/opensuse-tumbleweed-kde.sh \| sudo bash` |
| **Bazzite** | KDE / Steam Deck | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/fedora-atomic/bazzite-kde.sh \| sudo bash` |
| **Rocky / Alma / RHEL** | GNOME (엔터프라이즈) | `ibus` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/rhel-family/rocky-linux.sh \| sudo bash` |
| **NixOS** | GNOME / KDE 등 | `fcitx5` | [scripts/nixos/](scripts/nixos/) 설정 조각을 `configuration.nix`에 병합 |

<details>
<summary>📂 전체 지원 배포판 및 198개 스크립트 목록 펼치기</summary>

* **Debian / Ubuntu 계열 (75개)**: Mint, LMDE, Ubuntu, Kubuntu, Debian, Pop!_OS, Zorin OS, elementary OS, Sparky, Bodhi, Peppermint, Voyager, BunsenLabs, MX Linux, Kali, Parrot, Q4OS 등
* **Arch 계열 (41개)**: Arch Linux, EndeavourOS, Garuda, Manjaro, CachyOS, Mabox, Artix, BigLinux, Archcraft 등
* **Fedora 계열 (17개)**: Fedora Workstation(GNOME), KDE Spin, Xfce, Nobara, Ultramarine, Qubes OS(TemplateVM) 등
* **불변(Immutable) OS 계열 (9개)**: Bazzite, Fedora Silverblue/Kinoite, SteamOS 3.x, Vanilla OS 등
* **openSUSE 계열 (9개)**: Tumbleweed, Leap, MicroOS, Slowroll, Aeon 등
* **NixOS 계열 (6개)**: GNOME, KDE, Hyprland, Sway, Minimal 등
* **엔터프라이즈 RHEL 계열 (5개)**: RHEL, Rocky Linux, AlmaLinux, CentOS Stream, Oreon (`ibus-hangul` 표준 구성)
* **독립/경량 배포판 (24개)**: Void Linux, Alpine Linux, Solus, Gentoo, Mageia, KaOS, Guix 등
* **fcitx5-hangul 강제 선택 범용 입력기 (4개)**: 표준 `fcitx5-hangul` 계열별 범용 스크립트 (Debian/Ubuntu, Fedora, Arch, openSUSE — IBus 기본 배포판에서도 강제 전환 가능)
* **ibus-hangul 대안 입력기 (4개)**: GNOME 친화 `ibus-hangul` 범용 스크립트 (Debian/Ubuntu, Fedora/RHEL, Arch, openSUSE)
* **kime 대안 입력기 (4개)**: Rust 기반의 `kime` 전용 스크립트 (Debian, Fedora/RHEL(EL 소스 빌드), Arch, openSUSE)

</details>

---

## ✅ 직접 테스트 완료한 배포판

실제 환경(VM / 실기기)에서 직접 설치해가며 수정·검증한 배포판/에디션 목록입니다.

* **EndeavourOS Titan Nova** (KDE)
* **Omarchy** (Hyprland)
* **Garuda Linux** (KDE)
* **Bodhi Linux** (Moksha)
* **Loc-OS** (LXDE)
* **Sparky7 Multimedia** (Xfce)
* **openSUSE-Tumbleweed** (KDE / GNOME / Xfce)
* **Rocky Linux** (KDE / GNOME / Xfce)
* **Bazzite** (GNOME)
* **LMDE7** (Cinnamon)
* **CachyOS** (KDE)

---

## ⚙️ 자동 처리 및 핵심 기능

이 스크립트는 단순 패키지 설치에 그치지 않고, 한글 입력에 필요한 시스템 전반의 설정을 완결합니다:

1. **충돌 방지**: 기존 구버전 fcitx4 잔여 패키지 정리 및 ibus 데몬 충돌 자동 비활성화
2. **입력기 & Noto CJK 한글 폰트 설치**: 한글 깨짐(□ 네모 박스 현상) 방지 폰트 동시 설치
3. **환경변수 및 세션 자동 구성**: Wayland 및 X11 환경에 맞는 `GTK_IM_MODULE`, `QT_IM_MODULE`, `XMODIFIERS` 주입
4. **기본 프로필 사전 구성**: `영문(US)` + `한글(Hangul)` 레이아웃 및 `한/영`, `Ctrl+Space` 전환 단축키 자동 등록
5. **재부팅 후 1회성 안내 팝업**: 설치 후 첫 로그인 시 바탕화면에 필수 단축키 및 데스크톱별 추가 설정 팁을 1회 안내한 뒤 자동 삭제

---

## ❓ 자주 묻는 질문 (FAQ)

### Q1. 한/영 키를 눌러도 한글 전환이 안 되거나, Firefox 등에서 메뉴바와 전환이 동시에 작동합니다.
* **단순 미인식 (Alt_R로 전달되는 경우)**:
  1. 터미널에서 `fcitx5-configtool`을 실행합니다.
  2. **전역 옵션(Global Options)** → **입력기 전환(Trigger Input Method)** 항목을 클릭합니다.
  3. 원하는 전환키(오른쪽 Alt 등)를 누르고 **적용(Apply)**합니다.
* **Firefox 등 앱의 메뉴바(풀다운)가 함께 튀어나오는 경우**:
  * 오른쪽 Alt가 앱의 단축키와 충돌하는 현상입니다.
  * **해결**: **설정** → **키보드** → **키바인딩 / 레이아웃** → **키보드 옵션 설정** → **한국어 한/영키 한자키** → **오른쪽 ALT키를 한/영키로 만들기**를 체크하고 적용하세요. (하드웨어 키 자체가 `Hangul` 키코드로 변경되어 메뉴바 충돌이 완벽히 해결됩니다.)

### Q2. 설치 후 재로그인했는데도 한글이 안 써집니다.
터미널에서 상태를 빠르게 점검해 보세요:
```bash
# 1. fcitx5 데몬 실행 여부 확인
pgrep -af fcitx5

# 2. 프로세스가 꺼져 있다면 재시작
fcitx5 -r -d

# 3. 환경변수 확인 (fcitx가 출력되어야 함)
env | grep -i im_module

# 4. 상세 진단 보고서 출력
fcitx5-diagnose
```

### Q3. 크롬, VS Code, 슬랙 등 Electron 앱에서만 한글이 안 됩니다.
Wayland 세션을 사용할 때 일부 Electron 앱은 추가 플래그가 필요합니다.
* `~/.config/chrome-flags.conf` 또는 `~/.config/code-flags.conf` 파일에 `--enable-wayland-ime` 옵션을 추가해 보세요.

### Q4. 설치 로그는 어디서 확인하나요?
설치 과정의 모든 기록은 아래 로그 파일에 저장됩니다:
```bash
sudo cat /var/log/install-hangul-auto.log
```

---

## 📦 버전 고정 스크립트 다운로드 및 무결성 검증 (GitHub Releases)

`curl | bash` 파이프라인 대신 코드를 먼저 검토하거나 체크섬을 검증한 뒤 실행하려면, [GitHub Releases](https://github.com/stream9k/korean_input/releases/latest)에서 릴리즈 버전의 `install.sh`, `SHA256SUMS.txt`, `README.md`, `README.en.md`를 내려받을 수 있습니다:

```bash
curl -LO https://github.com/stream9k/korean_input/releases/latest/download/install.sh
curl -LO https://github.com/stream9k/korean_input/releases/latest/download/SHA256SUMS.txt
sha256sum -c SHA256SUMS.txt
sudo bash install.sh
```

---

## 🏗️ 아키텍처 및 패밀리별 구현 참고

* **`index.html` & `js/{data,templates,app}.js`**: 빌드 도구 없는 정적 HTML + 모듈형 JS 웹 생성기 (한국어/영어 다국어 지원, `DISTRO_DATA` 및 `SCRIPT_TEMPLATES` 내장)
* **`install.sh`**: 18개 배포판 패밀리를 자동 감지하고 권장 입력기(`fcitx5-hangul` / RHEL: `ibus-hangul`) 및 선택적 `ibus` 전환을 지원하는 만능 올인원 스크립트
* **`generate_scripts.js` & `scripts/`**: `js/data.js`·`js/templates.js`를 기반으로 `scripts/<family>/` 아래 198개 배포판별 `.sh` / `.nix` 파일을 일괄 생성

<details>
<summary>📋 20개 패밀리별 구현 차이 및 미지원 OS 40종 기준 펼치기</summary>

### 스크립트 패밀리별 핵심 구현 차이

| 패밀리 | 대상 | 패키지 관리자 | 입력기 전환 방식 | 환경변수 적용 | 특이사항 |
|---|---|---|---|---|---|
| **debian-family** | Mint, Ubuntu, Debian, LMDE, Pop, elementary, Zorin, KDE Neon, MX, antiX, Devuan, Kali, Parrot, TUXEDO, Q4OS, Lite, deepin, PikaOS, AnduinOS, PureOS, Slimbook, Emmabuntüs, siduction, SolydXK, RasPiOS 등 | `apt` | `im-config -n fcitx5` | `~/.config/environment.d/fcitx5.conf` + `/etc/environment` + `~/.xsessionrc` | `gsettings`로 DE별 단축키 충돌 해제, Non-systemd 호환 |
| **fedora** | Fedora 40/41/42, Nobara, Ultramarine, RakuOS, Qubes VM, CapivaraOS, Ludora | `dnf` | `alternatives --set xinputrc` + `sed`로 xinputrc 패치 | `~/.bash_profile` 또는 `~/.profile` | `systemctl --user disable ibus` 필수, KDE는 Virtual Keyboard 별도 설정 필요 |
| **arch-family** | Arch, Manjaro, EndeavourOS, Garuda, CachyOS, Omarchy, Artix, BigLinux, pearOS, Bluestar, ML4W, Archcraft, TROMjaro, blendOS 등 | `pacman` | 수동 (환경변수만) | `/etc/environment` (시스템 와이드) + `~/.config/environment.d/` | `fcitx5-im` 메타패키지, `systemctl --user enable fcitx5` 권장 |
| **opensuse** | openSUSE Leap/Tumbleweed/MicroOS/Slowroll/Aeon | `zypper` / `transactional-update` | `alternatives` + `sed` 패치 | `~/.bash_profile` | `transactional-update` 자동 분기 (Aeon/MicroOS 지원) |
| **nixos** | NixOS, Abora, GLF OS | `nix` | 선언적 (`configuration.nix`) | `environment.sessionVariables` | **스크립트 아님**, Nix 설정 조각 제공 |
| **fedora-atomic** | Bazzite, Aurora, Fedora Silverblue/Kinoite, butrelinux, Margine | `rpm-ostree` | 환경변수 + 레이어링 | `~/.config/environment.d/fcitx5.conf` | 불변 OS, 설치 후 **재부팅 필수** |
| **steamos** | SteamOS 3.x (Steam Deck) | `pacman` | 수동 (readonly 임시 해제) | `/etc/environment` | `steamos-readonly disable/enable` 자동 처리 |
| **rhel-family** | AlmaLinux, Rocky, RHEL, CentOS Stream, Oreon | `dnf` | `ibus-hangul` + `gsettings` | `~/.config/environment.d/ibus.conf` + `~/.bash_profile` | 공식 저장소 표준(`ibus-hangul`) 기준 구성 |
| **void** | Void Linux (glibc/musl), AgarimOS, LazyLinux, Neko-Void, d77void | `xbps-install` | 수동 (환경변수 + autostart) | `/etc/environment` + `~/.xprofile` | `runit` 기반, Non-systemd 환경 |
| **alpine** | Alpine Linux, Chimera Linux, Nura | `apk` | 수동 (환경변수 + autostart) | `/etc/environment` + `~/.profile` | `sh` 호환 POSIX 셸 스크립트 |
| **solus** | Solus (Budgie/GNOME/KDE/Xfce) | `eopkg` | 수동 (환경변수 + autostart) | `/etc/environment` + `~/.config/environment.d/` | Solus 전용 패키지명 적용 |
| **gentoo** | Gentoo (OpenRC/systemd), Calculate Linux, CalamaroOS | `emerge` | 수동 (환경변수 + autostart) | `/etc/environment` + `~/.xprofile` | `app-i18n/fcitx:5` 슬롯 지정 설치 |
| **mandriva-family** | Mageia, OpenMandriva, PCLinuxOS, MagOS | `dnf`/`urpmi`/`apt-get` | 수동 (환경변수 + autostart) | `/etc/environment` + `~/.xprofile` | 패키지 관리자 자동 분기 |
| **kaos** | KaOS | `pacman` | 수동 (환경변수 + autostart) | `/etc/environment` + `~/.config/environment.d/` | KDE/Qt 전용 패키지(`fcitx5-gtk` 제외) |
| **vanilla** | Vanilla OS 2 Orchid | `abroot` | 환경변수 + autostart | `~/.config/environment.d/fcitx5.conf` | ABRoot 불변 Debian, 설치 후 **재부팅 필수** |
| **alt** | ALT Linux | `apt-get` (`apt-rpm`) | 수동 (환경변수 + autostart) | `/etc/environment` + `~/.xprofile` | `apt-rpm` 패키지 구성 적용 |
| **guix** | Guix System | `guix` | 수동 (`guix install`) | `~/.bash_profile` (`GUIX_PROFILE`) | GNU Guix 사용자 프로필 설치 및 `config.scm` 안내 |
| **fcitx5** | 전체 (표준 범용 강제 선택) | 각자 | `im-config` / `alternatives` / 수동 | `~/.config/environment.d/fcitx5.conf` | IBus 기본 배포판에서도 fcitx5 강제 전환, Debian/Fedora/Arch/openSUSE 범용 분기 (RHEL은 COPR 등 필요 안내) |
| **ibus** | 전체 (GNOME 친화 대안) | 각자 | `im-config` / `gsettings` / `alternatives` | `~/.config/environment.d/ibus.conf` | GNOME 통합 친화 대안, Debian/Fedora/Arch/openSUSE 범용 분기 |
| **kime** | 전체 (대안) | 각자 | 수동 | `~/.config/environment.d/kime.conf` | Rust 기반, Wayland 네이티브, AUR/COPR/.deb/zypper/EL 소스 빌드 분기 |

### 제외(미지원) 대상 40종 및 사유
* **비리눅스 (12종)**: FreeBSD, GhostBSD, NetBSD, OpenBSD, MidnightBSD, SmartOS, OpenIndiana, ChromeOS, FydeOS, ReactOS, Haiku, CalyxOS
* **특수 목적/서버/NAS/유틸리티 리눅스 (12종)**: Talos, ZimaOS, Tails, HAOS(Home Assistant OS), umbrelOS, StartOS, TrueNAS, ShredOS, Clonezilla, Flatcar, Univention, Koozali
* **자동 스크립트 부적합/독자 빌드 데스크톱 (16종)**: Puppy Linux, EasyOS, Tiny Core, 4MLinux, Slackware, PorteuX, Zenwalk, AUSTRUMI, Slackel, T2 Linux, Nitrux(apt 제거 불변 구조), aerynOS(알파 단계 `moss`), GNOME OS, KDE Linux(개발용 Nightly 이미지), MocaccinoOS(`luet` 레이어 미비), Netdeep

</details>

---

## 🤝 참고 프로젝트 & 라이선스

이 프로젝트는 오픈소스 커뮤니티의 검증된 설정 가이드와 선행 프로젝트들을 참고하여 제작되었습니다:
* [ArchWiki Localization/Korean](https://wiki.archlinux.org/title/Localization/Korean) · [Fedora Wiki I18N/Fcitx5](https://fedoraproject.org/wiki/I18N/Fcitx5)
* [linuxmint-fcitx5-cjk-fix](https://github.com/kylechoidev/linuxmint-fcitx5-cjk-fix) · [linux-hangul-input-setup](https://github.com/ppugend/linux-hangul-input-setup) · [fedora42-fcitx5-guide](https://github.com/StrKare/fedora42-fcitx5-guide) · [Hangul-fixer](https://github.com/kernalix7/Hangul-fixer)

본 프로젝트는 **[MIT License](LICENSE)** 하에 자유롭게 사용 및 수정, 배포하실 수 있습니다.
