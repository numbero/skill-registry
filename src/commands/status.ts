/**
 * Skill Registry - Status Command
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { detectScope } from '../lib/context';
import { loadGlobalConfig, getGlobalConfigPath } from '../lib/config';
import { getSkillsPath } from '../lib/storage';
import * as projectCore from '../core/project';
import * as skillCore from '../core/skill';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Show complete status (project + global)')
    .action(async () => {
      try {
        const { isProject, projectDir } = detectScope();

        // Show project status
        if (isProject && projectDir) {
          console.log(chalk.blue('\n📦 Project Status\n'));
          console.log(chalk.gray(`  Directory: ${projectDir}`));
          console.log();

          const { config, targets, detected } = await projectCore.getProjectInfo();

          // Display targets
          console.log(chalk.cyan('Targets:'));
          if (Object.keys(targets).length === 0) {
            console.log(chalk.gray('  (none)'));
          } else {
            for (const [name, targetConfig] of Object.entries(targets)) {
              const autoMarker = detected.includes(name) ? chalk.magenta(' (auto-detected)') : '';
              console.log(chalk.gray(`  • ${name} → ${targetConfig.path}`) + autoMarker);
            }
          }
          console.log();

          // Display skills
          console.log(chalk.cyan('Skills:'));
          if (config.skills.length === 0) {
            console.log(chalk.gray('  (none)'));
          } else {
            for (const skill of config.skills) {
              console.log(chalk.gray(`  • ${skill}`));
            }
          }
          console.log();
        } else {
          console.log(chalk.yellow('\n⚠️  Not in a skill-registry project\n'));
        }

        // Show global status
        console.log(chalk.blue('\n🌐 Global Status\n'));

        try {
          const config = await loadGlobalConfig();
          const skillsPath = getSkillsPath();

          console.log(chalk.gray(`  Config: ${getGlobalConfigPath()}`));
          console.log(chalk.gray(`  Skills: ${skillsPath}`));
          console.log();

          // Display default targets
          console.log(chalk.cyan('Default Targets:'));
          const targetCount = Object.keys(config.defaults.targets).length;
          console.log(chalk.gray(`  ${targetCount} targets configured`));
          console.log();

          // Display groups
          console.log(chalk.cyan('Groups:'));
          const groupNames = Object.keys(config.groups);
          if (groupNames.length === 0) {
            console.log(chalk.gray('  (none)'));
          } else {
            console.log(chalk.gray(`  ${groupNames.length} groups`));
            for (const name of groupNames) {
              const skills = config.groups[name].skills;
              console.log(chalk.gray(`  • ${name} (${skills.length} skills)`));
            }
          }
          console.log();

          // Display total skills in registry
          const skills = await skillCore.listSkills();
          console.log(chalk.cyan('Registry:'));
          console.log(chalk.gray(`  ${skills.length} skills cached`));
          console.log();

        } catch (error: any) {
          console.log(chalk.yellow('Global configuration not initialized.'));
          console.log(chalk.gray('  Run: skill-registry init -g'));
          console.log();
        }

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}