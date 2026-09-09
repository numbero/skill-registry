/**
 * Skill Registry - Group Commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as groupCore from '../core/group';
import * as projectCore from '../core/project';
import { requireProjectContext } from '../lib/context';
import { saveProjectConfig } from '../lib/config';

export function registerGroupCommand(program: Command): void {
  const groupCommand = program
    .command('group')
    .description('Manage skill groups');

  // group list
  groupCommand
    .command('list')
    .description('List groups')
    .option('-g, --global', 'List global groups')
    .action(async (options: any) => {
      try {
        if (options.global) {
          // Global mode: list global groups
          console.log(chalk.blue('\nGlobal Skill Groups:\n'));

          const groups = await groupCore.listGroups();

          if (Object.keys(groups).length === 0) {
            console.log(chalk.gray('  No groups created.\n'));
            return;
          }

          for (const [name, group] of Object.entries(groups)) {
            console.log(chalk.cyan(`  ${name}`));
            if (group.description) {
              console.log(chalk.gray(`    ${group.description}`));
            }
            console.log(chalk.gray(`    Skills: ${group.skills.join(', ')}`));
            console.log();
          }

        } else {
          // Project mode: list project groups
          requireProjectContext(false);

          console.log(chalk.blue('\nProject Groups:\n'));

          const { config } = await projectCore.getProjectInfo();

          if (!config.groups || Object.keys(config.groups).length === 0) {
            console.log(chalk.gray('  No groups in project.\n'));
            return;
          }

          for (const [name, group] of Object.entries(config.groups)) {
            console.log(chalk.cyan(`  ${name}`));
            if (group.skills) {
              console.log(chalk.gray(`    Skills: ${group.skills.join(', ')}`));
            }
            console.log();
          }
        }

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // group add
  groupCommand
    .command('add <name>')
    .description('Add a group')
    .option('-g, --global', 'Create global group')
    .option('-d, --description <desc>', 'Group description')
    .action(async (name: string, options: any) => {
      try {
        if (options.global) {
          // Global mode: create global group
          console.log(chalk.blue(`\nCreating global group '${name}'...\n`));

          await groupCore.createGroup(name, options.description);

          console.log(chalk.green(`✓ Created global group '${name}'`));
          console.log();
          console.log(chalk.gray('Add skills: skill-registry group skill add -g <group> <skill>'));
          console.log();

        } else {
          // Project mode: add group to project
          requireProjectContext(false);

          console.log(chalk.blue(`\nAdding group '${name}' to project...\n`));

          const addedSkills = await projectCore.addProjectGroup(name);

          if (addedSkills.length > 0) {
            console.log(chalk.green(`✓ Added ${addedSkills.length} skills from group '${name}':`));
            for (const skill of addedSkills) {
              console.log(chalk.gray(`  • ${skill}`));
            }
          } else {
            console.log(chalk.yellow(`All skills from group '${name}' are already in the project.`));
          }

          console.log();
          console.log(chalk.gray('Tip: Run "skill-registry pull" to deploy skills.'));
          console.log();
        }

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // group remove
  groupCommand
    .command('remove <name>')
    .description('Remove a group')
    .option('-g, --global', 'Remove from global')
    .action(async (name: string, options: any) => {
      try {
        if (options.global) {
          // Global mode: delete global group
          console.log(chalk.blue(`\nDeleting global group '${name}'...\n`));

          await groupCore.deleteGroup(name);

          console.log(chalk.green(`✓ Deleted global group '${name}'`));
          console.log();

        } else {
          // Project mode: remove group from project
          requireProjectContext(false);

          console.log(chalk.blue(`\nRemoving group '${name}' from project...\n`));

          const { config } = await projectCore.getProjectInfo();

          if (!config.groups || !config.groups[name]) {
            throw new Error(`Group '${name}' not found in project configuration.`);
          }

          delete config.groups[name];
          await saveProjectConfig(config);

          console.log(chalk.green(`✓ Removed group '${name}' from project`));
          console.log();
        }

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // group skill subcommand
  const skillCommand = groupCommand
    .command('skill')
    .description('Manage skills in groups');

  // group skill add
  skillCommand
    .command('add <group> <skill>')
    .description('Add a skill to a group')
    .option('-g, --global', 'Add to global group')
    .action(async (groupName: string, skillName: string, options: any) => {
      try {
        if (options.global) {
          // Global mode: add to global group
          console.log(chalk.blue(`\nAdding skill '${skillName}' to global group '${groupName}'...\n`));

          await groupCore.addSkillToGroup(groupName, skillName);

          console.log(chalk.green(`✓ Added skill '${skillName}' to global group '${groupName}'`));
          console.log();

        } else {
          // Project mode: not supported
          throw new Error('Project-level group skill management is not supported.\nUse global groups instead.');
        }

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // group skill remove
  skillCommand
    .command('remove <group> <skill>')
    .description('Remove a skill from a group')
    .option('-g, --global', 'Remove from global group')
    .action(async (groupName: string, skillName: string, options: any) => {
      try {
        if (options.global) {
          // Global mode: remove from global group
          console.log(chalk.blue(`\nRemoving skill '${skillName}' from global group '${groupName}'...\n`));

          await groupCore.removeSkillFromGroup(groupName, skillName);

          console.log(chalk.green(`✓ Removed skill '${skillName}' from global group '${groupName}'`));
          console.log();

        } else {
          // Project mode: not supported
          throw new Error('Project-level group skill management is not supported.\nUse global groups instead.');
        }

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}