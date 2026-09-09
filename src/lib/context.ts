/**
 * Skill Registry - Context Detection
 */

import path from 'path';
import os from 'os';
import { isProjectDir } from './config';

/**
 * Detect current scope: project or global
 */
export function detectScope(): {
  isProject: boolean;
  projectDir: string | null;
} {
  let currentDir = process.cwd();
  const homeDir = os.homedir();

  // Walk up the directory tree to find project
  while (currentDir !== path.dirname(currentDir)) {
    if (isProjectDir(currentDir)) {
      return { isProject: true, projectDir: currentDir };
    }
    currentDir = path.dirname(currentDir);
  }

  // Check root directory
  if (isProjectDir(currentDir)) {
    return { isProject: true, projectDir: currentDir };
  }

  // Check home directory (treated as project if initialized)
  if (isProjectDir(homeDir)) {
    return { isProject: true, projectDir: homeDir };
  }

  return { isProject: false, projectDir: null };
}

/**
 * Ensure project context for project-level commands
 * @param global - Whether the command is running in global mode
 * @returns Project directory path
 * @throws Error if not in a project directory
 */
export function requireProjectContext(global: boolean): string {
  if (global) {
    // Global mode: any directory works
    return process.cwd();
  }

  const { isProject, projectDir } = detectScope();

  if (!isProject) {
    throw new Error(
      `Not a skill-registry project.\n\n` +
      `Options:\n` +
      `  1. Initialize: skill-registry init\n` +
      `  2. Use global: skill-registry <command> -g`
    );
  }

  return projectDir!;
}

/**
 * Get current project directory (if any)
 * @returns Project directory path or null
 */
export function getCurrentProjectDir(): string | null {
  const { isProject, projectDir } = detectScope();
  return isProject ? projectDir : null;
}