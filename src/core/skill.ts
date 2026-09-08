/**
 * Skill Registry - Skill Management Core
 */

import path from 'path';
import fs from 'fs-extra';
import { SkillInfo, SkillAddOptions } from '../types';
import {
  getSkillsPath,
  getSkillPath,
  skillExists,
  getSkillByName,
  getSkillInfo,
  listSkills as listSkillsFromStorage,
  removeSkill as removeSkillFromStorage
} from '../lib/storage';
import { parseGitUrl, isGitSource } from '../lib/utils';
import { cloneGitRepo, pullGitRepo, hasGitRemote } from '../lib/git';

/**
 * Add skill to registry
 */
export async function addSkill(
  source: string,
  options: SkillAddOptions = {}
): Promise<SkillInfo> {
  // Ensure registry exists
  await fs.ensureDir(getSkillsPath());

  // Determine skill name
  let skillName: string;

  if (options.name) {
    skillName = options.name;
  } else {
    skillName = await extractSkillName(source);
  }

  // Check uniqueness
  if (skillExists(skillName) && !options.force) {
    throw new Error(
      `Skill '${skillName}' already exists.\n\n` +
      `Options:\n` +
      `  • Use different name: --name <name>\n` +
      `  • Force overwrite: --force\n` +
      `  • Remove existing: skill-registry skill remove ${skillName}`
    );
  }

  // Get target path
  const targetPath = getSkillPath(skillName);

  // Remove existing if force
  if (options.force && fs.existsSync(targetPath)) {
    await fs.remove(targetPath);
  }

  // Clone or copy
  if (isGitSource(source)) {
    await addGitSkill(source, targetPath);
  } else {
    await addLocalSkill(source, targetPath);
  }

  // Get skill info
  const skillInfo = await getSkillInfo(targetPath);

  if (!skillInfo) {
    throw new Error('Failed to get skill info after registration.');
  }

  return skillInfo;
}

/**
 * Add Git skill
 */
async function addGitSkill(gitUrl: string, targetPath: string): Promise<void> {
  const { repoUrl, skillPath } = parseGitUrl(gitUrl);

  // Clone to temp directory first
  const tempDir = path.join(targetPath, '..', `temp-${Date.now()}`);
  await fs.ensureDir(tempDir);

  try {
    // Clone repository
    await cloneGitRepo(repoUrl, tempDir, { depth: 1 });

    // If skill path specified, move content
    if (skillPath) {
      const skillDir = path.join(tempDir, skillPath);
      if (!fs.existsSync(skillDir)) {
        throw new Error(`Skill path '${skillPath}' not found in repository.`);
      }
      await fs.copy(skillDir, targetPath);
    } else {
      await fs.copy(tempDir, targetPath);
    }

    // Verify SKILL.md exists
    const skillMdPath = path.join(targetPath, 'SKILL.md');
    if (!fs.existsSync(skillMdPath)) {
      throw new Error('SKILL.md not found in the repository.');
    }

  } finally {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      await fs.remove(tempDir);
    }
  }
}

/**
 * Add local skill
 */
async function addLocalSkill(localPath: string, targetPath: string): Promise<void> {
  // Validate local path
  if (!fs.existsSync(localPath)) {
    throw new Error(`Path not found: ${localPath}`);
  }

  if (!fs.statSync(localPath).isDirectory()) {
    throw new Error(`Not a directory: ${localPath}`);
  }

  // Check SKILL.md
  const skillMdPath = path.join(localPath, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    throw new Error(`SKILL.md not found in ${localPath}`);
  }

  // Copy to registry
  await fs.copy(localPath, targetPath, {
    overwrite: true,
    preserveTimestamps: true
  });
}

/**
 * Extract skill name from source
 */
async function extractSkillName(source: string): Promise<string> {
  if (isGitSource(source)) {
    const { skillPath, repoUrl } = parseGitUrl(source);

    // If skill path specified, use its basename
    if (skillPath) {
      return path.basename(skillPath);
    }

    // Otherwise, extract from repo URL
    const repoName = path.basename(repoUrl, '.git');
    return repoName;
  } else {
    // Local path, use basename
    return path.basename(source);
  }
}

/**
 * Remove skill from registry
 */
export async function removeSkill(name: string): Promise<void> {
  await removeSkillFromStorage(name);
}

/**
 * List all skills
 */
export async function listSkills(): Promise<SkillInfo[]> {
  return await listSkillsFromStorage();
}

/**
 * Update skill
 */
export async function updateSkill(name?: string): Promise<{
  updated: string[];
  skipped: string[];
  failed: { name: string; error: string }[];
}> {
  const skills = name ? [await getSkillByName(name)] : await listSkills();

  const result = {
    updated: [] as string[],
    skipped: [] as string[],
    failed: [] as { name: string; error: string }[]
  };

  for (const skill of skills) {
    if (!skill) {
      continue;
    }

    try {
      // Check if Git repo
      if (!skill.is_git) {
        result.skipped.push(`${skill.name} (not a Git repository)`);
        continue;
      }

      // Check if has remote
      const hasRemote = await hasGitRemote(skill.cached_path);
      if (!hasRemote) {
        result.skipped.push(`${skill.name} (no remote)`);
        continue;
      }

      // Pull updates
      await pullGitRepo(skill.cached_path);
      result.updated.push(skill.name);

    } catch (error: any) {
      result.failed.push({
        name: skill.name,
        error: error.message
      });
    }
  }

  return result;
}

/**
 * Get skill by name
 */
export async function getSkill(name: string): Promise<SkillInfo | null> {
  return await getSkillByName(name);
}