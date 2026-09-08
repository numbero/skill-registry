/**
 * Skill Registry - Global Commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { loadGlobalConfig, saveGlobalConfig, getGlobalConfigPath } from '../lib/config';
import { getSkillsPath } from '../lib/storage';

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

        // Display registry settings
        console.log(chalk.cyan('Registry:'));
        const skillsPath = getSkillsPath();
        console.log(chalk.gray(`  Skills path: ${skillsPath}`));
        if (config.registry?.path) {
          console.log(chalk.gray(`  Custom path: ${config.registry.path}`));
        }
        console.log();

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

  // global set-registry-path
  globalCommand
    .command('set-registry-path <path>')
    .description('Set custom skills storage path')
    .action(async (customPath: string) => {
      try {
        console.log(chalk.blue('\nSetting custom registry path...\n'));

        const config = await loadGlobalConfig();

        // Set custom path
        if (!config.registry) {
          config.registry = {};
        }
        config.registry.path = customPath;

        // Save config
        await saveGlobalConfig(config);

        console.log(chalk.green('✓ Custom registry path set'));
        console.log(chalk.gray(`  Path: ${customPath}`));
        console.log();
        console.log(chalk.yellow('Note:'));
        console.log(chalk.gray('  • Existing skills will remain in the old location'));
        console.log(chalk.gray('  • New skills will be stored in the new location'));
        console.log(chalk.gray('  • Manually move skills if needed:'));
        console.log(chalk.gray(`    mv ~/.skill-registry/skills/* ${customPath}/`));
        console.log();

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // global reset-registry-path
  globalCommand
    .command('reset-registry-path')
    .description('Reset to default skills storage path')
    .action(async () => {
      try {
        console.log(chalk.blue('\nResetting registry path...\n'));

        const config = await loadGlobalConfig();

        // Remove custom path
        if (config.registry) {
          delete config.registry.path;
          if (Object.keys(config.registry).length === 0) {
            delete config.registry;
          }
        }

        // Save config
        await saveGlobalConfig(config);

        console.log(chalk.green('✓ Registry path reset to default'));
        console.log(chalk.gray('  Path: ~/.skill-registry/skills/'));
        console.log();

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