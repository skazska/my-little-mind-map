import { Command } from 'commander';
import { registerNewMilestone } from './commands/new-milestone';
import { registerNewSprint } from './commands/new-sprint';
import { registerNewTask } from './commands/new-task';
import { registerPatch } from './commands/patch';
import { registerRollup } from './commands/rollup';
import { registerUpdateStatus } from './commands/update-status';
import { registerValidate } from './commands/validate';

const program = new Command();

program
    .name('plan')
    .description('Project flow CLI — scaffold and maintain project/PLAN.md documentation')
    .version('0.1.0');

registerNewMilestone(program);
registerNewSprint(program);
registerNewTask(program);
registerUpdateStatus(program);
registerRollup(program);
registerPatch(program);
registerValidate(program);

program.parse(process.argv);
