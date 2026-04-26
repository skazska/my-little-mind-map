#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const process = require("process");
const { spawnSync } = require("child_process");

const LINK_RE = /\[[^\]]+\]\(([^)]+)\)/g;
const HEADING_RE = /^#{1,6}\s+(.+?)\s*$/gm;

function writeStderr(message) {
  process.stderr.write(`${message}\n`);
}

function readHookInput() {
  const raw = fs.readFileSync(0, "utf8").trim();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function findValue(obj, key) {
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findValue(item, key);
      if (found !== undefined && found !== null) {
        return found;
      }
    }
    return undefined;
  }

  if (obj && typeof obj === "object") {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return obj[key];
    }

    for (const value of Object.values(obj)) {
      const found = findValue(value, key);
      if (found !== undefined && found !== null) {
        return found;
      }
    }
  }

  return undefined;
}

function findToolName(payload) {
  for (const candidate of ["toolName", "tool_name", "tool", "name"]) {
    const value = findValue(payload, candidate);
    if (typeof value === "string") {
      return value;
    }
  }

  return "";
}

function findToolInput(payload) {
  for (const candidate of ["toolInput", "tool_input", "input", "arguments", "args", "parameters"]) {
    const value = findValue(payload, candidate);
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value;
    }
  }

  return {};
}

function isCommitToolInvocation(payload) {
  const toolName = findToolName(payload);
  const toolInput = findToolInput(payload);
  const isTargetTool = toolName.includes("mcp_gitkraken_git_add_or_commit");
  const action = toolInput.action;
  const isCommitAction = typeof action === "string" && action.toLowerCase() === "commit";

  return isTargetTool && isCommitAction;
}

function slugifyHeading(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[`~!@#$%^&*()+=\[\]{}|;:'\",.<>/?\\]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function listMarkdownHeadings(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    return new Set();
  }

  const headings = new Set();
  for (const match of content.matchAll(HEADING_RE)) {
    headings.add(slugifyHeading(match[1]));
  }

  return headings;
}

function parseLinkTarget(target) {
  let cleaned = target.trim();
  if (cleaned.startsWith("<") && cleaned.endsWith(">")) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  if (cleaned.includes(" ") && !cleaned.startsWith("#")) {
    cleaned = cleaned.split(" ", 1)[0];
  }

  const hashIndex = cleaned.indexOf("#");
  if (hashIndex >= 0) {
    return {
      filePart: cleaned.slice(0, hashIndex).trim(),
      anchor: cleaned.slice(hashIndex + 1).trim(),
    };
  }

  return { filePart: cleaned, anchor: "" };
}

function isExternalOrIgnored(target) {
  const lowered = target.toLowerCase();
  return (
    lowered.startsWith("http://") ||
    lowered.startsWith("https://") ||
    lowered.startsWith("mailto:") ||
    lowered.startsWith("tel:") ||
    lowered.startsWith("data:")
  );
}

function stagedProjectMarkdownFiles(repoRoot) {
  const result = spawnSync(
    "git",
    [
      "-C",
      repoRoot,
      "diff",
      "--cached",
      "--name-only",
      "--diff-filter=ACMR",
      "--",
      ":(glob)project/**/*.md",
      "project/*.md",
    ],
    { encoding: "utf8" }
  );

  if (result.status !== 0) {
    return [];
  }

  return result.stdout
    .split(/\r?\n/)
    .map((rel) => rel.trim())
    .filter(Boolean)
    .map((rel) => path.join(repoRoot, rel))
    .filter((absPath) => fs.existsSync(absPath) && fs.statSync(absPath).isFile());
}

function toRepoRelative(repoRoot, targetPath) {
  const relativePath = path.relative(repoRoot, targetPath);
  return relativePath && !relativePath.startsWith("..") && !path.isAbsolute(relativePath)
    ? relativePath
    : targetPath;
}

function removeCodeBlocks(content) {
  return content.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
}

function validateLinks(repoRoot, files) {
  const errors = [];
  const headingCache = new Map();

  for (const filePath of files) {
    let content;
    try {
      content = removeCodeBlocks(fs.readFileSync(filePath, "utf8"));
    } catch {
      continue;
    }

    for (const match of content.matchAll(LINK_RE)) {
      const rawTarget = match[1].trim();
      if (!rawTarget || isExternalOrIgnored(rawTarget)) {
        continue;
      }

      const { filePart, anchor } = parseLinkTarget(rawTarget);
      const targetFile = filePart === ""
        ? filePath
        : path.resolve(path.dirname(filePath), filePart);

      if (!fs.existsSync(targetFile)) {
        const srcRel = toRepoRelative(repoRoot, filePath);
        const targetRel = toRepoRelative(repoRoot, targetFile);
        errors.push(`${srcRel}: missing link target ${rawTarget} -> ${targetRel}`);
        continue;
      }

      if (anchor) {
        const anchorSlug = slugifyHeading(anchor);
        if (!headingCache.has(targetFile)) {
          headingCache.set(targetFile, listMarkdownHeadings(targetFile));
        }

        if (anchorSlug && !headingCache.get(targetFile).has(anchorSlug)) {
          const srcRel = toRepoRelative(repoRoot, filePath);
          const targetRel = toRepoRelative(repoRoot, targetFile);
          errors.push(`${srcRel}: missing anchor #${anchor} in ${targetRel}`);
        }
      }
    }
  }

  return errors;
}

function emitAllow() {
  process.stdout.write(`${JSON.stringify({ continue: true })}\n`);
  return 0;
}

function emitDeny(errors) {
  const reason = "Broken internal markdown links detected in staged project docs";
  const output = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
    systemMessage: `${reason}\n${errors.slice(0, 20).join("\n")}`,
  };

  process.stdout.write(`${JSON.stringify(output)}\n`);
  return 2;
}

function emitGitPreCommitDeny(errors) {
  writeStderr("Broken internal markdown links detected in staged project docs:");
  for (const error of errors.slice(0, 20)) {
    writeStderr(error);
  }
  return 1;
}

function repoRootFromInput(toolInput) {
  if (typeof toolInput.directory === "string" && toolInput.directory.trim()) {
    return path.resolve(toolInput.directory);
  }

  return process.cwd();
}

function runValidation(repoRoot) {
  const files = stagedProjectMarkdownFiles(repoRoot);
  if (files.length === 0) {
    return [];
  }

  return validateLinks(repoRoot, files);
}

function mainGitPreCommit() {
  const repoRoot = process.cwd();
  const errors = runValidation(repoRoot);
  if (errors.length > 0) {
    return emitGitPreCommitDeny(errors);
  }

  return 0;
}

function mainCopilotHook() {
  const payload = readHookInput();
  if (!isCommitToolInvocation(payload)) {
    return emitAllow();
  }

  const toolInput = findToolInput(payload);
  const repoRoot = repoRootFromInput(toolInput);
  const errors = runValidation(repoRoot);
  if (errors.length > 0) {
    return emitDeny(errors);
  }

  return emitAllow();
}

function main() {
  if (process.argv.includes("--git-pre-commit")) {
    return mainGitPreCommit();
  }

  return mainCopilotHook();
}

process.exit(main());