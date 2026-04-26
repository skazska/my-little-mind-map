import type { Command } from 'commander';
import {
    addItemToSection,
    fileExists,
    milestoneFilePath,
    readFile,
    sprintDirPath,
    sprintFilePath,
    writeFile,
} from '../fs-utils';
import {
    sprintDecisionsContent,
    sprintFileContent,
    sprintRequirementsContent,
    sprintStatusContent,
} from '../templates';

export function registerNewSprint(program: Command): void {
    program
        .command('new-sprint <milestone> <sprint> <description>')
        .description('Scaffold a new sprint under a milestone')
        .option('--goal <item>', 'Add a goal (repeatable)', collect, [])
        .option('--requirement <item>', 'Add a requirement (repeatable)', collect, [])
        .option('--blocker <item>', 'Add a blocker (repeatable)', collect, [])
        .option('--open-question <item>', 'Add an open question (repeatable)', collect, [])
        .option('--deliverable <item>', 'Add a deliverable (repeatable)', collect, [])
        .option(
            '--section <name=item>',
            'Add item to a custom section, format "SectionName=item text" (repeatable)',
            collectSection,
            {} as Record<string, string[]>,
        )
        .action(
            (
                milestone: string,
                sprint: string,
                description: string,
                opts: {
                    goal: string[];
                    requirement: string[];
                    blocker: string[];
                    openQuestion: string[];
                    deliverable: string[];
                    section: Record<string, string[]>;
                },
            ) => {
                const mFile = milestoneFilePath(milestone);
                if (!fileExists(mFile)) {
                    console.error(`Error: milestone file not found: ${mFile}`);
                    process.exit(1);
                }

                const spFile = sprintFilePath(milestone, sprint);
                if (fileExists(spFile)) {
                    console.error(`Error: sprint "${milestone}-${sprint}" already exists at ${spFile}`);
                    process.exit(1);
                }

                const content = sprintFileContent(milestone, sprint, description, {
                    goals: opts.goal,
                    requirements: opts.requirement,
                    blockers: opts.blocker,
                    openQuestions: opts.openQuestion,
                    deliverables: opts.deliverable,
                    custom: opts.section,
                });

                writeFile(spFile, content);
                console.log(`Created ${spFile}`);

                const spDir = sprintDirPath(milestone, sprint);
                const name = `${milestone}-${sprint}`;
                writeFile(`${spDir}/${name}-requirements.md`, sprintRequirementsContent(milestone, sprint));
                writeFile(`${spDir}/${name}-decisions.md`, sprintDecisionsContent(milestone, sprint));
                writeFile(`${spDir}/${name}-status.md`, sprintStatusContent(milestone, sprint));
                console.log(`Created companion docs in ${spDir}/`);

                // Append sprint to milestone summary
                const mContent = readFile(mFile);
                const sprintEntry = `[${name}](${milestone}/${name}.md): ${description}`;
                const updated = addItemToSection(mContent, 'Sprints', sprintEntry);
                writeFile(mFile, updated);
                console.log(`Appended sprint entry to ${mFile}`);
            },
        );
}

function collect(val: string, acc: string[]): string[] {
    acc.push(val);
    return acc;
}

function collectSection(val: string, acc: Record<string, string[]>): Record<string, string[]> {
    const eqIdx = val.indexOf('=');
    if (eqIdx < 0) {
        console.error(`--section value must be in format "SectionName=item text", got: ${val}`);
        process.exit(1);
    }
    const name = val.slice(0, eqIdx).trim();
    const item = val.slice(eqIdx + 1).trim();
    if (!acc[name]) acc[name] = [];
    acc[name].push(item);
    return acc;
}
