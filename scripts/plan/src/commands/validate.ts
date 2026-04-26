import type { Command } from 'commander';
import { validateProject, type ValidationError } from '../validate';

export function registerValidate(program: Command): void {
    program
        .command('validate [milestone]')
        .description(
            'Validate project documentation consistency.\n' +
            '  Checks: broken links, non-canonical filenames, invalid statuses, roll-up consistency.\n' +
            '  Exits with code 1 if any violations are found.',
        )
        .action((milestone?: string) => {
            const errors = validateProject(milestone);

            if (errors.length === 0) {
                console.log('✓ No issues found.');
                return;
            }

            for (const err of errors) {
                const loc = err.line != null ? `${err.file}:${err.line}` : err.file;
                console.error(`  ${loc}: ${err.message}`);
            }

            console.error(`\n${errors.length} issue(s) found.`);
            process.exit(1);
        });
}
