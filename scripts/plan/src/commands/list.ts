/**
 * prints project structure tree
 *
 * Usage: `plan list [{MILESTONE}[-{SPRINT}[-{TASK}]]] [--descriptions] [--details]`
 *
 * Results in output like:
 * {milestone-name}: {description}
 * ├─ goals
 * │  ├─ {goal code}: {goal description}
 * │  └─ {goal code}: {goal description}
 * ├─ requirements
 * │  ├─ {requirement code}: {requirement description}
 * │  └─ {requirement code}: {requirement description}
 * ├─ ...
 * └─ sprints
 *    ├─ {sprint name}: {sprint description}
 *    │  ├─ {item code}: {item description}
 *    │  └─ {item code}: {item description}
 *    └─ ...
 */

import type { Command } from 'commander';
import { existsSync } from 'node:fs';
import {
    isCompanionDoc,
    listDir,
    milestoneDirPath,
    milestoneFilePath,
    parseName,
    projectPath,
    readFile,
    readStatus,
    sprintDirPath,
    sprintFilePath,
    taskFilePath,
} from '../commons/fs-utils';

// ─── Markdown helpers ─────────────────────────────────────────────────────────

function parseDescription(content: string): string {
    const lines = content.split('\n');
    let pastTitle = false;
    const descLines: string[] = [];

    for (const line of lines) {
        if (/^# /.test(line)) { pastTitle = true; continue; }
        if (!pastTitle) continue;
        if (/^## /.test(line)) break;
        // Skip navigation breadcrumb lines like "Milestone [X](...)" or "Sprint [X](...)"
        if (/^(Milestone|Sprint)\s+\[/.test(line)) continue;
        // Skip bare link-only lines like "[PLAN.md](PLAN.md)" or "[A](a) | [B](b)"
        if (/^(\[([^\]]*)\]\([^)]+\)\s*[|·\-]?\s*)+$/.test(line.trim())) continue;
        if (/^---\s*$/.test(line)) continue;
        if (line.trim() === '') {
            if (descLines.length > 0) break;
            continue;
        }
        descLines.push(line.trim());
    }
    return descLines.join(' ');
}

function escapeRe(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseSectionItems(content: string, sectionName: string): string[] {
    const lines = content.split('\n');
    const re = new RegExp(`^## ${escapeRe(sectionName)}\\s*$`, 'i');
    let inSection = false;
    const items: string[] = [];
    for (const line of lines) {
        if (re.test(line)) { inSection = true; continue; }
        if (inSection) {
            if (/^## /.test(line)) break;
            const m = /^- (.+)/.exec(line);
            if (m) items.push(m[1]);
        }
    }
    return items;
}

// ─── Discovery ────────────────────────────────────────────────────────────────

function discoverMilestones(): string[] {
    const pDir = projectPath();
    return listDir(pDir)
        .filter((f) => f.endsWith('.md') && f !== 'PLAN.md' && f !== 'IDEA.md')
        .map((f) => f.slice(0, -3))
        .sort();
}

function discoverSprints(milestone: string): string[] {
    const mDir = milestoneDirPath(milestone);

    console.debug(`Discovering sprints in milestone "${milestone}" with dir "${mDir}"`);

    return listDir(mDir)
        .filter((f) =>
            f.endsWith('.md') &&
            f.startsWith(`${milestone}-`) &&
            !isCompanionDoc(f),
        )
        .map((f) => f.slice(milestone.length + 1, -3))
        .sort();
}

function discoverTasks(milestone: string, sprint: string): string[] {
    const prefix = `${milestone}-${sprint}-`;
    const spDir = sprintDirPath(milestone, sprint);
    return listDir(spDir)
        .filter((f) => f.endsWith('.md') && f.startsWith(prefix) && !isCompanionDoc(f))
        .map((f) => f.slice(prefix.length, -3))
        .sort();
}

// ─── Tree node model ──────────────────────────────────────────────────────────

interface TreeNode {
    label: string;
    children: TreeNode[];
}

function nodeLabel(name: string, status: string, desc: string): string {
    const s = status ? ` [${status}]` : '';
    const d = desc ? `: ${desc}` : '';
    return `${name}${s}${d}`;
}

function sectionNodes(content: string, sections: string[]): TreeNode[] {
    const result: TreeNode[] = [];
    for (const sec of sections) {
        const items = parseSectionItems(content, sec);
        if (items.length > 0) {
            result.push({
                label: sec.toLowerCase(),
                children: items.map((item) => ({ label: item, children: [] })),
            });
        }
    }
    return result;
}

function buildTaskNode(milestone: string, sprint: string, task: string, {descriptions, details}: {descriptions: boolean; details: boolean}): TreeNode {
    const tFile = taskFilePath(milestone, sprint, task);
    const name = `${milestone}-${sprint}-${task}`;
    let status = '';
    let desc = '';
    const children: TreeNode[] = [];

    if (existsSync(tFile)) {
        const content = readFile(tFile);
        status = readStatus(content);
        desc = descriptions ? parseDescription(content) : '';
        if (details) {
            children.push(
                ...sectionNodes(content, [
                    'Goals',
                    'Requirements',
                    'Acceptance criteria',
                    'Deliverables',
                    'Design notes',
                ]),
            );
        }
    }

    return { label: nodeLabel(name, status, desc), children };
}

function buildSprintNode(milestone: string, sprint: string, {descriptions, details}: {descriptions: boolean; details: boolean}): TreeNode {
    const spFile = sprintFilePath(milestone, sprint);
    const name = `${milestone}-${sprint}`;
    let status = '';
    let desc = '';
    const children: TreeNode[] = [];

    if (existsSync(spFile)) {
        const content = readFile(spFile);
        status = readStatus(content);
        desc = descriptions ? parseDescription(content) : '';
        if (details) {
            children.push(
                ...sectionNodes(content, [
                    'Goals',
                    'Requirements',
                    'Open questions',
                    'Decisions',
                    'Deliverables',
                ]),
            );
        }
    }

    const tasks = discoverTasks(milestone, sprint);
    if (details && tasks.length > 0) {
        children.push({
            label: 'tasks',
            children: tasks.map((t) => buildTaskNode(milestone, sprint, t, { descriptions, details })),
        });
    } else {
        children.push(...tasks.map((t) => buildTaskNode(milestone, sprint, t, { descriptions, details })));
    }

    return { label: nodeLabel(name, status, desc), children };
}

function buildMilestoneNode(milestone: string, {descriptions, details}: {descriptions: boolean; details: boolean}): TreeNode {
    const mFile = milestoneFilePath(milestone);
    let status = '';
    let desc = '';
    const children: TreeNode[] = [];

    if (existsSync(mFile)) {
        const content = readFile(mFile);
        status = readStatus(content);
        desc = descriptions ? parseDescription(content) : '';
        if (details) {
            children.push(
                ...sectionNodes(content, ['Goals', 'Requirements', 'Open questions', 'Decisions']),
            );
        }
    }

    const sprints = discoverSprints(milestone);
    if (details && sprints.length > 0) {
        children.push({
            label: 'sprints',
            children: sprints.map((s) => buildSprintNode(milestone, s, { descriptions, details })),
        });
    } else {
        children.push(...sprints.map((s) => buildSprintNode(milestone, s, { descriptions, details })));
    }

    return { label: nodeLabel(milestone, status, desc), children };
}

// ─── Tree rendering ───────────────────────────────────────────────────────────

function printTree(nodes: TreeNode[], prefix = ''): void {
    for (let i = 0; i < nodes.length; i++) {
        const isLast = i === nodes.length - 1;
        const branch = isLast ? '└─ ' : '├─ ';
        const childPrefix = prefix + (isLast ? '   ' : '│  ');
        console.log(prefix + branch + nodes[i].label);
        if (nodes[i].children.length > 0) {
            printTree(nodes[i].children, childPrefix);
        }
    }
}

// ─── Command ──────────────────────────────────────────────────────────────────

export function registerList(program: Command): void {
    program
        .command('list [target]')
        .description(
            'Print project structure tree.\n' +
            '  target: optional MILESTONE[-SPRINT[-TASK]] to scope output.\n'
        )
        .option('--descriptions', 'Include item descriptions in output', false)
        .option('--details', 'Show section items (goals, requirements, etc.)', false)
        .action((target: string | undefined, opts: { descriptions: boolean; details: boolean; help: boolean }) => {

            if (opts.help) {
                program.commands.find(cmd => cmd.name() === 'list')?.help();
                return;
            }

            if (!target) {
                const milestones = discoverMilestones();
                if (milestones.length === 0) {
                    console.log('No milestones found.');
                    return;
                }
                for (let i = 0; i < milestones.length; i++) {
                    const node = buildMilestoneNode(milestones[i], opts);
                    console.log(node.label);
                    printTree(node.children);
                    if (i < milestones.length - 1) console.log('');
                }
                return;
            }

            const parsed = parseName(target);

            if (parsed.task) {
                const node = buildTaskNode(
                    parsed.milestone,
                    parsed.sprint!,
                    parsed.task,
                    opts,
                );
                console.log(node.label);
                printTree(node.children);
                return;
            }

            if (parsed.sprint) {
                const node = buildSprintNode(parsed.milestone, parsed.sprint, opts);
                console.log(node.label);
                printTree(node.children);
                return;
            }

            const node = buildMilestoneNode(parsed.milestone, opts);
            console.log(node.label);
            printTree(node.children);
        });
}

