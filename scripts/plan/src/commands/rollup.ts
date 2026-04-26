import type { Command } from 'commander';
import { fileExists, listDir, projectPath } from '../commons/fs-utils';
import { rollupMilestone, rollupSprint } from '../commons/status';

export function registerRollup(program: Command): void {
    program
        .command('rollup [milestone] [sprint]')
        .description(
            'Recompute and write status bottom-up.\n' +
            '  No args: all milestones.\n' +
            '  <milestone>: all sprints in that milestone.\n' +
            '  <milestone> <sprint>: single sprint only.',
        )
        .action((milestone?: string, sprint?: string) => {
            if (milestone && sprint) {
                const status = rollupSprint(milestone, sprint);
                console.log(`${milestone}-${sprint}: ${status}`);
                return;
            }

            const milestones = milestone ? [milestone] : discoverMilestones();

            for (const m of milestones) {
                const status = rollupMilestone(m);
                console.log(`${m}: ${status}`);
            }
        });
}

function discoverMilestones(): string[] {
    const projectDir = projectPath();
    if (!fileExists(projectDir)) return [];
    return listDir(projectDir)
        .filter((f) => f.endsWith('.md') && f !== 'PLAN.md' && f !== 'IDEA.md')
        .map((f) => f.slice(0, -3));
}
