/**
 * Skill Registry - Storage Management
 */

import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { SkillInfo } from '../types';
import { parseFrontmatter } from './utils';
import { getGitRemote, getGitVersion, getGitBranch, isGitRepo } from './git';

/**
 * Get central registry path
 */
export function getRegistryPath(): string {
  return path.join(os.homedir(), '.skill-registry');
}

/**
 * Get skills directory path
 */
export function getSkillsPath(): string {
  return path.join(getRegistryPath(), 'skills');
}

/**
 * Get global config path
 */
export function getGlobalConfigPath(): string {
  return path.join(getRegistryPath(), 'global.yaml');
}

/**
 * Ensure registry directory exists
 */
export async function ensureRegistry(): Promise<void> {
  const registryPath = getRegistryPath();
  const skillsPath = getSkillsPath();

  await fs.ensureDir(registryPath);
  await fs.ensureDir(skillsPath);
}

/**
 * Get skill directory path
 */
export function getSkillPath(skillName: string): string {
  return path.join(getSkillsPath(), skillName);
}

/**
 * Check if skill exists
 */
export function skillExists(skillName: string): boolean {
  const skillPath = getSkillPath(skillName);
  const skillMdPath = path.join(skillPath, 'SKILL.md');

  return fs.existsSync(skillPath) && fs.existsSync(skillMdPath);
}

/**
 * Get skill info
 */
export async function getSkillInfo(skillDir: string): Promise<SkillInfo | null> {
  // Check SKILL.md
  const skillMdPath = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    return null;
  }

  // Read SKILL.md
  const skillMd = await fs.readFile(skillMdPath, 'utf-8');
  const { frontmatter } = parseFrontmatter(skillMd);

  // Check Git
  const isGit = isGitRepo(skillDir);

  // Get Git info
  let source: string | undefined;
  let version: string | undefined;
  let branch: string | undefined;

  if (isGit) {
    try {
      source = await getGitRemote(skillDir);
      version = await getGitVersion(skillDir);
      branch = await getGitBranch(skillDir);
    } catch (error) {
      // Ignore Git errors
    }
  }

  // Get timestamps
  const stats = await fs.stat(skillDir);

  return {
    name: frontmatter.name || path.basename(skillDir),
    description: frontmatter.description || '',
    cached_path: skillDir,

    is_git: isGit,
    source: source,
    version: version,
    branch: branch,

    installed_at: stats.birthtime,
    updated_at: stats.mtime,

    metadata: frontmatter
  };
}

/**
 * List all skills
 */
export async function listSkills(): Promise<SkillInfo[]> {
  const skillsPath = getSkillsPath();

  // Ensure directory exists
  if (!fs.existsSync(skillsPath)) {
    return [];
  }

  const entries = await fs.readdir(skillsPath, { withFileTypes: true });
  const skills: SkillInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const skillDir = path.join(skillsPath, entry.name);
    const skillInfo = await getSkillInfo(skillDir);

    if (skillInfo) {
      skills.push(skillInfo);
    }
  }

  return skills;
}

/**
 * Get skill by name
 */
export async function getSkillByName(name: string): Promise<SkillInfo | null> {
  const skillDir = getSkillPath(name);

  if (!fs.existsSync(skillDir)) {
    return null;
  }

  return await getSkillInfo(skillDir);
}

/**
 * Remove skill
 */
export async function removeSkill(name: string): Promise<void> {
  const skillDir = getSkillPath(name);

  if (!fs.existsSync(skillDir)) {
    throw new Error(`Skill '${name}' not found.`);
  }

  await fs.remove(skillDir);
}