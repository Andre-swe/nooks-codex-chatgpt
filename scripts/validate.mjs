// Checks the files in this repository against the plugin directory's package
// rules. No dependencies; Node 22. It cannot check what the submission portal
// checks over the network (publisher identity, domain verification, the tool
// scan, the security scan).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

const requiredFiles = [
  "README.md",
  "LICENSE",
  "NOTICE",
  "SECURITY.md",
  ".gitignore",
  "plugin.json",
  "mcp.json",
  ".agents/plugins/marketplace.json",
  "skills/nooks-design/SKILL.md",
  "assets/icon.svg",
  "docs/codex.md",
  "docs/chatgpt.md",
  "scripts/validate.mjs",
  "scripts/pack.mjs",
  ".github/workflows/validate.yml",
];

function walk(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "dist") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(full));
    else if (entry.isFile()) found.push(full);
  }
  return found;
}

const files = walk(root);
const rel = (file) => relative(root, file).split("\\").join("/");

for (const file of requiredFiles) {
  if (!files.some((found) => rel(found) === file)) errors.push(`missing file: ${file}`);
}

const jsonFiles = files.filter((file) => extname(file) === ".json");
const data = new Map();
for (const file of jsonFiles) {
  try {
    data.set(rel(file), JSON.parse(readFileSync(file, "utf8")));
  } catch (error) {
    errors.push(`invalid JSON: ${rel(file)} (${error.message})`);
  }
}

function get(value, path) {
  return path.split("/").reduce((current, key) => current?.[key], value);
}

function expect(file, path, expected) {
  const value = get(data.get(file), path);
  if (value === undefined) {
    errors.push(`${file}: missing ${path}`);
  } else if (expected !== undefined && value !== expected) {
    errors.push(`${file}: ${path} should be ${JSON.stringify(expected)}`);
  }
}

function https(value) {
  if (typeof value !== "string" || !value.startsWith("https://")) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// --- Package identity -------------------------------------------------------
expect("plugin.json", "$schema", "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json");
expect("plugin.json", "name", "nooks");
expect("plugin.json", "description");
expect("plugin.json", "author/name", "Nooks");
expect("plugin.json", "author/url", "https://nooks.place");
expect("plugin.json", "homepage", "https://nooks.place/connect");
expect("plugin.json", "repository", "https://github.com/Andre-swe/nooks-codex-chatgpt");
expect("plugin.json", "license", "Apache-2.0");
expect("plugin.json", "keywords");

const version = get(data.get("plugin.json"), "version");
if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) {
  errors.push("plugin.json: version must be a semantic version, such as 1.0.0");
}
if (!["Nooks"].includes(get(data.get("plugin.json"), "author/name"))) {
  errors.push("plugin.json: author.name must be Nooks");
}
if (!https(get(data.get("plugin.json"), "author/url"))) {
  errors.push("plugin.json: author.url must be an https URL");
}
if (!https(get(data.get("plugin.json"), "repository"))) {
  errors.push("plugin.json: repository must be an https URL");
}

// --- Listing metadata -------------------------------------------------------
// Limits are the submission limits, not the upload limits.
const listing = "extensions/com.openai/interface";
expect("plugin.json", `${listing}/displayName`, "Nooks");
expect("plugin.json", `${listing}/developerName`, "Nooks");
expect("plugin.json", `${listing}/category`, "Productivity");
expect("plugin.json", `${listing}/longDescription`);
expect("plugin.json", `${listing}/defaultPrompt`);
expect("plugin.json", `${listing}/supportURL`);
expect("plugin.json", `${listing}/logo`);
expect("plugin.json", `${listing}/composerIcon`);

const limits = [
  ["displayName", 30],
  ["shortDescription", 30],
  ["longDescription", 4000],
  ["developerName", 80],
  ["websiteURL", 1024],
  ["supportURL", 1024],
  ["privacyPolicyURL", 1024],
  ["termsOfServiceURL", 1024],
];
for (const [field, max] of limits) {
  const value = get(data.get("plugin.json"), `${listing}/${field}`);
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(`plugin.json: interface.${field} is required`);
  } else if (value.length > max) {
    errors.push(`plugin.json: interface.${field} is ${value.length} characters; the limit is ${max}`);
  }
}
for (const field of ["websiteURL", "supportURL", "privacyPolicyURL", "termsOfServiceURL"]) {
  const value = get(data.get("plugin.json"), `${listing}/${field}`);
  if (value !== undefined && !https(value)) {
    errors.push(`plugin.json: interface.${field} must be an https URL`);
  }
}

const prompts = get(data.get("plugin.json"), `${listing}/defaultPrompt`);
if (Array.isArray(prompts)) {
  if (prompts.length > 3) errors.push("plugin.json: at most three default prompts");
  for (const prompt of prompts) {
    if (typeof prompt !== "string" || prompt.length > 128) {
      errors.push(`plugin.json: default prompt over 128 characters: ${String(prompt).slice(0, 40)}...`);
    }
  }
} else if (typeof prompts !== "string") {
  errors.push("plugin.json: interface.defaultPrompt must be a string or an array of strings");
}

const brandColor = get(data.get("plugin.json"), `${listing}/brandColor`);
if (!/^#[0-9A-Fa-f]{6}$/.test(brandColor ?? "")) {
  errors.push("plugin.json: interface.brandColor must be #RRGGBB");
}

const capabilities = get(data.get("plugin.json"), `${listing}/capabilities`);
if (!Array.isArray(capabilities) || capabilities.length === 0 || capabilities.length > 20) {
  errors.push("plugin.json: capabilities must be a non-empty array of at most 20 labels");
} else if (capabilities.some((item) => typeof item !== "string" || item.length > 120)) {
  errors.push("plugin.json: each capability label must be a string of at most 120 characters");
}

// Every referenced asset must exist, and an SVG icon must be square.
for (const field of ["logo", "composerIcon"]) {
  const value = get(data.get("plugin.json"), `${listing}/${field}`);
  if (typeof value !== "string") continue;
  if (!value.startsWith("./")) errors.push(`plugin.json: interface.${field} must start with ./`);
  const path = join(root, value.replace(/^\.\//, ""));
  if (!existsSync(path)) {
    errors.push(`plugin.json: interface.${field} points at ${value}, which does not exist`);
    continue;
  }
  if (![".svg", ".png", ".jpg", ".jpeg", ".webp"].includes(extname(path).toLowerCase())) {
    errors.push(`plugin.json: interface.${field} must be an SVG, PNG, JPEG or WebP image`);
  }
  if (statSync(path).size > 5 * 1024 * 1024) {
    errors.push(`plugin.json: interface.${field} is over 5 MiB`);
  }
  if (extname(path).toLowerCase() === ".svg") {
    const svg = readFileSync(path, "utf8");
    const square = /viewBox="0 0 (\d+(?:\.\d+)?) \1"/.exec(svg);
    const side = square ? Number(square[1]) : 0;
    if (!square || side < 48) {
      errors.push(`plugin.json: interface.${field} must have a square viewBox of at least 48 by 48`);
    }
  }
}

// --- Review and publication -------------------------------------------------
const testCases = "extensions/com.openai/review/test_cases";
const positive = get(data.get("plugin.json"), `${testCases}/positive`);
const negative = get(data.get("plugin.json"), `${testCases}/negative`);
if (!Array.isArray(positive) || positive.length !== 5) {
  errors.push("plugin.json: review.test_cases.positive must hold exactly five cases");
} else {
  positive.forEach((item, index) => {
    for (const field of ["description", "prompt", "tools_triggered", "expected_behavior"]) {
      if (typeof item?.[field] !== "string" || item[field].trim() === "") {
        errors.push(`plugin.json: positive test case ${index + 1} is missing ${field}`);
      }
    }
  });
}
if (!Array.isArray(negative) || negative.length !== 3) {
  errors.push("plugin.json: review.test_cases.negative must hold exactly three cases");
} else {
  negative.forEach((item, index) => {
    for (const field of ["description", "prompt"]) {
      if (typeof item?.[field] !== "string" || item[field].trim() === "") {
        errors.push(`plugin.json: negative test case ${index + 1} is missing ${field}`);
      }
    }
  });
}
if (get(data.get("plugin.json"), "extensions/com.openai/publication/release_notes") === undefined) {
  errors.push("plugin.json: publication.release_notes is missing");
}
if (get(data.get("plugin.json"), "extensions/com.openai/apps") !== undefined) {
  errors.push("plugin.json: remove apps; there is no registered plugin id");
}

// --- MCP server -------------------------------------------------------------
expect("mcp.json", "$schema", "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json");
expect("mcp.json", "mcpServers/nooks/type", "streamable-http");
expect("mcp.json", "mcpServers/nooks/url", "https://nooks.place/api/mcp-v2");

const servers = get(data.get("mcp.json"), "mcpServers") ?? {};
const serverNames = Object.keys(servers);
if (serverNames.join(",") !== "nooks") {
  errors.push(`mcp.json: expected only the nooks server, found ${serverNames.join(", ") || "none"}`);
}
const serverKeys = Object.keys(servers.nooks ?? {}).sort().join(",");
if (serverKeys !== "type,url") {
  errors.push(`mcp.json: mcpServers.nooks must carry only type and url, found ${serverKeys || "none"}`);
}
if (!https(servers.nooks?.url)) errors.push("mcp.json: mcpServers.nooks.url must be an https URL");

// --- Repo marketplace -------------------------------------------------------
expect(".agents/plugins/marketplace.json", "name", "nooks");
expect(".agents/plugins/marketplace.json", "interface/displayName", "Nooks");
expect(".agents/plugins/marketplace.json", "plugins/0/name", "nooks");
expect(".agents/plugins/marketplace.json", "plugins/0/source/source", "local");
expect(".agents/plugins/marketplace.json", "plugins/0/source/path", "./");
expect(".agents/plugins/marketplace.json", "plugins/0/policy/installation", "AVAILABLE");
expect(".agents/plugins/marketplace.json", "plugins/0/policy/authentication", "ON_USE");
expect(".agents/plugins/marketplace.json", "plugins/0/category", "Productivity");

const authentication = get(data.get(".agents/plugins/marketplace.json"), "plugins/0/policy/authentication");
if (!["ON_INSTALL", "ON_USE"].includes(authentication)) {
  errors.push(".agents/plugins/marketplace.json: policy.authentication must be ON_INSTALL or ON_USE");
}

// --- Skill ------------------------------------------------------------------
const skill = readFileSync(join(root, "skills/nooks-design/SKILL.md"), "utf8");
const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(skill);
if (!frontmatter) {
  errors.push("SKILL.md: missing frontmatter");
} else {
  const fields = new Map();
  const repeated = new Set();
  for (const line of frontmatter[1].split(/\r?\n/)) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) continue;
    if (fields.has(match[1])) repeated.add(match[1]);
    fields.set(match[1], match[2].trim());
  }
  if (repeated.size > 0) {
    errors.push(`SKILL.md: frontmatter repeats ${[...repeated].join(", ")}; description must be one value`);
  }
  if (fields.get("name") !== "nooks-design") {
    errors.push("SKILL.md: frontmatter name must be nooks-design");
  }
  if (!fields.get("description") || fields.get("description").length < 40) {
    errors.push("SKILL.md: frontmatter description is missing or too short");
  }
}

// --- Credentials and links --------------------------------------------------
const credentialPattern = /nooks_(?:acc|agt)_[A-Za-z0-9_-]{20,}/g;
const linkPattern = /https:\/\/nooks\.place[^\s<>"'`)\]]*/g;
const readable = new Set([".md", ".json", ".mjs", ".js", ".yml", ".yaml", ".toml", ".txt", ".svg", ""]);
let credentials = 0;
for (const file of files) {
  if (!readable.has(extname(file))) continue;
  const text = readFileSync(file, "utf8");
  for (const match of text.matchAll(credentialPattern)) {
    credentials += 1;
    errors.push(`possible credential in ${rel(file)}: ${match[0].slice(0, 12)}...`);
  }
  for (const match of text.matchAll(linkPattern)) {
    try {
      new URL(match[0]);
    } catch {
      errors.push(`invalid link in ${rel(file)}: ${match[0]}`);
    }
  }
}

if (errors.length > 0) {
  console.error(`validate: ${errors.length} problem(s)`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `validate: ok (${files.length} files, ${jsonFiles.length} JSON, 1 skill, 8 review cases, ${credentials} credentials)`,
);
