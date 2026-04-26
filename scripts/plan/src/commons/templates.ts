// Markdown template generators matching the SKILL.md spec.

export interface SectionItems {
    goals?: string[];
    requirements?: string[];
    blockers?: string[];
    openQuestions?: string[];
    decisions?: string[];
    deliverables?: string[];
    designNotes?: string[];
    acceptanceCriteria?: string[];
    resultsAndLearnings?: string[];
    /** Arbitrary extra sections: { sectionName: items[] } */
    custom?: Record<string, string[]>;
}

function bullets(items: string[] | undefined): string {
    if (!items || items.length === 0) return '';
    return items.map((i) => `- ${i}`).join('\n') + '\n';
}

function section(heading: string, items: string[] | undefined, optional = false): string {
    if (optional && (!items || items.length === 0)) return '';
    return `\n## ${heading}\n${bullets(items)}`;
}

function customSections(custom: Record<string, string[]> | undefined): string {
    if (!custom) return '';
    return Object.entries(custom)
        .map(([name, items]) => section(name, items))
        .join('');
}

// ─── Milestone ────────────────────────────────────────────────────────────────

/**
 * Generate the content for `project/{MILESTONE}.md`.
 */
export function milestoneFileContent(
    milestone: string,
    description: string,
    sections: SectionItems = {},
): string {
    let content = `# ${milestone}\n\nMilestone [PLAN](PLAN.md)\n\n${description}\n`;
    content += section('Goals', sections.goals);
    content += section('Blockers', sections.blockers, true);
    content += section('Requirements', sections.requirements);
    content += section('Open questions', sections.openQuestions);
    content += section('Decisions', sections.decisions);
    content += customSections(sections.custom);
    content += '\n## Status\nplanned\n';
    content += section('Results and learnings', sections.resultsAndLearnings, true);
    return content.trimEnd() + '\n';
}

/** Companion: `project/{M}/{M}-requirements.md` */
export function milestoneRequirementsContent(milestone: string): string {
    return `# ${milestone} Requirements\n\nSummary: [${milestone}.md](../${milestone}.md#requirements)\n\n`;
}

/** Companion: `project/{M}/{M}-decisions.md` */
export function milestoneDecisionsContent(milestone: string): string {
    return `# ${milestone} Decisions\n\nSummary: [${milestone}.md](../${milestone}.md#decisions)\n\n`;
}

/** Companion: `project/{M}/{M}-results.md` */
export function milestoneResultsContent(milestone: string): string {
    return `# ${milestone} Results and Learnings\n\nSummary: [${milestone}.md](../${milestone}.md#results-and-learnings)\n\n`;
}

// ─── Sprint ───────────────────────────────────────────────────────────────────

/**
 * Generate the content for `project/{M}/{M}-{S}.md`.
 */
export function sprintFileContent(
    milestone: string,
    sprint: string,
    description: string,
    sections: SectionItems = {},
): string {
    const name = `${milestone}-${sprint}`;
    let content = `# ${name}\n\nMilestone [${milestone}](../${milestone}.md)\n\n${description}\n`;
    content += section('Goals', sections.goals);
    content += section('Blockers', sections.blockers, true);
    content += section('Requirements', sections.requirements);
    content += section('Open questions', sections.openQuestions);
    content += section('Decisions', sections.decisions);
    content += section('Deliverables', sections.deliverables, true);
    content += customSections(sections.custom);
    content += '\n## Status\nplanned\n';
    content += section('Results and learnings', sections.resultsAndLearnings, true);
    return content.trimEnd() + '\n';
}

/** Companion: `project/{M}/{M}-{S}/{M}-{S}-requirements.md` */
export function sprintRequirementsContent(milestone: string, sprint: string): string {
    const name = `${milestone}-${sprint}`;
    return `# ${name} Requirements\n\nSummary: [${name}.md](../${name}.md#requirements)\n\n`;
}

/** Companion: `project/{M}/{M}-{S}/{M}-{S}-decisions.md` */
export function sprintDecisionsContent(milestone: string, sprint: string): string {
    const name = `${milestone}-${sprint}`;
    return `# ${name} Decisions\n\nSummary: [${name}.md](../${name}.md#decisions)\n\n`;
}

/** Companion: `project/{M}/{M}-{S}/{M}-{S}-status.md` */
export function sprintStatusContent(milestone: string, sprint: string): string {
    const name = `${milestone}-${sprint}`;
    return `# ${name} Status\n\nSummary: [${name}.md](../${name}.md#status)\n\n`;
}

// ─── Task ─────────────────────────────────────────────────────────────────────

/**
 * Generate the content for `project/{M}/{M}-{S}/{M}-{S}-{T}.md`.
 */
export function taskFileContent(
    milestone: string,
    sprint: string,
    task: string,
    description: string,
    sections: SectionItems = {},
): string {
    const sprintName = `${milestone}-${sprint}`;
    const taskName = `${sprintName}-${task}`;
    let content = `# ${taskName}\n\nMilestone [${milestone}](../../${milestone}.md)\nSprint [${sprintName}](../${sprintName}.md)\n\n${description}\n`;
    content += section('Goals', sections.goals);
    content += section('Blockers', sections.blockers, true);
    content += section('Requirements', sections.requirements);
    content += section('Open questions', sections.openQuestions);
    content += section('Design notes', sections.designNotes, true);
    content += section('Deliverables', sections.deliverables, true);
    content += section('Acceptance criteria', sections.acceptanceCriteria, true);
    content += customSections(sections.custom);
    content += '\n## Status\nplanned\n';
    content += section('Results and learnings', sections.resultsAndLearnings, true);
    return content.trimEnd() + '\n';
}

// ─── PLAN.md entry ────────────────────────────────────────────────────────────

export function planEntry(milestone: string, description: string): string {
    return `\n## ${milestone}\n\n${description}\n\nstatus: planned\n`;
}
