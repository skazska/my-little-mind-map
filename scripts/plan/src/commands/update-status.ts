import type { Command } from 'commander';
import {
    fileExists,
    milestoneFilePath,
    parseName,
    readFile,
    sprintFilePath,
    taskFilePath,
    updateStatusInContent,
    writeFile,
} from '../commons/fs-utils';
import { isValidStatus, VALID_STATUSES } from '../commons/status';

export function registerUpdateStatus(program: Command): void {
    program
        .command('update-status <name> <status>')
        .description(
            `Update the status of a milestone, sprint, or task.\n` +
            `  name: MILESTONE[-SPRINT[-TASK]]\n` +
            `  status: ${VALID_STATUSES.join(' | ')}`,
        )
        .action((name: string, status: string) => {
            if (!isValidStatus(status)) {
                console.error(
                    `Error: invalid status "${status}". Must be one of: ${VALID_STATUSES.join(', ')}`,
                );
                process.exit(1);
            }

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
            const updated = updateStatusInContent(content, status);
            writeFile(filePath, updated);
            console.log(`Updated status to "${status}" in ${filePath}`);
        });
}
