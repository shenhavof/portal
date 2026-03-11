const fs = require("fs");
const path = require("path");

const CSS_FILE = path.join(__dirname, "src", "styles", "global.css");

const CODE_DIR = path.join(__dirname, "src"); // ← תיקיית קוד לסריקה
const extensions = [".js", ".jsx", ".ts", ".tsx", ".html", ".cjs"]; // מה לסרוק

function getClassNamesFromCSS(cssPath) {
  const content = fs.readFileSync(cssPath, "utf-8");
  // חשוב: לא לתפוס מספרים עשרוניים כמו "0.2s" או סיומות קבצים כמו ".css" בהערות.
  // לכן דורשים שהנקודה תהיה חלק מסלקטור, וששם הקלאס יתחיל באות/underscore.
  const classRegex = /(^|[\s,{>+~])\.([a-zA-Z_][a-zA-Z0-9_-]*)/gm;
  const classNames = new Set();
  let match;
  while ((match = classRegex.exec(content))) {
    classNames.add(match[2]);
  }
  return Array.from(classNames);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isMatchWholeToken(content, token) {
  // כדי להימנע מ-false positives של substring (למשל "btn" בתוך "btn-purple")
  // נבדוק שהטוקן לא מוקף בתווים שמותריים בתוך שם class (אות/מספר/_/-)
  const re = new RegExp(`(^|[^a-zA-Z0-9_-])${escapeRegex(token)}([^a-zA-Z0-9_-]|$)`);
  return re.test(content);
}

function toRel(p) {
  return path.relative(__dirname, p).replaceAll("\\", "/");
}

function scanFilesForClassUsage(dir, classNames, usageMap = {}) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanFilesForClassUsage(fullPath, classNames, usageMap);
    } else if (extensions.includes(path.extname(entry.name))) {
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const className of classNames) {
        if (isMatchWholeToken(content, className)) {
          if (!usageMap[className]) usageMap[className] = new Set();
          usageMap[className].add(fullPath);
        }
      }
    }
  }
  return usageMap;
}

function main() {
  if (!fs.existsSync(CSS_FILE)) {
    console.error("⚠️ global.css not found!");
    return;
  }

  const classNames = getClassNamesFromCSS(CSS_FILE);
  const usageMap = scanFilesForClassUsage(CODE_DIR, classNames);

  console.log(`\n📊 CSS Class Usage Report:\n`);
  for (const className of classNames) {
    const usedIn = usageMap[className]?.size || 0;
    const files = Array.from(usageMap[className] ?? []).map(toRel).sort();
    console.log(`${className.padEnd(30)} → ${usedIn} file(s)`);
    if (files.length) {
      for (const f of files) console.log(`  - ${f}`);
    }
  }
  console.log("\n✅ Done.\n");
}

main();
