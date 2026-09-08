/**
 * Skill Registry - Git Utilities
 */

import path from 'path';
import fs from 'fs-extra';
import simpleGit from 'simple-git';
import { SimpleGit } from 'simple-git';

/**
 * Check if directory is a Git repository
 */
export function isGitRepo(dir: string): boolean {
  return fs.existsSync(path.join(dir, '.git'));
}

/**
 * Get Git instance
 */
function getGit(dir: string): SimpleGit {
  return simpleGit(dir);
}

/**
 * Get Git remote URL
 */
export async function getGitRemote(dir: string): Promise<string | undefined> {
  if (!isGitRepo(dir)) {
    return undefined;
  }

  try {
    const git = getGit(dir);
    const remotes = await git.getRemotes(true);
    return remotes[0]?.refs?.fetch;
  } catch (error) {
    return undefined;
  }
}

/**
 * Get Git version (commit hash)
 */
export async function getGitVersion(dir: string): Promise<string | undefined> {
  if (!isGitRepo(dir)) {
    return undefined;
  }

  try {
    const git = getGit(dir);
    const log = await git.log(['-1']);
    const latest = log.latest;

    if (!latest) {
      return undefined;
    }

    return String(latest.hash);
  } catch (error) {
    return undefined;
  }
}

/**
 * Get Git branch
 */
export async function getGitBranch(dir: string): Promise<string | undefined> {
  if (!isGitRepo(dir)) {
    return undefined;
  }

  try {
    const git = getGit(dir);
    const status = await git.status();
    const current = status.current;
    return current || undefined;
  } catch (error) {
    return undefined;
  }
}

/**
 * Clone Git repository
 */
export async function cloneGitRepo(
  repoUrl: string,
  targetPath: string,
  options?: { depth?: number; branch?: string }
): Promise<void> {
  const git = simpleGit();

  const args: string[] = [];

  if (options?.depth) {
    args.push('--depth', String(options.depth));
  }

  if (options?.branch) {
    args.push('--branch', options.branch);
  }

  await git.clone(repoUrl, targetPath, args);
}

/**
 * Pull Git repository
 */
export async function pullGitRepo(dir: string): Promise<void> {
  if (!isGitRepo(dir)) {
    throw new Error('Not a Git repository');
  }

  const git = getGit(dir);
  await git.pull();
}

/**
 * Get remote status (commits ahead/behind)
 */
export async function getRemoteStatus(dir: string): Promise<{
  ahead: number;
  behind: number;
}> {
  if (!isGitRepo(dir)) {
    return { ahead: 0, behind: 0 };
  }

  try {
    const git = getGit(dir);
    const status = await git.status();
    return {
      ahead: status.ahead,
      behind: status.behind
    };
  } catch (error) {
    return { ahead: 0, behind: 0 };
  }
}

/**
 * Check if Git repository has remote
 */
export async function hasGitRemote(dir: string): Promise<boolean> {
  if (!isGitRepo(dir)) {
    return false;
  }

  try {
    const git = getGit(dir);
    const remotes = await git.getRemotes();
    return remotes.length > 0;
  } catch (error) {
    return false;
  }
}