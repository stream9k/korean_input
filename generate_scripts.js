#!/usr/bin/env node
/**
 * index.html에 정의된 DISTRO_DATA와 SCRIPT_TEMPLATES를 기반으로
 * scripts/<family>/<scriptId>.<ext> 파일들을 일괄 생성합니다.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT_DIR = __dirname;
const HTML_PATH = path.join(ROOT_DIR, "index.html");
const SCRIPTS_DIR = path.join(ROOT_DIR, "scripts");

function loadGeneratorCore() {
  const html = fs.readFileSync(HTML_PATH, "utf8");
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!scriptMatch) {
    throw new Error("index.html에서 <script> 블록을 찾을 수 없습니다.");
  }

  const fullScript = scriptMatch[1];
  const uiMarker = "// UI 로직";
  const uiIndex = fullScript.indexOf(uiMarker);
  if (uiIndex === -1) {
    throw new Error("index.html에서 '// UI 로직' 구분자를 찾을 수 없습니다.");
  }

  const coreCode = `${fullScript.slice(0, uiIndex)}
({ GITHUB_REPO, DISTRO_DATA, SCRIPT_TEMPLATES, getScriptId, getTemplateFamily });
`;

  const context = vm.createContext({});
  return vm.runInContext(coreCode, context, { filename: "index.html" });
}

function main() {
  const {
    DISTRO_DATA,
    SCRIPT_TEMPLATES,
    getScriptId,
    getTemplateFamily
  } = loadGeneratorCore();

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
