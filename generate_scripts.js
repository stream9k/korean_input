#!/usr/bin/env node
/**
 * index.html에 정의된 DISTRO_DATA와 SCRIPT_TEMPLATES를 기반으로
 * scripts/<family>/<scriptId>.<ext> 파일들을 일괄 생성합니다.
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = __dirname;
const SCRIPTS_DIR = path.join(ROOT_DIR, "scripts");

function loadGeneratorCore() {
  const data = require("./js/data.js");
  const templates = require("./js/templates.js");
  return {
    GITHUB_REPO: data.GITHUB_REPO,
    DISTRO_DATA: data.DISTRO_DATA,
    SCRIPT_TEMPLATES: templates.SCRIPT_TEMPLATES,
    getScriptId: data.getScriptId,
    getTemplateFamily: data.getTemplateFamily
  };
}

function syncIndexAssetVersions() {
  const templatesPath = path.join(ROOT_DIR, "js", "templates.js");
  const indexPath = path.join(ROOT_DIR, "index.html");
  if (!fs.existsSync(templatesPath) || !fs.existsSync(indexPath)) return;

  const templatesSrc = fs.readFileSync(templatesPath, "utf8");
  const match = templatesSrc.match(/SCRIPT_VERSION="([^"]+)"/);
  if (!match) return;

  const version = match[1];
  const indexSrc = fs.readFileSync(indexPath, "utf8");
  const updated = indexSrc.replace(
    /src="js\/(data|templates|app)\.js(?:\?v=[^"]*)?"/g,
    `src="js/$1.js?v=${version}"`
  );
  if (updated !== indexSrc) {
    fs.writeFileSync(indexPath, updated, "utf8");
    console.log(`✅ index.html JS 캐시 버스팅 버전 동기화 (?v=${version})`);
  }
}

function main() {
  const {
    DISTRO_DATA,
    SCRIPT_TEMPLATES,
    getScriptId,
    getTemplateFamily
  } = loadGeneratorCore();

  syncIndexAssetVersions();

  const generatedFiles = new Map();
  const familyCounts = new Map();

  for (const [distroKey, distro] of Object.entries(DISTRO_DATA)) {
    const family = getTemplateFamily(distroKey);
    const templateFn = SCRIPT_TEMPLATES[family] || SCRIPT_TEMPLATES["debian-family"];
    const ext = distroKey === "nixos" ? "nix" : "sh";

    for (const [editionKey, edition] of Object.entries(distro.editions)) {
      const scriptId = getScriptId(distroKey, editionKey);
      const outDir = path.join(SCRIPTS_DIR, family);
      const fileName = `${scriptId}.${ext}`;
      const outPath = path.join(outDir, fileName);

      fs.mkdirSync(outDir, { recursive: true });

      const content = templateFn({
        distroName: distro.name,
        editionLabel: edition.label,
        scriptId,
        distroKey,
        editionKey
      }).replace(/\r\n/g, "\n");

      const relPath = path.relative(ROOT_DIR, outPath).replace(/\\/g, "/");
      const isUpdate = generatedFiles.has(relPath);

      fs.writeFileSync(outPath, content, "utf8");
      if (ext === "sh") {
        try {
          fs.chmodSync(outPath, 0o755);
        } catch {
          // Windows 환경에서는 POSIX 실행 비트가 무시될 수 있음
        }
      }

      generatedFiles.set(relPath, { distroKey, editionKey, family });
      if (!isUpdate) {
        familyCounts.set(family, (familyCounts.get(family) || 0) + 1);
      }
    }
  }

  console.log(`✅ 총 ${generatedFiles.size}개 스크립트 파일 생성 완료 (${SCRIPTS_DIR})`);
  for (const [family, count] of familyCounts.entries()) {
    console.log(`   - ${family}: ${count}개`);
  }
}

main();
