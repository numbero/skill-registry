/**
 * Skill Registry - Init Commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { saveGlobalConfig, getDefaultGlobalConfig, initProjectConfig } from '../lib/config';
import { getSkillsPath } from '../lib/storage';

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize project or global configuration')
    .option('-g, --global', 'Initialize global configuration')
    .option('-p, --path <path>', 'Custom skills storage path (global only)')
    .action(async (options: any) => {
      try {
        if (options.global) {
          await initGlobal(options.path);
        } else {
          await initProject();
        }
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}

/**
 * Initialize global configuration
 */
async function initGlobal(customPath?: string): Promise<void> {
  const configPath = path.join(os.homedir(), '.skill-registry', 'global.yaml');

  // Check if already initialized
  if (fs.existsSync(configPath)) {
    console.log(chalk.yellow('Global configuration already exists.'));

    const skillsPath = getSkillsPath();

    console.log(chalk.gray(`  Config: ${configPath}`));
    console.log(chalk.gray(`  Skills: ${skillsPath}`));
    console.log();

    return;
  }

  console.log(chalk.blue('\nInitializing global configuration...\n'));

  // Create default config
  const config = getDefaultGlobalConfig();

  // Set custom path if provided
  if (customPath) {
    const expandedPath = customPath.startsWith('~')
      ? path.join(os.homedir(), customPath.slice(1))
      : path.resolve(customPath);

    config.registry = { path: expandedPath };
  }

  // Save config
  await saveGlobalConfig(config);

  // Get skills path
  const skillsPath = getSkillsPath();

  // Create skills directory
  await fs.ensureDir(skillsPath);

  console.log(chalk.green('✓ Global skill-registry initialized'));
  console.log(chalk.gray(`  Config: ${configPath}`));
  console.log(chalk.gray(`  Skills: ${skillsPath}`));
  console.log();

  // Show default targets
  console.log(chalk.cyan('Default targets:'));
  const targets = config.defaults.targets;
  const defaultTarget = config.settings.default_target;

  for (const name of Object.keys(targets)) {
    const marker = name === defaultTarget ? chalk.green(' (default)') : '';
    console.log(chalk.gray(`  • ${name}${marker}`));
  }
  console.log();

  console.log(chalk.blue('Next steps:'));
  console.log(chalk.gray('  1. Add skills: skill-registry skill add -g <source>'));
  console.log(chalk.gray('  2. Initialize project: cd my-project && skill-registry init'));
  console.log();
}

/**
 * Initialize project configuration
 */
async function initProject(): Promise<void> {
  console.log(chalk.blue('\nInitializing project...\n'));

  try {
    await initProjectConfig();

    console.log(chalk.green('✓ Created .skill-registry/config.yaml'));
    console.log(chalk.green('✓ Project initialized'));
    console.log();

    console.log(chalk.blue('Next steps:'));
    console.log(chalk.gray('  1. Add skills: skill-registry skill add <skill>'));
    console.log(chalk.gray('  2. Pull skills: skill-registry pull'));
    console.log();

  } catch (error: any) {
    if (error.message.includes('already initialized')) {
      console.log(chalk.yellow('Project already initialized.'));
      console.log(chalk.gray('  Config: .skill-registry/config.yaml'));
      console.log();
    } else {
      throw error;
    }
  }
}