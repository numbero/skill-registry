#!/usr/bin/env node

/**
 * Skill Registry - CLI Entry Point
 */

import { Command } from 'commander';
import { registerSkillCommand } from './commands/skill';
import { registerGroupCommand } from './commands/group';
import { registerTargetCommand } from './commands/target';
import { registerGlobalCommand } from './commands/global';
import { registerProjectCommand } from './commands/project';
import { registerStatusCommand } from './commands/status';

const program = new Command();

program
  .name('skill-registry')
  .version('1.0.0')
  .description('CLI tool for managing AI Agent Skills from Git and local sources');

// Register commands
registerSkillCommand(program);
registerGroupCommand(program);
registerTargetCommand(program);
registerGlobalCommand(program);
registerProjectCommand(program);
registerStatusCommand(program);

// Parse arguments
program.parse(process.argv);