import { type LoadedConfig } from './config.js';
/**
 * Configuration for logbook path resolution
 */
export interface LogbookPathOptions {
    /** Use global logbook instead of project-local */
    global?: boolean;
    /** Custom path to logbook directory */
    path?: string;
}
/**
 * Gets the global logbook directory path
 * Follows XDG Base Directory specification
 */
export declare function getGlobalLogbookDir(): string;
/**
 * Ensures a directory exists, creating it if necessary
 */
export declare function ensureDirectory(dirPath: string): void;
/**
 * Finds the nearest .logbook directory by searching up the directory tree
 * Stops at git repository root or filesystem root
 */
export declare function findLogbookDir(startDir?: string): Promise<string | null>;
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
export declare function getLogbookDir(options?: LogbookPathOptions): Promise<string>;
/**
 * Gets the logbook database path
 */
export declare function getLogbookDbPath(options?: LogbookPathOptions): Promise<string>;
/**
 * Gets the logbook config path
 */
export declare function getLogbookConfigPath(options?: LogbookPathOptions): Promise<string>;
/**
 * Gets the local logbook config path (not committed to git)
 */
export declare function getLogbookLocalConfigPath(options?: LogbookPathOptions): Promise<string>;
/**
 * Creates initial .logbook directory structure with .gitignore
 */
export declare function initLogbookDir(options?: LogbookPathOptions): Promise<string>;
/**
 * Checks if we should migrate from old logbooks.sqlite location
 */
export declare function checkForLegacyDb(): Promise<string | null>;
/**
 * The structured representation of all relevant Logbooks paths.
 */
export type LogbookPaths = {
    /** The root directory for the logbook (`.logbook/` or `~/.config/logbooks/`). */
    root: string;
    /** The absolute path to the SQLite database file. */
    database: string;
    /** The absolute path to the project-specific config file. */
    projectConfig: string | null;
    /** The absolute path to the global config file. */
    globalConfig: string | null;
};
/**
 * Resolves the appropriate paths for the logbook based on configuration and environment.
 *
 * @param loadedConfig The result from `loadConfig`.
 * @param options An object containing flags like `--global`.
 * @returns An object containing all the necessary logbook paths.
 */
export declare function resolvePaths(loadedConfig: LoadedConfig | null, options?: {
    global?: boolean;
}): LogbookPaths;
/**
 * Ensures that the directory for the given database path exists.
 *
 * @param dbPath The full path to the database file.
 */
export declare function ensureDatabaseDir(dbPath: string): Promise<void>;
