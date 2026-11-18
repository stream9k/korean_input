package installer

import _ "embed"

// InstallScript에는 배포판 자동 감지 올인원 설치 스크립트(install.sh)가 내장됩니다.
//
//go:embed install.sh
var InstallScript string
