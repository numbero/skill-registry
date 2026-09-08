/**
 * Skill Registry - Utility Functions
 */

import yaml from 'js-yaml';
import path from 'path';
import { ParsedFrontmatter, GitUrlInfo } from '../types';

/**
 * Parse frontmatter from content
 */
export function parseFrontmatter(content: string): ParsedFrontmatter {
  const match = content.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);

  if (!match) {
    return { frontmatter: {}, content: content };
  }

  try {
    const frontmatter = yaml.load(match[1]) as Record<string, any> || {};
    const body = match[2];

    return { frontmatter, content: body };
  } catch (error) {
    return { frontmatter: {}, content: content };
  }
}

/**
 * Parse Git URL
 * Format: git+https://github.com/user/repo.git#path/to/skill
 */
export function parseGitUrl(url: string): GitUrlInfo {
  // Check for git+ prefix
  if (!url.startsWith('git+')) {
    return { repoUrl: url };
  }

  // Remove git+ prefix
  const cleanUrl = url.slice(4);

  // Check for # separator (path/to/skill)
  const hashIndex = cleanUrl.indexOf('#');

  if (hashIndex === -1) {
    return { repoUrl: cleanUrl };
  }

  const repoUrl = cleanUrl.slice(0, hashIndex);
  const skillPath = cleanUrl.slice(hashIndex + 1);

  return { repoUrl, skillPath };
}

/**
 * Check if source is a Git URL
 */
export function isGitSource(source: string): boolean {
  return source.startsWith('git+') ||
         source.startsWith('git@') ||
         source.startsWith('https://github.com/') ||
         source.startsWith('https://gitlab.com/') ||
         source.startsWith('https://bitbucket.org/');
}

/**
 * Check if source is a local path
 */
export function isLocalSource(source: string): boolean {
  return !isGitSource(source);
}

/**
 * Resolve path (handle ~ and relative paths)
 */
export function resolvePath(targetPath: string, baseDir?: string): string {
  // Handle home directory
  if (targetPath.startsWith('~/')) {
    return path.join(process.env.HOME || '', targetPath.slice(2));
  }

  // Handle absolute path
  if (path.isAbsolute(targetPath)) {
    return targetPath;
  }

  // Handle relative path
  if (baseDir) {
    return path.resolve(baseDir, targetPath);
  }

  return path.resolve(targetPath);
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Truncate string to specified length
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - 3) + '...';
}