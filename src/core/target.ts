/**
 * Skill Registry - Target Management Core
 */

import { TargetConfig } from '../types';
import { loadGlobalConfig, saveGlobalConfig } from '../lib/config';

/**
 * Add global target
 */
export async function addGlobalTarget(
  name: string,
  targetPath: string,
  description?: string
): Promise<void> {
  // Load global config
  const config = await loadGlobalConfig();

  // Check if target exists
  if (config.defaults.targets[name]) {
    throw new Error(`Target '${name}' already exists.`);
  }

  // Add target
  config.defaults.targets[name] = {
    path: targetPath,
    description: description
  };

  // Save config
  await saveGlobalConfig(config);
}

/**
 * Remove global target
 */
export async function removeGlobalTarget(name: string): Promise<void> {
  // Load global config
  const config = await loadGlobalConfig();

  // Check if target exists
  if (!config.defaults.targets[name]) {
    throw new Error(`Target '${name}' not found.`);
  }

  // Check if is default target
  if (config.settings.default_target === name) {
    throw new Error(
      `Cannot remove default target '${name}'.\n\n` +
      `Change default target first:\n` +
      `  skill-registry global set settings.default_target <target>`
    );
  }

  // Remove target
  delete config.defaults.targets[name];

  // Save config
  await saveGlobalConfig(config);
}

/**
 * List global targets
 */
export async function listGlobalTargets(): Promise<Record<string, TargetConfig>> {
  // Load global config
  const config = await loadGlobalConfig();

  return config.defaults.targets;
}

/**
 * Get global target by name
 */
export async function getGlobalTarget(name: string): Promise<TargetConfig | null> {
  // Load global config
  const config = await loadGlobalConfig();

  return config.defaults.targets[name] || null;
}

/**
 * Set default target
 */
export async function setDefaultTarget(name: string): Promise<void> {
  // Load global config
  const config = await loadGlobalConfig();

  // Check if target exists
  if (!config.defaults.targets[name]) {
    throw new Error(`Target '${name}' not found.`);
  }

  // Set default target
  config.settings.default_target = name;

  // Save config
  await saveGlobalConfig(config);
}

/**
 * Get default target
 */
export async function getDefaultTarget(): Promise<string> {
  // Load global config
  const config = await loadGlobalConfig();

  return config.settings.default_target;
}