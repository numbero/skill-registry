/**
 * Skill Registry - Type Definitions
 */

export interface SkillInfo {
  name: string;
  description: string;
  cached_path: string;

  is_git: boolean;
  source?: string;
  version?: string;
  branch?: string;

  installed_at: Date;
  updated_at: Date;

  metadata: Record<string, any>;
}

export interface GlobalConfig {
  defaults: {
    targets: Record<string, TargetConfig>;
  };
  groups: Record<string, GroupConfig>;
  settings: {
    default_target: string;
  };
}

export interface ProjectConfig {
  targets?: Record<string, TargetConfig>;
  skills: string[];
}

export interface TargetConfig {
  path: string;
  description?: string;
}

export interface GroupConfig {
  description?: string;
  skills: string[];
}

export interface SkillAddOptions {
  name?: string;
  description?: string;
  force?: boolean;
}

export interface GitUrlInfo {
  repoUrl: string;
  skillPath?: string;
}

export interface Frontmatter {
  name?: string;
  description?: string;
  [key: string]: any;
}

export interface ParsedFrontmatter {
  frontmatter: Frontmatter;
  content: string;
}