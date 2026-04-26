import { join } from 'node:path';
import {
    fileExists,
    isCompanionDoc,
    listDir,
    milestoneDirPath,
    milestoneFilePath,
    readFile,
    readStatus,
    sprintDirPath,
    sprintFilePath,
    updateStatusInContent,
    writeFile,
} from './fs-utils';

export type Status = 'planned' | 'in-progress' | 'blocked' | 'done';
export const VALID_STATUSES: Status[] = ['planned', 'in-progress', 'blocked', 'done'];

export function isValidStatus(s: string): s is Status {
    return (VALID_STATUSES as string[]).includes(s);
}

/**
 * Roll-up rules (from SKILL.md):
 * - any child blocked  → blocked
 * - any child in-progress → in-progress
 * - all children done → done
 * - else → planned
 */
export function rollupStatuses(statuses: string[]): Status {
    if (statuses.length === 0) return 'planned';
    if (statuses.some((s) => s === 'blocked')) return 'blocked';
    if (statuses.some((s) => s === 'in-progress')) return 'in-progress';
    if (statuses.every((s) => s === 'done')) return 'done';
    return 'planned';
}

// ─── Sprint-level roll-up ─────────────────────────────────────────────────────

/**
 * Compute the sprint status from its task files and write it to the sprint file.
 * Returns the computed status.
 */
export function rollupSprint(milestone: string, sprint: string): Status {
    const sprintDir = sprintDirPath(milestone, sprint);
    const prefix = `${milestone}-${sprint}-`;
    const taskFiles = listDir(sprintDir).filter(
        (f) => f.endsWith('.md') && f.startsWith(prefix) && !isCompanionDoc(f),
    );

    const statuses = taskFiles.map((f) => {
        const content = readFile(join(sprintDir, f));
        return readStatus(content);
    });

    const computed = rollupStatuses(statuses);

    const spFile = sprintFilePath(milestone, sprint);
    if (fileExists(spFile)) {
        const content = readFile(spFile);
        writeFile(spFile, updateStatusInContent(content, computed));
    }

    return computed;
}

// ─── Milestone-level roll-up ──────────────────────────────────────────────────

/**
 * Compute the milestone status from its sprint files (rolling up each sprint first)
 * and write it to the milestone file.
 * Returns the computed status.
 */
export function rollupMilestone(milestone: string): Status {
    const mDir = milestoneDirPath(milestone);
    const sprintFiles = listDir(mDir).filter(
        (f) =>
            f.endsWith('.md') &&
            f.startsWith(`${milestone}-`) &&
            !isCompanionDoc(f),
    );

    const statuses = sprintFiles.map((f) => {
        // Extract sprint name from filename: {MILESTONE}-{SPRINT}.md
        const sprintName = f.slice(milestone.length + 1, -3); // strip "{M}-" prefix and ".md"
        return rollupSprint(milestone, sprintName);
    });

    const computed = rollupStatuses(statuses);

    const mFile = milestoneFilePath(milestone);
    if (fileExists(mFile)) {
        const content = readFile(mFile);
        writeFile(mFile, updateStatusInContent(content, computed));
    }

    return computed;
}
