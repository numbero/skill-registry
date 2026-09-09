/**
 * Skill Registry - Skill Commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as skillCore from '../core/skill';
import * as projectCore from '../core/project';
import { requireProjectContext } from '../lib/context';
import { formatRelativeTime, truncate } from '../lib/utils';

export function registerSkillCommand(program: Command): void {
  const skillCommand = program
    .command('skill')
    .description('Manage skills');

  // skill add
  skillCommand
    .command('add <source>')
    .description('Add a skill from Git or local source')
    .option('-g, --global', 'Add to global registry')
    .option('-n, --name <name>', 'Custom skill name')
    .option('-d, --description <desc>', 'Skill description')
    .option('-f, --force', 'Force overwrite existing skill')
    .action(async (source: string, options: any) => {
      try {
        if (options.global) {
          // Global mode: register to registry
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
          console.log(chalk.gray(`  • Add to project: skill-registry skill add ${skillInfo.name}`));
          console.log();

        } else {
          // Project mode: add to project
          requireProjectContext(false);

          console.log(chalk.blue(`\nAdding skill '${source}' to project...\n`));

          await projectCore.addProjectSkill(source);

          console.log(chalk.green(`✓ Added skill '${source}' to project`));
          console.log();
          console.log(chalk.gray('Tip: Run "skill-registry pull" to deploy to targets.'));
          console.log();
        }

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // skill remove
  skillCommand
    .command('remove <skill>')
    .description('Remove a skill')
    .option('-g, --global', 'Remove from global registry')
    .action(async (skillName: string, options: any) => {
      try {
        if (options.global) {
          // Global mode: remove from registry
          console.log(chalk.blue(`\nRemoving skill '${skillName}' from global registry...\n`));

          await skillCore.removeSkill(skillName);

          console.log(chalk.green(`✓ Removed skill '${skillName}'`));
          console.log();

        } else {
          // Project mode: remove from project
          requireProjectContext(false);

          console.log(chalk.blue(`\nRemoving skill '${skillName}' from project...\n`));

          await projectCore.removeProjectSkill(skillName);

          console.log(chalk.green(`✓ Removed skill '${skillName}' from project configuration`));
          console.log(chalk.yellow('Note: The skill links remain in target directories.'));
          console.log(chalk.gray('      Next pull will not create new links for this skill.'));
          console.log();
        }

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // skill list
  skillCommand
    .command('list')
    .description('List skills')
    .option('-g, --global', 'List global registry skills')
    .action(async (options: any) => {
      try {
        if (options.global) {
          // Global mode: list all skills in registry
          console.log(chalk.blue('\nGlobal Registry Skills:\n'));

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
          console.log(chalk.gray(`  ${skills.length} skills (${gitCount} git, ${localCount} local)`));
          console.log();

        } else {
          // Project mode: list project skills
          requireProjectContext(false);

          console.log(chalk.blue('\nProject Skills:\n'));

          const { config } = await projectCore.getProjectInfo();

          if (config.skills.length === 0) {
            console.log(chalk.gray('  No skills configured.\n'));
            return;
          }

          for (const skill of config.skills) {
            console.log(chalk.gray(`  • ${skill}`));
          }

          console.log();
          console.log(chalk.gray(`  ${config.skills.length} skills`));
          console.log();
        }

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // skill update
  skillCommand
    .command('update [name]')
    .description('Update skill(s)')
    .option('-g, --global', 'Update global registry skills')
    .action(async (name: string | undefined, options: any) => {
      try {
        if (options.global) {
          // Global mode: update skills in registry
          console.log(chalk.blue('\nUpdating global registry skills...\n'));

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

        } else {
          // Project mode: update project skills
          requireProjectContext(false);

          console.log(chalk.blue('\nUpdating project skills...\n'));

          // Get project skills and update each
          const { config } = await projectCore.getProjectInfo();

          if (config.skills.length === 0) {
            console.log(chalk.gray('  No skills to update.\n'));
            return;
          }

          const result = await skillCore.updateSkill();

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
        }

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}