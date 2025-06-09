import { cosmiconfig } from 'cosmiconfig';
import { z } from 'zod';

/**
 * Defines the schema for the Fieldbooks configuration.
 *
 * This schema is the single source of truth for all configuration options.
 * It uses `zod` to provide compile-time type safety and runtime validation.
 * "Parse, don't validate."
 */
export const FieldbookConfigSchema = z.object({
  /**
   * The configuration schema version. Used for future-proofing and migrations.
   */
  version: z.literal('1.0.0').default('1.0.0'),

  /**
   * Settings related to the author of fieldbook entries.
   */
  author: z
    .object({
      defaultId: z.string().optional(),
      defaultType: z.enum(['user', 'agent', 'service']).optional(),
      defaultName: z.string().optional(),
      model: z.string().optional(),
      tool: z.string().optional(),
      serviceType: z.string().optional(),
    })
    .optional(),

  /**
   * Settings related to the database connection and backups.
   */
  database: z
    .object({
      path: z.string().optional(),
      backup: z
        .object({
          enabled: z.boolean().default(false),
          interval: z.enum(['hourly', 'daily', 'weekly']).default('daily'),
          retention: z.number().int().positive().optional(),
          location: z.string().default('./backups/'),
        })
        .optional(),
    })
    .optional(),

  /**
   * Settings that control the behavior of the CLI.
   */
  cli: z
    .object({
      defaultCommand: z.enum(['list', 'add']).default('list'),
      listLimit: z.number().int().positive().default(20),
      richOutput: z.boolean().default(true),
      timestampFormat: z.enum(['iso', 'relative', 'local']).default('relative'),
      editor: z.string().optional(),
    })
    .optional(),

  /**
   * Default settings for new entries.
   */
  entries: z
    .object({
      defaultType: z.string().default('update'),
      metadata: z
        .object({
          includeGitBranch: z.boolean().default(false),
          includeHostname: z.boolean().default(false),
          includeWorkingDirectory: z.boolean().default(false),
        })
        .optional(),
    })
    .optional(),

  /**
   * Configuration for running scripts at different lifecycle events.
   */
  hooks: z
    .object({
      preAdd: z.string().optional(),
      postAdd: z.string().optional(),
      preCommit: z.string().optional(),
    })
    .optional(),

  /**
   * Settings for automatic data exports.
   */
  export: z
    .object({
      auto: z
        .object({
          onCommit: z.boolean().default(false),
          format: z.enum(['markdown', 'json', 'csv']).default('markdown'),
          location: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

/**
 * The inferred TypeScript type from the FieldbookConfigSchema.
 * This provides type safety for all configuration objects used in the application.
 */
export type FieldbookConfig = z.infer<typeof FieldbookConfigSchema>;

// The module name to search for in config files.
const MODULE_NAME = 'fieldbooks';

/**
 * A record containing the loaded configuration and the filepath it was loaded from.
 */
export type LoadedConfig = {
  config: FieldbookConfig;
  filepath: string;
};

/**
 * Loads, parses, and validates the Fieldbooks configuration.
 *
 * This function uses `cosmiconfig` to search for configuration files
 * in the standard places (up the directory tree, in package.json, etc.).
 * It then validates the found configuration against the `FieldbookConfigSchema`.
 *
 * @param cwd The current working directory to start searching from.
 * @returns A promise that resolves to the loaded configuration and its filepath, or null if not found.
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<LoadedConfig | null> {
  const explorer = cosmiconfig(MODULE_NAME, {
    searchPlaces: [
      'package.json',
      `.${MODULE_NAME}rc`,
      `.${MODULE_NAME}rc.json`,
      `.${MODULE_NAME}rc.yaml`,
      `.${MODULE_NAME}rc.yml`,
      `.${MODULE_NAME}rc.js`,
      `.${MODULE_NAME}rc.ts`,
      `.${MODULE_NAME}rc.cjs`,
      'config.json',
      'config.local.json',
    ],
  });

  const projectConfigResult = await explorer.search(cwd);

  // For now, we only support project-based config. Global will be added.
  if (!projectConfigResult) {
    return null;
  }

  try {
    const parsedConfig = FieldbookConfigSchema.parse(projectConfigResult.config);
    return {
      config: parsedConfig,
      filepath: projectConfigResult.filepath,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Provide a more helpful error message for validation failures.
      const issues = error.errors.map((e) => `  - ${e.path.join('.')}: ${e.message}`);
      throw new Error(
        `Configuration file validation failed at ${
          projectConfigResult.filepath
        }:\n${issues.join('\n')}`,
      );
    }
    throw error;
  }
}
