# Linux Korean Input Method Auto-Installer (`fcitx5-hangul` / `kime`)

🌐 [🇰🇷 한국어 (README.md)](README.md) | **🇺🇸 English** | [Web Generator (Short: is.gd/korean_input)](https://is.gd/korean_input) | [English Web Page](https://stream9k.github.io/korean_input/index-en.html)

Installed Linux in English (`en_US`) and struggling to type or render Korean characters?  
This repository provides an **auto-detecting all-in-one installer (`install.sh`)**, a **web script generator**, and **190 distro/edition-specific scripts across 18 Linux families** to set up Korean input (`fcitx5-hangul` / `kime` / `ibus-hangul`) and **Noto CJK Korean fonts** in one step.

> 💡 **Built for English-only Linux installs**: Even if your Linux OS was installed purely in English without Korean fonts or `git`, `install.sh` detects your `$LANG` locale, prints English terminal prompts before fonts are installed, installs **Noto CJK fonts** to prevent broken `□□□` glyphs, and configures English/Korean switching cleanly.

---

## ⚡ 10-Second Quick Start

No `git` required. No `chmod +x` needed. No need to pick your distro manually.

1. Open your terminal (`Ctrl + Alt + T`).
2. Paste this single command, press `Enter`, and enter your `sudo` password:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input/main/install.sh | sudo bash
   ```
3. **Log out and log back in** (or reboot) when finished, then press `Hangul`, `Ctrl + Space`, or `Shift + Space` to type Korean!
   - *(KDE Plasma users: select **Fcitx 5** in `System Settings → Input Devices → Virtual Keyboard`)*
   - *(Prefer selecting your distro manually? Open the [Web Generator (is.gd/korean_input)](https://is.gd/korean_input))*

---

## 📌 What This Tool Automatically Configures

1. **Removes conflicting legacy IMEs**: Purges legacy `fcitx` (fcitx4) packages or disables conflicting `ibus` user services where needed.
2. **Installs full IME stack + Korean fonts**: Installs `fcitx5`, `fcitx5-hangul`, GTK3/GTK4 & Qt5/Qt6 frontends, `fcitx5-configtool`, and **Noto CJK fonts** (`fonts-noto-cjk` / `noto-fonts-cjk` / `google-noto-sans-cjk-*`).
3. **Switches system IM framework**: Runs `im-config -n fcitx5` (Debian/Ubuntu) or `alternatives` (Fedora/openSUSE) appropriately.
4. **Pre-configures profile & hotkeys**: Sets up `keyboard-us` + `hangul` in `~/.config/fcitx5/profile` and binds `Hangul`, `Ctrl+Space`, and `Shift+Space` in `~/.config/fcitx5/config`.
5. **Clears desktop shortcut conflicts**: Unbinds `Super+Space` input-source switching on Cinnamon, GNOME, Xfce, and MATE via `gsettings`.
6. **Sets X11 / Wayland environment variables**: Configures `~/.config/environment.d/fcitx5.conf`, `/etc/environment`, and `~/.xsessionrc` / `~/.bash_profile` / `~/.xprofile`.
7. **Registers autostart**: Adds `~/.config/autostart/fcitx5.desktop` (and `systemd --user` where applicable).

---

## 🚀 Installation Methods

### Method 1: Universal Auto-Detect One-Liner (Recommended — No `git` / `chmod` needed)

```bash
# Using curl (available on most distros)
curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input/main/install.sh | sudo bash

# Or using wget
wget -qO- https://raw.githubusercontent.com/stream9k/korean_input/main/install.sh | sudo bash
```

> Force English or Korean terminal output explicitly with `--lang=en` or `--lang=ko` (e.g., `sudo bash install.sh --lang=en`).

### Method 2: Running a Downloaded `.sh` File (Without `chmod +x`)

Linux browsers and `curl -O` save downloaded files without execute permissions (`+x`). Instead of `./install.sh` (which fails with Permission Denied), simply pass the file to **`sudo bash`**:

```bash
curl -fsSLO https://raw.githubusercontent.com/stream9k/korean_input/main/install.sh
sudo bash install.sh

# Or if downloaded via browser to ~/Downloads:
sudo bash ~/Downloads/install.sh
```

- **Web Generator**: Use the [English Web Page](https://stream9k.github.io/korean_input/index-en.html) (or [Auto KO/EN Page](https://stream9k.github.io/korean_input/)) to search by distro/desktop and copy or download tailored scripts.

### Method 3: Distro-Specific One-Liners

| Distro | Desktop / Edition | One-Line Command |
|---|---|---|
| **Garuda Linux** | KDE Plasma (Dragonized) | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/arch-family/garuda-kde.sh \| sudo bash` |
| **Linux Mint** | Cinnamon (Default) | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/mint-cinnamon.sh \| sudo bash` |
| **Ubuntu** | GNOME (Default) | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/ubuntu-gnome.sh \| sudo bash` |
| **Kubuntu** | KDE Plasma | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/ubuntu-kde.sh \| sudo bash` |
| **Debian** | GNOME (Default) | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/debian-gnome.sh \| sudo bash` |
| **Fedora** | KDE Plasma | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/fedora/fedora-kde.sh \| sudo bash` |
| **Fedora** | GNOME (Workstation) | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/fedora/fedora-gnome.sh \| sudo bash` |
| **Arch Linux** | Base | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/arch-family/arch-base.sh \| sudo bash` |
| **Manjaro** | KDE Plasma | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/arch-family/manjaro-kde.sh \| sudo bash` |
| **openSUSE** | Tumbleweed KDE | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/opensuse/opensuse-tumbleweed-kde.sh \| sudo bash` |
| **MX Linux** | Xfce (Default) | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/mx-xfce.sh \| sudo bash` |
| **Bazzite** | KDE / Deck (Immutable) | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/fedora-atomic/bazzite-kde.sh \| sudo bash` |
| **AlmaLinux** | GNOME (`ibus-hangul`) | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/rhel-family/almalinux.sh \| sudo bash` |
| **Void Linux** | glibc | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/void/void-glibc.sh \| sudo bash` |

### Method 4: Single Static Go Binary (`hangul-installer`)

Pre-built static Linux binaries ([`cmd/hangul-installer/main.go`](cmd/hangul-installer/main.go)) with `install.sh` embedded are published on [GitHub Releases](https://github.com/stream9k/korean_input/releases/latest):

- **x86_64 (amd64)**: [`hangul-installer-linux-amd64`](https://github.com/stream9k/korean_input/releases/latest/download/hangul-installer-linux-amd64)
- **ARM64 (aarch64)**: [`hangul-installer-linux-arm64`](https://github.com/stream9k/korean_input/releases/latest/download/hangul-installer-linux-arm64)

```bash
curl -fsSLO https://github.com/stream9k/korean_input/releases/latest/download/hangul-installer-linux-amd64
chmod +x hangul-installer-linux-amd64
./hangul-installer-linux-amd64
```

---

## ✅ Post-Install Checklist & Tips for US Keyboard Users

### 1. Log Out & Log Back In (or Reboot)
Input method environment variables take effect only on a new desktop session. For immutable distros (**Bazzite, Aurora, Fedora Silverblue/Kinoite, Vanilla OS, openSUSE Aeon/MicroOS**), a **full reboot** (`systemctl reboot`) is required.

### 2. Using Right Alt (`Alt_R`) on a US / Non-Korean Keyboard
Standard US/international keyboards send `Alt_R` instead of the Korean `Hangul` keycode when pressing Right Alt.
- By default, you can immediately use **`Ctrl + Space`** or **`Shift + Space`**.
- To also toggle Korean with **Right Alt**:
  1. Run `fcitx5-configtool` from your terminal or app launcher.
  2. Open **Global Options** → click **Trigger Input Method**.
  3. Press your **Right Alt** key to bind `Alt_R`, then click **Apply**.

### 3. KDE Plasma (Wayland) Extra Step
On KDE Plasma (Garuda Dragonized, Fedora KDE, Kubuntu, Manjaro KDE, Bazzite KDE, openSUSE KDE):
1. Open **System Settings** → **Input Devices** → **Virtual Keyboard**.
2. Select **Fcitx 5** (or **Kime** if using `kime`) and click **Apply**.
3. Log out and log back in.

### 4. NixOS Users
NixOS uses declarative snippets in `scripts/nixos/` (e.g., `scripts/nixos/nixos-gnome.nix`). Merge the snippet into `/etc/nixos/configuration.nix` and run `sudo nixos-rebuild switch`.

---

## 📋 Coverage & Troubleshooting

- **Coverage**: **18 template families, 168 scripts/configs** covering **160 of 176 general Linux desktops (90.9%)** in the DistroWatch Top 200. (Non-Linux OSes, server/NAS appliances, and source-only/alpha distros are excluded — see [README.md](README.md) for the full 168-script matrix and 40 excluded OSes.)
- **Diagnostics**:
  ```bash
  pgrep -af fcitx5          # verify daemon is running
  env | grep -i -E "im_module|xmodifiers"
  fcitx5-diagnose           # full diagnostic report
  fcitx5 -r -d              # restart daemon
  ```
- **Chrome / Electron apps on Wayland**: Add `--enable-wayland-ime` to `~/.config/chrome-flags.conf` or `~/.config/code-flags.conf`.
- **Logs**: Installation logs are written to `/var/log/install-hangul-*.log`.

---

## 🤝 Credits & License

Templates were created by referencing package setups, configuration order, and edge-case handling from these projects:

| Project | Purpose | License | Source |
|---|---|---|---|
| `linuxmint-fcitx5-cjk-fix` | Complete Linux Mint Cinnamon fcitx5 migration | MIT | https://github.com/kylechoidev/linuxmint-fcitx5-cjk-fix |
| `linux-hangul-input-setup` | LMDE 7 / Debian-family fcitx5 setup scripts | MIT | https://github.com/ppugend/linux-hangul-input-setup |
| `fedora42-fcitx5-guide` | Fedora 42 KDE Plasma fcitx5 guide + install-fcitx5.sh | MIT | https://github.com/StrKare/fedora42-fcitx5-guide |
| `Hangul-fixer` | Cross-distro cheat sheet + kime introduction | MIT | https://github.com/kernalix7/Hangul-fixer |
| `ArchWiki Localization/Korean` | Official fcitx5-hangul configuration docs | CC BY-SA 4.0 | https://wiki.archlinux.org/title/Localization/Korean |
| `Fedora Wiki I18N/Fcitx5` | Official Fedora package list & alternatives setup | CC BY-SA 4.0 | https://fedoraproject.org/wiki/I18N/Fcitx5 |
| `Omarchy PR #11719` | omarchy-setup-input-hangul — dynamic D-Bus fcitx5 setup | MIT | https://github.com/omacom/omarchy/pull/11719 |

Licensed under the **MIT License** — see [LICENSE](LICENSE).
