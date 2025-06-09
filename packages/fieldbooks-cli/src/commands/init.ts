import { promises as fs } from 'fs';
import path from 'path';

import { FieldbookConfigSchema, type FieldbookConfig } from 'fieldbooks-lib/config';

const PROJECT_DIR_NAME = '.fieldbook';
const CONFIG_FILE_NAME = 'config.json';
const GITIGNORE_FILE_NAME = '.gitignore';

const DEFAULT_CONFIG: Partial<FieldbookConfig> = {
  version: '1.0.0',
  cli: {
    richOutput: true,
  },
  database: {
    backup: {
      enabled: true,
      interval: 'daily',
      retention: 7,
    },
  },
};

const GITIGNORE_CONTENT = `
# Fieldbooks files
fieldbook.sqlite
fieldbook.sqlite-shm
fieldbook.sqlite-wal

# Local configuration overrides
config.local.json

# Backups
backups/
`;

export async function runInitCommand(): Promise<void> {
  const rootDir = path.join(process.cwd(), PROJECT_DIR_NAME);
  const configPath = path.join(rootDir, CONFIG_FILE_NAME);
  const gitignorePath = path.join(rootDir, GITIGNORE_FILE_NAME);

  console.log(`Initializing Fieldbook in ${rootDir}...`);

  try {
    try {
      await fs.access(configPath);
      console.warn(`! Fieldbook already initialized at ${configPath}. Aborting.`);
      return;
    } catch {
      // File doesn't exist, continue with initialization
    }

    await fs.mkdir(rootDir, { recursive: true });

    // Validate our default config against the schema before writing
    const validatedConfig = FieldbookConfigSchema.partial().parse(DEFAULT_CONFIG);

    await fs.writeFile(configPath, JSON.stringify(validatedConfig, null, 2));
    await fs.writeFile(gitignorePath, GITIGNORE_CONTENT.trim());

    console.log('✓ Fieldbook initialized successfully.');
    console.log(`- Created config file: ${configPath}`);
    console.log(`- Created .gitignore: ${gitignorePath}`);
  } catch (e) {
    console.error('Failed to initialize Fieldbook:');
    const error = e as Error;
    console.error(error.message);
    process.exit(1);
  }
}
