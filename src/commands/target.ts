/**
 * Skill Registry - Target Commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as targetCore from '../core/target';

export function registerTargetCommand(program: Command): void {
  const targetCommand = program
    .command('target')
    .description('Manage global targets');

  // target add
  targetCommand
    .command('add <name>')
    .description('Add a new global target')
    .option('-p, --path <path>', 'Target path (required)')
    .option('-d, --description <desc>', 'Target description')
    .action(async (name: string, options: any) => {
      try {
        if (!options.path) {
          throw new Error('Path is required. Use --path option.');
        }

        console.log(chalk.blue(`\nAdding target '${name}'...\n`));

        await targetCore.addGlobalTarget(name, options.path, options.description);

        console.log(chalk.green(`✓ Added target '${name}' to global configuration`));
        console.log(chalk.gray(`  Path: ${options.path}\n`));

        console.log(chalk.blue('All projects can now use this target.\n'));

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // target remove
  targetCommand
    .command('remove <name>')
    .description('Remove a global target')
    .action(async (name: string) => {
      try {
        console.log(chalk.blue(`\nRemoving target '${name}'...\n`));

        await targetCore.removeGlobalTarget(name);

        console.log(chalk.green(`✓ Removed target '${name}' from global configuration\n`));

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // target list
  targetCommand
    .command('list')
    .description('List all global predefined targets')
    .action(async () => {
      try {
        console.log(chalk.blue('\nGlobal Predefined Targets:\n'));

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

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}