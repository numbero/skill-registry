/**
 * Skill Registry - Project Management Core
 */

import path from 'path';
import fs from 'fs-extra';
import { ProjectConfig } from '../types';
import {
  loadProjectConfig,
  saveProjectConfig,
  initProjectConfig,
  getProjectTargetDetails
} from '../lib/config';
import { loadGlobalConfig } from '../lib/config';
import { getSkillPath, skillExists } from '../lib/storage';
import { resolvePath } from '../lib/utils';

/**
 * Initialize project
 */
export async function initProject(projectDir?: string): Promise<void> {
  await initProjectConfig(projectDir);
}

/**
 * Add skill to project
 */
export async function addProjectSkill(skillName: string, projectDir?: string): Promise<void> {
  // Check if skill exists in registry
  if (!skillExists(skillName)) {
    throw new Error(
      `Skill '${skillName}' not found in registry.\n\n` +
      `To register a new skill:\n` +
      `  skill-registry skill add <source>`
    );
  }

  // Load project config
  const config = await loadProjectConfig(projectDir);

  // Check if already added
  if (config.skills.includes(skillName)) {
    throw new Error(`Skill '${skillName}' already in project.`);
  }

  // Add skill
  config.skills.push(skillName);

  // Save config
  await saveProjectConfig(config, projectDir);
}

/**
 * Remove skill from project
 */
export async function removeProjectSkill(skillName: string, projectDir?: string): Promise<void> {
  // Load project config
  const config = await loadProjectConfig(projectDir);

  // Check if skill exists
  const index = config.skills.indexOf(skillName);
  if (index === -1) {
    throw new Error(`Skill '${skillName}' not in project.`);
  }

  // Remove skill
  config.skills.splice(index, 1);

  // Save config
  await saveProjectConfig(config, projectDir);
}

/**
 * Add group to project
 */
export async function addProjectGroup(groupName: string, projectDir?: string): Promise<string[]> {
  // Load global config
  const globalConfig = await loadGlobalConfig();

  // Check if group exists
  if (!globalConfig.groups[groupName]) {
    throw new Error(`Group '${groupName}' not found.`);
  }

  // Get group skills
  const groupSkills = globalConfig.groups[groupName].skills;

  // Load project config
  const config = await loadProjectConfig(projectDir);

  // Add skills (avoid duplicates)
  const addedSkills: string[] = [];
  for (const skillName of groupSkills) {
    if (!config.skills.includes(skillName)) {
      config.skills.push(skillName);
      addedSkills.push(skillName);
    }
  }

  // Save config
  await saveProjectConfig(config, projectDir);

  return addedSkills;
}

/**
 * Add target to project
 */
export async function addProjectTarget(
  targetName: string,
  targetPath?: string,
  projectDir?: string
): Promise<void> {
  // Load global config
  const globalConfig = await loadGlobalConfig();

  // Check if target exists in global defaults
  let targetConfig = globalConfig.defaults.targets[targetName];

  if (!targetConfig) {
    // Not in global, require path
    if (!targetPath) {
      throw new Error(
        `Target '${targetName}' not found in global defaults.\n\n` +
        `Please specify a path:\n` +
        `  skill-registry project target add ${targetName} --path <path>`
      );
    }

    // Create new target config
    targetConfig = {
      path: targetPath
    };
  } else if (targetPath) {
    // Override path
    targetConfig = {
      ...targetConfig,
      path: targetPath
    };
  }

  // Load project config
  const config = await loadProjectConfig(projectDir);

  // Initialize targets if not exists
  if (!config.targets) {
    config.targets = {};
  }

  // Check if already exists
  if (config.targets[targetName]) {
    throw new Error(`Target '${targetName}' already in project.`);
  }

  // Add target
  config.targets[targetName] = targetConfig;

  // Save config
  await saveProjectConfig(config, projectDir);
}

/**
 * Pull skills to targets
 */
export async function pullProjectSkills(projectDir?: string): Promise<{
  pulled: string[];
  skipped: string[];
  detected: string[];
}> {
  // Load project config
  const config = await loadProjectConfig(projectDir);

  // Get project targets (explicit ∪ auto-detected)
  const { targets, detected } = await getProjectTargetDetails(projectDir);

  if (Object.keys(targets).length === 0) {
    throw new Error('No targets configured for this project.');
  }

  const result = {
    pulled: [] as string[],
    skipped: [] as string[],
    detected
  };

  // Pull each skill to each target
  for (const skillName of config.skills) {
    // Get skill path
    const skillPath = getSkillPath(skillName);

    if (!fs.existsSync(skillPath)) {
      console.warn(`Warning: Skill '${skillName}' not found in registry.`);
      continue;
    }

    // Pull to each target
    for (const [targetName, targetConfig] of Object.entries(targets)) {
      // Resolve target path
      const baseDir = projectDir || process.cwd();
      const targetDir = resolvePath(targetConfig.path, baseDir);

      // Create target directory
      await fs.ensureDir(targetDir);

      // Create link path
      const linkPath = path.join(targetDir, skillName);

      // Check if already exists (single-direction pull)
      if (fs.existsSync(linkPath)) {
        result.skipped.push(`${skillName} → ${targetName}`);
        continue;
      }

      // Create symlink
      await fs.ensureSymlink(skillPath, linkPath);
      result.pulled.push(`${skillName} → ${targetName}`);
    }
  }

  return result;
}

/**
 * Get project info
 */
export async function getProjectInfo(projectDir?: string): Promise<{
  config: ProjectConfig;
  targets: Record<string, { path: string; description?: string }>;
  detected: string[];
}> {
  const config = await loadProjectConfig(projectDir);
  const { targets, detected } = await getProjectTargetDetails(projectDir);

  return { config, targets, detected };
}