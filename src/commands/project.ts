/**
 * Skill Registry - Project Commands
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as projectCore from '../core/project';
import * as skillCore from '../core/skill';

export function registerProjectCommand(program: Command): void {
  const projectCommand = program
    .command('project')
    .description('Manage project skills and targets');

  // project init
  projectCommand
    .command('init')
    .description('Initialize a skill-registry project')
    .action(async () => {
      try {
        console.log(chalk.blue('\nInitializing project...\n'));

        await projectCore.initProject();

        console.log(chalk.green('✓ Created .skill-registry/config.yaml'));
        console.log(chalk.green('✓ Project initialized\n'));

        console.log(chalk.blue('Next steps:'));
        console.log(chalk.gray('  1. Add skills: skill-registry project add <skill>'));
        console.log(chalk.gray('  2. Pull skills: skill-registry project pull\n'));

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // project add
  projectCommand
    .command('add <skill>')
    .description('Add a skill to the project')
    .action(async (skillName: string) => {
      try {
        console.log(chalk.blue(`\nAdding skill '${skillName}' to project...\n`));

        await projectCore.addProjectSkill(skillName);

        console.log(chalk.green(`✓ Added skill '${skillName}' to project\n`));

        console.log(chalk.gray('Tip: Run "skill-registry project pull" to pull to targets.\n'));

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // project remove
  projectCommand
    .command('remove <skill>')
    .description('Remove a skill from the project')
    .action(async (skillName: string) => {
      try {
        console.log(chalk.blue(`\nRemoving skill '${skillName}' from project...\n`));

        await projectCore.removeProjectSkill(skillName);

        console.log(chalk.green(`✓ Removed skill '${skillName}' from project configuration\n`));

        console.log(chalk.yellow('Note: The skill links remain in target directories.'));
        console.log(chalk.gray('      Next pull will not create new links for this skill.\n'));

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // project pull
  projectCommand
    .command('pull')
    .description('Pull skills to targets (single-direction, incremental)')
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

  // project group
  const groupCommand = projectCommand
    .command('group')
    .description('Manage project groups');

  // project group add
  groupCommand
    .command('add <name>')
    .description('Add a group to the project')
    .action(async (groupName: string) => {
      try {
        console.log(chalk.blue(`\nAdding group '${groupName}' to project...\n`));

        const addedSkills = await projectCore.addProjectGroup(groupName);

        if (addedSkills.length > 0) {
          console.log(chalk.green(`✓ Added ${addedSkills.length} skills from group '${groupName}':`));
          for (const skill of addedSkills) {
            console.log(chalk.gray(`  • ${skill}`));
          }
        } else {
          console.log(chalk.yellow(`All skills from group '${groupName}' are already in the project.`));
        }

        console.log();
        console.log(chalk.gray('Tip: Run "skill-registry project pull" to pull to targets.\n'));

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // project target
  const targetCommand = projectCommand
    .command('target')
    .description('Manage project targets');

  // project target add
  targetCommand
    .command('add <name>')
    .description('Add a target to the project')
    .option('-p, --path <path>', 'Custom target path')
    .action(async (targetName: string, options: any) => {
      try {
        console.log(chalk.blue(`\nAdding target '${targetName}' to project...\n`));

        await projectCore.addProjectTarget(targetName, options.path);

        console.log(chalk.green(`✓ Added target '${targetName}' to project\n`));

        console.log(chalk.gray('Tip: Run "skill-registry project pull" to pull to targets.\n'));

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // project target list
  targetCommand
    .command('list')
    .description('List project targets')
    .action(async () => {
      try {
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

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // project show
  projectCommand
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

        console.log(chalk.gray('Config file: .skill-registry/config.yaml\n'));

      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // Shortcut commands at top level
  // add (same as project add)
  program
    .command('add <skill>')
    .description('Add a skill to the project')
    .action(async (skillName: string) => {
      try {
        await projectCore.addProjectSkill(skillName);
        console.log(chalk.green(`✓ Added skill '${skillName}' to project\n`));
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // pull (same as project pull)
  program
    .command('pull')
    .description('Pull skills to targets')
    .action(async () => {
      try {
        const result = await projectCore.pullProjectSkills();
        if (result.detected.length > 0) {
          console.log(chalk.cyan(`Auto-detected targets: ${result.detected.join(', ')}`));
        }
        console.log(chalk.green(`✓ Pulled ${result.pulled.length} skills, skipped ${result.skipped.length}\n`));
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });

  // list (same as skill list)
  program
    .command('list')
    .description('List all registered skills')
    .action(async () => {
      try {
        const skills = await skillCore.listSkills();
        console.log(chalk.blue(`\n${skills.length} skills registered:\n`));
        for (const skill of skills) {
          console.log(chalk.gray(`  • ${skill.name}`));
        }
        console.log();
      } catch (error: any) {
        console.error(chalk.red(`Error: ${error.message}`));
        process.exit(1);
      }
    });
}