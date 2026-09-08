/**
 * Skill Registry - Global Commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { loadGlobalConfig, getGlobalConfigPath } from '../lib/config';

export function registerGlobalCommand(program: Command): void {
  const globalCommand = program
    .command('global')
    .description('Manage global configuration');

  // global show
  globalCommand
    .command('show')
    .description('Show global configuration')
    .action(async () => {
      try {
        console.log(chalk.blue('\nGlobal Configuration:\n'));

        const config = await loadGlobalConfig();

        // Display default targets
        console.log(chalk.cyan('Default Targets:'));
        for (const [name, target] of Object.entries(config.defaults.targets)) {
          console.log(chalk.gray(`  • ${name.padEnd(20)} → ${target.path}`));
        }
        console.log();

        // Display groups
        console.log(chalk.cyan('Groups:'));
        const groupNames = Object.keys(config.groups);
        if (groupNames.length === 0) {
          console.log(chalk.gray('  (none)'));
        } else {
          for (const name of groupNames) {
            const skills = config.groups[name].skills;
            console.log(chalk.gray(`  • ${name.padEnd(20)} → ${skills.length} skills`));
          }
        }
        console.log();

        // Display settings
        console.log(chalk.cyan('Settings:'));
        console.log(chalk.gray(`  default_target: ${config.settings.default_target}`));
        console.log();

        // Display config file path
        console.log(chalk.gray(`Config file: ${getGlobalConfigPath()}\n`));

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // global edit
  globalCommand
    .command('edit')
    .description('Open global configuration in editor')
    .action(async () => {
      try {
        const configPath = getGlobalConfigPath();

        // Ensure config exists
        await loadGlobalConfig();

        // Open in default editor
        const { spawn } = require('child_process');
        const editor = process.env.EDITOR || process.env.VISUAL || 'vim';

        const child = spawn(editor, [configPath], {
          stdio: 'inherit',
          shell: true
        });

        child.on('exit', (code: number) => {
          process.exit(code);
        });

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}