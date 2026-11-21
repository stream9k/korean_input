const GITHUB_REPO = "stream9k/korean_input";

// ──────────────────────────────────────────────────────────────
// 데이터: 배포판별 에디션/스크립트 매핑
// ──────────────────────────────────────────────────────────────
const DISTRO_DATA = {
  mint: {
    name: "Linux Mint",
    base: "Ubuntu LTS / Debian (LMDE)",
    pkgMgr: "apt",
    imConfig: "im-config",
    editions: {
      cinnamon: { label: "Cinnamon (기본)", status: "verified", script: "mint-cinnamon" },
      xfce: { label: "Xfce", status: "verified", script: "mint-xfce" },
      mate: { label: "MATE", status: "verified", script: "mint-mate" },
      lmde: { label: "LMDE (Debian 베이스)", status: "verified", script: "lmde" },
      edge: { label: "Edge (신규 하드웨어 커널)", status: "beta", script: "mint-cinnamon" }
    },
    defaultEdition: "cinnamon"
  },
  lmde: {
    name: "LMDE (Linux Mint Debian Edition)",
    base: "Debian",
    pkgMgr: "apt",
    imConfig: "im-config",
    editions: {
      cinnamon: { label: "Cinnamon (단일 에디션)", status: "verified", script: "lmde" }
    },
    defaultEdition: "cinnamon"
  },
  ubuntu: {
    name: "Ubuntu",
    base: "Debian",
    pkgMgr: "apt",
    imConfig: "im-config",
    editions: {
      gnome: { label: "GNOME (기본)", status: "verified", script: "ubuntu-gnome" },
      kde: { label: "Kubuntu (KDE Plasma)", status: "verified", script: "ubuntu-kde" },
      xfce: { label: "Xubuntu (Xfce)", status: "verified", script: "ubuntu-xfce" },
      mate: { label: "Ubuntu MATE", status: "verified", script: "ubuntu-mate" },
      budgie: { label: "Ubuntu Budgie", status: "beta", script: "ubuntu-gnome" },
      cinnamon: { label: "Ubuntu Cinnamon", status: "beta", script: "ubuntu-gnome" },
      lxqt: { label: "Lubuntu (LXQt)", status: "beta", script: "ubuntu-gnome" },
      studio: { label: "Ubuntu Studio", status: "beta", script: "ubuntu-kde" },
      sway: { label: "Ubuntu Sway", status: "beta", script: "ubuntu-sway" },
      unity: { label: "Ubuntu Unity", status: "beta", script: "ubuntu-unity" }
    },
    defaultEdition: "gnome"
  },
  debian: {
    name: "Debian",
    base: "Debian",
    pkgMgr: "apt",
    imConfig: "im-config",
    editions: {
      gnome: { label: "GNOME (기본)", status: "verified", script: "debian-gnome" },
      kde: { label: "KDE Plasma", status: "verified", script: "debian-kde" },
      xfce: { label: "Xfce", status: "verified", script: "debian-xfce" },
      mate: { label: "MATE", status: "verified", script: "debian-mate" },
      cinnamon: { label: "Cinnamon", status: "beta", script: "debian-gnome" },
      lxqt: { label: "LXQt", status: "beta", script: "debian-gnome" }
    },
    defaultEdition: "gnome"
  },
  fedora: {
    name: "Fedora Linux",
    base: "Independent (RHEL 업스트림)",
    pkgMgr: "dnf",
    imConfig: "alternatives + imsettings",
    editions: {
      kde: { label: "KDE Plasma (기본 권장)", status: "verified", script: "fedora-kde" },
      gnome: { label: "GNOME (Workstation)", status: "verified", script: "fedora-gnome" },
      xfce: { label: "Xfce Spin", status: "beta", script: "fedora-gnome" },
      mate: { label: "MATE Spin", status: "beta", script: "fedora-gnome" },
      cinnamon: { label: "Cinnamon Spin", status: "beta", script: "fedora-gnome" },
      lxqt: { label: "LXQt Spin", status: "beta", script: "fedora-gnome" },
      i3: { label: "i3 Spin", status: "experimental", script: "fedora-gnome" },
      sway: { label: "Sway Spin", status: "experimental", script: "fedora-gnome" },
      nobara: { label: "Nobara Linux", status: "verified", script: "fedora-nobara" },
      ultramarine: { label: "Ultramarine Linux", status: "verified", script: "fedora-ultramarine" },
      rakuos: { label: "RakuOS", status: "beta", script: "fedora-rakuos" },
      qubes: { label: "Qubes OS (Fedora TemplateVM)", status: "beta", script: "fedora-qubes" },
      capivaraos: { label: "CapivaraOS", status: "beta", script: "fedora-capivaraos" },
      ludora: { label: "Ludora", status: "beta", script: "fedora-ludora" }
    },
    defaultEdition: "kde"
  },
  arch: {
    name: "Arch Linux",
    base: "Independent (Rolling)",
    pkgMgr: "pacman",
    imConfig: "수동 (환경변수 + autostart)",
    editions: {
      base: { label: "베이스 (직접 구성)", status: "verified", script: "arch-base" },
      endeavour: { label: "EndeavourOS (사전 구성)", status: "verified", script: "arch-endeavour" },
      manjaro: { label: "Manjaro (별도 항목 참조)", status: "beta", script: "arch-manjaro" },
      garuda: { label: "Garuda Linux (별도 항목 참조)", status: "beta", script: "arch-garuda" },
      cachyos: { label: "CachyOS", status: "beta", script: "arch-base" },
      omarchy: { label: "Omarchy", status: "beta", script: "arch-omarchy" },
      artix: { label: "Artix Linux", status: "beta", script: "arch-artix" },
      biglinux: { label: "BigLinux", status: "beta", script: "arch-biglinux" },
      pearos: { label: "pearOS", status: "beta", script: "arch-pearos" },
      bluestar: { label: "Bluestar Linux", status: "beta", script: "arch-bluestar" },
      ml4w: { label: "ML4W (Hyprland)", status: "beta", script: "arch-ml4w" },
      archcraft: { label: "Archcraft", status: "beta", script: "arch-archcraft" },
      tromjaro: { label: "TROMjaro", status: "beta", script: "arch-tromjaro" },
      blendos: { label: "blendOS", status: "experimental", script: "arch-blendos" },
      prismlinux: { label: "PrismLinux", status: "beta", script: "arch-prismlinux" },
      kiro: { label: "Kiro", status: "beta", script: "arch-kiro" },
      stratos: { label: "StratOS", status: "beta", script: "arch-stratos" },
      ezarcher: { label: "Ezarcher", status: "beta", script: "arch-ezarcher" }
    },
    defaultEdition: "base"
  },
  manjaro: {
    name: "Manjaro Linux",
    base: "Arch (Rolling, Held-back)",
    pkgMgr: "pacman",
    imConfig: "수동 (Manjaro Settings Manager 연동)",
    editions: {
      kde: { label: "KDE Plasma (기본)", status: "verified", script: "manjaro-kde" },
      gnome: { label: "GNOME", status: "verified", script: "manjaro-gnome" },
      xfce: { label: "Xfce", status: "verified", script: "manjaro-xfce" },
      cinnamon: { label: "Cinnamon", status: "beta", script: "manjaro-gnome" },
      mate: { label: "MATE", status: "beta", script: "manjaro-gnome" },
      i3: { label: "i3WM", status: "experimental", script: "manjaro-base" },
      sway: { label: "Sway", status: "experimental", script: "manjaro-base" }
    },
    defaultEdition: "kde"
  },
  opensuse: {
    name: "openSUSE",
    base: "Independent (SLE 업스트림)",
    pkgMgr: "zypper",
    imConfig: "YaST / alternatives",
    editions: {
      tumbleweed_kde: { label: "Tumbleweed KDE Plasma", status: "verified", script: "opensuse-tumbleweed-kde" },
      tumbleweed_gnome: { label: "Tumbleweed GNOME", status: "verified", script: "opensuse-tumbleweed-gnome" },
      leap_kde: { label: "Leap 15.5+ KDE Plasma", status: "verified", script: "opensuse-leap-kde" },
      leap_gnome: { label: "Leap 15.5+ GNOME", status: "verified", script: "opensuse-leap-gnome" },
      microos: { label: "MicroOS (Transactional)", status: "experimental", script: "opensuse-microos" },
      slowroll: { label: "Slowroll", status: "beta", script: "opensuse-tumbleweed-kde" },
      aeon: { label: "Aeon (불변 GNOME)", status: "beta", script: "opensuse-aeon" }
    },
    defaultEdition: "tumbleweed_kde"
  },
  pop: {
    name: "Pop!_OS",
    base: "Ubuntu LTS",
    pkgMgr: "apt",
    imConfig: "im-config",
    editions: {
      gnome: { label: "GNOME (COSMIC 곧 전환)", status: "verified", script: "pop-gnome" },
      nvidia: { label: "NVIDIA ISO (동일)", status: "verified", script: "pop-gnome" }
    },
    defaultEdition: "gnome"
  },
  elementary: {
    name: "elementary OS",
    base: "Ubuntu LTS",
    pkgMgr: "apt",
    imConfig: "im-config",
    editions: {
      pantheon: { label: "Pantheon (단일)", status: "verified", script: "elementary-pantheon" }
    },
    defaultEdition: "pantheon"
  },
  zorin: {
    name: "Zorin OS",
    base: "Ubuntu LTS",
    pkgMgr: "apt",
    imConfig: "im-config",
    editions: {
      core: { label: "Core (GNOME)", status: "verified", script: "zorin-core" },
      pro: { label: "Pro (레이아웃 선택 가능)", status: "verified", script: "zorin-core" },
      lite: { label: "Lite (Xfce)", status: "verified", script: "zorin-lite" },
      education: { label: "Education", status: "beta", script: "zorin-core" }
    },
    defaultEdition: "core"
  },
  "kde-neon": {
    name: "KDE Neon",
    base: "Ubuntu LTS",
    pkgMgr: "apt",
    imConfig: "im-config",
    editions: {
      user: { label: "User Edition (기본)", status: "verified", script: "kde-neon-user" },
      testing: { label: "Testing", status: "beta", script: "kde-neon-user" },
      unstable: { label: "Unstable", status: "experimental", script: "kde-neon-user" }
    },
    defaultEdition: "user"
  },
  endeavour: {
    name: "EndeavourOS",
    base: "Arch (Rolling, 온라인 인스톨러)",
    pkgMgr: "pacman",
    imConfig: "수동",
    editions: {
      kde: { label: "KDE Plasma (온라인 선택)", status: "verified", script: "endeavour-kde" },
      gnome: { label: "GNOME", status: "verified", script: "endeavour-gnome" },
      xfce: { label: "Xfce", status: "verified", script: "endeavour-xfce" },
      i3wm: { label: "i3WM", status: "beta", script: "endeavour-base" },
      sway: { label: "Sway", status: "beta", script: "endeavour-base" },
      bspwm: { label: "BSPWM", status: "experimental", script: "endeavour-base" }
    },
    defaultEdition: "kde"
  },
  garuda: {
    name: "Garuda Linux",
    base: "Arch (Rolling, 사전 구성 많음)",
    pkgMgr: "pacman",
    imConfig: "Garuda Assistant 연동",
    editions: {
      kde: { label: "KDE Plasma 'Dragonized' (기본)", status: "verified", script: "garuda-kde" },
      gnome: { label: "GNOME", status: "verified", script: "garuda-gnome" },
      xfce: { label: "Xfce", status: "verified", script: "garuda-xfce" },
      wayfire: { label: "Wayfire", status: "beta", script: "garuda-base" },
      hyprland: { label: "Hyprland", status: "beta", script: "garuda-base" },
      qtile: { label: "Qtile", status: "experimental", script: "garuda-base" }
    },
    defaultEdition: "kde"
  },
  nixos: {
    name: "NixOS",
    base: "Independent (함수형, 설정 파일 기반)",
    pkgMgr: "nix (configuration.nix / flake)",
    imConfig: "configuration.nix 에서 선언적 설정",
    editions: {
      gnome: { label: "GNOME (configuration.nix)", status: "verified", script: "nixos-gnome" },
      kde: { label: "KDE Plasma", status: "verified", script: "nixos-kde" },
      hyprland: { label: "Hyprland", status: "beta", script: "nixos-hyprland" },
      sway: { label: "Sway", status: "beta", script: "nixos-sway" },
      minimal: { label: "Minimal (서버/헤드리스)", status: "experimental", script: "nixos-minimal" },
      glf: { label: "GLF OS (NixOS 기반 게이밍)", status: "beta", script: "nixos-glf" }
    },
    defaultEdition: "gnome"
  },
  mx: {
    name: "MX Linux / antiX / Devuan",
    base: "Debian (Non-systemd / SysVinit 지원)",
    pkgMgr: "apt",
    imConfig: "im-config + /etc/environment + ~/.xsessionrc",
    editions: {
      xfce: { label: "MX Linux Xfce (기본)", status: "verified", script: "mx-xfce" },
      kde: { label: "MX Linux KDE", status: "verified", script: "mx-kde" },
      fluxbox: { label: "MX Linux Fluxbox", status: "beta", script: "mx-fluxbox" },
      antix: { label: "antiX", status: "beta", script: "antix" },
      devuan: { label: "Devuan / Peppermint", status: "beta", script: "devuan" },
      expirion: { label: "Expirion Linux", status: "beta", script: "expirion" },
      lcos: { label: "LCOS", status: "beta", script: "lcos" },
      superlite: { label: "Super Lite", status: "beta", script: "superlite" }
    },
    defaultEdition: "xfce"
  },
  kali: {
    name: "Kali Linux / Parrot OS / 보안 데비안",
    base: "Debian Testing / Stable",
    pkgMgr: "apt",
    imConfig: "im-config",
    editions: {
      xfce: { label: "Kali Linux Xfce (기본)", status: "verified", script: "kali-xfce" },
      gnome: { label: "Kali Linux GNOME", status: "verified", script: "kali-gnome" },
      kde: { label: "Kali Linux KDE", status: "verified", script: "kali-kde" },
      parrot: { label: "Parrot OS", status: "beta", script: "parrot" },
      kodachi: { label: "Linux Kodachi", status: "beta", script: "kodachi" },
      gnoppix: { label: "Gnoppix", status: "beta", script: "gnoppix" },
      osintvm: { label: "OSINT VM", status: "beta", script: "osintvm" },
      nethydra: { label: "NetHydra", status: "beta", script: "nethydra" }
    },
    defaultEdition: "xfce"
  },
  "ubuntu-derivatives": {
    name: "Ubuntu / Debian 주요 파생",
    base: "Ubuntu / Debian",
    pkgMgr: "apt",
    imConfig: "im-config",
    editions: {
      tuxedo: { label: "TUXEDO OS", status: "verified", script: "tuxedo-os" },
      q4os: { label: "Q4OS", status: "beta", script: "q4os" },
      lite: { label: "Linux Lite", status: "beta", script: "linux-lite" },
      deepin: { label: "deepin", status: "beta", script: "deepin" },
      pikaos: { label: "PikaOS", status: "beta", script: "pikaos" },
      anduinos: { label: "AnduinOS", status: "beta", script: "anduinos" },
      pureos: { label: "PureOS", status: "beta", script: "pureos" },
      slimbook: { label: "Slimbook OS", status: "beta", script: "slimbook-os" },
      emmabuntus: { label: "Emmabuntüs", status: "beta", script: "emmabuntus" },
      siduction: { label: "siduction", status: "beta", script: "siduction" },
      solydxk: { label: "SolydXK", status: "beta", script: "solydxk" },
      raspios: { label: "Raspberry Pi OS", status: "beta", script: "raspios" },
      dietpi: { label: "DietPi (Desktop)", status: "experimental", script: "dietpi" },
      makulu: { label: "MakuluLinux", status: "beta", script: "makulu" },
      cuerdos: { label: "CuerdOS", status: "beta", script: "cuerdos" }
    },
    defaultEdition: "tuxedo"
  },
  bazzite: {
    name: "Bazzite / Aurora / Fedora Atomic",
    base: "Fedora Atomic (rpm-ostree 불변 OS)",
    pkgMgr: "rpm-ostree",
    imConfig: "environment.d + rpm-ostree layering",
    editions: {
      "bazzite-kde": { label: "Bazzite KDE / Deck", status: "beta", script: "bazzite-kde" },
      "bazzite-gnome": { label: "Bazzite GNOME", status: "beta", script: "bazzite-gnome" },
      aurora: { label: "Aurora KDE", status: "beta", script: "aurora" },
      silverblue: { label: "Fedora Silverblue", status: "beta", script: "fedora-silverblue" },
      kinoite: { label: "Fedora Kinoite", status: "beta", script: "fedora-kinoite" },
      butrelinux: { label: "butrelinux (Bluefin 기반)", status: "beta", script: "butrelinux" },
      margine: { label: "Margine (Bluefin 기반)", status: "beta", script: "margine" }
    },
    defaultEdition: "bazzite-kde"
  },
  steamos: {
    name: "SteamOS 3.x",
    base: "Arch (Immutable)",
    pkgMgr: "pacman (steamos-readonly 해제)",
    imConfig: "/etc/environment + autostart",
    editions: {
      holo: { label: "SteamOS 3 / Deck Desktop Mode", status: "experimental", script: "steamos-holo" }
    },
    defaultEdition: "holo"
  },
  rhel: {
    name: "AlmaLinux / Rocky / RHEL / CentOS / Oreon",
    base: "Enterprise Linux (RHEL 계열)",
    pkgMgr: "dnf",
    imConfig: "ibus-hangul + gsettings",
    editions: {
      almalinux: { label: "AlmaLinux", status: "beta", script: "almalinux" },
      rocky: { label: "Rocky Linux", status: "beta", script: "rocky-linux" },
      rhel: { label: "Red Hat Enterprise Linux (RHEL)", status: "beta", script: "rhel" },
      centos: { label: "CentOS Stream", status: "beta", script: "centos-stream" },
      oreon: { label: "Oreon Linux (Alma 기반 데스크톱)", status: "beta", script: "oreon" }
    },
    defaultEdition: "almalinux"
  },
  void: {
    name: "Void Linux / AgarimOS / 파생",
    base: "Independent (runit)",
    pkgMgr: "xbps-install",
    imConfig: "/etc/environment + ~/.xprofile",
    editions: {
      glibc: { label: "Void Linux (glibc)", status: "beta", script: "void-glibc" },
      musl: { label: "Void Linux (musl)", status: "experimental", script: "void-musl" },
      agarimos: { label: "AgarimOS", status: "beta", script: "agarimos" },
      lazylinux: { label: "LazyLinux", status: "beta", script: "lazylinux" },
      nekovoid: { label: "Neko-Void", status: "beta", script: "nekovoid" },
      d77void: { label: "d77void", status: "beta", script: "d77void" }
    },
    defaultEdition: "glibc"
  },
  alpine: {
    name: "Alpine Linux / Chimera / Nura",
    base: "Independent (apk 기반)",
    pkgMgr: "apk",
    imConfig: "/etc/environment + ~/.profile",
    editions: {
      desktop: { label: "Alpine Desktop (Xfce / GNOME / KDE)", status: "experimental", script: "alpine-desktop" },
      chimera: { label: "Chimera Linux (FreeBSD userland + apk)", status: "experimental", script: "chimera-linux" },
      nura: { label: "Nura Linux (Alpine 기반)", status: "experimental", script: "nura-linux" }
    },
    defaultEdition: "desktop"
  },
  solus: {
    name: "Solus",
    base: "Independent",
    pkgMgr: "eopkg",
    imConfig: "/etc/environment + environment.d",
    editions: {
      budgie: { label: "Solus Budgie (기본)", status: "beta", script: "solus-budgie" },
      gnome: { label: "Solus GNOME", status: "beta", script: "solus-gnome" },
      kde: { label: "Solus KDE Plasma", status: "beta", script: "solus-kde" },
      xfce: { label: "Solus Xfce", status: "beta", script: "solus-xfce" }
    },
    defaultEdition: "budgie"
  },
  gentoo: {
    name: "Gentoo / Calculate / CalamaroOS",
    base: "Independent (Portage 기반)",
    pkgMgr: "emerge (Portage)",
    imConfig: "/etc/environment + ~/.xprofile",
    editions: {
      openrc: { label: "Gentoo OpenRC", status: "experimental", script: "gentoo-openrc" },
      systemd: { label: "Gentoo systemd", status: "experimental", script: "gentoo-systemd" },
      calculate: { label: "Calculate Linux", status: "beta", script: "calculate-linux" },
      calamaroos: { label: "CalamaroOS", status: "experimental", script: "calamaroos" }
    },
    defaultEdition: "systemd"
  },
  mageia: {
    name: "Mageia / OpenMandriva / PCLinuxOS",
    base: "Mandriva 계열",
    pkgMgr: "dnf / urpmi / apt-get",
    imConfig: "/etc/environment + ~/.xprofile",
    editions: {
      mageia: { label: "Mageia", status: "beta", script: "mageia" },
      openmandriva: { label: "OpenMandriva Lx", status: "beta", script: "openmandriva" },
      pclinuxos: { label: "PCLinuxOS", status: "beta", script: "pclinuxos" },
      magos: { label: "MagOS", status: "experimental", script: "magos" }
    },
    defaultEdition: "mageia"
  },
  kaos: {
    name: "KaOS",
    base: "Independent (KDE/Qt 전용)",
    pkgMgr: "pacman",
    imConfig: "/etc/environment + autostart",
    editions: {
      kde: { label: "KaOS KDE Plasma", status: "beta", script: "kaos-kde" }
    },
    defaultEdition: "kde"
  },
  vanilla: {
    name: "Vanilla OS",
    base: "Debian (ABRoot 불변 OS)",
    pkgMgr: "abroot",
    imConfig: "environment.d + autostart",
    editions: {
      gnome: { label: "Vanilla OS 2 Orchid (GNOME)", status: "experimental", script: "vanilla-gnome" }
    },
    defaultEdition: "gnome"
  },
  alt: {
    name: "ALT Linux",
    base: "Independent (Sisyphus / apt-rpm)",
    pkgMgr: "apt-get (apt-rpm)",
    imConfig: "/etc/environment + ~/.xprofile",
    editions: {
      workstation: { label: "ALT Workstation / Regular", status: "beta", script: "alt-workstation" }
    },
    defaultEdition: "workstation"
  },
  guix: {
    name: "Guix System",
    base: "Independent (GNU 함수형)",
    pkgMgr: "guix",
    imConfig: "~/.bash_profile / config.scm",
    editions: {
      desktop: { label: "Guix System Desktop", status: "experimental", script: "guix-desktop" }
    },
    defaultEdition: "desktop"
  },
  sparky: {
    name: "SparkyLinux",
    base: "Debian (Testing / Stable)",
    pkgMgr: "apt",
    imConfig: "im-config",
    editions: {
      lxqt: { label: "LXQt (기본 에디션)", status: "verified", script: "sparky-lxqt" },
      xfce: { label: "Xfce", status: "verified", script: "sparky-xfce" },
      kde: { label: "KDE Plasma", status: "verified", script: "sparky-kde" }
    },
    defaultEdition: "lxqt"
  },
  bodhi: {
    name: "Bodhi Linux",
    base: "Ubuntu LTS",
    pkgMgr: "apt",
    imConfig: "im-config",
    editions: {
      moksha: { label: "Standard (Moksha Desktop)", status: "verified", script: "bodhi-moksha" },
      hwe: { label: "HWE (최신 하드웨어)", status: "verified", script: "bodhi-hwe" }
    },
    defaultEdition: "moksha"
  },
  peppermint: {
    name: "Peppermint OS",
    base: "Debian / Devuan",
    pkgMgr: "apt",
    imConfig: "im-config",
    editions: {
      xfce: { label: "Xfce (기본)", status: "verified", script: "peppermint-xfce" },
      devuan: { label: "Devuan 베이스 (SysVinit)", status: "beta", script: "peppermint-devuan" }
    },
    defaultEdition: "xfce"
  },
  voyager: {
    name: "Voyager Live",
    base: "Ubuntu / Debian",
    pkgMgr: "apt",
    imConfig: "im-config",
    editions: {
      gnome: { label: "GNOME (기본)", status: "verified", script: "voyager-gnome" },
      xfce: { label: "Xfce", status: "verified", script: "voyager-xfce" }
    },
    defaultEdition: "gnome"
  },
  mabox: {
    name: "Mabox Linux",
    base: "Manjaro / Arch (Rolling)",
    pkgMgr: "pacman",
    imConfig: "수동 (environment.d + autostart)",
    editions: {
      openbox: { label: "Openbox (경량 WM)", status: "verified", script: "mabox-openbox" }
    },
    defaultEdition: "openbox"
  },
  bunsenlabs: {
    name: "BunsenLabs Linux",
    base: "Debian Stable (Boron)",
    pkgMgr: "apt",
    imConfig: "im-config",
    editions: {
      openbox: { label: "Openbox (CrunchBang 후속)", status: "verified", script: "bunsenlabs-openbox" }
    },
    defaultEdition: "openbox"
  },
  "generic-debian": {
    name: "기타 Debian / Ubuntu 파생 (Generic Debian/Ubuntu)",
    base: "Debian / Ubuntu 기반 모든 파생 OS (Simple OS, Sparky, Peppermint 등)",
    pkgMgr: "apt",
    imConfig: "im-config",
    editions: {
      gnome: { label: "GNOME / COSMIC / Pantheon", status: "verified", script: "generic-debian-gnome" },
      xfce: { label: "Xfce / MATE / Cinnamon / Openbox / 기타", status: "verified", script: "generic-debian-xfce" },
      kde: { label: "KDE Plasma", status: "verified", script: "generic-debian-kde" }
    },
    defaultEdition: "gnome"
  },
  "generic-arch": {
    name: "기타 Arch Linux 파생 (Generic Arch)",
    base: "Arch Linux 기반 모든 파생 OS (Mabox, ArcoLinux, BlackArch 등)",
    pkgMgr: "pacman",
    imConfig: "수동 (environment.d + autostart)",
    editions: {
      kde: { label: "KDE Plasma", status: "verified", script: "generic-arch-kde" },
      gnome: { label: "GNOME", status: "verified", script: "generic-arch-gnome" },
      wm: { label: "Xfce / Openbox / i3 / 기타 WM", status: "verified", script: "generic-arch-wm" }
    },
    defaultEdition: "kde"
  },
  "generic-fedora": {
    name: "기타 Fedora / RPM 파생 (Generic Fedora/RPM)",
    base: "Fedora 및 RPM 기반 모든 파생 OS",
    pkgMgr: "dnf",
    imConfig: "alternatives + xinputrc",
    editions: {
      workstation: { label: "GNOME / Workstation", status: "verified", script: "generic-fedora-gnome" },
      kde: { label: "KDE Plasma Spin", status: "verified", script: "generic-fedora-kde" },
      spin: { label: "Xfce / Cinnamon / MATE / 기타 Spin", status: "verified", script: "generic-fedora-spin" }
    },
    defaultEdition: "workstation"
  },
  "generic-opensuse": {
    name: "기타 openSUSE 파생 (Generic openSUSE)",
    base: "openSUSE 기반 모든 파생 OS (Regata OS, GeckoLinux 등)",
    pkgMgr: "zypper",
    imConfig: "alternatives + xinputrc",
    editions: {
      kde: { label: "KDE Plasma (기본)", status: "verified", script: "generic-opensuse-kde" },
      gnome: { label: "GNOME", status: "verified", script: "generic-opensuse-gnome" }
    },
    defaultEdition: "kde"
  },
  ibus: {
    name: "ibus-hangul (GNOME 친화 대안 입력기)",
    base: "GNOME 네이티브 통합 / 대안 입력기",
    pkgMgr: "apt / dnf / pacman / zypper",
    imConfig: "im-config (Debian) / gsettings + environment.d",
    editions: {
      debian: { label: "Debian / Ubuntu / Mint (apt)", status: "verified", script: "ibus-debian" },
      fedora: { label: "Fedora / RHEL / Rocky / Alma (dnf)", status: "verified", script: "ibus-fedora" },
      arch: { label: "Arch / Manjaro / Endeavour (pacman)", status: "beta", script: "ibus-arch" },
      opensuse: { label: "openSUSE (zypper)", status: "beta", script: "ibus-opensuse" }
    },
    defaultEdition: "debian"
  },
  kime: {
    name: "kime (Rust 기반 경량 입력기)",
    base: "Wayland 네이티브 대안 입력기",
    pkgMgr: "AUR / COPR / zypper / .deb / 소스 빌드(EL)",
    imConfig: "im-config (Debian) / environment.d + autostart",
    editions: {
      debian: { label: "Debian / Ubuntu / Mint (.deb)", status: "beta", script: "kime-debian" },
      fedora: { label: "Fedora (COPR) / RHEL·Rocky·Alma (소스 빌드)", status: "beta", script: "kime-fedora" },
      arch: { label: "Arch / Manjaro / Endeavour (AUR)", status: "beta", script: "kime-arch" },
      opensuse: { label: "openSUSE (zypper)", status: "beta", script: "kime-opensuse" }
    },
    defaultEdition: "debian"
  }
};

// ──────────────────────────────────────────────────────────────
// 에디션별 스크립트 ID 매핑
// ──────────────────────────────────────────────────────────────
function getScriptId(distroKey, editionKey) {
  const map = {
    mint: {
      cinnamon: "mint-cinnamon",
      xfce: "mint-xfce",
      mate: "mint-mate",
      lmde: "lmde-cinnamon",
      edge: "mint-edge"
    },
    ubuntu: {
      gnome: "ubuntu-gnome",
      kde: "ubuntu-kde",
      xfce: "ubuntu-xfce",
      mate: "ubuntu-mate",
      budgie: "ubuntu-budgie",
      cinnamon: "ubuntu-cinnamon",
      lxqt: "ubuntu-lxqt",
      studio: "ubuntu-studio",
      sway: "ubuntu-sway",
      unity: "ubuntu-unity"
    },
    debian: {
      gnome: "debian-gnome",
      kde: "debian-kde",
      xfce: "debian-xfce",
      mate: "debian-mate",
      cinnamon: "debian-cinnamon",
      lxqt: "debian-lxqt"
    },
    lmde: { cinnamon: "lmde-cinnamon" },
    fedora: {
      kde: "fedora-kde",
      gnome: "fedora-gnome",
      xfce: "fedora-xfce",
      mate: "fedora-mate",
      cinnamon: "fedora-cinnamon",
      lxqt: "fedora-lxqt",
      i3: "fedora-i3",
      sway: "fedora-sway",
      nobara: "fedora-nobara",
      ultramarine: "fedora-ultramarine",
      rakuos: "fedora-rakuos",
      qubes: "fedora-qubes",
      capivaraos: "fedora-capivaraos",
      ludora: "fedora-ludora"
    },
    arch: {
      base: "arch-base",
      endeavour: "arch-endeavour",
      manjaro: "arch-manjaro",
      garuda: "arch-garuda",
      cachyos: "arch-cachyos",
      omarchy: "arch-omarchy",
      artix: "arch-artix",
      biglinux: "arch-biglinux",
      pearos: "arch-pearos",
      bluestar: "arch-bluestar",
      ml4w: "arch-ml4w",
      archcraft: "arch-archcraft",
      tromjaro: "arch-tromjaro",
      blendos: "arch-blendos",
      prismlinux: "arch-prismlinux",
      kiro: "arch-kiro",
      stratos: "arch-stratos",
      ezarcher: "arch-ezarcher"
    },
    manjaro: {
      kde: "manjaro-kde",
      gnome: "manjaro-gnome",
      xfce: "manjaro-xfce",
      cinnamon: "manjaro-cinnamon",
      mate: "manjaro-mate",
      i3: "manjaro-i3",
      sway: "manjaro-sway"
    },
    opensuse: {
      tumbleweed_kde: "opensuse-tumbleweed-kde",
      tumbleweed_gnome: "opensuse-tumbleweed-gnome",
      leap_kde: "opensuse-leap-kde",
      leap_gnome: "opensuse-leap-gnome",
      microos: "opensuse-microos",
      slowroll: "opensuse-slowroll",
      aeon: "opensuse-aeon"
    },
    pop: { gnome: "pop-gnome", nvidia: "pop-nvidia" },
    elementary: { pantheon: "elementary-pantheon" },
    zorin: { core: "zorin-core", pro: "zorin-pro", lite: "zorin-lite", education: "zorin-education" },
    "kde-neon": { user: "kde-neon-user", testing: "kde-neon-testing", unstable: "kde-neon-unstable" },
    endeavour: {
      kde: "endeavour-kde",
      gnome: "endeavour-gnome",
      xfce: "endeavour-xfce",
      i3wm: "endeavour-i3wm",
      sway: "endeavour-sway",
      bspwm: "endeavour-bspwm"
    },
    garuda: {
      kde: "garuda-kde",
      gnome: "garuda-gnome",
      xfce: "garuda-xfce",
      wayfire: "garuda-wayfire",
      hyprland: "garuda-hyprland",
      qtile: "garuda-qtile"
    },
    nixos: {
      gnome: "nixos-gnome",
      kde: "nixos-kde",
      hyprland: "nixos-hyprland",
      sway: "nixos-sway",
      minimal: "nixos-minimal",
      glf: "nixos-glf"
    },
    mx: {
      xfce: "mx-xfce",
      kde: "mx-kde",
      fluxbox: "mx-fluxbox",
      antix: "antix",
      devuan: "devuan",
      expirion: "expirion",
      lcos: "lcos",
      superlite: "superlite"
    },
    kali: {
      xfce: "kali-xfce",
      gnome: "kali-gnome",
      kde: "kali-kde",
      parrot: "parrot",
      kodachi: "kodachi",
      gnoppix: "gnoppix",
      osintvm: "osintvm",
      nethydra: "nethydra"
    },
    "ubuntu-derivatives": {
      tuxedo: "tuxedo-os",
      q4os: "q4os",
      lite: "linux-lite",
      deepin: "deepin",
      pikaos: "pikaos",
      anduinos: "anduinos",
      pureos: "pureos",
      slimbook: "slimbook-os",
      emmabuntus: "emmabuntus",
      siduction: "siduction",
      solydxk: "solydxk",
      raspios: "raspios",
      dietpi: "dietpi",
      makulu: "makulu",
      cuerdos: "cuerdos"
    },
    bazzite: {
      "bazzite-kde": "bazzite-kde",
      "bazzite-gnome": "bazzite-gnome",
      aurora: "aurora",
      silverblue: "fedora-silverblue",
      kinoite: "fedora-kinoite",
      butrelinux: "butrelinux",
      margine: "margine"
    },
    steamos: { holo: "steamos-holo" },
    rhel: {
      almalinux: "almalinux",
      rocky: "rocky-linux",
      rhel: "rhel",
      centos: "centos-stream",
      oreon: "oreon"
    },
    void: {
      glibc: "void-glibc",
      musl: "void-musl",
      agarimos: "agarimos",
      lazylinux: "lazylinux",
      nekovoid: "nekovoid",
      d77void: "d77void"
    },
    alpine: {
      desktop: "alpine-desktop",
      chimera: "chimera-linux",
      nura: "nura-linux"
    },
    solus: {
      budgie: "solus-budgie",
      gnome: "solus-gnome",
      kde: "solus-kde",
      xfce: "solus-xfce"
    },
    gentoo: {
      openrc: "gentoo-openrc",
      systemd: "gentoo-systemd",
      calculate: "calculate-linux",
      calamaroos: "calamaroos"
    },
    mageia: {
      mageia: "mageia",
      openmandriva: "openmandriva",
      pclinuxos: "pclinuxos",
      magos: "magos"
    },
    kaos: { kde: "kaos-kde" },
    vanilla: { gnome: "vanilla-gnome" },
    alt: { workstation: "alt-workstation" },
    guix: { desktop: "guix-desktop" },
    ibus: {
      debian: "ibus-debian",
      fedora: "ibus-fedora",
      arch: "ibus-arch",
      opensuse: "ibus-opensuse"
    },
    kime: {
      debian: "kime-debian",
      fedora: "kime-fedora",
      arch: "kime-arch",
      opensuse: "kime-opensuse"
    }
  };
  return map[distroKey]?.[editionKey] || `${distroKey}-${editionKey}`;
}

function getTemplateFamily(distroKey) {
  const families = {
    mint: "debian-family",
    ubuntu: "debian-family",
    debian: "debian-family",
    lmde: "debian-family",
    pop: "debian-family",
    elementary: "debian-family",
    zorin: "debian-family",
    "kde-neon": "debian-family",
    mx: "debian-family",
    kali: "debian-family",
    "ubuntu-derivatives": "debian-family",
    fedora: "fedora",
    arch: "arch-family",
    manjaro: "arch-family",
    endeavour: "arch-family",
    garuda: "arch-family",
    opensuse: "opensuse",
    nixos: "nixos",
    bazzite: "fedora-atomic",
    steamos: "steamos",
    rhel: "rhel-family",
    void: "void",
    alpine: "alpine",
    solus: "solus",
    gentoo: "gentoo",
    mageia: "mandriva-family",
    kaos: "kaos",
    vanilla: "vanilla",
    alt: "alt",
    guix: "guix",
    sparky: "debian-family",
    bodhi: "debian-family",
    peppermint: "debian-family",
    voyager: "debian-family",
    mabox: "arch-family",
    bunsenlabs: "debian-family",
    "generic-debian": "debian-family",
    "generic-arch": "arch-family",
    "generic-fedora": "fedora",
    "generic-opensuse": "opensuse",
    ibus: "ibus",
    kime: "kime"
  };
  return families[distroKey] || "debian-family";
}

// ──────────────────────────────────────────────────────────────
// 201위~552위 배포판 검색 가이드 & 파생 매핑 데이터베이스
// ──────────────────────────────────────────────────────────────
const DISTRO_FALLBACK_MAP = {
  simpleos: {
    name: "Simple OS",
    badge: "552위 · Debian 기반",
    base: "Debian (Calamares + Openbox)",
    targetDistro: "generic-debian",
    targetEdition: "xfce",
    hint: "Debian 기반의 미니멀 데스크톱입니다. Debian/Ubuntu 범용 스크립트(apt)로 100% 호환됩니다."
  },
  lxle: {
    name: "LXLE",
    badge: "Ubuntu 파생",
    base: "Ubuntu LTS (LXDE)",
    targetDistro: "generic-debian",
    targetEdition: "xfce",
    hint: "Ubuntu LTS 기반 경량 OS입니다. Debian/Ubuntu 범용 스크립트로 호환됩니다."
  },
  arcolinux: {
    name: "ArcoLinux",
    badge: "Arch 파생",
    base: "Arch Linux (Rolling)",
    targetDistro: "arch",
    targetEdition: "base",
    hint: "Arch Linux 기반 학습용 배포판입니다. Arch Linux 스크립트와 100% 호환됩니다."
  },
  blackarch: {
    name: "BlackArch",
    badge: "Arch 파생",
    base: "Arch Linux (Security)",
    targetDistro: "arch",
    targetEdition: "base",
    hint: "Arch Linux 기반 보안 침투 테스트 OS입니다. Arch Linux 스크립트와 100% 호환됩니다."
  },
  regata: {
    name: "Regata OS",
    badge: "openSUSE 파생",
    base: "openSUSE (Gaming)",
    targetDistro: "opensuse",
    targetEdition: "tumbleweed_kde",
    hint: "openSUSE 기반 게이밍 배포판입니다. openSUSE 스크립트로 100% 호환됩니다."
  },
  geckolinux: {
    name: "GeckoLinux",
    badge: "openSUSE 파생",
    base: "openSUSE Leap / Tumbleweed",
    targetDistro: "opensuse",
    targetEdition: "leap_kde",
    hint: "openSUSE 기반 데스크톱 배포판입니다. openSUSE 스크립트로 호환됩니다."
  },
  trisquel: {
    name: "Trisquel",
    badge: "Ubuntu 파생",
    base: "Ubuntu (자유 소프트웨어)",
    targetDistro: "generic-debian",
    targetEdition: "gnome",
    hint: "완전 자유 소프트웨어 Ubuntu 파생입니다. Debian/Ubuntu 범용 스크립트로 호환됩니다."
  },
  elive: {
    name: "Elive",
    badge: "Debian 파생",
    base: "Debian (Enlightenment)",
    targetDistro: "generic-debian",
    targetEdition: "xfce",
    hint: "Debian 기반의 감각적인 경량 OS입니다. Debian/Ubuntu 범용 스크립트로 호환됩니다."
  },
  feren: {
    name: "Feren OS",
    badge: "Ubuntu 파생",
    base: "Ubuntu LTS (KDE Plasma)",
    targetDistro: "generic-debian",
    targetEdition: "kde",
    hint: "Ubuntu 기반 Plasma 데스크톱 OS입니다. Debian/Ubuntu KDE 스크립트로 호환됩니다."
  },
  tails: {
    name: "Tails (The Amnesic Incognito Live System)",
    badge: "특수 보안 OS",
    unsupported: true,
    reason: "Tails는 매 부팅 시 RAM에서 실행되고 세션이 초기화되는 보안 익명 OS로, 영구 입력기 설치가 권장되지 않습니다."
  },
  tinycore: {
    name: "Tiny Core Linux",
    badge: "독립 초경량",
    unsupported: true,
    reason: "독자 .tcz 패키지 구조 및 초경량 라이브러리로 인해 Fcitx5 바이너리가 지원되지 않습니다."
  },
  puppy: {
    name: "Puppy Linux / EasyOS",
    badge: "독립 초경량",
    unsupported: true,
    reason: "독자 .pet 패키지 관리자 구조로 인해 Fcitx5 한글 입력기 바이너리가 공식 지원되지 않습니다."
  },
  slackware: {
    name: "Slackware / Salix / PorteuX / Slackel",
    badge: "독립 배포판",
    unsupported: true,
    reason: "Slackware 계열은 사용자가 직접 SlackBuilds(sbopkg)로 Fcitx5 및 의존 라이브러리를 소스 컴파일해야 합니다."
  },
  freebsd: {
    name: "FreeBSD / GhostBSD / NomadBSD",
    badge: "비리눅스 (BSD)",
    unsupported: true,
    reason: "리눅스가 아닌 BSD 유닉스 운영체제입니다. 터미널에서 'sudo pkg install fcitx5 fcitx5-hangul'로 설치를 권장합니다."
  },
  openbsd: {
    name: "OpenBSD / NetBSD",
    badge: "비리눅스 (BSD)",
    unsupported: true,
    reason: "리눅스가 아닌 독립 BSD 운영체제입니다."
  },
  haiku: {
    name: "Haiku OS",
    badge: "독립 OS (BeOS 후속)",
    unsupported: true,
    reason: "리눅스가 아닌 독립 오픈소스 운영체제로 Fcitx5가 호환되지 않습니다."
  },
  reactos: {
    name: "ReactOS",
    badge: "독립 OS (Windows NT 호환)",
    unsupported: true,
    reason: "윈도우 NT 호환을 목표로 하는 독립 운영체제로 리눅스 입력기를 사용할 수 없습니다."
  },
  openwrt: {
    name: "OpenWrt / IPFire",
    badge: "네트워크 전용 OS",
    unsupported: true,
    reason: "네트워크 라우터/임베디드 전용 운영체제로 GUI 데스크톱 환경이 없습니다."
  },
  pfsense: {
    name: "pfSense / OPNsense",
    badge: "방화벽 전용 OS",
    unsupported: true,
    reason: "방화벽/네트워크 게이트웨이 전용 운영체제로 GUI 데스크톱 환경이 없습니다."
  },
  truenas: {
    name: "TrueNAS / unRAID",
    badge: "스토리지 (NAS) 전용 OS",
    unsupported: true,
    reason: "네트워크 연결 스토리지(NAS) 전용 운영체제입니다."
  },
  crux: {
    name: "CRUX / Lunar Linux",
    badge: "소스 빌드 독립 OS",
    unsupported: true,
    reason: "BSD 스타일의 소스 컴파일 전용 독립 리눅스로 Fcitx5 자동 패키징이 지원되지 않습니다."
  },
  "4mlinux": {
    name: "4MLinux",
    badge: "독립 미니멀 OS",
    unsupported: true,
    reason: "독자 바이너리 패키지 구조로 Fcitx5 한글 엔진이 제공되지 않습니다."
  }
};

const KOREAN_ALIASES = {
  "심플": "simpleos",
  "스파키": "sparky",
  "보디": "bodhi",
  "페퍼민트": "peppermint",
  "보이저": "voyager",
  "마복스": "mabox",
  "번센": "bunsenlabs",
  "테일즈": "tails",
  "퍼피": "puppy",
  "슬랙웨어": "slackware",
  "프리bsd": "freebsd",
  "하이쿠": "haiku",
  "리액트": "reactos",
  "아르코": "arcolinux",
  "블랙아치": "blackarch",
  "레가타": "regata",
  "게코": "geckolinux",
  "트리스켈": "trisquel",
  "엘라이브": "elive",
  "페렌": "feren",
  "가루다": "garuda",
  "민트": "mint",
  "우분투": "ubuntu",
  "쿠분투": "kubuntu kde",
  "주분투": "xubuntu xfce",
  "루분투": "lubuntu lxqt",
  "페도라": "fedora",
  "노바라": "nobara",
  "바자이트": "bazzite",
  "오로라": "aurora",
  "실버블루": "silverblue",
  "키노이트": "kinoite",
  "아치": "arch",
  "만자로": "manjaro",
  "엔데버": "endeavour",
  "캐치": "cachyos",
  "오마키": "omarchy",
  "아트릭스": "artix",
  "데비안": "debian",
  "칼리": "kali",
  "패럿": "parrot",
  "라즈베리": "raspios raspberry",
  "오픈수세": "opensuse",
  "수세": "opensuse",
  "알마": "almalinux",
  "록키": "rocky",
  "센트": "centos",
  "레드햇": "rhel",
  "보이드": "void",
  "알파인": "alpine",
  "솔루스": "solus",
  "젠투": "gentoo",
  "마게이아": "mageia",
  "카오스": "kaos",
  "바닐라": "vanilla",
  "닉스": "nixos",
  "스팀": "steamos",
  "덱": "steamos deck",
  "턱시도": "tuxedo",
  "딥인": "deepin",
  "구익스": "guix",
  "아이버스": "ibus",
  "아이부스": "ibus",
  "키메": "kime"
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    GITHUB_REPO,
    DISTRO_DATA,
    getScriptId,
    getTemplateFamily,
    DISTRO_FALLBACK_MAP,
    KOREAN_ALIASES
  };
}
