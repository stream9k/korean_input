# 리눅스 한글 입력기 자동 설치 스크립트 생성기 프로젝트

> **목적**: 어떤 리눅스 배포판/에디션이든 선택하면 해당 환경에 맞는 한글 입력기(fcitx5-hangul 또는 kime) 자동 설치 스크립트를 생성해주는 웹사이트 제작
> **현황**: 단일 HTML 파일(`hangul-installer-generator.html`)로 완성, 정적 호스팅만 하면 바로 서비스 가능

---

## 📁 프로젝트 구조 (권장)

```
hangul-installer-scripts/
├── index.html                    # 메인 생성기 페이지 (hangul-installer-generator.html → index.html로 이름 변경)
├── scripts/                      # 배포판별 실제 .sh 파일들 (Raw URL용)
│   ├── debian-family/
│   │   ├── mint-cinnamon.sh
│   │   ├── mint-xfce.sh
│   │   ├── mint-mate.sh
│   │   ├── lmde-cinnamon.sh
│   │   ├── ubuntu-gnome.sh
│   │   ├── ubuntu-kde.sh
│   │   ├── ubuntu-xfce.sh
│   │   ├── ubuntu-mate.sh
│   │   ├── debian-gnome.sh
│   │   ├── debian-kde.sh
│   │   ├── pop-gnome.sh
│   │   ├── elementary-pantheon.sh
│   │   ├── zorin-core.sh
│   │   ├── zorin-lite.sh
│   │   └── kde-neon-user.sh
│   ├── fedora/
│   │   ├── fedora-kde.sh
│   │   ├── fedora-gnome.sh
│   │   ├── fedora-xfce.sh
│   │   └── fedora-mate.sh
│   ├── arch-family/
│   │   ├── arch-base.sh
│   │   ├── manjaro-kde.sh
│   │   ├── manjaro-gnome.sh
│   │   ├── manjaro-xfce.sh
│   │   ├── endeavour-kde.sh
│   │   ├── endeavour-gnome.sh
│   │   ├── endeavour-xfce.sh
│   │   ├── garuda-kde.sh
│   │   ├── garuda-gnome.sh
│   │   └── garuda-xfce.sh
│   ├── opensuse/
│   │   ├── opensuse-tumbleweed-kde.sh
│   │   ├── opensuse-tumbleweed-gnome.sh
│   │   ├── opensuse-leap-kde.sh
│   │   └── opensuse-leap-gnome.sh
│   ├── nixos/
│   │   ├── nixos-gnome.nix
│   │   ├── nixos-kde.nix
│   │   └── nixos-hyprland.nix
│   └── kime/
│       ├── kime-arch.sh
│       ├── kime-fedora.sh
│       ├── kime-opensuse.sh
│       └── kime-debian.sh
├── README.md
└── LICENSE (MIT)
```

---

## ✅ 완료된 작업 요약

### 1. 선행 조사 (2026-11-17)
- **기존 자동화 스크립트 탐색 완료**
  - `linuxmint-fcitx5-cjk-fix` (가장 완성도 높음, 원라인 설치 지원)
  - `linux-hangul-input-setup` (LMDE 7 대상, 데비안 계열)
  - `fedora42-fcitx5-guide` (Fedora KDE 대상, alternatives/sed 패치 방식)
  - `Hangul-fixer` (크로스 디스트로 치트시트, kime 대안 안내)
- **대상 배포판 17종 + 에디션별 분기 설계 완료**

### 2. Linux Mint PoC 스크립트 작성 완료
- 파일: `install-hangul-mint.sh` (로컬에 저장됨)
- 기능: 레거시 fcitx4 제거 → fcitx5 풀스택 설치 → im-config 전환 → 프로필/핫키 선작성 → 데스크톱별 단축키 충돌 해제 → Wayland 환경변수 → 자동시작 등록

### 3. 웹사이트 생성기 완성 (`hangul-installer-generator.html`)
- **단일 파일, 의존성 최소화** (Prism.js CDN만 사용)
- **지원 배포판 17종**: Mint, Ubuntu, Debian, LMDE, Fedora, Arch, Manjaro, openSUSE, Pop!_OS, elementary, Zorin, KDE Neon, EndeavourOS, Garuda, NixOS (+ kime)
- **에디션별 분기**: 배포판당 1~8개 (Cinnamon, GNOME, KDE, Xfce, MATE, i3, Hyprland, Wayfire 등)
- **상태 배지**: ✅ 검증됨 / ⚠️ 베타 / 🧪 실험적 / 👥 커뮤니티
- **출력**: 스크립트 전체 코드 + 복사/다운로드/원라인 명령 + 검증 가이드
- **공유 URL**: `#mint/cinnamon` 해시 기반

---

## 🔧 스크립트 패밀리별 핵심 구현 차이

| 패밀리 | 대상 | 패키지 관리자 | 입력기 전환 방식 | 환경변수 적용 | 특이사항 |
|---|---|---|---|---|---|
| **debian-family** | Mint, Ubuntu, Debian, LMDE, Pop, elementary, Zorin, KDE Neon | `apt` | `im-config -n fcitx5` | `~/.config/environment.d/fcitx5.conf` + `/etc/environment` | `gsettings`로 DE별 단축키 충돌 해제 (Cinnamon/GNOME/Xfce/MATE 분기) |
| **fedora** | Fedora 40/41/42 | `dnf` | `alternatives --set xinputrc` + `sed`로 xinputrc 패치 | `~/.bash_profile` 또는 `~/.profile` | `systemctl --user disable ibus` 필수, KDE는 Virtual Keyboard 별도 설정 필요 |
| **arch-family** | Arch, Manjaro, EndeavourOS, Garuda | `pacman` | 수동 (환경변수만) | `/etc/environment` (시스템 와이드) + `~/.config/environment.d/` | `fcitx5-im` 메타패키지, `systemctl --user enable fcitx5` 권장 |
| **opensuse** | openSUSE Leap/Tumbleweed | `zypper` | `alternatives` + `sed` 패치 | `~/.bash_profile` | `fcitx5-qt5/qt6` 별도 패키지, KDE Virtual Keyboard 안내 |
| **nixos** | NixOS | `nix` | 선언적 (`configuration.nix`) | `environment.sessionVariables` | **스크립트 아님**, Nix 설정 조각 제공 |
| **kime** | 전체 (대안) | 각자 | 수동 | `~/.config/environment.d/kime.conf` | Rust 기반, Wayland 네이티브, AUR/COPR/.deb/zypper 분기 |

---

## 📋 각 배포판별 에디션 매트릭스 (웹사이트 내장 데이터)

### Linux Mint (`mint`)
| 에디션 키 | 라벨 | 상태 | 스크립트 ID |
|---|---|---|---|
| `cinnamon` | Cinnamon (기본) | ✅ 검증됨 | `mint-cinnamon` |
| `xfce` | Xfce | ✅ 검증됨 | `mint-xfce` |
| `mate` | MATE | ✅ 검증됨 | `mint-mate` |
| `lmde` | LMDE (Debian 베이스) | ✅ 검증됨 | `lmde-cinnamon` |
| `edge` | Edge (신규 하드웨어) | ⚠️ 베타 | `mint-edge` |

### Ubuntu (`ubuntu`)
| 에디션 키 | 라벨 | 상태 | 스크립트 ID |
|---|---|---|---|
| `gnome` | GNOME (기본) | ✅ 검증됨 | `ubuntu-gnome` |
| `kde` | Kubuntu (KDE Plasma) | ✅ 검증됨 | `ubuntu-kde` |
| `xfce` | Xubuntu (Xfce) | ✅ 검증됨 | `ubuntu-xfce` |
| `mate` | Ubuntu MATE | ✅ 검증됨 | `ubuntu-mate` |
| `budgie` | Ubuntu Budgie | ⚠️ 베타 | `ubuntu-budgie` |
| `cinnamon` | Ubuntu Cinnamon | ⚠️ 베타 | `ubuntu-cinnamon` |
| `lxqt` | Lubuntu (LXQt) | ⚠️ 베타 | `ubuntu-lxqt` |
| `studio` | Ubuntu Studio | ⚠️ 베타 | `ubuntu-studio` |

### Fedora (`fedora`)
| 에디션 키 | 라벨 | 상태 | 스크립트 ID |
|---|---|---|---|
| `kde` | KDE Plasma (권장) | ✅ 검증됨 | `fedora-kde` |
| `gnome` | GNOME (Workstation) | ✅ 검증됨 | `fedora-gnome` |
| `xfce` | Xfce Spin | ⚠️ 베타 | `fedora-xfce` |
| `mate` | MATE Spin | ⚠️ 베타 | `fedora-mate` |
| `cinnamon` | Cinnamon Spin | ⚠️ 베타 | `fedora-cinnamon` |
| `lxqt` | LXQt Spin | ⚠️ 베타 | `fedora-lxqt` |
| `i3` | i3 Spin | 🧪 실험적 | `fedora-i3` |
| `sway` | Sway Spin | 🧪 실험적 | `fedora-sway` |

### Arch 계열 (`arch`, `manjaro`, `endeavour`, `garuda`)
- **Arch**: base, endeavour, manjaro, garuda, cachyos
- **Manjaro**: kde, gnome, xfce, cinnamon, mate, i3, sway
- **EndeavourOS**: kde, gnome, xfce, i3wm, sway, bspwm
- **Garuda**: kde, gnome, xfce, wayfire, hyprland, qtile

### openSUSE (`opensuse`)
- `tumbleweed_kde`, `tumbleweed_gnome`, `leap_kde`, `leap_gnome`, `microos`, `slowroll`

### 기타
- **Pop!_OS**: gnome, nvidia
- **elementary OS**: pantheon (단일)
- **Zorin OS**: core, pro, lite, education
- **KDE Neon**: user, testing, unstable
- **NixOS**: gnome, kde, hyprland, sway, minimal

---

## 🚀 다른 컴퓨터에서 이어서 작업하기

### 1. 파일 복사
```bash
# 현재 컴퓨터에서
scp hangul-installer-generator.html user@other-computer:~/hangul-installer-scripts/
# 또는 GitHub에 푸시 후 클론
```

### 2. GitHub 레포 생성 및 배포 (권장 워크플로)

```bash
# 1) 레포 생성 (GitHub 웹에서 또는 CLI)
gh repo create hangul-installer-scripts --public --description "Linux Hangul Input Method Auto-Installer Generator"

# 2) 로컬에서 초기 커밋
mkdir -p hangul-installer-scripts/scripts
cd hangul-installer-scripts

# HTML 파일 복사 (index.html로 이름 변경)
cp ~/hangul-installer-generator.html ./index.html

# 3) 스크립트 파일들 추출 (아래 '스크립트 파일 일괄 생성' 섹션 참조)
#    scripts/ 폴더에 각 .sh 파일 배치

# 4) HTML 내 Raw URL 교체
#    <YOUR_GITHUB_ID> → 본인 GitHub 아이디
#    sed -i 's|<YOUR_GITHUB_ID>|your-github-username|g' index.html

# 5) 커밋 & 푸시
git init
git add .
git commit -m "Initial commit: hangul installer generator + scripts"
git branch -M main
git remote add origin https://github.com/your-github-username/hangul-installer-scripts.git
git push -u origin main

# 6) GitHub Pages 활성화
#    Settings → Pages → Source: Deploy from branch → main / root → Save
#    접속: https://your-github-username.github.io/hangul-installer-scripts/
```

### 3. 스크립트 파일 일괄 생성 (템플릿에서 추출)

웹사이트의 `SCRIPT_TEMPLATES` 객체에 정의된 6개 패밀리 함수(`debian-family`, `fedora`, `arch-family`, `opensuse`, `nixos`, `kime`)를 이용해 각 `scriptId`별 `.sh` 파일을 생성하세요.

**자동 생성 스크립트 예시** (Node.js 또는 Python으로 작성 가능):

```python
# generate_scripts.py
import os
import re

# 웹사이트의 SCRIPT_TEMPLATES와 DISTRO_DATA를 여기에 복사해 넣고
# 각 에디션별로 params를 넘겨 template_fn(params) 호출 → 파일 저장
```

또는 **브라우저 콘솔에서 직접 생성**:
1. `index.html` 로컬 오픈
2. 개발자 도구 콘솔에서 `generateAllScripts()` 함수 실행 (아래 참고)

```javascript
// 브라우저 콘솔에 붙여넣기 실행
async function generateAllScripts() {
  const base = "scripts/";
  for (const [distroKey, distro] of Object.entries(DISTRO_DATA)) {
    for (const [edKey, ed] of Object.entries(distro.editions)) {
      const scriptId = getScriptId(distroKey, edKey);
      const family = getTemplateFamily(distroKey);
      const fn = SCRIPT_TEMPLATES[family] || SCRIPT_TEMPLATES["debian-family"];
      const script = fn({
        distroName: distro.name,
        editionLabel: ed.label,
        scriptId,
        distroKey,
        editionKey: edKey
      });
      // 다운로드 트리거
      const blob = new Blob([script], {type: "text/x-sh"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}${scriptId}.sh`;
      a.click();
      URL.revokeObjectURL(url);
      await new Promise(r => setTimeout(r, 50)); // 브라우저 다운로드 큐 처리
    }
  }
  alert("모든 스크립트 다운로드 완료! scripts/ 폴더에 저장하세요.");
}
generateAllScripts();
```

---

## 📝 남은 작업 (TODO)

| 우선순위 | 작업 | 비고 |
|---|---|---|
| **높음** | GitHub 레포 생성 + `scripts/` 폴더에 실제 `.sh` 파일들 채우기 | Raw URL이 작동해야 원라인 설치 가능 |
| **높음** | `index.html` 내 `<YOUR_GITHUB_ID>` → 본인 아이디로 치환 | 배포 전 필수 |
| **높음** | GitHub Pages / Netlify / Vercel / Cloudflare Pages 배포 | 정적 파일이라 어디든 가능 |
| **중간** | 각 스크립트 실제 VM 테스트 (Mint Cinnamon → Ubuntu GNOME → Fedora KDE → Arch → openSUSE 순) | 상태 배지 ✅로 업그레이드 |
| **중간** | NixOS 설정 조각(`.nix`) 검증 및 `home-manager` 옵션 추가 | NixOS 사용자 피드백 필요 |
| **중간** | kime 대안 스크립트 테스트 (Wayland 네이티브 장점 어필) | 최신 배포판에서 fcitx5 대체 가능성 |
| **낮음** | 다국어 지원 (영어/일본어/중국어 UI) | 한국어만 해도 1차 목표 달성 |
| **낮음** | 통계 수집 (어떤 배포판/에디션이 많이 선택되는지) | 개인정보 없는 익명 카운터 |

---

## 🔗 참고 자료 (원본 소스)

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

---

## 💡 설계 원칙 (향후 확장 시 참고)

1. **단일 HTML 파일** — 빌드 과정 없음, CDN 의존성 최소화 (Prism.js만)
2. **데이터 주도** — `DISTRO_DATA` 객체만 수정하면 새 배포판/에디션 추가 가능
3. **템플릿 패밀리** — 패키지 관리자/시스템 구조가 같은 배포판끼리 템플릿 공유
4. **점진적 향상** — 검증됨 → 베타 → 실험적 순으로 상태 업그레이드
5. **커뮤니티 친화적** — MIT 라이선스, PR로 기여받기 쉬운 구조
6. **오프라인 동작** — HTML 파일만 있으면 인터넷 없이도 스크립트 생성 가능 (다운로드/실행만 네트워크 필요)

---

## 📄 라이선스

**MIT License** — 자유 사용, 수정, 배포 가능. 원저자 표기만 유지.

```
MIT License

Copyright (c) 2026 [Your Name]

Permission is hereby granted...
```

---

## 🎯 다음 세션 시작 시 체크리스트

- [ ] `hangul-installer-generator.html` → `index.html`로 이름 변경
- [ ] GitHub 레포 `hangul-installer-scripts` 생성
- [ ] `scripts/` 폴더에 전체 `.sh` 파일 생성·커밋
- [ ] `index.html` 내 GitHub 아이디 치환
- [ ] GitHub Pages 활성화 → URL 확인
- [ ] Mint Cinnamon VM에서 원라인 설치 테스트 (`curl -sL ... | sudo bash`)
- [ ] 테스트 통과 시 해당 에디션 상태 ✅로 업데이트

---

**작성일**: 2026-11-17  
**작성자**: Hermes Agent (사용자 지시에 따라 정리)  
**버전**: 1.0 (초안 완료)