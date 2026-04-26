import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
    isCompanionDoc,
    listDir,
    milestoneDirPath,
    milestoneFilePath,
    planFilePath,
    projectPath,
    readFile,
    readStatus,
    resolveProjectRoot,
    sprintDirPath,
    sprintFilePath,
} from './fs-utils';
import { rollupStatuses, VALID_STATUSES } from './status';

export interface ValidationError {
    file: string;
    line?: number;
    message: string;
}

// ─── Main entry ───────────────────────────────────────────────────────────────

export function validateProject(milestoneName?: string): ValidationError[] {
    const errors: ValidationError[] = [];
    const root = resolveProjectRoot();

    const milestones = milestoneName
        ? [milestoneName]
        : discoverMilestones(root);

    for (const m of milestones) {
        errors.push(...validateMilestone(m, root));
    }

    // PLAN.md links
    const planFile = planFilePath();
    if (existsSync(planFile)) {
        errors.push(...validateLinks(planFile));
    }

    return errors;
}

// ─── Milestone validation ─────────────────────────────────────────────────────

function validateMilestone(milestone: string, root: string): ValidationError[] {
    const errors: ValidationError[] = [];
    const mFile = milestoneFilePath(milestone);
    const mDir = milestoneDirPath(milestone);

    if (!existsSync(mFile)) {
        errors.push({ file: mFile, message: `Milestone file missing: ${mFile}` });
        return errors;
    }

    errors.push(...validateLinks(mFile));
    errors.push(...validateStatusValue(mFile));

    if (!existsSync(mDir)) return errors;

    const entries = listDir(mDir).filter((f) => f.endsWith('.md') && !isCompanionDoc(f));
    const sprintFiles = entries.filter((f) => f.startsWith(`${milestone}-`));
    const unexpectedFiles = entries.filter((f) => !f.startsWith(`${milestone}-`));

    for (const f of unexpectedFiles) {
        errors.push({
            file: join(mDir, f),
            message: `Non-canonical filename: expected prefix "${milestone}-"`,
        });
    }

    const sprintStatuses: string[] = [];
    for (const sf of sprintFiles) {
        const sprint = sf.slice(milestone.length + 1, -3);
        const sprintErrors = validateSprint(milestone, sprint, root);
        errors.push(...sprintErrors);

        const spFile = sprintFilePath(milestone, sprint);
        if (existsSync(spFile)) {
            sprintStatuses.push(readStatus(readFile(spFile)));
        }
    }

    // Status roll-up consistency
    if (sprintStatuses.length > 0) {
        const expected = rollupStatuses(sprintStatuses);
        const actual = readStatus(readFile(mFile));
        if (actual && actual !== expected) {
            errors.push({
                file: mFile,
                message: `Status roll-up mismatch: file has "${actual}", expected "${expected}" from sprints`,
            });
        }
    }

    return errors;
}

// ─── Sprint validation ────────────────────────────────────────────────────────

function validateSprint(milestone: string, sprint: string, root: string): ValidationError[] {
    const errors: ValidationError[] = [];
    const spFile = sprintFilePath(milestone, sprint);
    const spDir = sprintDirPath(milestone, sprint);
    const prefix = `${milestone}-${sprint}-`;

    if (!existsSync(spFile)) {
        errors.push({ file: spFile, message: `Sprint file missing: ${spFile}` });
        return errors;
    }

    errors.push(...validateLinks(spFile));
    errors.push(...validateStatusValue(spFile));

    if (!existsSync(spDir)) return errors;

    const entries = listDir(spDir).filter((f) => f.endsWith('.md') && !isCompanionDoc(f));
    const taskFiles = entries.filter((f) => f.startsWith(prefix));
    const unexpectedFiles = entries.filter((f) => !f.startsWith(prefix));

    for (const f of unexpectedFiles) {
        errors.push({
            file: join(spDir, f),
            message: `Non-canonical filename: expected prefix "${prefix}"`,
        });
    }

    const taskStatuses: string[] = [];
    for (const tf of taskFiles) {
        const taskPath = join(spDir, tf);
        errors.push(...validateLinks(taskPath));
        errors.push(...validateStatusValue(taskPath));
        taskStatuses.push(readStatus(readFile(taskPath)));
    }

    // Status roll-up consistency
    if (taskStatuses.length > 0) {
        const expected = rollupStatuses(taskStatuses);
        const actual = readStatus(readFile(spFile));
        if (actual && actual !== expected) {
            errors.push({
                file: spFile,
                message: `Status roll-up mismatch: file has "${actual}", expected "${expected}" from tasks`,
            });
        }
    }

    return errors;
}

// ─── Link validation ──────────────────────────────────────────────────────────

export function validateLinks(filePath: string): ValidationError[] {
    const errors: ValidationError[] = [];
    const content = readFile(filePath);
    const lines = content.split('\n');

    const linkRe = /\[([^\]]*)\]\(([^)]+)\)/g;

    lines.forEach((line, idx) => {
        let match: RegExpExecArray | null;
        linkRe.lastIndex = 0;
        while ((match = linkRe.exec(line)) !== null) {
            const href = match[2];
            // Skip external links and anchors-only
            if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
                continue;
            }
            // Strip anchor fragment for file existence check
            const [filePart] = href.split('#');
            if (!filePart) continue;
            const resolved = resolve(dirname(filePath), filePart);
            if (!existsSync(resolved)) {
                errors.push({
                    file: filePath,
                    line: idx + 1,
                    message: `Broken link: [${match[1]}](${href})`,
                });
            }
        }
    });

    return errors;
}

// ─── Status value validation ──────────────────────────────────────────────────

function validateStatusValue(filePath: string): ValidationError[] {
    const content = readFile(filePath);
    const status = readStatus(content);
    if (!status) return [];
    if (!(VALID_STATUSES as string[]).includes(status)) {
        return [
            {
                file: filePath,
                message: `Invalid status value: "${status}". Must be one of: ${VALID_STATUSES.join(', ')}`,
            },
        ];
    }
    return [];
}

// ─── Milestone discovery ──────────────────────────────────────────────────────

function discoverMilestones(root: string): string[] {
    const projectDir = join(root, 'project');
    if (!existsSync(projectDir)) return [];

    return listDir(projectDir)
        .filter((f) => f.endsWith('.md') && f !== 'PLAN.md' && f !== 'IDEA.md')
        .map((f) => f.slice(0, -3));
}
