import { z } from 'zod';
/**
 * Defines the schema for the Logbooks configuration.
 *
 * This schema is the single source of truth for all configuration options.
 * It uses `zod` to provide compile-time type safety and runtime validation.
 * "Parse, don't validate."
 */
export declare const LogbookConfigSchema: z.ZodObject<{
    /**
     * The configuration schema version. Used for future-proofing and migrations.
     */
    version: z.ZodDefault<z.ZodLiteral<"1.0.0">>;
    /**
     * Settings related to the author of logbook entries.
     */
    author: z.ZodOptional<z.ZodObject<{
        defaultId: z.ZodOptional<z.ZodString>;
        defaultType: z.ZodOptional<z.ZodEnum<["user", "agent", "service"]>>;
        defaultName: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
        tool: z.ZodOptional<z.ZodString>;
        serviceType: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        model?: string | undefined;
        tool?: string | undefined;
        serviceType?: string | undefined;
        defaultId?: string | undefined;
        defaultType?: "user" | "agent" | "service" | undefined;
        defaultName?: string | undefined;
    }, {
        model?: string | undefined;
        tool?: string | undefined;
        serviceType?: string | undefined;
        defaultId?: string | undefined;
        defaultType?: "user" | "agent" | "service" | undefined;
        defaultName?: string | undefined;
    }>>;
    /**
     * Settings related to the database connection and backups.
     */
    database: z.ZodOptional<z.ZodObject<{
        path: z.ZodOptional<z.ZodString>;
        backup: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            interval: z.ZodDefault<z.ZodEnum<["hourly", "daily", "weekly"]>>;
            retention: z.ZodOptional<z.ZodNumber>;
            location: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            interval: "hourly" | "daily" | "weekly";
            location: string;
            retention?: number | undefined;
        }, {
            enabled?: boolean | undefined;
            interval?: "hourly" | "daily" | "weekly" | undefined;
            retention?: number | undefined;
            location?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        path?: string | undefined;
        backup?: {
            enabled: boolean;
            interval: "hourly" | "daily" | "weekly";
            location: string;
            retention?: number | undefined;
        } | undefined;
    }, {
        path?: string | undefined;
        backup?: {
            enabled?: boolean | undefined;
            interval?: "hourly" | "daily" | "weekly" | undefined;
            retention?: number | undefined;
            location?: string | undefined;
        } | undefined;
    }>>;
    /**
     * Settings that control the behavior of the CLI.
     */
    cli: z.ZodOptional<z.ZodObject<{
        defaultCommand: z.ZodDefault<z.ZodEnum<["list", "add"]>>;
        listLimit: z.ZodDefault<z.ZodNumber>;
        richOutput: z.ZodDefault<z.ZodBoolean>;
        timestampFormat: z.ZodDefault<z.ZodEnum<["iso", "relative", "local"]>>;
        editor: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        defaultCommand: "list" | "add";
        listLimit: number;
        richOutput: boolean;
        timestampFormat: "iso" | "relative" | "local";
        editor?: string | undefined;
    }, {
        defaultCommand?: "list" | "add" | undefined;
        listLimit?: number | undefined;
        richOutput?: boolean | undefined;
        timestampFormat?: "iso" | "relative" | "local" | undefined;
        editor?: string | undefined;
    }>>;
    /**
     * Default settings for new entries.
     */
    entries: z.ZodOptional<z.ZodObject<{
        defaultType: z.ZodDefault<z.ZodString>;
        metadata: z.ZodOptional<z.ZodObject<{
            includeGitBranch: z.ZodDefault<z.ZodBoolean>;
            includeHostname: z.ZodDefault<z.ZodBoolean>;
            includeWorkingDirectory: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            includeGitBranch: boolean;
            includeHostname: boolean;
            includeWorkingDirectory: boolean;
        }, {
            includeGitBranch?: boolean | undefined;
            includeHostname?: boolean | undefined;
            includeWorkingDirectory?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        defaultType: string;
        metadata?: {
            includeGitBranch: boolean;
            includeHostname: boolean;
            includeWorkingDirectory: boolean;
        } | undefined;
    }, {
        defaultType?: string | undefined;
        metadata?: {
            includeGitBranch?: boolean | undefined;
            includeHostname?: boolean | undefined;
            includeWorkingDirectory?: boolean | undefined;
        } | undefined;
    }>>;
    /**
     * Configuration for running scripts at different lifecycle events.
     */
    hooks: z.ZodOptional<z.ZodObject<{
        preAdd: z.ZodOptional<z.ZodString>;
        postAdd: z.ZodOptional<z.ZodString>;
        preCommit: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        preAdd?: string | undefined;
        postAdd?: string | undefined;
        preCommit?: string | undefined;
    }, {
        preAdd?: string | undefined;
        postAdd?: string | undefined;
        preCommit?: string | undefined;
    }>>;
    /**
     * Settings for automatic data exports.
     */
    export: z.ZodOptional<z.ZodObject<{
        auto: z.ZodOptional<z.ZodObject<{
            onCommit: z.ZodDefault<z.ZodBoolean>;
            format: z.ZodDefault<z.ZodEnum<["markdown", "json", "csv"]>>;
            location: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            onCommit: boolean;
            format: "json" | "markdown" | "csv";
            location?: string | undefined;
        }, {
            location?: string | undefined;
            onCommit?: boolean | undefined;
            format?: "json" | "markdown" | "csv" | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        auto?: {
            onCommit: boolean;
            format: "json" | "markdown" | "csv";
            location?: string | undefined;
        } | undefined;
    }, {
        auto?: {
            location?: string | undefined;
            onCommit?: boolean | undefined;
            format?: "json" | "markdown" | "csv" | undefined;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    version: "1.0.0";
    entries?: {
        defaultType: string;
        metadata?: {
            includeGitBranch: boolean;
            includeHostname: boolean;
            includeWorkingDirectory: boolean;
        } | undefined;
    } | undefined;
    author?: {
        model?: string | undefined;
        tool?: string | undefined;
        serviceType?: string | undefined;
        defaultId?: string | undefined;
        defaultType?: "user" | "agent" | "service" | undefined;
        defaultName?: string | undefined;
    } | undefined;
    database?: {
        path?: string | undefined;
        backup?: {
            enabled: boolean;
            interval: "hourly" | "daily" | "weekly";
            location: string;
            retention?: number | undefined;
        } | undefined;
    } | undefined;
    cli?: {
        defaultCommand: "list" | "add";
        listLimit: number;
        richOutput: boolean;
        timestampFormat: "iso" | "relative" | "local";
        editor?: string | undefined;
    } | undefined;
    hooks?: {
        preAdd?: string | undefined;
        postAdd?: string | undefined;
        preCommit?: string | undefined;
    } | undefined;
    export?: {
        auto?: {
            onCommit: boolean;
            format: "json" | "markdown" | "csv";
            location?: string | undefined;
        } | undefined;
    } | undefined;
}, {
    entries?: {
        defaultType?: string | undefined;
        metadata?: {
            includeGitBranch?: boolean | undefined;
            includeHostname?: boolean | undefined;
            includeWorkingDirectory?: boolean | undefined;
        } | undefined;
    } | undefined;
    version?: "1.0.0" | undefined;
    author?: {
        model?: string | undefined;
        tool?: string | undefined;
        serviceType?: string | undefined;
        defaultId?: string | undefined;
        defaultType?: "user" | "agent" | "service" | undefined;
        defaultName?: string | undefined;
    } | undefined;
    database?: {
        path?: string | undefined;
        backup?: {
            enabled?: boolean | undefined;
            interval?: "hourly" | "daily" | "weekly" | undefined;
            retention?: number | undefined;
            location?: string | undefined;
        } | undefined;
    } | undefined;
    cli?: {
        defaultCommand?: "list" | "add" | undefined;
        listLimit?: number | undefined;
        richOutput?: boolean | undefined;
        timestampFormat?: "iso" | "relative" | "local" | undefined;
        editor?: string | undefined;
    } | undefined;
    hooks?: {
        preAdd?: string | undefined;
        postAdd?: string | undefined;
        preCommit?: string | undefined;
    } | undefined;
    export?: {
        auto?: {
            location?: string | undefined;
            onCommit?: boolean | undefined;
            format?: "json" | "markdown" | "csv" | undefined;
        } | undefined;
    } | undefined;
}>;
/**
 * The inferred TypeScript type from the LogbookConfigSchema.
 * This provides type safety for all configuration objects used in the application.
 */
export type LogbookConfig = z.infer<typeof LogbookConfigSchema>;
/**
 * A record containing the loaded configuration and the filepath it was loaded from.
 */
export type LoadedConfig = {
    config: LogbookConfig;
    filepath: string;
};
/**
 * Loads, parses, and validates the Logbooks configuration.
 *
 * This function uses `cosmiconfig` to search for configuration files
 * in the standard places (up the directory tree, in package.json, etc.).
 * It then validates the found configuration against the `LogbookConfigSchema`.
 *
 * @param cwd The current working directory to start searching from.
 * @returns A promise that resolves to the loaded configuration and its filepath, or null if not found.
 */
export declare function loadConfig(cwd?: string): Promise<LoadedConfig | null>;
