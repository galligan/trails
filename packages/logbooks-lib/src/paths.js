import { existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import path, { join, dirname, resolve } from 'path';
import { findUp } from 'find-up';
import fs from 'fs-extra';
import { xdgConfig } from 'xdg-basedir';
/**
 * Gets the global logbook directory path
 * Follows XDG Base Directory specification
 */
export function getGlobalLogbookDir() {
    const configHome = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
    return join(configHome, 'logbooks');
}
/**
 * Ensures a directory exists, creating it if necessary
 */
export function ensureDirectory(dirPath) {
    if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
    }
}
/**
 * Finds the nearest .logbook directory by searching up the directory tree
 * Stops at git repository root or filesystem root
 */
export async function findLogbookDir(startDir = process.cwd()) {
    // First check if we're in a git repo and find its root
    const gitRoot = await findUp('.git', {
        cwd: startDir,
        type: 'directory',
    });
    const stopAt = gitRoot ? dirname(gitRoot) : undefined;
    // Look for .logbook directory
    const logbook = await findUp('.logbook', {
        cwd: startDir,
        type: 'directory',
        stopAt,
    });
    return logbook || null;
}
/**
 * Gets the logbook directory path based on options
 *
 * Resolution order:
 * 1. If options.path is provided, use it directly
 * 2. If options.global is true, use global config directory
 * 3. If LOGBOOKS_PATH env var is set, use it
 * 4. Search for .logbook in parent directories
 * 5. Default to .logbook in current directory
 */
export async function getLogbookDir(options) {
    // 1. Custom path takes precedence
    if (options?.path) {
        return resolve(options.path);
    }
    // 2. Global flag
    if (options?.global) {
        return getGlobalLogbookDir();
    }
    // 3. Environment variable for directory
    if (process.env.LOGBOOKS_PATH) {
        return resolve(process.env.LOGBOOKS_PATH);
    }
    // 4. Environment variable for database (backwards compatibility and testing)
    if (process.env.LOGBOOKS_DB) {
        // If it's a sqlite file, get the directory
        const dbPath = process.env.LOGBOOKS_DB;
        if (dbPath.endsWith('.sqlite')) {
            return dirname(resolve(dbPath));
        }
        return resolve(dbPath);
    }
    // 5. Search parent directories
    const foundDir = await findLogbookDir();
    if (foundDir) {
        return foundDir;
    }
    // 6. Default to current directory
    return join(process.cwd(), '.logbook');
}
/**
 * Gets the logbook database path
 */
export async function getLogbookDbPath(options) {
    // Check if LOGBOOKS_DB is set to a specific file
    if (process.env.LOGBOOKS_DB?.endsWith('.sqlite')) {
        const dbPath = resolve(process.env.LOGBOOKS_DB);
        ensureDirectory(dirname(dbPath));
        return dbPath;
    }
    const dir = await getLogbookDir(options);
    ensureDirectory(dir);
    return join(dir, 'logbook.sqlite');
}
/**
 * Gets the logbook config path
 */
export async function getLogbookConfigPath(options) {
    const dir = await getLogbookDir(options);
    return join(dir, 'config.json');
}
/**
 * Gets the local logbook config path (not committed to git)
 */
export async function getLogbookLocalConfigPath(options) {
    const dir = await getLogbookDir(options);
    return join(dir, 'config.local.json');
}
/**
 * Creates initial .logbook directory structure with .gitignore
 */
export async function initLogbookDir(options) {
    const dir = await getLogbookDir(options);
    ensureDirectory(dir);
    // Create subdirectories
    ensureDirectory(join(dir, 'backups'));
    ensureDirectory(join(dir, 'exports'));
    // Create .gitignore if it doesn't exist
    const gitignorePath = join(dir, '.gitignore');
    if (!existsSync(gitignorePath)) {
        const { writeFileSync } = await import('fs');
        writeFileSync(gitignorePath, `# Database files
logbook.sqlite
logbook.sqlite-shm
logbook.sqlite-wal

# Local configuration
config.local.json

# Backups
backups/*.sqlite

# But keep the directory structure
!backups/.gitkeep
!exports/.gitkeep
`);
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
 * Checks if we should migrate from old logbooks.sqlite location
 */
export async function checkForLegacyDb() {
    const legacyPath = './logbooks.sqlite';
    if (existsSync(legacyPath)) {
        return resolve(legacyPath);
    }
    const oldPath = './logbook.sqlite';
    if (existsSync(oldPath)) {
        return resolve(oldPath);
    }
    return null;
}
const GLOBAL_DIR_NAME = 'logbooks';
const PROJECT_DIR_NAME = '.logbook';
const DB_FILE_NAME = 'logbook.sqlite';
/**
 * Resolves the appropriate paths for the logbook based on configuration and environment.
 *
 * @param loadedConfig The result from `loadConfig`.
 * @param options An object containing flags like `--global`.
 * @returns An object containing all the necessary logbook paths.
 */
export function resolvePaths(loadedConfig, options = {}) {
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
    // If no config is found, default to a local .logbook directory.
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
export async function ensureDatabaseDir(dbPath) {
    const dir = path.dirname(dbPath);
    await fs.ensureDir(dir);
}
