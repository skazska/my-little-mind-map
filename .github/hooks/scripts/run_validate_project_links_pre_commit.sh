#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
JS_SCRIPT="$SCRIPT_DIR/validate_project_links_pre_commit.js"
TMP_INPUT=$(mktemp)
trap 'rm -f "$TMP_INPUT"' EXIT HUP INT TERM

cat > "$TMP_INPUT"

if command -v node >/dev/null 2>&1; then
  exec node "$JS_SCRIPT" < "$TMP_INPUT"
fi

if grep -q 'mcp_gitkraken_git_add_or_commit' "$TMP_INPUT" && grep -Eq '"action"[[:space:]]*:[[:space:]]*"commit"' "$TMP_INPUT"; then
  printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Node.js is required to validate staged project markdown links before commit."},"systemMessage":"Node.js is required to validate staged project markdown links before commit. Install Node.js or disable this hook."}'
  exit 2
fi

printf '%s\n' '{"continue":true}'
