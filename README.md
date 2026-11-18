# 리눅스 한글 입력기 자동 설치 스크립트 (`fcitx5-hangul` / `kime`)

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

### 설치 완료 후
1. **로그아웃 후 다시 로그인 (또는 재부팅)**합니다.
2. `한/영` 키 또는 `Ctrl + Space`를 눌러 한글 입력을 시작합니다.
   * 🖥 **KDE Plasma 사용자**: `시스템 설정 → 입력 장치 → 가상 키보드 → Fcitx 5`를 선택해야 Wayland 환경에서 정상 작동합니다.
   * ⌨️ **영문 키보드 사용자 (오른쪽 Alt 키)**: `fcitx5-configtool`을 열고 전역 옵션에서 `오른쪽 Alt(Alt_R)`를 전환키로 추가하세요.

---

## 🌐 웹 생성기 안내 (배포판 직접 선택)

웹 브라우저에서 내 배포판과 데스크톱 환경(GNOME, KDE, Xfce 등)에 딱 맞춘 전용 스크립트를 생성하고 싶다면 웹 생성기를 이용하세요.

* 🔗 **웹 생성기 주소**: **[https://is.gd/korean_input](https://is.gd/korean_input)** (또는 [GitHub Pages](https://stream9k.github.io/korean_input/))

웹 생성기에서는 두 가지 방식 중 편한 방법을 선택할 수 있습니다:
* **방법 A (원라인 명령어)**: 터미널에 복사·붙여넣기하여 즉시 설치 (다운로드 불필요)
* **방법 B (파일 다운로드)**: 스크립트 코드를 직접 검토하거나 파일로 저장 후 `sudo bash ~/Downloads/파일명.sh` 로 실행

---

## 📌 주요 배포판별 전용 명령어

자동 감지 대신 특정 배포판 전용 스크립트를 바로 실행하려면 아래 명령어를 사용하세요. (전체 18개 패밀리, 190개 스크립트 지원)

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
<summary>📂 전체 지원 배포판 및 190개 스크립트 목록 펼치기</summary>

* **Debian / Ubuntu 계열 (75개)**: Mint, LMDE, Ubuntu, Kubuntu, Debian, Pop!_OS, Zorin OS, elementary OS, Sparky, Bodhi, Peppermint, Voyager, BunsenLabs, MX Linux, Kali, Parrot, Q4OS 등
* **Arch 계열 (41개)**: Arch Linux, EndeavourOS, Garuda, Manjaro, CachyOS, Mabox, Artix, BigLinux, Archcraft 등
* **Fedora 계열 (17개)**: Fedora Workstation(GNOME), KDE Spin, Xfce, Nobara, Ultramarine, Qubes OS(TemplateVM) 등
* **불변(Immutable) OS 계열 (9개)**: Bazzite, Fedora Silverblue/Kinoite, SteamOS 3.x, Vanilla OS 등
* **openSUSE 계열 (9개)**: Tumbleweed, Leap, MicroOS, Slowroll, Aeon 등
* **NixOS 계열 (6개)**: GNOME, KDE, Hyprland, Sway, Minimal 등
* **엔터프라이즈 RHEL 계열 (5개)**: RHEL, Rocky Linux, AlmaLinux, CentOS Stream, Oreon (`ibus-hangul` 표준 구성)
* **독립/경량 배포판 (24개)**: Void Linux, Alpine Linux, Solus, Gentoo, Mageia, KaOS, Guix 등
* **kime 대안 입력기 (4개)**: Rust 기반의 `kime` 전용 스크립트 (Debian, Fedora, Arch, openSUSE)

</details>

---

## ⚙️ 자동 처리 및 핵심 기능

이 스크립트는 단순 패키지 설치에 그치지 않고, 한글 입력에 필요한 시스템 전반의 설정을 완결합니다:

1. **충돌 방지**: 기존 구버전 fcitx4 잔여 패키지 정리 및 ibus 데몬 충돌 자동 비활성화
2. **입력기 & Noto CJK 한글 폰트 설치**: 한글 깨짐(□ 네모 박스 현상) 방지 폰트 동시 설치
3. **환경변수 및 세션 자동 구성**: Wayland 및 X11 환경에 맞는 `GTK_IM_MODULE`, `QT_IM_MODULE`, `XMODIFIERS` 주입
4. **기본 프로필 사전 구성**: `영문(US)` + `한글(Hangul)` 레이아웃 및 `한/영`, `Ctrl+Space`, `Shift+Space` 전환 단축키 자동 등록
5. **재부팅 후 1회성 안내 팝업**: 설치 후 첫 로그인 시 바탕화면에 필수 단축키 및 데스크톱별 추가 설정 팁을 1회 안내한 뒤 자동 삭제

---

## ❓ 자주 묻는 질문 (FAQ)

### Q1. 한/영 키를 눌러도 한글 전환이 안 됩니다 (오른쪽 Alt 키보드).
일반 영문 배열 키보드나 일부 노트북은 오른쪽 Alt 키가 `Hangul`이 아닌 `Alt_R` 키코드로 전달됩니다.
1. 터미널에서 `fcitx5-configtool`을 실행합니다.
2. **전역 옵션(Global Options)** → **입력기 전환(Trigger Input Method)** 항목을 클릭합니다.
3. 원하는 전환키(오른쪽 Alt 등)를 누르고 **적용(Apply)**합니다.

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

## 📦 대안 바이너리 실행 파일 (`hangul-installer`)

인터넷 파이프라인(`curl | bash`) 없이 오프라인 실행 파일이 필요한 경우, [GitHub Releases](https://github.com/stream9k/korean_input/releases/latest)에서 빌드된 단일 실행 파일을 받아 실행할 수 있습니다:

```bash
# x86_64 PC 환경
curl -LO https://github.com/stream9k/korean_input/releases/latest/download/hangul-installer-linux-amd64
chmod +x hangul-installer-linux-amd64
./hangul-installer-linux-amd64
```

---

## 🤝 참고 프로젝트 & 라이선스

이 프로젝트는 오픈소스 커뮤니티의 검증된 설정 가이드와 선행 프로젝트들을 참고하여 제작되었습니다:
* [ArchWiki Localization/Korean](https://wiki.archlinux.org/title/Localization/Korean) · [Fedora Wiki I18N/Fcitx5](https://fedoraproject.org/wiki/I18N/Fcitx5)
* [linuxmint-fcitx5-cjk-fix](https://github.com/kylechoidev/linuxmint-fcitx5-cjk-fix) · [linux-hangul-input-setup](https://github.com/ppugend/linux-hangul-input-setup) · [fedora42-fcitx5-guide](https://github.com/StrKare/fedora42-fcitx5-guide) · [Hangul-fixer](https://github.com/kernalix7/Hangul-fixer)

본 프로젝트는 **[MIT License](LICENSE)** 하에 자유롭게 사용 및 수정, 배포하실 수 있습니다.
자세한 개발 로드맵과 아키텍처는 [PROJECT_HANGUL_INSTALLER.md](PROJECT_HANGUL_INSTALLER.md)를 참고하세요.
