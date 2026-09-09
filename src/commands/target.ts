/**
 * Skill Registry - Target Commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as targetCore from '../core/target';
import * as projectCore from '../core/project';
import { requireProjectContext } from '../lib/context';
import { saveProjectConfig } from '../lib/config';

export function registerTargetCommand(program: Command): void {
  const targetCommand = program
    .command('target')
    .description('Manage deployment targets');

  // target list
  targetCommand
    .command('list')
    .description('List targets')
    .option('-g, --global', 'List global preset targets')
    .action(async (options: any) => {
      try {
        if (options.global) {
          // Global mode: list global preset targets
          console.log(chalk.blue('\nGlobal Preset Targets:\n'));

          const targets = await targetCore.listGlobalTargets();
          const defaultTarget = await targetCore.getDefaultTarget();

          for (const [name, config] of Object.entries(targets)) {
            const isDefault = name === defaultTarget;
            const marker = isDefault ? chalk.green(' (default)') : '';

            console.log(`  ${chalk.cyan(name.padEnd(20))}${marker}`);
            console.log(chalk.gray(`    Path: ${config.path}`));
            if (config.description) {
              console.log(chalk.gray(`    ${config.description}`));
            }
            console.log();
          }

        } else {
          // Project mode: list project targets
          requireProjectContext(false);

          console.log(chalk.blue('\nProject Targets:\n'));

          const { targets, detected } = await projectCore.getProjectInfo();

          if (Object.keys(targets).length === 0) {
            console.log(chalk.gray('  No targets configured.\n'));
            return;
          }

          for (const [name, config] of Object.entries(targets)) {
            const autoMarker = detected.includes(name) ? chalk.magenta(' (auto-detected)') : '';
            console.log(`  ${chalk.cyan(name.padEnd(20))}  ${config.path}${autoMarker}`);
            if (config.description) {
              console.log(chalk.gray(`  ${''.padEnd(20)}  ${config.description}`));
            }
          }

          console.log();
        }

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // target add
  targetCommand
    .command('add <name>')
    .description('Add a target')
    .option('-g, --global', 'Add to global presets')
    .option('-p, --path <path>', 'Target path (required for global)')
    .option('-d, --description <desc>', 'Target description')
    .option('--detect <markers>', 'Comma-separated marker dirs for auto-detection (global only)')
    .action(async (name: string, options: any) => {
      try {
        if (options.global) {
          // Global mode: add global preset
          if (!options.path) {
            throw new Error('Path is required. Use --path option.');
          }

          console.log(chalk.blue(`\nAdding global target '${name}'...\n`));

          const detect = options.detect
            ? String(options.detect).split(',').map((s: string) => s.trim()).filter(Boolean)
            : undefined;

          await targetCore.addGlobalTarget(name, options.path, options.description, detect);

          console.log(chalk.green(`✓ Added target '${name}' to global configuration`));
          console.log(chalk.gray(`  Path: ${options.path}`));
          if (detect) {
            console.log(chalk.gray(`  Detect: ${detect.join(', ')}`));
          }
          console.log();
          console.log(chalk.blue('All projects can now use this target.'));
          console.log();

        } else {
          // Project mode: add target to project
          requireProjectContext(false);

          console.log(chalk.blue(`\nAdding target '${name}' to project...\n`));

          await projectCore.addProjectTarget(name, options.path);

          console.log(chalk.green(`✓ Added target '${name}' to project`));
          console.log();
          console.log(chalk.gray('Tip: Run "skill-registry pull" to deploy skills.'));
          console.log();
        }

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // target remove
  targetCommand
    .command('remove <name>')
    .description('Remove a target')
    .option('-g, --global', 'Remove from global presets')
    .action(async (name: string, options: any) => {
      try {
        if (options.global) {
          // Global mode: remove from global presets
          console.log(chalk.blue(`\nRemoving global target '${name}'...\n`));

          await targetCore.removeGlobalTarget(name);

          console.log(chalk.green(`✓ Removed target '${name}' from global configuration`));
          console.log();
          console.log(chalk.gray('Tip: Use "skill-registry target restore -g" to restore defaults.'));
          console.log();

        } else {
          // Project mode: remove from project
          requireProjectContext(false);

          console.log(chalk.blue(`\nRemoving target '${name}' from project...\n`));

          // Remove from project config
          const { config } = await projectCore.getProjectInfo();

          if (!config.targets || !config.targets[name]) {
            throw new Error(`Target '${name}' not found in project configuration.`);
          }

          delete config.targets[name];
          await saveProjectConfig(config);

          console.log(chalk.green(`✓ Removed target '${name}' from project`));
          console.log();
        }

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // target restore
  targetCommand
    .command('restore [name]')
    .description('Restore default target presets')
    .option('-g, --global', 'Restore global presets (required)')
    .action(async (name: string | undefined, options: any) => {
      try {
        if (!options.global) {
          throw new Error('The --global flag is required for restore command.');
        }

        console.log(chalk.blue('\nRestoring default target presets...\n'));

        const restored = await targetCore.restoreDefaultTargets(name);

        if (restored.length === 0) {
          console.log(chalk.yellow('No targets to restore.'));
          console.log(chalk.gray('All default targets are already present.'));
          console.log();
        } else {
          console.log(chalk.green(`✓ Restored ${restored.length} target(s):`));
          for (const targetName of restored) {
            console.log(chalk.gray(`  • ${targetName}`));
          }
          console.log();
        }

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // target default
  targetCommand
    .command('default <name>')
    .description('Set default target')
    .option('-g, --global', 'Set global default (required)')
    .action(async (name: string, options: any) => {
      try {
        if (!options.global) {
          throw new Error('The --global flag is required for default command.');
        }

        console.log(chalk.blue(`\nSetting default target to '${name}'...\n`));

        await targetCore.setDefaultTarget(name);

        console.log(chalk.green(`✓ Default target set to '${name}'`));
        console.log();

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}