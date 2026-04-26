import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

// Compiled to scripts/dist/plan/src/ — 4 levels up is the project root.
export function resolveProjectRoot(): string {
    return resolve(__dirname, '../../../../');
}

export function projectPath(...parts: string[]): string {
    return join(resolveProjectRoot(), 'project', ...parts);
}

export function planFilePath(): string {
    return projectPath('PLAN.md');
}

export function milestoneFilePath(milestone: string): string {
    return projectPath(`${milestone}.md`);
}

export function milestoneDirPath(milestone: string): string {
    return projectPath(milestone);
}

export function sprintFilePath(milestone: string, sprint: string): string {
    return projectPath(milestone, `${milestone}-${sprint}.md`);
}

export function sprintDirPath(milestone: string, sprint: string): string {
    return projectPath(milestone, `${milestone}-${sprint}`);
}

export function taskFilePath(milestone: string, sprint: string, task: string): string {
    return projectPath(milestone, `${milestone}-${sprint}`, `${milestone}-${sprint}-${task}.md`);
}

export function ensureDir(dirPath: string): void {
    mkdirSync(dirPath, { recursive: true });
}

export function readFile(filePath: string): string {
    return readFileSync(filePath, 'utf-8');
}

export function writeFile(filePath: string, content: string): void {
    ensureDir(dirname(filePath));
    writeFileSync(filePath, content, 'utf-8');
}

export function fileExists(filePath: string): boolean {
    return existsSync(filePath);
}

export function listDir(dirPath: string): string[] {
    if (!existsSync(dirPath)) return [];
    return readdirSync(dirPath);
}

export function relPath(from: string, to: string): string {
    return relative(dirname(from), to);
}

// ─── Name parsing ────────────────────────────────────────────────────────────

export interface ParsedName {
    milestone: string;
    sprint?: string;
    task?: string;
}

/**
 * Parse "MILESTONE[-SPRINT[-TASK]]" using the filesystem to resolve ambiguity
 * (since each segment may itself contain hyphens).
 */
export function parseName(name: string): ParsedName {
    const root = resolveProjectRoot();
    const parts = name.split('-');

    for (let mEnd = parts.length; mEnd >= 1; mEnd--) {
        const milestone = parts.slice(0, mEnd).join('-');
        const mFile = join(root, 'project', `${milestone}.md`);
        const mDir = join(root, 'project', milestone);
        if (!existsSync(mFile) && !existsSync(mDir)) continue;

        if (mEnd === parts.length) return { milestone };

        for (let sEnd = parts.length; sEnd > mEnd; sEnd--) {
            const sprint = parts.slice(mEnd, sEnd).join('-');
            const sFile = join(root, 'project', milestone, `${milestone}-${sprint}.md`);
            const sDir = join(root, 'project', milestone, `${milestone}-${sprint}`);
            if (!existsSync(sFile) && !existsSync(sDir)) continue;

            if (sEnd === parts.length) return { milestone, sprint };
            const task = parts.slice(sEnd).join('-');
            return { milestone, sprint, task };
        }

        // Sprint not found on fs; treat next hyphen-segment as sprint, rest as task
        const sprint = parts[mEnd];
        if (parts.length > mEnd + 1) {
            return { milestone, sprint, task: parts.slice(mEnd + 1).join('-') };
        }
        return { milestone, sprint };
    }

    return { milestone: name };
}

// ─── Markdown section utilities ───────────────────────────────────────────────

/**
 * Read the value immediately after a `## Status` heading.
 * Returns empty string if not found.
 */
export function readStatus(content: string): string {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (/^## Status\s*$/.test(lines[i])) {
            for (let j = i + 1; j < lines.length; j++) {
                if (lines[j].trim() === '') continue;
                if (/^## /.test(lines[j])) break;
                return lines[j].trim();
            }
        }
    }
    return '';
}

/**
 * Replace the value under `## Status` with the given status string.
 */
export function updateStatusInContent(content: string, status: string): string {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (/^## Status\s*$/.test(lines[i])) {
            // Find the value line (first non-empty, non-heading line after heading)
            for (let j = i + 1; j < lines.length; j++) {
                if (lines[j].trim() === '') continue;
                if (/^## /.test(lines[j])) {
                    lines.splice(j, 0, status);
                    return lines.join('\n');
                }
                lines[j] = status;
                return lines.join('\n');
            }
            lines.push(status);
            return lines.join('\n');
        }
    }
    return content.trimEnd() + '\n\n## Status\n' + status + '\n';
}

/**
 * Append a bullet item to a named section.
 * If the section does not exist, it is inserted before `## Status`.
 * For blocker items with a link: formats as `- [CODE](link): rest`
 */
export function addItemToSection(
    content: string,
    sectionName: string,
    item: string,
    link?: string,
): string {
    const bullet = link ? formatLinkedItem(item, link) : `- ${item}`;
    const lines = content.split('\n');
    const headingRe = new RegExp(`^## ${escapeRe(sectionName)}\\s*$`, 'i');

    const sectionStart = lines.findIndex((l) => headingRe.test(l));

    if (sectionStart !== -1) {
        // Find end of section
        let sectionEnd = lines.length;
        for (let i = sectionStart + 1; i < lines.length; i++) {
            if (/^## /.test(lines[i])) { sectionEnd = i; break; }
        }
        // Insert after last non-empty line in section
        let insertAt = sectionStart + 1;
        for (let i = sectionEnd - 1; i > sectionStart; i--) {
            if (lines[i].trim() !== '') { insertAt = i + 1; break; }
        }
        lines.splice(insertAt, 0, bullet);
    } else {
        // Create section before ## Status
        const statusIdx = lines.findIndex((l) => /^## Status\s*$/.test(l));
        if (statusIdx !== -1) {
            lines.splice(statusIdx, 0, `## ${sectionName}`, bullet, '');
        } else {
            lines.push('', `## ${sectionName}`, bullet);
        }
    }

    return lines.join('\n');
}

function formatLinkedItem(item: string, link: string): string {
    // item like "BLK_1: Some description" → `- [BLK_1](link): Some description`
    const colonIdx = item.indexOf(':');
    if (colonIdx > 0) {
        const code = item.slice(0, colonIdx).trim();
        const rest = item.slice(colonIdx + 1).trim();
        return `- [${code}](${link}): ${rest}`;
    }
    return `- [${item}](${link})`;
}

function escapeRe(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Companion doc naming ─────────────────────────────────────────────────────

export const COMPANION_SUFFIXES = [
    '-requirements.md',
    '-decisions.md',
    '-results.md',
    '-status.md',
];

export function isCompanionDoc(filename: string): boolean {
    return COMPANION_SUFFIXES.some((s) => filename.endsWith(s));
}
