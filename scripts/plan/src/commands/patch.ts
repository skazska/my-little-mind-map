import type { Command } from 'commander';
import {
    addItemToSection,
    fileExists,
    milestoneFilePath,
    parseName,
    readFile,
    sprintFilePath,
    taskFilePath,
    writeFile,
} from '../fs-utils';

export function registerPatch(program: Command): void {
    program
        .command('patch <name>')
        .description(
            'Append a bullet item to a named section in a milestone, sprint, or task file.\n' +
            '  name: MILESTONE[-SPRINT[-TASK]]',
        )
        .requiredOption('--section <name>', 'Section heading to append to (case-insensitive)')
        .requiredOption('--add <item>', 'Bullet item text to append')
        .option(
            '--link <url>',
            'For Blockers: wrap the item code in a link, e.g. - [BLK_1](url): description',
        )
        .action((name: string, opts: { section: string; add: string; link?: string }) => {
            const parsed = parseName(name);
            let filePath: string;

            if (parsed.task && parsed.sprint) {
                filePath = taskFilePath(parsed.milestone, parsed.sprint, parsed.task);
            } else if (parsed.sprint) {
                filePath = sprintFilePath(parsed.milestone, parsed.sprint);
            } else {
                filePath = milestoneFilePath(parsed.milestone);
            }

            if (!fileExists(filePath)) {
                console.error(`Error: file not found: ${filePath}`);
                process.exit(1);
            }

            const content = readFile(filePath);
            const updated = addItemToSection(content, opts.section, opts.add, opts.link);
            writeFile(filePath, updated);
            console.log(`Added item to "## ${opts.section}" in ${filePath}`);
        });
}
