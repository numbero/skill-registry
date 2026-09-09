/**
 * Skill Registry - Target Auto-Detection
 *
 * Detects which global preset targets apply to a project directory.
 * The detection marker is derived from the target path itself: the first
 * path segment (e.g. '.cursor/rules' → '.cursor'). A target matches when
 * that directory exists in the project root.
 *
 * Home ('~/...') and absolute paths are never auto-detected — they are
 * not project-local and must be explicit opt-ins.
 */

import path from 'path';
import fs from 'fs-extra';
import { TargetConfig } from '../types';

/**
 * Extract the detection marker (first path segment) from a target path.
 * Returns null for paths that are not project-relative ('~/' or absolute).
 */
export function getDetectMarker(targetPath: string): string | null {
  if (targetPath.startsWith('~/') || path.isAbsolute(targetPath)) {
    return null;
  }

  const firstSegment = targetPath.split(/[\\/]/)[0];

  return firstSegment || null;
}

/**
 * Detect which candidate targets match the given project directory.
 */
export function detectTargets(
  projectDir: string,
  candidates: Record<string, TargetConfig>
): Record<string, TargetConfig> {
  const matched: Record<string, TargetConfig> = {};

  for (const [name, config] of Object.entries(candidates)) {
    const marker = getDetectMarker(config.path);

    if (marker && fs.existsSync(path.join(projectDir, marker))) {
      matched[name] = config;
    }
  }

  return matched;
}
