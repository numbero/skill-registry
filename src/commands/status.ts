/**
 * Skill Registry - Status Command
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as skillCore from '../core/skill';
import * as groupCore from '../core/group';
import * as targetCore from '../core/target';
import * as projectCore from '../core/project';
import { isProjectDir } from '../lib/config';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Show overall status (global + project if applicable)')
    .action(async () => {
      try {
        console.log(chalk.blue('\nSkill Registry Status:\n'));

        // Global registry info
        console.log(chalk.cyan('Global Registry:'));

        const skills = await skillCore.listSkills();
        const groups = await groupCore.listGroups();
        const targets = await targetCore.listGlobalTargets();

        const gitCount = skills.filter(s => s.is_git).length;
        const localCount = skills.length - gitCount;

        console.log(chalk.gray(`  Skills: ${skills.length} (${gitCount} git, ${localCount} local)`));
        console.log(chalk.gray(`  Groups: ${Object.keys(groups).length}`));
        console.log(chalk.gray(`  Targets: ${Object.keys(targets).length} predefined`));
        console.log();

        // Project info (if in project directory)
        if (isProjectDir(process.cwd())) {
          console.log(chalk.cyan('Current Project:'));

          try {
            const { config, targets: projectTargets } = await projectCore.getProjectInfo();

            console.log(chalk.gray(`  Path: ${process.cwd()}`));
            console.log(chalk.gray(`  Skills: ${config.skills.length}`));

            const targetNames = Object.keys(projectTargets);
            console.log(chalk.gray(`  Targets: ${targetNames.length} (${targetNames.join(', ')})`));

            console.log();
          } catch (error) {
            console.log(chalk.gray('  (unable to load project info)\n'));
          }
        }

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}