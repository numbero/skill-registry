/**
 * Skill Registry - Group Management Core
 */

import { GroupConfig } from '../types';
import { loadGlobalConfig, saveGlobalConfig } from '../lib/config';
import { skillExists } from '../lib/storage';

/**
 * Create group
 */
export async function createGroup(name: string, description?: string): Promise<void> {
  // Load global config
  const config = await loadGlobalConfig();

  // Check if group exists
  if (config.groups[name]) {
    throw new Error(`Group '${name}' already exists.`);
  }

  // Create group
  config.groups[name] = {
    description: description,
    skills: []
  };

  // Save config
  await saveGlobalConfig(config);
}

/**
 * Add skill to group
 */
export async function addSkillToGroup(
  groupName: string,
  skillName: string
): Promise<void> {
  // Load global config
  const config = await loadGlobalConfig();

  // Check if group exists
  if (!config.groups[groupName]) {
    throw new Error(`Group '${groupName}' not found.`);
  }

  // Check if skill exists
  if (!skillExists(skillName)) {
    throw new Error(`Skill '${skillName}' not found in registry.`);
  }

  // Check if skill already in group
  if (config.groups[groupName].skills.includes(skillName)) {
    throw new Error(`Skill '${skillName}' already in group '${groupName}'.`);
  }

  // Add skill
  config.groups[groupName].skills.push(skillName);

  // Save config
  await saveGlobalConfig(config);
}

/**
 * Remove skill from group
 */
export async function removeSkillFromGroup(
  groupName: string,
  skillName: string
): Promise<void> {
  // Load global config
  const config = await loadGlobalConfig();

  // Check if group exists
  if (!config.groups[groupName]) {
    throw new Error(`Group '${groupName}' not found.`);
  }

  // Check if skill in group
  const index = config.groups[groupName].skills.indexOf(skillName);
  if (index === -1) {
    throw new Error(`Skill '${skillName}' not in group '${groupName}'.`);
  }

  // Remove skill
  config.groups[groupName].skills.splice(index, 1);

  // Save config
  await saveGlobalConfig(config);
}

/**
 * Delete group
 */
export async function deleteGroup(name: string): Promise<void> {
  // Load global config
  const config = await loadGlobalConfig();

  // Check if group exists
  if (!config.groups[name]) {
    throw new Error(`Group '${name}' not found.`);
  }

  // Delete group
  delete config.groups[name];

  // Save config
  await saveGlobalConfig(config);
}

/**
 * List groups
 */
export async function listGroups(): Promise<Record<string, GroupConfig>> {
  // Load global config
  const config = await loadGlobalConfig();

  return config.groups;
}

/**
 * Get group by name
 */
export async function getGroup(name: string): Promise<GroupConfig | null> {
  // Load global config
  const config = await loadGlobalConfig();

  return config.groups[name] || null;
}