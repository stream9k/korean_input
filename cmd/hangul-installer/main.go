package main

import (
	"flag"
	"fmt"
	"os"
	"os/exec"
	"runtime"

	installer "github.com/stream9k/korean_input"
)

const version = "1.1.2"

func main() {
	showVersion := flag.Bool("version", false, "버전 정보 출력")
	printScript := flag.Bool("print", false, "내장된 설치 스크립트 내용 출력")
	flag.Parse()

	if *showVersion {
		fmt.Printf("hangul-installer v%s (%s/%s)\n", version, runtime.GOOS, runtime.GOARCH)
		return
	}

	if *printScript {
		fmt.Print(installer.InstallScript)
		return
	}

	if runtime.GOOS != "linux" {
		fmt.Fprintf(os.Stderr, "❌ 이 설치 프로그램은 Linux 전용입니다 (현재 OS: %s).\n", runtime.GOOS)
		os.Exit(1)
	}

	if os.Geteuid() != 0 {
		sudoPath, err := exec.LookPath("sudo")
		if err != nil {
			fmt.Fprintln(os.Stderr, "❌ root 권한이 필요합니다. 'sudo'로 다시 실행하세요.")
			os.Exit(1)
		}
		exe, err := os.Executable()
		if err != nil {
			fmt.Fprintf(os.Stderr, "❌ 실행 파일 경로 확인 실패: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("🔐 관리자 권한(sudo)으로 설치를 시작합니다...")
		args := append([]string{exe}, flag.Args()...)
		cmd := exec.Command(sudoPath, args...)
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			if exitErr, ok := err.(*exec.ExitError); ok {
				os.Exit(exitErr.ExitCode())
			}
			fmt.Fprintf(os.Stderr, "❌ sudo 실행 실패: %v\n", err)
			os.Exit(1)
		}
		return
	}

	tmpFile, err := os.CreateTemp("", "hangul-installer-*.sh")
	if err != nil {
		fmt.Fprintf(os.Stderr, "❌ 임시 스크립트 생성 실패: %v\n", err)
		os.Exit(1)
	}
	tmpPath := tmpFile.Name()
	defer os.Remove(tmpPath)

	if _, err := tmpFile.WriteString(installer.InstallScript); err != nil {
		tmpFile.Close()
		fmt.Fprintf(os.Stderr, "❌ 임시 스크립트 쓰기 실패: %v\n", err)
		os.Exit(1)
	}
	if err := tmpFile.Close(); err != nil {
		fmt.Fprintf(os.Stderr, "❌ 임시 스크립트 닫기 실패: %v\n", err)
		os.Exit(1)
	}

	shellPath, err := exec.LookPath("bash")
	if err != nil {
		fmt.Fprintln(os.Stderr, "❌ bash가 설치되어 있지 않습니다. Alpine Linux 등은 'scripts/alpine/alpine-desktop.sh'를 sh로 실행하세요.")
		os.Exit(1)
	}

	cmd := exec.Command(shellPath, append([]string{tmpPath}, flag.Args()...)...)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			os.Exit(exitErr.ExitCode())
		}
		fmt.Fprintf(os.Stderr, "❌ 설치 스크립트 실행 실패: %v\n", err)
		os.Exit(1)
	}
}
