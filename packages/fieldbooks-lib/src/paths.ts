import { existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import path, { join, dirname, resolve } from 'path';

import { findUp } from 'find-up';
import fs from 'fs-extra';
import { xdgConfig } from 'xdg-basedir';

import { type LoadedConfig } from './config.js';

/**
 * Configuration for fieldbook path resolution
 */
export interface FieldbookPathOptions {
  /** Use global fieldbook instead of project-local */
  global?: boolean;
  /** Custom path to fieldbook directory */
  path?: string;
}

/**
 * Gets the global fieldbook directory path
 * Follows XDG Base Directory specification
 */
export function getGlobalFieldbookDir(): string {
  const configHome = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
  return join(configHome, 'fieldbooks');
}

/**
 * Ensures a directory exists, creating it if necessary
 */
export function ensureDirectory(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Finds the nearest .fieldbook directory by searching up the directory tree
 * Stops at git repository root or filesystem root
 */
export async function findFieldbookDir(startDir: string = process.cwd()): Promise<string | null> {
  // First check if we're in a git repo and find its root
  const gitRoot = await findUp('.git', {
    cwd: startDir,
    type: 'directory',
  });

  const stopAt = gitRoot ? dirname(gitRoot) : undefined;

  // Look for .fieldbook directory
  const fieldbook = await findUp('.fieldbook', {
    cwd: startDir,
    type: 'directory',
    stopAt,
  });

  return fieldbook || null;
}

/**
 * Gets the fieldbook directory path based on options
 *
 * Resolution order:
 * 1. If options.path is provided, use it directly
 * 2. If options.global is true, use global config directory
 * 3. If FIELDBOOKS_PATH env var is set, use it
 * 4. Search for .fieldbook in parent directories
 * 5. Default to .fieldbook in current directory
 */
export async function getFieldbookDir(options?: FieldbookPathOptions): Promise<string> {
  // 1. Custom path takes precedence
  if (options?.path) {
    return resolve(options.path);
  }

  // 2. Global flag
  if (options?.global) {
    return getGlobalFieldbookDir();
  }

  // 3. Environment variable for directory
  if (process.env.FIELDBOOKS_PATH) {
    return resolve(process.env.FIELDBOOKS_PATH);
  }

  // 4. Environment variable for database (backwards compatibility and testing)
  if (process.env.FIELDBOOKS_DB) {
    // If it's a sqlite file, get the directory
    const dbPath = process.env.FIELDBOOKS_DB;
    if (dbPath.endsWith('.sqlite')) {
      return dirname(resolve(dbPath));
    }
    return resolve(dbPath);
  }

  // 5. Search parent directories
  const foundDir = await findFieldbookDir();
  if (foundDir) {
    return foundDir;
  }

  // 6. Default to current directory
  return join(process.cwd(), '.fieldbook');
}

/**
 * Gets the fieldbook database path
 */
export async function getFieldbookDbPath(options?: FieldbookPathOptions): Promise<string> {
  // Check if FIELDBOOKS_DB is set to a specific file
  if (process.env.FIELDBOOKS_DB?.endsWith('.sqlite')) {
    const dbPath = resolve(process.env.FIELDBOOKS_DB);
    ensureDirectory(dirname(dbPath));
    return dbPath;
  }

  const dir = await getFieldbookDir(options);
  ensureDirectory(dir);
  return join(dir, 'fieldbook.sqlite');
}

/**
 * Gets the fieldbook config path
 */
export async function getFieldbookConfigPath(options?: FieldbookPathOptions): Promise<string> {
  const dir = await getFieldbookDir(options);
  return join(dir, 'config.json');
}

/**
 * Gets the local fieldbook config path (not committed to git)
 */
export async function getFieldbookLocalConfigPath(options?: FieldbookPathOptions): Promise<string> {
  const dir = await getFieldbookDir(options);
  return join(dir, 'config.local.json');
}

/**
 * Creates initial .fieldbook directory structure with .gitignore
 */
export async function initFieldbookDir(options?: FieldbookPathOptions): Promise<string> {
  const dir = await getFieldbookDir(options);
  ensureDirectory(dir);

  // Create subdirectories
  ensureDirectory(join(dir, 'backups'));
  ensureDirectory(join(dir, 'exports'));

  // Create .gitignore if it doesn't exist
  const gitignorePath = join(dir, '.gitignore');
  if (!existsSync(gitignorePath)) {
    const { writeFileSync } = await import('fs');
    writeFileSync(
      gitignorePath,
      `# Database files
fieldbook.sqlite
fieldbook.sqlite-shm
fieldbook.sqlite-wal

# Local configuration
config.local.json

# Backups
backups/*.sqlite

# But keep the directory structure
!backups/.gitkeep
!exports/.gitkeep
`,
    );
  }

  // Create .gitkeep files
  const { writeFileSync } = await import('fs');
  const backupsGitkeep = join(dir, 'backups', '.gitkeep');
  const exportsGitkeep = join(dir, 'exports', '.gitkeep');

  if (!existsSync(backupsGitkeep)) {
    writeFileSync(backupsGitkeep, '');
  }
  if (!existsSync(exportsGitkeep)) {
    writeFileSync(exportsGitkeep, '');
  }

  return dir;
}

/**
 * Checks if we should migrate from old fieldbooks.sqlite location
 */
export async function checkForLegacyDb(): Promise<string | null> {
  const legacyPath = './fieldbooks.sqlite';
  if (existsSync(legacyPath)) {
    return resolve(legacyPath);
  }

  const oldPath = './fieldbook.sqlite';
  if (existsSync(oldPath)) {
    return resolve(oldPath);
  }

  return null;
}

/**
 * The structured representation of all relevant Fieldbooks paths.
 */
export type FieldbookPaths = {
  /** The root directory for the fieldbook (`.fieldbook/` or `~/.config/fieldbooks/`). */
  root: string;
  /** The absolute path to the SQLite database file. */
  database: string;
  /** The absolute path to the project-specific config file. */
  projectConfig: string | null;
  /** The absolute path to the global config file. */
  globalConfig: string | null;
};

const GLOBAL_DIR_NAME = 'fieldbooks';
const PROJECT_DIR_NAME = '.fieldbook';
const DB_FILE_NAME = 'fieldbook.sqlite';

/**
 * Resolves the appropriate paths for the fieldbook based on configuration and environment.
 *
 * @param loadedConfig The result from `loadConfig`.
 * @param options An object containing flags like `--global`.
 * @returns An object containing all the necessary fieldbook paths.
 */
export function resolvePaths(
  loadedConfig: LoadedConfig | null,
  options: { global?: boolean } = {},
): FieldbookPaths {
  const home = process.env.HOME ?? process.cwd();
  const globalConfigHome = xdgConfig ?? path.join(home, '.config');
  const globalConfigDir = path.join(globalConfigHome, GLOBAL_DIR_NAME);

  if (options.global) {
    return {
      root: globalConfigDir,
      database: path.join(globalConfigDir, DB_FILE_NAME),
      projectConfig: null,
      globalConfig: path.join(globalConfigDir, 'config.json'),
    };
  }

  if (loadedConfig) {
    const root = path.dirname(loadedConfig.filepath);
    return {
      root,
      database: path.join(root, DB_FILE_NAME),
      projectConfig: loadedConfig.filepath,
      globalConfig: path.join(globalConfigDir, 'config.json'),
    };
  }

  // If no config is found, default to a local .fieldbook directory.
  const localRoot = path.join(process.cwd(), PROJECT_DIR_NAME);
  return {
    root: localRoot,
    database: path.join(localRoot, DB_FILE_NAME),
    projectConfig: path.join(localRoot, 'config.json'),
    globalConfig: path.join(globalConfigDir, 'config.json'),
  };
}

/**
 * Ensures that the directory for the given database path exists.
 *
 * @param dbPath The full path to the database file.
 */
export async function ensureDatabaseDir(dbPath: string): Promise<void> {
  const dir = path.dirname(dbPath);
  await fs.ensureDir(dir);
}
