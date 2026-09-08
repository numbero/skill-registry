/**
 * Skill Registry - Skill Commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as skillCore from '../core/skill';
import { formatRelativeTime, truncate } from '../lib/utils';

export function registerSkillCommand(program: Command): void {
  const skillCommand = program
    .command('skill')
    .description('Manage skills in the registry');

  // skill add
  skillCommand
    .command('add <source>')
    .description('Register a new skill from Git or local source')
    .option('-n, --name <name>', 'Custom skill name')
    .option('-d, --description <desc>', 'Skill description')
    .option('-f, --force', 'Force overwrite existing skill')
    .action(async (source: string, options: any) => {
      try {
        console.log(chalk.blue(`\nRegistering skill from: ${source}\n`));

        const skillInfo = await skillCore.addSkill(source, {
          name: options.name,
          description: options.description,
          force: options.force
        });

        console.log(chalk.green(`✓ Registered skill '${skillInfo.name}'`));
        console.log(chalk.gray(`  Path: ${skillInfo.cached_path}`));

        if (skillInfo.is_git) {
          console.log(chalk.gray(`  Source: ${skillInfo.source}`));
          console.log(chalk.gray(`  Version: ${skillInfo.version?.substring(0, 7)}`));
        }

        console.log();
        console.log(chalk.blue('Available actions:'));
        console.log(chalk.gray(`  • Add to project: skill-registry project add ${skillInfo.name}`));
        console.log(chalk.gray(`  • View details: skill-registry skill list`));
        console.log();

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // skill remove
  skillCommand
    .command('remove <name>')
    .description('Remove a skill from the registry')
    .action(async (name: string) => {
      try {
        console.log(chalk.blue(`\nRemoving skill '${name}'...\n`));

        await skillCore.removeSkill(name);

        console.log(chalk.green(`✓ Removed skill '${name}'`));
        console.log();

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // skill list
  skillCommand
    .command('list')
    .description('List all registered skills')
    .action(async () => {
      try {
        console.log(chalk.blue('\nRegistered Skills:\n'));

        const skills = await skillCore.listSkills();

        if (skills.length === 0) {
          console.log(chalk.gray('  No skills registered.\n'));
          return;
        }

        // Sort by name
        skills.sort((a, b) => a.name.localeCompare(b.name));

        // Display skills
        const maxName = 20;
        const maxSource = 30;

        for (const skill of skills) {
          const name = truncate(skill.name, maxName).padEnd(maxName);
          const type = skill.is_git ? 'git  ' : 'local';
          const source = skill.is_git && skill.source
            ? truncate(skill.source.replace(/.*github\.com\//, ''), maxSource)
            : '';
          const updated = formatRelativeTime(skill.updated_at);

          console.log(`  ${chalk.cyan(name)}  ${chalk.gray(type)}  ${source.padEnd(maxSource)}  ${chalk.gray(updated)}`);
        }

        // Summary
        const gitCount = skills.filter(s => s.is_git).length;
        const localCount = skills.length - gitCount;

        console.log();
        console.log(chalk.gray(`  ${skills.length} skills (${gitCount} git, ${localCount} local)\n`));

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // skill update
  skillCommand
    .command('update [name]')
    .description('Update skill(s) from their source')
    .action(async (name: string | undefined) => {
      try {
        console.log(chalk.blue('\nUpdating skills...\n'));

        const result = await skillCore.updateSkill(name);

        // Display updated
        if (result.updated.length > 0) {
          console.log(chalk.green('Updated:'));
          for (const skill of result.updated) {
            console.log(chalk.gray(`  ✓ ${skill}`));
          }
          console.log();
        }

        // Display skipped
        if (result.skipped.length > 0) {
          console.log(chalk.yellow('Skipped:'));
          for (const skill of result.skipped) {
            console.log(chalk.gray(`  - ${skill}`));
          }
          console.log();
        }

        // Display failed
        if (result.failed.length > 0) {
          console.log(chalk.red('Failed:'));
          for (const item of result.failed) {
            console.log(chalk.red(`  ✗ ${item.name}: ${item.error}`));
          }
          console.log();
        }

        // Summary
        console.log(
          chalk.gray(
            `${result.updated.length} updated, ` +
            `${result.skipped.length} skipped, ` +
            `${result.failed.length} failed`
          )
        );
        console.log();

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}