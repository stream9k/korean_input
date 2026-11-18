# NixOS Sway - 한글 입력기 설정 (configuration.nix)
# 이 스크립트는 실행 파일이 아닙니다. configuration.nix 에 병합하세요.

# 1. fcitx5 패키지 및 한글 엔진 추가
{ config, pkgs, ... }:

{
  # fcitx5 활성화
  i18n.inputMethod = {
    enabled = "fcitx5";
    fcitx5 = {
      enable = true;
      engines = with pkgs; [ fcitx5-hangul ];  # 한국어
      # engines = with pkgs; [ fcitx5-hangul fcitx5-mozc fcitx5-chinese-addons ]; # 다국어
    };
  };

  # 2. 환경변수 (Wayland/X11 공통)
  environment.sessionVariables = {
    GTK_IM_MODULE = "fcitx";
    QT_IM_MODULE = "fcitx";
    XMODIFIERS = "@im=fcitx";
  };

  # 3. 자동시작 (플라즈마/그놈 등에서 자동 처리됨)
  # Wayland 세션용 추가 환경변수
  wayland = {
    enable = true;
    windowManager.fcitx5 = {
      enable = true;
    };
  };

  # 4. 사용자별 Fcitx5 설정 (홈 매니저 사용 시)
  # home-manager 옵션 예시:
  # programs.fcitx5 = {
  #   enable = true;
  #   engines = with pkgs; [ fcitx5-hangul ];
  #   configFile = {
  #     "profile" = ''
  #       [Groups/0]
  #       Name=Default
  #       Default Layout=us
  #       DefaultIM=keyboard-us
  #       [Groups/0/Items/0]
  #       Name=keyboard-us
  #       Layout=
  #       [Groups/0/Items/1]
  #       Name=hangul
  #       Layout=
  #       [GroupOrder]
  #       0=Default
  #     '';
  #     "config" = ''
  #       [Hotkey]
  #       EnumerateWithTriggerKeys=True
  #       SkipFirst=False
  #       [Hotkey/TriggerKeys]
  #       0=Hangul
  #       1=Control+space
  #       2=Shift+space
  #     '';
  #   };
  # };

  # 5. 폰트 (한글 렌더링)
  fonts.packages = with pkgs; [ noto-fonts-cjk noto-fonts-emoji ];
}

# ─── 적용 방법 ───
# 1. 위 내용을 /etc/nixos/configuration.nix 에 병합
# 2. sudo nixos-rebuild switch
# 3. 재부팅 또는 재로그인
# 4. fcitx5-configtool 로 엔진 순서/핫키 확인
