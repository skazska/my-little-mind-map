import type { Command } from 'commander';
import {
    addItemToSection,
    fileExists,
    readFile,
    sprintFilePath,
    taskFilePath,
    writeFile,
} from '../fs-utils';
import { taskFileContent } from '../templates';

export function registerNewTask(program: Command): void {
    program
        .command('new-task <milestone> <sprint> <task> <description>')
        .description('Scaffold a new task under a sprint')
        .option('--goal <item>', 'Add a goal (repeatable)', collect, [])
        .option('--requirement <item>', 'Add a requirement (repeatable)', collect, [])
        .option('--blocker <item>', 'Add a blocker (repeatable)', collect, [])
        .option('--open-question <item>', 'Add an open question (repeatable)', collect, [])
        .option('--design-note <item>', 'Add a design note (repeatable)', collect, [])
        .option('--deliverable <item>', 'Add a deliverable (repeatable)', collect, [])
        .option('--acceptance-criterion <item>', 'Add an acceptance criterion (repeatable)', collect, [])
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
                task: string,
                description: string,
                opts: {
                    goal: string[];
                    requirement: string[];
                    blocker: string[];
                    openQuestion: string[];
                    designNote: string[];
                    deliverable: string[];
                    acceptanceCriterion: string[];
                    section: Record<string, string[]>;
                },
            ) => {
                const spFile = sprintFilePath(milestone, sprint);
                if (!fileExists(spFile)) {
                    console.error(`Error: sprint file not found: ${spFile}`);
                    process.exit(1);
                }

                const tFile = taskFilePath(milestone, sprint, task);
                if (fileExists(tFile)) {
                    console.error(
                        `Error: task "${milestone}-${sprint}-${task}" already exists at ${tFile}`,
                    );
                    process.exit(1);
                }

                const content = taskFileContent(milestone, sprint, task, description, {
                    goals: opts.goal,
                    requirements: opts.requirement,
                    blockers: opts.blocker,
                    openQuestions: opts.openQuestion,
                    designNotes: opts.designNote,
                    deliverables: opts.deliverable,
                    acceptanceCriteria: opts.acceptanceCriterion,
                    custom: opts.section,
                });

                writeFile(tFile, content);
                console.log(`Created ${tFile}`);

                // Append task to sprint summary
                const spContent = readFile(spFile);
                const taskName = `${milestone}-${sprint}-${task}`;
                const taskEntry = `[${taskName}](${milestone}-${sprint}/${taskName}.md): ${description}`;
                const updated = addItemToSection(spContent, 'Tasks', taskEntry);
                writeFile(spFile, updated);
                console.log(`Appended task entry to ${spFile}`);
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
