# NixOS GLF OS (NixOS 기반 게이밍) - 한글 입력기 설정 (configuration.nix)
# 이 스크립트는 실행 파일이 아닙니다. configuration.nix 에 병합하세요.

# 1. fcitx5 패키지 및 한글 엔진 추가
{ config, pkgs, ... }:

{
  # fcitx5 활성화
  i18n.inputMethod = {
    enable = true;
    type = "fcitx5";
    fcitx5 = {
      # waylandFrontend = true; # Wayland(GNOME/KDE/Hyprland/Sway) 사용 시 권장
      addons = with pkgs; [ fcitx5-hangul ];  # 한국어
      # addons = with pkgs; [ fcitx5-hangul fcitx5-mozc fcitx5-chinese-addons ]; # 다국어
    };
  };

  # 2. 환경변수 (Wayland/X11 공통)
  environment.sessionVariables = {
    GTK_IM_MODULE = "fcitx";
    QT_IM_MODULE = "fcitx";
    XMODIFIERS = "@im=fcitx";
  };

  # 3. 사용자별 Fcitx5 설정 (홈 매니저 사용 시)
  # home-manager 옵션 예시:
  # programs.fcitx5 = {
  #   enable = true;
  #   addons = with pkgs; [ fcitx5-hangul ];
  #   settings = {
  #     inputMethod = {
  #       "Groups/0" = {
  #         Name = "Default";
  #         "Default Layout" = "us";
  #         DefaultIM = "hangul";
  #       };
  #       "Groups/0/Items/0".Name = "keyboard-us";
  #       "Groups/0/Items/1".Name = "hangul";
  #       GroupOrder."0" = "Default";
  #     };
  #   };
  # };

  # 4. 폰트 (한글 렌더링)
  fonts.packages = with pkgs; [ noto-fonts-cjk-sans noto-fonts-color-emoji ];
}

# ─── 적용 방법 ───
# 1. 위 내용을 /etc/nixos/configuration.nix 에 병합
# 2. sudo nixos-rebuild switch
# 3. 재부팅 또는 재로그인
# 4. fcitx5-configtool 로 엔진 순서/핫키 확인
