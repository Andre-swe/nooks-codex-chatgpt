#!/usr/bin/env node
// Builds the plugin ZIP that the OpenAI plugin directory accepts, without a
// dependency and without a shell. Runs on Node 22.
//
//   node scripts/pack.mjs           writes dist/nooks-<version>.zip
//   node scripts/pack.mjs --check   builds it in memory and checks the result
//
// The archive is stored, not compressed, and every entry carries a fixed
// timestamp, so the same tree always produces the same bytes.

import { mkdirSync, readFileSync, statSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const checkOnly = process.argv.includes("--check");

// The package is the plugin, not the repository: no CI, no scripts, no ignores.
const includeDirs = ["skills", "assets", "docs"];
const includeFiles = ["plugin.json", "mcp.json", "README.md", "LICENSE", "NOTICE", "SECURITY.md"];
const maxEntryBytes = 5 * 1024 * 1024;

const errors = [];
const fail = (message) => errors.push(message);

function walk(dir) {
  const found = [];
  for (const name of readdirSync(dir).sort()) {
    if (name === ".git" || name === "node_modules") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) found.push(...walk(full));
    else found.push(full);
  }
  return found;
}

const entries = [];
for (const file of includeFiles) {
  try {
    statSync(join(root, file));
    entries.push(file);
  } catch {
    fail(`${file} is missing from the package`);
  }
}
for (const dir of includeDirs) {
  let files = [];
  try {
    files = walk(join(root, dir));
  } catch {
    fail(`${dir}/ is missing from the package`);
    continue;
  }
  for (const file of files) entries.push(relative(root, file).split("\\").join("/"));
}
entries.sort();

const needed = ["plugin.json", "mcp.json", "skills/nooks-design/SKILL.md"];
for (const file of needed) {
  if (!entries.includes(file)) fail(`the package must contain ${file}`);
}

let plugin = null;
try {
  plugin = JSON.parse(readFileSync(join(root, "plugin.json"), "utf8"));
} catch (error) {
  fail(`plugin.json: ${error.message}`);
}
const version = plugin?.version ?? "0.0.0";

const crcTable = new Uint32Array(256);
for (let index = 0; index < 256; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  crcTable[index] = value >>> 0;
}
const crc32 = (buffer) => {
  let value = 0xffffffff;
  for (const byte of buffer) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
};

const now = { time: 0, date: 0x0021 }; // 1980-01-01 00:00, the DOS epoch
const chunks = [];
const central = [];
let offset = 0;

for (const name of entries) {
  let data;
  try {
    data = readFileSync(join(root, name));
  } catch (error) {
    fail(`${name}: ${error.message}`);
    continue;
  }
  if (data.length >= maxEntryBytes) fail(`${name}: ${data.length} bytes; the directory limit is 5 MiB`);
  const nameBuffer = Buffer.from(name, "utf8");
  const crc = crc32(data);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 6);
  local.writeUInt16LE(0, 8);
  local.writeUInt16LE(now.time, 10);
  local.writeUInt16LE(now.date, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBuffer.length, 26);
  local.writeUInt16LE(0, 28);

  chunks.push(local, nameBuffer, data);

  const directory = Buffer.alloc(46);
  directory.writeUInt32LE(0x02014b50, 0);
  directory.writeUInt16LE(20, 4);
  directory.writeUInt16LE(20, 6);
  directory.writeUInt16LE(0, 8);
  directory.writeUInt16LE(0, 10);
  directory.writeUInt16LE(now.time, 12);
  directory.writeUInt16LE(now.date, 14);
  directory.writeUInt32LE(crc, 16);
  directory.writeUInt32LE(data.length, 20);
  directory.writeUInt32LE(data.length, 24);
  directory.writeUInt16LE(nameBuffer.length, 28);
  directory.writeUInt16LE(0, 30);
  directory.writeUInt16LE(0, 32);
  directory.writeUInt16LE(0, 34);
  directory.writeUInt16LE(0, 36);
  directory.writeUInt32LE(0, 38);
  directory.writeUInt32LE(offset, 42);

  central.push(directory, nameBuffer);
  offset += local.length + nameBuffer.length + data.length;
}

const centralBuffer = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(0, 4);
end.writeUInt16LE(0, 6);
end.writeUInt16LE(entries.length, 8);
end.writeUInt16LE(entries.length, 10);
end.writeUInt32LE(centralBuffer.length, 12);
end.writeUInt32LE(offset, 16);
end.writeUInt16LE(0, 20);

const archive = Buffer.concat([...chunks, centralBuffer, end]);

if (errors.length > 0) {
  for (const error of errors) console.error(`- ${error}`);
  console.error(`pack: failed with ${errors.length} problem${errors.length === 1 ? "" : "s"}`);
  process.exit(1);
}

const target = join(root, "dist", `nooks-${version}.zip`);
if (checkOnly) {
  console.log(`pack: ok - ${entries.length} entries, ${archive.length} bytes, version ${version}`);
} else {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, archive);
  console.log(`pack: wrote ${relative(process.cwd(), target).split("\\").join("/")} - ${entries.length} entries, ${archive.length} bytes`);
}
