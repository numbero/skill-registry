/**
 * Skill Registry - Configuration Management
 */

import path from 'path';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import os from 'os';
import { GlobalConfig, ProjectConfig, TargetConfig } from '../types';

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
 * Get project targets (merge global defaults with project config)
 */
export async function getProjectTargets(projectDir?: string): Promise<Record<string, TargetConfig>> {
  // Load global config
  const globalConfig = await loadGlobalConfig();

  // Check if project dir exists
  const baseDir = projectDir || process.cwd();
  if (!isProjectDir(baseDir)) {
    // Not a project, return empty
    return {};
  }

  // Load project config
  const projectConfig = await loadProjectConfig(projectDir);

  // If project has targets, use them
  if (projectConfig.targets && Object.keys(projectConfig.targets).length > 0) {
    return projectConfig.targets;
  }

  // Otherwise, use global default
  const defaultTargetName = globalConfig.settings.default_target;
  const defaultTarget = globalConfig.defaults.targets[defaultTargetName];

  if (!defaultTarget) {
    return {};
  }

  return {
    [defaultTargetName]: defaultTarget
  };
}