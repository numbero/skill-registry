/**
 * Skill Registry - Group Commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as groupCore from '../core/group';

export function registerGroupCommand(program: Command): void {
  const groupCommand = program
    .command('group')
    .description('Manage skill groups');

  // group add
  groupCommand
    .command('add <name> [skill]')
    .description('Create a group or add skill(s) to existing group')
    .option('-d, --description <desc>', 'Group description')
    .action(async (name: string, skill: string | undefined, options: any) => {
      try {
        // Check if creating new group or adding skill
        const existingGroup = await groupCore.getGroup(name);

        if (!existingGroup) {
          // Create new group
          console.log(chalk.blue(`\nCreating group '${name}'...\n`));

          await groupCore.createGroup(name, options.description);

          console.log(chalk.green(`✓ Created group '${name}'\n`));

          // If skill specified, add it
          if (skill) {
            await groupCore.addSkillToGroup(name, skill);
            console.log(chalk.green(`✓ Added skill '${skill}' to group\n`));
          }

        } else {
          // Add skill to existing group
          if (!skill) {
            throw new Error('Skill name required when adding to existing group.');
          }

          console.log(chalk.blue(`\nAdding skill '${skill}' to group '${name}'...\n`));

          await groupCore.addSkillToGroup(name, skill);

          console.log(chalk.green(`✓ Added skill '${skill}' to group '${name}'\n`));
        }

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // group remove
  groupCommand
    .command('remove <name> [skill]')
    .description('Remove skill from group or delete group')
    .action(async (name: string, skill: string | undefined) => {
      try {
        if (skill) {
          // Remove skill from group
          console.log(chalk.blue(`\nRemoving skill '${skill}' from group '${name}'...\n`));

          await groupCore.removeSkillFromGroup(name, skill);

          console.log(chalk.green(`✓ Removed skill '${skill}' from group '${name}'\n`));

        } else {
          // Delete group
          console.log(chalk.blue(`\nDeleting group '${name}'...\n`));

          await groupCore.deleteGroup(name);

          console.log(chalk.green(`✓ Deleted group '${name}'\n`));
        }

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // group list
  groupCommand
    .command('list')
    .description('List all groups')
    .action(async () => {
      try {
        console.log(chalk.blue('\nSkill Groups:\n'));

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

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}