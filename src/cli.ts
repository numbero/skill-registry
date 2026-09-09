#!/usr/bin/env node

/**
 * Skill Registry - CLI Entry Point
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { registerInitCommand } from './commands/init';
import { registerSkillCommand } from './commands/skill';
import { registerGroupCommand } from './commands/group';
import { registerTargetCommand } from './commands/target';
import { registerStatusCommand } from './commands/status';
import { registerGlobalCommand } from './commands/global';
import * as projectCore from './core/project';

const program = new Command();

program
  .name('skill-registry')
  .version('1.0.0')
  .description('CLI tool for managing AI Agent Skills from Git and local sources');

// Register main commands
registerInitCommand(program);
registerSkillCommand(program);
registerGroupCommand(program);
registerTargetCommand(program);
registerStatusCommand(program);
registerGlobalCommand(program);

// Top-level shortcuts
program
  .command('pull')
  .description('Pull skills to targets')
  .action(async () => {
    try {
      console.log(chalk.blue('\nPulling skills to targets...\n'));

      const result = await projectCore.pullProjectSkills();

      // Display auto-detected targets
      if (result.detected.length > 0) {
        console.log(chalk.cyan(`Auto-detected targets: ${result.detected.join(', ')}`));
        console.log();
      }

      // Display pulled
      if (result.pulled.length > 0) {
        console.log(chalk.green('Pulled:'));
        for (const item of result.pulled) {
          console.log(chalk.gray(`  ✓ ${item}`));
        }
        console.log();
      }

      // Display skipped
      if (result.skipped.length > 0) {
        console.log(chalk.yellow('Skipped (already exists):'));
        for (const item of result.skipped) {
          console.log(chalk.gray(`  - ${item}`));
        }
        console.log();
      }

      // Summary
      console.log(
        chalk.gray(
          `${result.pulled.length} pulled, ` +
          `${result.skipped.length} skipped`
        )
      );
      console.log();

    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program
  .command('show')
  .description('Show project configuration')
  .action(async () => {
    try {
      console.log(chalk.blue('\nProject Configuration:\n'));

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

      console.log(chalk.gray('Config file: .skill-registry/config.yaml'));
      console.log();

    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);