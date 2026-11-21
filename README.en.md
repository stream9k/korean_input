# Linux Korean Input Method Auto-Installer (`fcitx5-hangul` / `ibus-hangul` / `kime`)

🌐 [🇰🇷 한국어 (README.md)](README.md) | **🇺🇸 English** | [🌐 Web Generator (is.gd/korean_input)](https://is.gd/korean_input)

Installed Linux in English (`en_US`) and need Korean input + clean Korean fonts right away?  
This tool automatically detects your distribution and configures **`fcitx5-hangul` (or `ibus-hangul` / `kime`)** alongside **Noto CJK fonts** in **one command**.

> 💡 **For most users, the one-line command below finishes everything in one shot.**

---

## ⚡ Quick Start: One-Line Auto Install (Recommended)

No `git` required, no `chmod +x` needed, and no need to select your distro manually. Open your terminal (`Ctrl + Alt + T`) and paste:

```bash
# Using curl (recommended)
curl -fsSL https://raw.githubusercontent.com/stream9k/korean_input/main/install.sh | sudo bash
```

```bash
# Using wget (if curl is missing)
wget -qO- https://raw.githubusercontent.com/stream9k/korean_input/main/install.sh | sudo bash
```

> 🛡️ **Pre-flight Confirmation**: Before modifying anything, the installer inspects your OS, desktop session, and existing IMEs, prints all planned package and config changes with the recommended IME (`fcitx5-hangul`, or `ibus-hangul` on RHEL), and prompts `[y/N/ibus]` (or `[y/N]`).
> * Prefer IBus? Type **`ibus`** at the confirmation prompt or pass `--ibus` (`... | sudo bash -s -- --ibus`).
> * For unattended runs, append `-s -- --yes` (or `--yes` / `-y` locally).

### After Installation
1. **Log out and log back in** (or reboot).
2. Press `Hangul` or `Ctrl + Space` to toggle Korean input.
   * 🖥 **KDE Plasma Users**: The installer automatically sets the Virtual Keyboard to **Fcitx 5** in `~/.config/kwinrc`. (If it is not active after re-login, verify it under `System Settings → Input Devices → Virtual Keyboard`.)
   * ⌨️ **US Keyboards (Right Alt)**: Open `fcitx5-configtool` → **Global Options** → **Trigger Input Method** and press `Right Alt` (`Alt_R`) to add it as a toggle key.
   * 💡 **Firefox Menu Bar Conflict (Right Alt triggers both menu dropdown & Hangul)**:
     * If pressing Right Alt pops up the app menu in Firefox while toggling Korean, remap Right Alt at the XKB hardware level:
     * **Settings** → **Keyboard** → **Keybindings (or Layout)** → **Options** → **Korean Hangul/Hanja keys** → check **Make Right Alt a Hangul key** → **Apply**.

---

## 🌐 Web Script Generator (Pick Your Distro)

If you prefer selecting your exact Linux distribution and desktop environment (GNOME, KDE, Xfce, etc.):

* 🔗 **Web Generator**: **[https://is.gd/korean_input](https://is.gd/korean_input)** (or [GitHub Pages](https://stream9k.github.io/korean_input/?lang=en))

The Web Generator offers two execution choices:
* **Option A (Terminal One-Liner)**: Copy and paste the one-liner command directly into your terminal (no download needed).
* **Option B (Download Script)**: Inspect the shell code or download the `.sh` file and run via `sudo bash ~/Downloads/filename.sh`.

---

## 📌 Distro-Specific One-Liners

Representative one-liners from our **194 pre-generated scripts across 19 families**:

| Distro | Desktop / Edition | IME | One-Line Command |
|:---|:---|:---|:---|
| **Ubuntu** | GNOME (Default) | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/ubuntu-gnome.sh \| sudo bash` |
| **Linux Mint** | Cinnamon (Default) | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/mint-cinnamon.sh \| sudo bash` |
| **LMDE** | Cinnamon | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/lmde-cinnamon.sh \| sudo bash` |
| **Debian** | GNOME | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/debian-family/debian-gnome.sh \| sudo bash` |
| **Fedora** | KDE Plasma | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/fedora/fedora-kde.sh \| sudo bash` |
| **Fedora** | GNOME (Workstation) | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/fedora/fedora-gnome.sh \| sudo bash` |
| **Arch Linux** | Base | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/arch-family/arch-base.sh \| sudo bash` |
| **Garuda Linux** | KDE Plasma | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/arch-family/garuda-kde.sh \| sudo bash` |
| **Manjaro** | KDE Plasma | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/arch-family/manjaro-kde.sh \| sudo bash` |
| **openSUSE** | Tumbleweed KDE | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/opensuse/opensuse-tumbleweed-kde.sh \| sudo bash` |
| **Bazzite** | KDE / Steam Deck | `fcitx5` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/fedora-atomic/bazzite-kde.sh \| sudo bash` |
| **Rocky / Alma / RHEL** | GNOME (Enterprise) | `ibus` | `curl -sL https://raw.githubusercontent.com/stream9k/korean_input/main/scripts/rhel-family/rocky-linux.sh \| sudo bash` |
| **NixOS** | GNOME / KDE | `fcitx5` | Merge snippet from [scripts/nixos/](scripts/nixos/) into `configuration.nix` |

<details>
<summary>📂 View full list of 194 supported scripts and distro families</summary>

* **Debian / Ubuntu Family (75 scripts)**: Mint, LMDE, Ubuntu, Kubuntu, Debian, Pop!_OS, Zorin OS, elementary OS, Sparky, Bodhi, Peppermint, Voyager, BunsenLabs, MX Linux, Kali, Parrot, Q4OS, etc.
* **Arch Family (41 scripts)**: Arch Linux, EndeavourOS, Garuda, Manjaro, CachyOS, Mabox, Artix, BigLinux, Archcraft, etc.
* **Fedora Family (17 scripts)**: Fedora Workstation (GNOME), KDE Spin, Xfce, Nobara, Ultramarine, Qubes OS (TemplateVM), etc.
* **Immutable OS Family (9 scripts)**: Bazzite, Fedora Silverblue/Kinoite, SteamOS 3.x, Vanilla OS, etc.
* **openSUSE Family (9 scripts)**: Tumbleweed, Leap, MicroOS, Slowroll, Aeon, etc.
* **NixOS Family (6 scripts)**: GNOME, KDE, Hyprland, Sway, Minimal, etc.
* **Enterprise RHEL Family (5 scripts)**: RHEL, Rocky Linux, AlmaLinux, CentOS Stream, Oreon (`ibus-hangul` standard stack)
* **Independent / Lightweight (24 scripts)**: Void Linux, Alpine Linux, Solus, Gentoo, Mageia, KaOS, Guix, etc.
* **ibus-hangul Alternative IME (4 scripts)**: GNOME-friendly universal `ibus-hangul` scripts for Debian/Ubuntu, Fedora/RHEL, Arch, openSUSE
* **kime Alternative IME (4 scripts)**: Rust-based `kime` scripts for Debian, Fedora/RHEL (EL source build), Arch, openSUSE

</details>

---

## ✅ Verified Distributions (Hands-On Tested)

Distributions directly tested for installation and Korean input functionality:

### Listed Supported Distributions
* **EndeavourOS**
* **Omarchy**
* **Garuda Linux**

### Unlisted Distributions Confirmed Working (via Auto-Detect `install.sh`)
* **Bodhi Linux**
* **Loc-OS**
* **SparkyLinux Multimedia**

---

## ⚙️ Key Automatic Configurations

1. **Removes Conflicting IMEs**: Automatically purges legacy `fcitx4` remnants and disables conflicting `ibus` user services.
2. **Installs Full Stack + Noto CJK Fonts**: Prevents broken `□` glyphs by bundling Korean font packages.
3. **Environment Variables**: Sets `GTK_IM_MODULE`, `QT_IM_MODULE`, and `XMODIFIERS` for both Wayland and X11 sessions.
4. **Pre-configured Profile**: Sets `keyboard-us` + `hangul` input profiles and configures `Hangul`, `Ctrl+Space`, and `Shift+Space` toggles.
5. **One-Shot Post-Reboot Guide**: Shows a one-time welcome dialog with essential desktop shortcuts on your next login, then self-deletes.

---

## ❓ FAQ & Troubleshooting

### Q1. Korean toggle does not work with Right Alt (US keyboards).
Standard US keyboards send `Alt_R` instead of `Hangul`:
1. Run `fcitx5-configtool` from terminal.
2. Open **Global Options** → **Trigger Input Method**.
3. Press `Right Alt` to add `Alt_R`, then click **Apply**.

### Q2. Korean input still does not work after re-login.
Run these commands in terminal to inspect the setup:
```bash
pgrep -af fcitx5          # Verify daemon is running
fcitx5 -r -d              # Restart daemon if not running
env | grep -i im_module   # Check environment variables
fcitx5-diagnose           # Print full diagnostic report
```

### Q3. Korean input fails in Chrome / VS Code (Wayland).
Add `--enable-wayland-ime` to `~/.config/chrome-flags.conf` or `~/.config/code-flags.conf`.

---

## 📦 Versioned Release Script & Checksum Verification

If you prefer inspecting the script and verifying its checksum instead of piping `curl | bash`, download `install.sh`, `SHA256SUMS.txt`, and the release README files (`README.md`, `README.en.md`) from [GitHub Releases](https://github.com/stream9k/korean_input/releases/latest):

```bash
curl -LO https://github.com/stream9k/korean_input/releases/latest/download/install.sh
curl -LO https://github.com/stream9k/korean_input/releases/latest/download/SHA256SUMS.txt
sha256sum -c SHA256SUMS.txt
sudo bash install.sh
```

---

## 🤝 Credits & License

Built referencing proven open-source setups from [linuxmint-fcitx5-cjk-fix](https://github.com/kylechoidev/linuxmint-fcitx5-cjk-fix), [fedora42-fcitx5-guide](https://github.com/StrKare/fedora42-fcitx5-guide), and [ArchWiki Localization/Korean](https://wiki.archlinux.org/title/Localization/Korean).

Licensed under the **[MIT License](LICENSE)**.
