// ──────────────────────────────────────────────────────────────
// UI 로직
// ──────────────────────────────────────────────────────────────
const distroSelect = document.getElementById("distroSelect");
const editionSelect = document.getElementById("editionSelect");
const editionTags = document.getElementById("editionTags");
const scriptCard = document.getElementById("scriptCard");
const verifyCard = document.getElementById("verifyCard");
const scriptTitle = document.getElementById("scriptTitle");
const scriptContent = document.querySelector("#scriptContent code");
const downloadBtn = document.getElementById("downloadBtn");
const badgesEl = document.getElementById("badges");
const scriptInfo = document.getElementById("scriptInfo");
const onelinerLabel = document.getElementById("onelinerLabel");
const oneliner = document.getElementById("oneliner");
const supportMatrix = document.getElementById("supportMatrix");
const toast = document.getElementById("toast");

let currentDistro = null;
let currentEdition = null;
let currentLang = "ko";
const FORCE_IME_KEYS = new Set(["fcitx5", "ibus", "kime"]);

const I18N = {
  ko: {
    pageTitle: "리눅스 한글 입력기 자동 설치 스크립트 생성기",
    heroTitle: "한글 입력기 자동 설치 스크립트",
    heroSubtitle: "배포판과 에디션을 선택하면 맞춤 스크립트를 생성해 드립니다.",
    shortUrlTitle: "단축 주소",
    heroTitleTooltip: "초기 화면으로 돌아가기",
    step0Title: "⚡ 0단계: 배포판 선택 없이 한 줄 자동 설치 (권장)",
    step0Desc: "<code>git</code> 설치도, 실행 권한(<code>chmod +x</code>) 변경도 필요 없습니다. 터미널에 아래 명령어 한 줄만 붙여넣으면 사용 중인 배포판(Garuda, Arch, Mint, Ubuntu, Fedora 등)을 자동 감지해 설치합니다. <strong style=\"color:var(--success);\">대부분 0단계 스크립트로 한방에 설치가 끝나며, 설치가 완료되면 1단계로 가실 필요가 없습니다.</strong>",
    btnCopyAutoOneliner: "📋 원라인 복사",
    btnDownloadAuto: "⬇️ 만능 install.sh 다운로드",
    step0Hint: "💡 파일로 직접 받으신 경우 권한 변경(<code>chmod +x</code>) 없이 <code>sudo bash ~/Downloads/install.sh</code> 로 바로 실행할 수 있습니다.<br>💡 IBus를 선호하시는 경우 실행 확인 단계에서 <code>ibus</code>를 입력하거나 <code>--ibus</code> 옵션(<code>... | sudo bash -s -- --ibus</code>)을 전달하세요.",
    step1Kicker: "배포판/에디션 선택형",
    step1Title: "📋 1단계: 배포판 선택",
    searchLabel: "배포판·데스크톱 빠른 검색",
    searchPlaceholder: "배포판 또는 데스크톱 검색 (예: garuda, 가루다, mint, 민트, bazzite, kde...)",
    btnSearch: "🔍 검색",
    clearSearchBtn: "✕ 초기화",
    distroLabel: "배포판",
    distroPlaceholder: "-- 배포판 선택 --",
    editionLabel: "에디션 / 데스크톱",
    editionPlaceholderFirst: "-- 먼저 배포판 선택 --",
    editionPlaceholder: "-- 에디션 선택 --",
    step2Title: "📄 2단계: 설치 방법 선택 (방법 A 또는 방법 B 중 하나만 실행하세요)",
    step2Intro: "아래 <strong>방법 A</strong>(원라인 명령어로 터미널에서 즉시 실행)와 <strong>방법 B</strong>(파일로 다운로드하거나 복사해서 실행) 중 <strong>편한 방식 하나만 선택</strong>하여 실행하세요. (둘 다 하실 필요가 없습니다!)",
    methodATitle: "⚡ 방법 A: 터미널 한 줄 실행 (가장 추천 — 다운로드 불필요)",
    methodADesc: "터미널(Ctrl+Alt+T)을 열고 아래 명령어를 복사해 붙여넣으면 즉시 설치됩니다.",
    orDivider: "또는 (OR)",
    methodBTitle: "💾 방법 B: 스크립트 파일 직접 다운로드 / 코드 검토",
    methodBDesc: "스크립트 코드를 직접 검토하거나, 다운로드 폴더에서 파일로 직접 실행할 때 사용합니다.",
    btnCopyScript: "📋 복사",
    btnCopyOneliner: "📋 원라인 명령어 복사",
    downloadLabel: (ext) => `⬇️ 다운로드 (.${ext})`,
    step3Title: "✅ 3단계: 설치 후 검증",
    verifyCode: {
      fcitx5: `# 1. fcitx5 상세 진단 (재로그인 후 실행)\nfcitx5-diagnose\n\n# 2. 환경변수 확인 (fcitx 가 출력되어야 함)\nenv | grep -i im_module\n\n# 3. 프로세스 확인\npgrep -af fcitx5\n\n# 4. 설정 확인\ncat ~/.config/fcitx5/profile\ncat ~/.config/fcitx5/config\n\n# 5. 강제 재시작\nfcitx5 -r`,
      ibus: `# 1. ibus 데몬 프로세스 확인\npgrep -af ibus-daemon\n\n# 2. 환경변수 확인 (ibus 가 출력되어야 함)\nenv | grep -i im_module\n\n# 3. GNOME 입력 소스 한글 등록 확인\ngsettings get org.gnome.desktop.input-sources sources\n\n# 4. ibus 한글 엔진 등록 확인\nibus list-engine | grep hangul\n\n# 5. ibus 설정 창 열기 (단축키 및 세부 설정)\nibus-setup`,
      kime: `# 1. kime 시스템 상태 진단\nkime-check\n\n# 2. kime 프로세스 확인\npgrep -af kime\n\n# 3. 환경변수 확인\nenv | grep -i im_module\n\n# 4. kime 설정 파일 확인\ncat ~/.config/kime/config.yaml`
    },
    altKeyTipTitle: "💡 오른쪽 Alt 키 누를 때 Firefox 메뉴바(풀다운)와 한/영 전환이 동시에 작동하는 경우:",
    altKeyTipBody: "일부 노트북이나 키보드에서 오른쪽 Alt 키가 브라우저 메뉴 단축키(Alt)와 한/영 전환을 동시에 호출할 수 있습니다.<br><strong>해결 방법:</strong> 설정 → 키보드 → 키바인딩 (또는 레이아웃) → <strong>키보드 옵션 설정</strong> 체크 → <strong>한국어 한/영키 한자키</strong> → <strong>오른쪽 ALT키를 한/영키로 만들기</strong> 체크 후 적용하세요.",
    step4Title: "📚 지원 현황 확인 후 선택 / 입력기 강제 선택",
    forceImeOptgroup: "── ⌨️ 입력기 강제 선택 (배포판 무관 범용/대안 입력기) ──",
    forceImeSectionTitle: "⌨️ 입력기 강제 선택 (배포판 무관 범용/대안 입력기)",
    forceImeSectionDesc: "배포판별 기본 입력기 대신 원하는 한글 입력기를 직접 지정해 설치합니다.",
    forceImeTag: "입력기 강제 선택",
    legendImeBadge: "입력기 강제 선택 ⌨️",
    legendImeDesc: "배포판 무관 범용/대안 입력기",
    stickyNavAria: "페이지 탐색 및 언어 설정",
    stickyHomeDefault: "처음 화면",
    stickyHomeReset: "← 처음 화면 (선택 해제)",
    stickyHomeTooltip: "선택을 해제하고 초기 화면으로 돌아가기",
    stickyClearAria: "선택 해제 및 초기 화면으로 돌아가기",
    stickyClearTitle: "선택 해제",
    inlineResetBtn: "↺ 선택 해제 · 처음 화면",
    floatingHomeText: "처음 화면",
    floatingHomeTitle: "선택을 해제하고 초기 화면으로 돌아가기",
    backToTopText: "맨 위로",
    backToTopTitle: "맨 위로 이동",
    toastResetHome: "선택을 해제하고 초기 화면으로 돌아왔습니다",
    footerNote: "이 프로젝트들의 패키지 구성·설정 순서·예외 처리 로직을 참고해 템플릿을 만들었습니다.",
    thProject: "프로젝트",
    thPurpose: "용도",
    thLicense: "라이선스",
    thSource: "출처",
    footerMeta: "MIT License · 커뮤니티 기여 환영",
    badges: { verified: "검증됨 ✅", beta: "베타 ⚠️", experimental: "실험적 🧪", },
    infoLabels: { distro: "배포판", base: "베이스", pkgMgr: "패키지 관리자", imConfig: "입력기 설정", edition: "에디션", scriptId: "스크립트 ID" },
    nixOnelinerLabel: "NixOS 적용 방법 (/etc/nixos/configuration.nix 병합):",
    nixOnelinerBody: (rawUrl, file) => `# 1. 설정 파일 다운로드 또는 위 내용을 복사해 /etc/nixos/configuration.nix 에 병합\ncurl -sL ${rawUrl} -o ${file}\n\n# 2. 시스템 재빌드 및 적용\nsudo nixos-rebuild switch`,
    nixHint: "💡 <code>.nix</code> 파일은 실행 스크립트가 아니며 <code>/etc/nixos/configuration.nix</code> 에 병합해 적용합니다.",
    shOnelinerLabel: "원라인 설치 명령어 (git·chmod 불필요):",
    shHint: (shellCmd, file) => `💡 파일로 다운로드했다면 <code>chmod +x</code> 없이 <code>sudo ${shellCmd} ~/Downloads/${file}</code> 로 바로 실행하세요.`,
    matrixSummary: (v, b, e) => `검증: ${v} · 베타: ${b} · 실험적: ${e}`,
    matrixBadgeTitle: "클릭해서 바로 선택",
    searchNeedQuery: "검색어를 입력해 주세요",
    searchNoMatch: (q) => `'${q}'에 일치하는 배포판/에디션이 없습니다. 상단 0단계 만능 install.sh 를 사용하거나 다른 키워드로 검색해 보세요.`,
    searchNoMatchToast: "검색 결과가 없습니다",
    searchCountTop: (n) => `검색 결과 ${n}개 중 상위 30개 표시 (클릭하면 바로 스크립트 생성)`,
    searchCountAll: (n) => `검색 결과 ${n}개 (클릭하면 바로 스크립트 생성)`,
    toastSelected: (d, e) => `${d} · ${e} 선택됨`,
    toastAutoCopied: "만능 자동 설치 명령어가 복사되었습니다",
    toastOnelinerCopied: "원라인 명령어가 복사되었습니다",
    toastScriptCopied: "스크립트가 클립보드에 복사되었습니다",
    toastCopyFail: "복사 실패",
    toastAutoDownloaded: "install.sh 다운로드 완료 (sudo bash ~/Downloads/install.sh 로 실행)",
    toastAutoRequested: "install.sh 다운로드 요청됨 (sudo bash ~/Downloads/install.sh 로 실행)",
    toastScriptDownloaded: (f) => `${f} 다운로드 완료`
  },
  en: {
    pageTitle: "Linux Korean Input Method Auto-Installer Generator",
    heroTitle: "Linux Korean Input Method Installer",
    heroSubtitle: "Select your Linux distribution and edition to generate a tailored fcitx5-hangul, ibus-hangul, or kime setup script.",
    shortUrlTitle: "Short URL",
    heroTitleTooltip: "Reset to home",
    step0Title: "⚡ Step 0: One-Line Auto-Detect Installer (Recommended)",
    step0Desc: "No <code>git</code> required, no <code>chmod +x</code> needed. Paste this single command into your terminal to auto-detect your distro (Garuda, Arch, Mint, Ubuntu, Fedora, etc.) and install Korean input + Noto CJK fonts. <strong style=\"color:var(--success);\">For most users, this Step 0 script finishes everything in one shot — if it succeeds, you do not need to proceed to Step 1.</strong>",
    btnCopyAutoOneliner: "📋 Copy One-Liner",
    btnDownloadAuto: "⬇️ Download install.sh",
    step0Hint: "💡 If you downloaded the file manually, run <code>sudo bash ~/Downloads/install.sh</code> directly without <code>chmod +x</code>.<br>💡 Prefer IBus? Type <code>ibus</code> at the confirmation prompt or pass <code>--ibus</code> (<code>... | sudo bash -s -- --ibus</code>).",
    step1Kicker: "Distro / Edition Selection",
    step1Title: "📋 Step 1: Select Distribution",
    searchLabel: "Quick Search (Distro / Desktop)",
    searchPlaceholder: "Search distro or desktop (e.g. garuda, mint, bazzite, kde, 가루다...)",
    btnSearch: "🔍 Search",
    clearSearchBtn: "✕ Clear",
    distroLabel: "Distribution",
    distroPlaceholder: "-- Select Distribution --",
    editionLabel: "Edition / Desktop",
    editionPlaceholderFirst: "-- Select Distribution First --",
    editionPlaceholder: "-- Select Edition --",
    step2Title: "📄 Step 2: Choose Installation Method (Choose Option A OR Option B)",
    step2Intro: "Choose <strong>Option A</strong> (One-liner directly in terminal) or <strong>Option B</strong> (Download/copy script file) — <strong>execute only one of them</strong>.",
    methodATitle: "⚡ Option A: Terminal One-Liner (Recommended — No Download Needed)",
    methodADesc: "Open terminal (Ctrl+Alt+T) and paste this single command to install immediately.",
    orDivider: "OR",
    methodBTitle: "💾 Option B: Run Downloaded Script File / Inspect Code",
    methodBDesc: "Use this if you prefer inspecting the shell code or running the script from a downloaded file.",
    btnCopyScript: "📋 Copy",
    btnCopyOneliner: "📋 Copy One-Liner",
    downloadLabel: (ext) => `⬇️ Download (.${ext})`,
    step3Title: "✅ Step 3: Post-Install Verification",
    verifyCode: {
      fcitx5: `# 1. fcitx5 diagnostics (run after re-login)\nfcitx5-diagnose\n\n# 2. Check environment variables (should show fcitx)\nenv | grep -i im_module\n\n# 3. Check running process\npgrep -af fcitx5\n\n# 4. Inspect config files\ncat ~/.config/fcitx5/profile\ncat ~/.config/fcitx5/config\n\n# 5. Force restart\nfcitx5 -r`,
      ibus: `# 1. Check ibus daemon process\npgrep -af ibus-daemon\n\n# 2. Check environment variables (should show ibus)\nenv | grep -i im_module\n\n# 3. Check GNOME input sources\ngsettings get org.gnome.desktop.input-sources sources\n\n# 4. Check ibus Hangul engine\nibus list-engine | grep hangul\n\n# 5. Open ibus setup dialog\nibus-setup`,
      kime: `# 1. Run kime system diagnostics\nkime-check\n\n# 2. Check kime process\npgrep -af kime\n\n# 3. Check environment variables\nenv | grep -i im_module\n\n# 4. Inspect kime config file\ncat ~/.config/kime/config.yaml`
    },
    altKeyTipTitle: "💡 Right Alt Conflict (Firefox menu dropdown & Korean toggle both triggering):",
    altKeyTipBody: "On some laptops or US keyboards, Right Alt triggers the browser menu bar while toggling Korean.<br><strong>Fix:</strong> Settings → Keyboard → Keybindings (or Layout) → <strong>Keyboard Options</strong> → <strong>Korean Hangul/Hanja keys</strong> → check <strong>Make Right Alt a Hangul key</strong> → Apply.",
    step4Title: "📚 Select by Support Status / Force Input Method",
    forceImeOptgroup: "── ⌨️ Force Input Method (Universal / Alternative IMEs) ──",
    forceImeSectionTitle: "⌨️ Force Input Method (Distro-Independent Universal / Alternative IMEs)",
    forceImeSectionDesc: "Directly install a specific Korean input method instead of the distro default.",
    forceImeTag: "Force IME",
    legendImeBadge: "Force IME ⌨️",
    legendImeDesc: "Distro-independent universal / alternative IME",
    stickyNavAria: "Page navigation and language settings",
    stickyHomeDefault: "Home",
    stickyHomeReset: "← Home (Reset)",
    stickyHomeTooltip: "Clear selection and return to home",
    stickyClearAria: "Clear selection and return to home",
    stickyClearTitle: "Clear selection",
    inlineResetBtn: "↺ Clear · Home",
    floatingHomeText: "Home",
    floatingHomeTitle: "Clear selection and return to home",
    backToTopText: "Top",
    backToTopTitle: "Scroll to top",
    toastResetHome: "Selection cleared — returned to home",
    footerNote: "Templates were created by referencing package setups, configuration order, and edge-case handling from these projects.",
    thProject: "Project",
    thPurpose: "Purpose",
    thLicense: "License",
    thSource: "Source",
    footerMeta: "MIT License · Community Contributions Welcome",
    badges: { verified: "Verified ✅", beta: "Beta ⚠️", experimental: "Experimental 🧪", },
    infoLabels: { distro: "Distro", base: "Base", pkgMgr: "Package Manager", imConfig: "IM Config", edition: "Edition", scriptId: "Script ID" },
    nixOnelinerLabel: "NixOS Setup (Merge into /etc/nixos/configuration.nix):",
    nixOnelinerBody: (rawUrl, file) => `# 1. Download snippet or copy above into /etc/nixos/configuration.nix\ncurl -sL ${rawUrl} -o ${file}\n\n# 2. Rebuild and switch\nsudo nixos-rebuild switch`,
    nixHint: "💡 <code>.nix</code> is declarative configuration, not a shell script. Merge it into <code>/etc/nixos/configuration.nix</code>.",
    shOnelinerLabel: "One-Line Install Command (No git / chmod needed):",
    shHint: (shellCmd, file) => `💡 If downloaded locally, run <code>sudo ${shellCmd} ~/Downloads/${file}</code> without <code>chmod +x</code>.`,
    matrixSummary: (v, b, e) => `Verified: ${v} · Beta: ${b} · Experimental: ${e}`,
    matrixBadgeTitle: "Click to select this edition",
    searchNeedQuery: "Please enter a search keyword",
    searchNoMatch: (q) => `No distributions or editions matched '${q}'. Try the Step 0 universal install.sh above or another keyword.`,
    searchNoMatchToast: "No matching results",
    searchCountTop: (n) => `Showing top 30 of ${n} matches (click to generate script)`,
    searchCountAll: (n) => `${n} match(es) found (click to generate script)`,
    toastSelected: (d, e) => `Selected ${d} · ${e}`,
    toastAutoCopied: "Auto-detect one-liner copied to clipboard",
    toastOnelinerCopied: "One-liner command copied to clipboard",
    toastScriptCopied: "Script copied to clipboard",
    toastCopyFail: "Copy failed",
    toastAutoDownloaded: "Downloaded install.sh (run: sudo bash ~/Downloads/install.sh)",
    toastAutoRequested: "Download started for install.sh (run: sudo bash ~/Downloads/install.sh)",
    toastScriptDownloaded: (f) => `Downloaded ${f}`
  }
};

function tLabel(str) {
  if (currentLang !== "en" || typeof str !== "string") return str;
  return str
    .replace("(기본 권장)", "(Recommended Default)")
    .replace("(기본)", "(Default)")
    .replace("(단일 에디션)", "(Single Edition)")
    .replace("(단일)", "(Single)")
    .replace("(직접 구성)", "(Manual Setup)")
    .replace("(사전 구성 많음)", "(Rich Pre-config)")
    .replace("(사전 구성)", "(Pre-configured)")
    .replace("(별도 항목 참조)", "(See dedicated entry)")
    .replace("(온라인 선택)", "(Online Installer)")
    .replace("(온라인 인스톨러)", "(Online Installer)")
    .replace("(신규 하드웨어 커널)", "(HWE Kernel)")
    .replace("(COSMIC 곧 전환)", "(COSMIC upcoming)")
    .replace("(동일)", "(Same as GNOME)")
    .replace("(레이아웃 선택 가능)", "(Layout options)")
    .replace("(서버/헤드리스)", "(Server/Headless)")
    .replace("(불변 GNOME)", "(Immutable GNOME)")
    .replace("(불변 Debian)", "(Immutable Debian)")
    .replace("(불변 OS)", "(Immutable OS)")
    .replace("(함수형, 설정 파일 기반)", "(Functional, Declarative)")
    .replace("(GNU 함수형)", "(GNU Functional)")
    .replace("(소스 기반)", "(Source-based)")
    .replace("(Portage 기반)", "(Portage-based)")
    .replace("(KDE/Qt 전용)", "(KDE/Qt only)")
    .replace("(Non-systemd / SysVinit 지원)", "(Non-systemd / SysVinit supported)")
    .replace("(Non-systemd 포함)", "(incl. Non-systemd)")
    .replace("(Bluefin 기반)", "(Bluefin-based)")
    .replace("(Alma 기반 데스크톱)", "(Alma-based Desktop)")
    .replace("(Alpine 기반)", "(Alpine-based)")
    .replace("(Rust 기반 대안 입력기)", "(Rust Alternative IME)")
    .replace("fcitx5-hangul (표준 범용 한글 입력기)", "fcitx5-hangul (Standard Universal IME)")
    .replace("크로스 배포판 표준 한글 입력기", "Cross-distro Standard Korean IME")
    .replace("ibus-hangul (GNOME 친화 대안 입력기)", "ibus-hangul (GNOME-friendly Alternative IME)")
    .replace("GNOME 네이티브 통합 / 대안 입력기", "GNOME-native Integration / Alternative IME")
    .replace("kime (Rust 기반 경량 입력기)", "kime (Lightweight Rust IME)")
    .replace("Wayland 네이티브 대안 입력기", "Wayland-native Alternative IME")
    .replace("소스 빌드(EL)", "Source Build (EL)")
    .replace("(소스 빌드)", "(Source Build)")
    .replace("Ubuntu/Debian 주요 파생", "Ubuntu/Debian Derivatives")
    .replace("Ubuntu / Debian 주요 파생", "Ubuntu / Debian Derivatives")
    .replace("보안 데비안", "Security Debian")
    .replace("파생", "Derivatives")
    .replace("베이스", "Base")
    .replace("계열", "Family")
    .replace("업스트림", "Upstream")
    .replace("수동", "Manual")
    .replace("환경변수", "env vars")
    .replace("에서 선언적 설정", "declarative config")
    .replace("연동", "integration")
    .replace("해제", "unlock")
    .replace("등", "etc.");
}

function detectInitialLang() {
  try {
    const qp = new URLSearchParams(location.search).get("lang");
    if (qp === "en" || qp === "ko") return qp;
  } catch {}
  const defLang = document.documentElement.dataset.defaultLang;
  if (defLang === "en" || defLang === "ko") return defLang;
  try {
    const saved = localStorage.getItem("hangul_installer_lang");
    if (saved === "en" || saved === "ko") return saved;
  } catch {}
  const navLangs = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language || "ko"];
  return String(navLangs[0] || "ko").toLowerCase().startsWith("ko") ? "ko" : "en";
}

function applyTranslations() {
  const t = I18N[currentLang];
  document.documentElement.lang = currentLang;
  document.title = t.pageTitle;

  document.getElementById("btnLangKo").classList.toggle("active", currentLang === "ko");
  document.getElementById("btnLangEn").classList.toggle("active", currentLang === "en");
  const shortUrlLink = document.getElementById("shortUrlLink");
  if (shortUrlLink) shortUrlLink.title = t.shortUrlTitle;

  const heroTitleEl = document.getElementById("heroTitle");
  heroTitleEl.textContent = t.heroTitle;
  heroTitleEl.title = t.heroTitleTooltip;
  document.getElementById("heroSubtitle").textContent = t.heroSubtitle;
  document.getElementById("step0Title").textContent = t.step0Title;
  document.getElementById("step0Desc").innerHTML = t.step0Desc;
  document.getElementById("btnCopyAutoOneliner").textContent = t.btnCopyAutoOneliner;
  document.getElementById("btnDownloadAuto").textContent = t.btnDownloadAuto;
  document.getElementById("step0Hint").innerHTML = t.step0Hint;

  const step1Kicker = document.getElementById("step1Kicker");
  if (step1Kicker) step1Kicker.textContent = t.step1Kicker;
  const step1HeadingMain = document.getElementById("step1HeadingMain");
  if (step1HeadingMain) step1HeadingMain.textContent = t.step1Title;
  document.getElementById("searchLabel").textContent = t.searchLabel;
  document.getElementById("distroSearchInput").placeholder = t.searchPlaceholder;
  document.getElementById("btnSearch").textContent = t.btnSearch;
  document.getElementById("clearSearchBtn").textContent = t.clearSearchBtn;
  document.getElementById("distroLabel").textContent = t.distroLabel;
  document.getElementById("distroPlaceholderOpt").textContent = t.distroPlaceholder;
  document.getElementById("editionLabel").textContent = t.editionLabel;
  const hintEl = document.getElementById("editionHintText");
  if (hintEl) hintEl.textContent = currentLang === "en" ? "Click your desktop environment" : "원하시는 데스크톱을 클릭하세요";

  const optgroupForceIme = document.getElementById("optgroupForceIme");
  if (optgroupForceIme) optgroupForceIme.label = t.forceImeOptgroup;

  Array.from(distroSelect.options).forEach(opt => {
    if (!opt.value) return;
    if (!opt.dataset.koLabel) opt.dataset.koLabel = opt.textContent;
    opt.textContent = currentLang === "en" ? tLabel(opt.dataset.koLabel) : opt.dataset.koLabel;
  });

  document.getElementById("step2Title").textContent = t.step2Title;
  document.getElementById("step2Intro").innerHTML = t.step2Intro;
  document.getElementById("methodATitle").textContent = t.methodATitle;
  document.getElementById("methodADesc").textContent = t.methodADesc;
  document.getElementById("orDivider").textContent = t.orDivider;
  document.getElementById("methodBTitle").textContent = t.methodBTitle;
  document.getElementById("methodBDesc").textContent = t.methodBDesc;
  document.getElementById("btnCopyScript").textContent = t.btnCopyScript;
  document.getElementById("btnCopyOneliner").textContent = t.btnCopyOneliner;
  document.getElementById("step3Title").textContent = t.step3Title;
  const verifyBlock = document.getElementById("verifyCodeBlock");
  if (verifyBlock) {
    let imType = "fcitx5";
    if (currentDistro) {
      const dKey = distroSelect ? distroSelect.value : "";
      const tf = typeof getTemplateFamily === "function" ? getTemplateFamily(dKey) : "";
      if (tf === "rhel-family" || tf === "ibus" || dKey === "ibus") imType = "ibus";
      else if (dKey === "kime") imType = "kime";
    }
    verifyBlock.textContent = t.verifyCode[imType] || t.verifyCode.fcitx5;
  }
  const tipTitle = document.getElementById("altKeyTipTitle");
  if (tipTitle) tipTitle.textContent = t.altKeyTipTitle;
  const tipBody = document.getElementById("altKeyTipBody");
  if (tipBody) tipBody.innerHTML = t.altKeyTipBody;
  document.getElementById("step4Title").textContent = t.step4Title;
  const legTitle = document.getElementById("legendTitle");
  if (legTitle) legTitle.textContent = currentLang === "en" ? "Status Legend:" : "색상 / 상태 구분:";
  const legV = document.getElementById("legendVerifiedDesc");
  if (legV) legV.textContent = currentLang === "en" ? "Most stable & recommended" : "가장 안정적인 권장 환경";
  const legB = document.getElementById("legendBetaDesc");
  if (legB) legB.textContent = currentLang === "en" ? "Standard reliable" : "표준 신뢰 단계";
  const legE = document.getElementById("legendExpDesc");
  if (legE) legE.textContent = currentLang === "en" ? "Manual setup / special" : "수동 설정/특수 환경";
  const legC = document.getElementById("legendCommDesc");
  if (legC) legC.textContent = currentLang === "en" ? "Dedicated section" : "별도 전용 항목";
  const legImeBadge = document.getElementById("legendImeBadge");
  if (legImeBadge) legImeBadge.textContent = t.legendImeBadge;
  const legImeDesc = document.getElementById("legendImeDesc");
  if (legImeDesc) legImeDesc.textContent = t.legendImeDesc;

  const topNavBar = document.getElementById("topNavBar");
  if (topNavBar) topNavBar.setAttribute("aria-label", t.stickyNavAria);
  const stickyHomeLink = document.getElementById("stickyHomeLink");
  if (stickyHomeLink) stickyHomeLink.title = t.stickyHomeTooltip;
  const btnStickyClear = document.getElementById("btnStickyClear");
  if (btnStickyClear) {
    btnStickyClear.setAttribute("aria-label", t.stickyClearAria);
    btnStickyClear.title = t.stickyClearTitle;
  }
  const inlineResetBtn = document.getElementById("inlineResetBtn");
  if (inlineResetBtn) inlineResetBtn.textContent = t.inlineResetBtn;
  const floatingHomeBtn = document.getElementById("floatingHomeBtn");
  if (floatingHomeBtn) floatingHomeBtn.title = t.floatingHomeTitle;
  const floatingHomeText = document.getElementById("floatingHomeText");
  if (floatingHomeText) floatingHomeText.textContent = t.floatingHomeText;
  const backToTopBtn = document.getElementById("backToTopBtn");
  if (backToTopBtn) {
    backToTopBtn.title = t.backToTopTitle;
    backToTopBtn.setAttribute("aria-label", t.backToTopTitle);
  }
  const backToTopText = document.getElementById("backToTopText");
  if (backToTopText) backToTopText.textContent = t.backToTopText;

  document.getElementById("footerNote").textContent = t.footerNote;
  document.getElementById("thProject").textContent = t.thProject;
  document.getElementById("thPurpose").textContent = t.thPurpose;
  document.getElementById("thLicense").textContent = t.thLicense;
  document.getElementById("thSource").textContent = t.thSource;
  document.getElementById("footerMeta").textContent = t.footerMeta;

  if (!distroSelect.value) {
    editionSelect.innerHTML = `<option id="editionPlaceholderOpt" value="">${t.editionPlaceholderFirst}</option>`;
  } else if (currentDistro) {
    const savedEd = currentEdition;
    editionSelect.innerHTML = `<option id="editionPlaceholderOpt" value="">${t.editionPlaceholder}</option>`;
    Object.entries(currentDistro.editions).forEach(([edKey, ed]) => {
      const opt = document.createElement("option");
      opt.value = edKey;
      opt.textContent = tLabel(ed.label);
      editionSelect.appendChild(opt);
    });
    if (savedEd) editionSelect.value = savedEd;
    editionTags.querySelectorAll(".edition-tag").forEach(tag => {
      const ed = currentDistro.editions[tag.dataset.edition];
      if (ed) {
        tag.textContent = tLabel(ed.label) + (ed.status === "experimental" ? " 🧪" : "");
      }
    });
    if (currentEdition) generateScript();
  }

  if (document.getElementById("distroSearchInput").value.trim()) {
    runDistroSearch(false);
  }
  renderSupportMatrix();
  updateSelectionUi();
}

function setLang(lang, persist = true) {
  currentLang = lang === "en" ? "en" : "ko";
  if (persist) {
    try { localStorage.setItem("hangul_installer_lang", currentLang); } catch {}
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("lang")) {
        url.searchParams.set("lang", currentLang);
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
      }
    } catch {}
  }
  applyTranslations();
}

function showToast(msg, type = "success") {
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function onDistroChange() {
  const t = I18N[currentLang];
  const key = distroSelect.value;
  distroSelect.classList.toggle("ime-selected", FORCE_IME_KEYS.has(key));
  const editionSection = document.getElementById("editionSection");
  editionSelect.innerHTML = `<option id="editionPlaceholderOpt" value="">${t.editionPlaceholder}</option>`;
  editionTags.innerHTML = "";
  editionTags.style.display = "none";
  scriptCard.style.display = "none";
  verifyCard.style.display = "none";

  if (!key) {
    if (editionSection) editionSection.style.display = "none";
    editionSelect.disabled = true;
    editionSelect.innerHTML = `<option id="editionPlaceholderOpt" value="">${t.editionPlaceholderFirst}</option>`;
    currentDistro = null;
    currentEdition = null;
    clearUrlHash();
    updateSelectionUi();
    return;
  }

  currentDistro = DISTRO_DATA[key];
  editionSelect.disabled = false;
  if (editionSection) editionSection.style.display = "block";

  // 셀렉트 옵션 채우기
  Object.entries(currentDistro.editions).forEach(([edKey, ed]) => {
    const opt = document.createElement("option");
    opt.value = edKey;
    opt.textContent = tLabel(ed.label);
    editionSelect.appendChild(opt);
  });

  // 태그 버튼도 생성
  Object.entries(currentDistro.editions).forEach(([edKey, ed]) => {
    const tag = document.createElement("button");
    tag.type = "button";
    tag.className = "edition-tag" + (edKey === currentDistro.defaultEdition ? " selected" : "");
    tag.textContent = tLabel(ed.label) + (ed.status === "experimental" ? " 🧪" : "");
    tag.dataset.edition = edKey;
    tag.onclick = () => selectEditionTag(edKey);
    if (ed.status === "experimental") {
      tag.classList.add("experimental");
      tag.title = currentLang === "en" ? "Experimental (Manual setup may be needed)" : "실험적 (수동 추가 설정이 필요할 수 있습니다)";
    }
    editionTags.appendChild(tag);
  });
  editionTags.style.display = "flex";

  // 기본 에디션 자동 선택
  selectEdition(currentDistro.defaultEdition);
}

function selectEditionTag(edKey) {
  editionSelect.value = edKey;
  selectEdition(edKey);
}

function selectEdition(edKey) {
  if (!currentDistro || !currentDistro.editions[edKey]) return;
  currentEdition = edKey;
  editionSelect.value = edKey;

  // 태그 업데이트
  editionTags.querySelectorAll(".edition-tag").forEach(t => {
    t.classList.toggle("selected", t.dataset.edition === edKey);
  });

  // 스크립트 생성
  generateScript();
  updateSelectionUi();
}

function generateScript() {
  if (!currentDistro || !currentEdition) return;
  const t = I18N[currentLang];
  const distroKey = distroSelect.value;
  const ed = currentDistro.editions[currentEdition];
  const scriptId = getScriptId(distroKey, currentEdition);
  const templateFamily = getTemplateFamily(distroKey);
  const templateFn = SCRIPT_TEMPLATES[templateFamily] || SCRIPT_TEMPLATES["debian-family"];
  const ext = distroKey === "nixos" ? "nix" : "sh";
  const scriptFileName = `${scriptId}.${ext}`;

  const params = {
    distroName: currentDistro.name,
    editionLabel: ed.label,
    scriptId: scriptId,
    distroKey: distroKey,
    editionKey: currentEdition
  };

  const script = templateFn(params);

  // UI 업데이트
  scriptTitle.textContent = `${tLabel(currentDistro.name)} ${tLabel(ed.label)} - ${scriptFileName}`;
  downloadBtn.textContent = t.downloadLabel(ext);
  scriptContent.className = distroKey === "nixos" ? "language-none" : "language-bash";
  scriptContent.textContent = script;
  if (typeof Prism !== "undefined" && Prism.highlightAll) {
    Prism.highlightAll();
  }

  // 배지
  const badgeClassMap = {
    verified: "badge-verified",
    beta: "badge-beta",
    experimental: "badge-experimental",
    community: "badge-community"
  };
  const badgeCls = badgeClassMap[ed.status] || "badge-verified";
  const badgeText = t.badges[ed.status] || t.badges.verified;
  badgesEl.innerHTML = `<span class="badge ${badgeCls}">${badgeText}</span>`;

  // 정보 그리드
  scriptInfo.innerHTML = `
    <div class="info-item"><span class="info-label">${t.infoLabels.distro}</span><span class="info-value">${tLabel(currentDistro.name)}</span></div>
    <div class="info-item"><span class="info-label">${t.infoLabels.base}</span><span class="info-value">${tLabel(currentDistro.base)}</span></div>
    <div class="info-item"><span class="info-label">${t.infoLabels.pkgMgr}</span><span class="info-value">${currentDistro.pkgMgr}</span></div>
    <div class="info-item"><span class="info-label">${t.infoLabels.imConfig}</span><span class="info-value">${tLabel(currentDistro.imConfig)}</span></div>
    <div class="info-item"><span class="info-label">${t.infoLabels.edition}</span><span class="info-value">${tLabel(ed.label)}</span></div>
    <div class="info-item"><span class="info-label">${t.infoLabels.scriptId}</span><span class="info-value">${scriptId}</span></div>
  `;

  // 원라인 명령어 (GitHub Raw URL) 또는 NixOS 적용 안내
  const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/scripts/${templateFamily}/${scriptFileName}`;
  const localRunHint = document.getElementById("localRunHint");
  if (distroKey === "nixos") {
    if (onelinerLabel) onelinerLabel.textContent = t.nixOnelinerLabel;
    oneliner.textContent = t.nixOnelinerBody(rawUrl, scriptFileName);
    localRunHint.innerHTML = t.nixHint;
  } else {
    const shellCmd = distroKey === "alpine" ? "sh" : "bash";
    if (onelinerLabel) onelinerLabel.textContent = t.shOnelinerLabel;
    oneliner.textContent = `curl -sL ${rawUrl} | sudo ${shellCmd}`;
    localRunHint.innerHTML = t.shHint(shellCmd, scriptFileName);
  }

  // 3단계 검증 코드 맞춤형 업데이트
  const verifyBlock = document.getElementById("verifyCodeBlock");
  if (verifyBlock) {
    const imType = (templateFamily === "rhel-family" || templateFamily === "ibus" || distroKey === "ibus") ? "ibus" : (distroKey === "kime" ? "kime" : "fcitx5");
    verifyBlock.textContent = t.verifyCode[imType] || t.verifyCode.fcitx5;
  }

  scriptCard.style.display = "block";
  verifyCard.style.display = "block";
}

function copyAutoOneliner() {
  const t = I18N[currentLang];
  const cmd = document.getElementById("autoOneliner").textContent;
  navigator.clipboard.writeText(cmd).then(() => {
    showToast(t.toastAutoCopied);
  }).catch(() => showToast(t.toastCopyFail, "error"));
}

function downloadAutoInstaller() {
  const t = I18N[currentLang];
  const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/install.sh`;
  fetch("install.sh").then(res => {
    if (!res.ok) throw new Error("fetch failed");
    return res.blob();
  }).then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "install.sh";
    a.click();
    URL.revokeObjectURL(url);
    showToast(t.toastAutoDownloaded);
  }).catch(() => {
    const a = document.createElement("a");
    a.href = location.protocol === "file:" ? "install.sh" : rawUrl;
    a.download = "install.sh";
    a.click();
    showToast(t.toastAutoRequested);
  });
}

function copyOneliner() {
  const t = I18N[currentLang];
  navigator.clipboard.writeText(oneliner.textContent).then(() => {
    showToast(t.toastOnelinerCopied);
  }).catch(() => showToast(t.toastCopyFail, "error"));
}

function copyScript() {
  const t = I18N[currentLang];
  navigator.clipboard.writeText(scriptContent.textContent).then(() => {
    showToast(t.toastScriptCopied);
  }).catch(() => showToast(t.toastCopyFail, "error"));
}

function expandSearchQuery(raw) {
  let q = raw.trim().toLowerCase();
  for (const [ko, en] of Object.entries(KOREAN_ALIASES)) {
    if (q.includes(ko)) {
      q = q.split(ko).join(` ${en} `);
    }
  }
  return q.trim().split(/\s+/).filter(Boolean);
}

function runDistroSearch(autoSelectFirst = false) {
  const t = I18N[currentLang];
  const input = document.getElementById("distroSearchInput");
  const resultsEl = document.getElementById("searchResults");
  const clearBtn = document.getElementById("clearSearchBtn");
  const raw = input.value.trim();

  if (!raw) {
    resultsEl.style.display = "none";
    resultsEl.innerHTML = "";
    clearBtn.style.display = "none";
    if (autoSelectFirst) {
      showToast(t.searchNeedQuery, "error");
      input.focus();
    }
    return;
  }

  clearBtn.style.display = "inline-block";
  const terms = expandSearchQuery(raw);
  const matches = [];

  for (const [distroKey, distro] of Object.entries(DISTRO_DATA)) {
    for (const [edKey, ed] of Object.entries(distro.editions)) {
      const scriptId = getScriptId(distroKey, edKey);
      const haystack = [
        distroKey,
        distro.name,
        distro.base,
        distro.pkgMgr,
        edKey,
        ed.label,
        tLabel(ed.label),
        scriptId
      ].join(" ").toLowerCase();

      if (terms.every(term => haystack.includes(term))) {
        matches.push({
          distroKey,
          editionKey: edKey,
          distroName: distro.name,
          editionLabel: ed.label,
          scriptId
        });
      }
    }
  }

  // 201위~552위 파생 & 미지원 배포판 검색
  const fallbackMatches = [];
  const unsupportedMatches = [];
  if (typeof DISTRO_FALLBACK_MAP === "object") {
    for (const [fbKey, fb] of Object.entries(DISTRO_FALLBACK_MAP)) {
      const fbHaystack = [fbKey, fb.name, fb.badge || "", fb.base || "", fb.hint || "", fb.reason || ""].join(" ").toLowerCase();
      if (terms.some(term => fbHaystack.includes(term))) {
        if (fb.unsupported) {
          unsupportedMatches.push({ key: fbKey, ...fb });
        } else {
          fallbackMatches.push({ key: fbKey, ...fb });
        }
      }
    }
  }

  resultsEl.innerHTML = "";
  resultsEl.style.display = "block";

  const hasAnyMatch = matches.length > 0 || fallbackMatches.length > 0 || unsupportedMatches.length > 0;

  if (!hasAnyMatch) {
    const empty = document.createElement("div");
    empty.className = "search-meta";
    empty.textContent = t.searchNoMatch(raw);
    resultsEl.appendChild(empty);
  } else {
    // 1. 공식 지원 매칭 리스트
    if (matches.length > 0) {
      const meta = document.createElement("div");
      meta.className = "search-meta";
      const shown = matches.slice(0, 30);
      meta.textContent = matches.length > 30
        ? t.searchCountTop(matches.length)
        : t.searchCountAll(matches.length);
      resultsEl.appendChild(meta);

      const list = document.createElement("div");
      list.className = "search-list";
      for (const m of shown) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "search-item";
        btn.onclick = () => pickDistroEdition(m.distroKey, m.editionKey);

        const mainSpan = document.createElement("span");
        mainSpan.textContent = `${tLabel(m.distroName)} · ${tLabel(m.editionLabel)}`;
        const subSpan = document.createElement("span");
        subSpan.className = "search-sub";
        subSpan.textContent = `(${m.scriptId})`;

        btn.appendChild(mainSpan);
        btn.appendChild(subSpan);
        list.appendChild(btn);
      }
      resultsEl.appendChild(list);
    }

    // 2. 201위~552위 파생 배포판 매핑 리스트
    if (fallbackMatches.length > 0) {
      const fbMeta = document.createElement("div");
      fbMeta.className = "search-meta";
      fbMeta.style.marginTop = matches.length > 0 ? "0.75rem" : "0";
      fbMeta.textContent = currentLang === "en"
        ? `💡 Derivative Distro Guide (${fallbackMatches.length} match): Click to apply base compatible script`
        : `💡 파생 배포판 매핑 가이드 (${fallbackMatches.length}개 발견): 클릭하면 기반 호환 스크립트가 적용됩니다`;
      resultsEl.appendChild(fbMeta);

      const fbList = document.createElement("div");
      fbList.className = "search-list";
      for (const fb of fallbackMatches) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "search-item fallback";
        btn.onclick = () => {
          pickDistroEdition(fb.targetDistro, fb.targetEdition);
          showToast(currentLang === "en"
            ? `💡 Applied compatible script for ${fb.name}`
            : `💡 ${fb.name} (${fb.badge}) 호환 스크립트가 적용되었습니다`);
        };

        const mainSpan = document.createElement("span");
        mainSpan.textContent = `💡 ${fb.name} (${fb.badge})`;
        const subSpan = document.createElement("span");
        subSpan.className = "search-sub";
        subSpan.textContent = `→ ${fb.base}`;

        btn.appendChild(mainSpan);
        btn.appendChild(subSpan);
        fbList.appendChild(btn);
      }
      resultsEl.appendChild(fbList);
    }

    // 3. 비리눅스 / 독립 OS 미지원 사유 안내
    if (unsupportedMatches.length > 0) {
      for (const u of unsupportedMatches) {
        const box = document.createElement("div");
        box.className = "search-unsupported";
        box.innerHTML = `<strong>⚠️ ${u.name} (${u.badge})</strong>: ${u.reason}`;
        resultsEl.appendChild(box);
      }
    }
  }

  // 4. 어떤 검색어든 목록에 없는 배포판을 위한 4대 기반 OS 빠른 선택 가이드
  const genericBox = document.createElement("div");
  genericBox.className = "search-generic-box";
  const genericTitle = document.createElement("div");
  genericTitle.className = "search-generic-title";
  genericTitle.textContent = currentLang === "en"
    ? "🌐 Unlisted or niche distro? Choose your base Linux family or run universal Step 0:"
    : "🌐 목록에 없는 배포판이신가요? 시스템의 기반 OS를 선택하거나 0단계 만능 스크립트를 사용하세요:";
  genericBox.appendChild(genericTitle);

  const genericList = document.createElement("div");
  genericList.className = "search-list";

  const genericItems = [
    { label: "Debian / Ubuntu 파생", distro: "generic-debian", ed: "gnome" },
    { label: "Arch Linux 파생", distro: "generic-arch", ed: "kde" },
    { label: "Fedora / RPM 파생", distro: "generic-fedora", ed: "workstation" },
    { label: "openSUSE 파생", distro: "generic-opensuse", ed: "kde" }
  ];

  for (const gi of genericItems) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "search-item generic";
    btn.textContent = gi.label;
    btn.onclick = () => pickDistroEdition(gi.distro, gi.ed);
    genericList.appendChild(btn);
  }
  genericBox.appendChild(genericList);
  resultsEl.appendChild(genericBox);

  if (autoSelectFirst) {
    if (matches.length > 0) {
      const first = matches[0];
      pickDistroEdition(first.distroKey, first.editionKey);
      showToast(t.toastSelected(tLabel(first.distroName), tLabel(first.editionLabel)));
    } else if (fallbackMatches.length > 0) {
      const first = fallbackMatches[0];
      pickDistroEdition(first.targetDistro, first.targetEdition);
      showToast(currentLang === "en"
        ? `💡 Applied compatible script for ${first.name}`
        : `💡 ${first.name} 호환 스크립트가 적용되었습니다`);
    } else {
      showToast(t.searchNoMatchToast, "error");
    }
  }
}

function pickDistroEdition(distroKey, editionKey) {
  if (!DISTRO_DATA[distroKey]) return;
  distroSelect.value = distroKey;
  onDistroChange();
  if (editionKey && DISTRO_DATA[distroKey].editions[editionKey]) {
    selectEdition(editionKey);
  }
  scriptCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearDistroSearch() {
  const input = document.getElementById("distroSearchInput");
  const resultsEl = document.getElementById("searchResults");
  const clearBtn = document.getElementById("clearSearchBtn");
  input.value = "";
  resultsEl.innerHTML = "";
  resultsEl.style.display = "none";
  clearBtn.style.display = "none";
  input.focus();
}

function downloadScript() {
  if (!currentDistro || !currentEdition) return;
  const t = I18N[currentLang];
  const distroKey = distroSelect.value;
  const scriptId = getScriptId(distroKey, currentEdition);
  const ext = distroKey === "nixos" ? "nix" : "sh";
  const scriptFileName = `${scriptId}.${ext}`;
  const mime = distroKey === "nixos" ? "text/plain" : "text/x-sh";
  const blob = new Blob([scriptContent.textContent], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = scriptFileName;
  a.click();
  URL.revokeObjectURL(url);
  showToast(t.toastScriptDownloaded(scriptFileName));
}

// ──────────────────────────────────────────────────────────────
// 지원 매트릭스 렌더링
// ──────────────────────────────────────────────────────────────
function renderSupportMatrix() {
  const t = I18N[currentLang];
  const entries = Object.entries(DISTRO_DATA);
  const distroEntries = entries.filter(([key]) => !FORCE_IME_KEYS.has(key));
  const imeEntries = entries.filter(([key]) => FORCE_IME_KEYS.has(key));

  const renderMatrixEntry = (key, d, isForceIme) => {
    const verified = Object.values(d.editions).filter(e => e.status === "verified").length;
    const beta = Object.values(d.editions).filter(e => e.status === "beta").length;
    const exp = Object.values(d.editions).filter(e => e.status === "experimental").length;
    const titleHtml = isForceIme
      ? `<span class="matrix-item-title-wrap"><span class="matrix-item-name">${tLabel(d.name)}</span><span class="badge badge-ime">${t.forceImeTag}</span></span>`
      : `<span>${tLabel(d.name)}</span>`;
    return `
      <details class="matrix-item${isForceIme ? " ime-override" : ""}">
        <summary>
          ${titleHtml}
          <span style="font-size:0.8rem; color:var(--muted);">${tLabel(d.base)} · ${d.pkgMgr}</span>
        </summary>
        <div style="margin-top:0.5rem; display:flex; flex-wrap:wrap; gap:0.4rem;">
          ${Object.entries(d.editions).map(([ek, e]) => `
            <span class="badge ${({
              verified: "badge-verified",
              beta: "badge-beta",
              experimental: "badge-experimental",
              community: "badge-community"
            })[e.status]}" style="font-size:0.7rem; cursor:pointer;" onclick="pickDistroEdition('${key}', '${ek}')" title="${t.matrixBadgeTitle}">${tLabel(e.label)}</span>
          `).join("")}
        </div>
        <div style="margin-top:0.5rem; font-size:0.75rem; color:var(--muted);">
          ${t.matrixSummary(verified, beta, exp)}
        </div>
      </details>
    `;
  };

  let html = distroEntries.map(([key, d]) => renderMatrixEntry(key, d, false)).join("");
  if (imeEntries.length > 0) {
    html += `
      <div class="matrix-ime-section">
        <div class="matrix-ime-header">
          <h3 class="matrix-ime-title">${t.forceImeSectionTitle}</h3>
          <p class="matrix-ime-desc">${t.forceImeSectionDesc}</p>
        </div>
        ${imeEntries.map(([key, d]) => renderMatrixEntry(key, d, true)).join("")}
      </div>
    `;
  }
  supportMatrix.innerHTML = html;
}

// ──────────────────────────────────────────────────────────────
// 홈 복귀 / URL 정리 / 스크롤 상태 보조
// ──────────────────────────────────────────────────────────────
function getCleanHomeUrl() {
  const path = location.protocol === "file:"
    ? location.pathname
    : (location.pathname.replace(/\/index\.html$/i, "/") || "/");
  return path + location.search;
}

function clearUrlHash() {
  const hasIndexHtml = location.protocol !== "file:" && /\/index\.html$/i.test(location.pathname);
  if (!location.hash && !hasIndexHtml) return;
  const cleanUrl = getCleanHomeUrl();
  if (window.history && window.history.replaceState) {
    try {
      window.history.replaceState(null, "", cleanUrl);
      return;
    } catch {}
  }
  window.location.href = cleanUrl;
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

function scrollToTopClean() {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  const heroTitle = document.getElementById("heroTitle");
  if (heroTitle && typeof heroTitle.focus === "function") {
    heroTitle.focus({ preventScroll: true });
  }
}

function updateSelectionUi() {
  const t = I18N[currentLang];
  const hasSelection = Boolean(currentDistro && distroSelect.value);
  const topNavBar = document.getElementById("topNavBar");
  const stickyHomeLink = document.getElementById("stickyHomeLink");
  const stickyHomeText = document.getElementById("stickyHomeText");
  const chip = document.getElementById("activeSelectionChip");
  const chipText = document.getElementById("activeSelectionText");
  const inlineResetBtn = document.getElementById("inlineResetBtn");
  const floatingHomeBtn = document.getElementById("floatingHomeBtn");

  if (topNavBar) topNavBar.classList.toggle("has-selection", hasSelection);
  if (stickyHomeLink) stickyHomeLink.classList.toggle("is-active", hasSelection);
  if (stickyHomeText) stickyHomeText.textContent = hasSelection ? t.stickyHomeReset : t.stickyHomeDefault;
  if (inlineResetBtn) inlineResetBtn.hidden = !hasSelection;
  if (floatingHomeBtn) floatingHomeBtn.hidden = !hasSelection;

  if (chip && chipText) {
    if (hasSelection) {
      const ed = currentEdition ? currentDistro.editions[currentEdition] : null;
      chipText.textContent = ed
        ? `${tLabel(currentDistro.name)} · ${tLabel(ed.label)}`
        : tLabel(currentDistro.name);
      chip.hidden = false;
    } else {
      chipText.textContent = "";
      chip.hidden = true;
    }
  }
}

function resetToHome({ updateUrl = true, scrollTop = true, showNotice = false } = {}) {
  const t = I18N[currentLang];
  if (distroSelect.value) {
    distroSelect.value = "";
  }
  onDistroChange();

  const searchInput = document.getElementById("distroSearchInput");
  const resultsEl = document.getElementById("searchResults");
  const clearBtn = document.getElementById("clearSearchBtn");
  if (searchInput) searchInput.value = "";
  if (resultsEl) {
    resultsEl.innerHTML = "";
    resultsEl.style.display = "none";
  }
  if (clearBtn) clearBtn.style.display = "none";

  if (supportMatrix) {
    supportMatrix.querySelectorAll("details.matrix-item[open]").forEach(el => {
      el.open = false;
    });
  }

  if (updateUrl) {
    clearUrlHash();
  }
  updateSelectionUi();

  if (scrollTop) {
    scrollToTopClean();
  }
  if (showNotice) {
    showToast(t.toastResetHome);
  }
}

function handleHomeResetClick(event) {
  if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button === 1)) {
    return;
  }
  if (event) event.preventDefault();

  const searchInput = document.getElementById("distroSearchInput");
  const hasSearch = Boolean(searchInput && searchInput.value.trim());
  const hasOpenMatrix = Boolean(supportMatrix && supportMatrix.querySelector("details.matrix-item[open]"));
  const hasIndexHtml = location.protocol !== "file:" && /\/index\.html$/i.test(location.pathname);

  if (currentDistro || distroSelect.value || location.hash || hasIndexHtml || hasSearch || hasOpenMatrix) {
    resetToHome({ updateUrl: true, scrollTop: true, showNotice: true });
  } else {
    scrollToTopClean();
  }
}

function syncFromHash() {
  if (!location.hash) {
    resetToHome({ updateUrl: false, scrollTop: false, showNotice: false });
    return;
  }
  const [distro, edition] = location.hash.slice(1).split("/");
  if (DISTRO_DATA[distro]) {
    if (distroSelect.value !== distro) {
      distroSelect.value = distro;
      onDistroChange();
    }
    if (edition && DISTRO_DATA[distro].editions[edition] && currentEdition !== edition) {
      origSelectEdition(edition);
      updateSelectionUi();
    }
  }
}

// ──────────────────────────────────────────────────────────────
// 초기화
// ──────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  setLang(detectInitialLang(), false);
  // URL 해시로 프리셋 지원 (예: #mint/cinnamon)
  if (location.hash) {
    const [distro, edition] = location.hash.slice(1).split("/");
    if (DISTRO_DATA[distro]) {
      distroSelect.value = distro;
      onDistroChange();
      if (edition && DISTRO_DATA[distro].editions[edition]) {
        selectEdition(edition);
      }
    }
  }
  updateSelectionUi();

  const supportsScrollState = typeof CSS !== "undefined" && CSS.supports && CSS.supports("container-type", "scroll-state");
  if (!supportsScrollState && "IntersectionObserver" in window) {
    const sentinel = document.querySelector(".scroll-sentinel");
    const stickyBar = document.getElementById("topBarSticky");
    if (sentinel) {
      document.documentElement.classList.add("js-scroll-fallback");
      const observer = new IntersectionObserver(
        ([entry]) => {
          const scrolled = !entry.isIntersecting;
          document.documentElement.classList.toggle("is-scrolled", scrolled);
          if (stickyBar) stickyBar.classList.toggle("is-stuck", scrolled);
        },
        { root: null, threshold: 0 }
      );
      observer.observe(sentinel);
    }
  }

  const floatingActions = document.getElementById("floatingActions");
  if (floatingActions) {
    floatingActions.addEventListener("focusout", (e) => {
      if (!e.relatedTarget && window.scrollY <= 2) {
        const stickyHomeLink = document.getElementById("stickyHomeLink");
        if (stickyHomeLink) stickyHomeLink.focus({ preventScroll: true });
      }
    });
  }
});

// 해시/히스토리 변경 감지 (뒤로 가기 / 앞으로 가기 / 수동 해시 삭제 시)
window.addEventListener("hashchange", syncFromHash);
window.addEventListener("popstate", syncFromHash);

// 해시 업데이트 함수 (replaceState 사용하여 hashchange 루프 방지)
function updateHash() {
  if (currentDistro && currentEdition) {
    const distroKey = distroSelect.value;
    const newHash = `#${distroKey}/${currentEdition}`;
    const targetUrl = getCleanHomeUrl() + newHash;
    if (location.hash !== newHash || (location.protocol !== "file:" && /\/index\.html$/i.test(location.pathname))) {
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", targetUrl);
      } else {
        location.hash = `${distroKey}/${currentEdition}`;
      }
    }
  }
}
// selectEdition에서 호출하도록 패치
const origSelectEdition = selectEdition;
selectEdition = function(edKey) {
  origSelectEdition(edKey);
  updateHash();
};
