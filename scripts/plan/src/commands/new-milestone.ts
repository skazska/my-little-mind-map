import type { Command } from 'commander';
import {
    addItemToSection,
    fileExists,
    milestoneDirPath,
    milestoneFilePath,
    planFilePath,
    readFile,
    writeFile,
} from '../fs-utils';
import {
    milestoneDecisionsContent,
    milestoneFileContent,
    milestoneRequirementsContent,
    milestoneResultsContent,
    planEntry,
} from '../templates';

export function registerNewMilestone(program: Command): void {
    program
        .command('new-milestone <milestone> <description>')
        .description('Scaffold a new milestone with companion docs')
        .option('--goal <item>', 'Add a goal (repeatable)', collect, [])
        .option('--requirement <item>', 'Add a requirement (repeatable)', collect, [])
        .option('--blocker <item>', 'Add a blocker (repeatable)', collect, [])
        .option('--open-question <item>', 'Add an open question (repeatable)', collect, [])
        .option(
            '--section <name=item>',
            'Add item to a custom section, format "SectionName=item text" (repeatable)',
            collectSection,
            {} as Record<string, string[]>,
        )
        .action(
            (
                milestone: string,
                description: string,
                opts: {
                    goal: string[];
                    requirement: string[];
                    blocker: string[];
                    openQuestion: string[];
                    section: Record<string, string[]>;
                },
            ) => {
                const mFile = milestoneFilePath(milestone);
                if (fileExists(mFile)) {
                    console.error(`Error: milestone "${milestone}" already exists at ${mFile}`);
                    process.exit(1);
                }

                const content = milestoneFileContent(milestone, description, {
                    goals: opts.goal,
                    requirements: opts.requirement,
                    blockers: opts.blocker,
                    openQuestions: opts.openQuestion,
                    custom: opts.section,
                });

                writeFile(mFile, content);
                console.log(`Created ${mFile}`);

                const mDir = milestoneDirPath(milestone);
                writeFile(`${mDir}/${milestone}-requirements.md`, milestoneRequirementsContent(milestone));
                writeFile(`${mDir}/${milestone}-decisions.md`, milestoneDecisionsContent(milestone));
                writeFile(`${mDir}/${milestone}-results.md`, milestoneResultsContent(milestone));
                console.log(`Created companion docs in ${mDir}/`);

                // Append to PLAN.md
                const planFile = planFilePath();
                if (fileExists(planFile)) {
                    const existing = readFile(planFile);
                    // Only append if milestone not already mentioned
                    if (!existing.includes(`## ${milestone}`)) {
                        writeFile(planFile, existing.trimEnd() + '\n' + planEntry(milestone, description));
                        console.log(`Appended "${milestone}" entry to PLAN.md`);
                    }
                }
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
