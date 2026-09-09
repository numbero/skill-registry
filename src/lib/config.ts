/**
 * Skill Registry - Configuration Management
 */

import path from 'path';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import os from 'os';
import { GlobalConfig, ProjectConfig, TargetConfig } from '../types';
import { clearSkillsPathCache } from './storage';
import { detectTargets } from './detect';

export function getGlobalConfigPath(): string {
  return path.join(os.homedir(), '.skill-registry', 'global.yaml');
}

/**
 * Get default global config
 */
export function getDefaultGlobalConfig(): GlobalConfig {
  return {
    defaults: {
      targets: {
        'claude-code': {
          path: '.claude/skills',
          description: 'Claude Code CLI'
        },
        'claude-code-home': {
          path: '~/.claude/skills',
          description: 'Claude Code (home)'
        },
        cursor: {
          path: '.cursor/rules',
          description: 'Cursor IDE'
        },
        codex: {
          path: '.codex/skills',
          description: 'OpenAI Codex CLI'
        },
        'kiro-steering': {
          path: '.kiro/steering',
          description: 'Kiro Steering'
        },
        windsurf: {
          path: '.windsurf/rules',
          description: 'Windsurf IDE'
        },
        'agent-generic': {
          path: '.agents/skills',
          description: 'Generic Agent (.agents standard)'
        },
        qoder: {
          path: '.qoder/skills',
          description: 'Qoder AI'
        }
      }
    },
    groups: {},
    settings: {
      default_target: 'claude-code'
    }
  };
}

/**
 * Load global config
 */
export async function loadGlobalConfig(): Promise<GlobalConfig> {
  const configPath = getGlobalConfigPath();

  // Create default config if not exists
  if (!fs.existsSync(configPath)) {
    const defaultConfig = getDefaultGlobalConfig();
    await saveGlobalConfig(defaultConfig);
    return defaultConfig;
  }

  const content = await fs.readFile(configPath, 'utf-8');
  const config = yaml.load(content) as GlobalConfig;

  return config;
}

/**
 * Save global config
 */
export async function saveGlobalConfig(config: GlobalConfig): Promise<void> {
  const configPath = getGlobalConfigPath();

  // Ensure directory exists
  await fs.ensureDir(path.dirname(configPath));

  // Write config
  const content = yaml.dump(config, {
    indent: 2,
    lineWidth: -1
  });

  await fs.writeFile(configPath, content);

  // Clear skills path cache in case registry.path changed
  clearSkillsPathCache();
}

/**
 * Get project config path
 */
export function getProjectConfigPath(projectDir?: string): string {
  const baseDir = projectDir || process.cwd();
  return path.join(baseDir, '.skill-registry', 'config.yaml');
}

/**
 * Check if directory is a project
 */
export function isProjectDir(dir: string): boolean {
  const configPath = path.join(dir, '.skill-registry', 'config.yaml');
  return fs.existsSync(configPath);
}

/**
 * Load project config
 */
export async function loadProjectConfig(projectDir?: string): Promise<ProjectConfig> {
  const configPath = getProjectConfigPath(projectDir);

  if (!fs.existsSync(configPath)) {
    throw new Error('Not a skill-registry project. Run "skill-registry project init" first.');
  }

  const content = await fs.readFile(configPath, 'utf-8');
  const config = yaml.load(content) as ProjectConfig;

  return config;
}

/**
 * Save project config
 */
export async function saveProjectConfig(config: ProjectConfig, projectDir?: string): Promise<void> {
  const configPath = getProjectConfigPath(projectDir);

  // Ensure directory exists
  await fs.ensureDir(path.dirname(configPath));

  // Write config
  const content = yaml.dump(config, {
    indent: 2,
    lineWidth: -1
  });

  await fs.writeFile(configPath, content);
}

/**
 * Initialize project config
 */
export async function initProjectConfig(projectDir?: string): Promise<void> {
  const configPath = getProjectConfigPath(projectDir);

  // Check if already initialized
  if (fs.existsSync(configPath)) {
    throw new Error('Project already initialized.');
  }

  // Create default config
  const config: ProjectConfig = {
    skills: []
  };

  await saveProjectConfig(config, projectDir);
}

/**
 * Get project targets with detection details.
 *
 * Resolution order (union semantics):
 * 1. Explicit targets from project config.yaml (win on name conflicts)
 * 2. Auto-detected global preset targets (marker dirs present in project root)
 * 3. Fallback to global default_target when the union is empty
 */
export async function getProjectTargetDetails(projectDir?: string): Promise<{
  targets: Record<string, TargetConfig>;
  detected: string[];
}> {
  // Load global config
  const globalConfig = await loadGlobalConfig();

  // Check if project dir exists
  const baseDir = projectDir || process.cwd();
  if (!isProjectDir(baseDir)) {
    // Not a project, return empty
    return { targets: {}, detected: [] };
  }

  // Load project config
  const projectConfig = await loadProjectConfig(projectDir);
  const explicit = projectConfig.targets || {};

  // Auto-detect matching global preset targets
  const detectedConfigs = detectTargets(baseDir, globalConfig.defaults.targets);

  // Union: explicit config wins on conflicts
  const targets: Record<string, TargetConfig> = { ...detectedConfigs, ...explicit };
  const detected = Object.keys(detectedConfigs).filter(name => !explicit[name]);

  if (Object.keys(targets).length === 0) {
    // Nothing explicit and nothing detected: fall back to global default
    const defaultTargetName = globalConfig.settings.default_target;
    const defaultTarget = globalConfig.defaults.targets[defaultTargetName];

    if (defaultTarget) {
      return { targets: { [defaultTargetName]: defaultTarget }, detected: [] };
    }

    return { targets: {}, detected: [] };
  }

  return { targets, detected };
}

/**
 * Get project targets (explicit config ∪ auto-detected presets)
 */
export async function getProjectTargets(projectDir?: string): Promise<Record<string, TargetConfig>> {
  const { targets } = await getProjectTargetDetails(projectDir);
  return targets;
}