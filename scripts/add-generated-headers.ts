#!/usr/bin/env tsx

/**
 * @fileoverview Adds generated file headers to TypeScript build output
 * @module scripts/add-generated-headers
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generates a header comment for a compiled JavaScript file
 * @param {string} jsPath - Path to the JavaScript file
 * @param {string} tsPath - Path to the source TypeScript file
 * @returns {string} The header comment
 */
function generateHeader(jsPath: string, tsPath: string): string {
  return `/**
 * @generated from ${tsPath}
 * This file was automatically generated from TypeScript source.
 * Do not modify this file directly. Instead, edit the source TypeScript file.
 * 
 * Generated at: ${new Date().toISOString()}
 */

`;
}

/**
 * Recursively finds all JavaScript files in a directory
 * @param {string} dir - Directory to search
 * @returns {Promise<string[]>} Array of JavaScript file paths
 */
async function findJsFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findJsFiles(fullPath)));
    } else if (entry.name.endsWith('.js') && !entry.name.endsWith('.test.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Adds generated headers to all JavaScript files in dist directories
 * @param {string} packagePath - Path to the package
 * @returns {Promise<void>}
 */
async function addHeadersToPackage(packagePath: string): Promise<void> {
  const distPath = join(packagePath, 'dist');
  const srcPath = join(packagePath, 'src');

  try {
    const jsFiles = await findJsFiles(distPath);

    for (const jsFile of jsFiles) {
      // Calculate the TypeScript source path
      const relativePath = relative(distPath, jsFile);
      const tsFile = join(srcPath, relativePath.replace(/\.js$/, '.ts'));
      const tsRelativePath = relative(dirname(jsFile), tsFile);

      // Read the JavaScript file
      const content = await readFile(jsFile, 'utf-8');

      // Skip if already has a generated header
      if (content.includes('@generated')) {
        continue;
      }

      // Check if the file starts with a shebang
      const shebangMatch = content.match(/^(#!.*?\n)/);
      const header = generateHeader(jsFile, tsRelativePath);

      // Add the header after shebang if present, otherwise at the beginning
      if (shebangMatch) {
        const shebang = shebangMatch[1];
        const restOfContent = content.slice(shebang.length);
        await writeFile(jsFile, shebang + header + restOfContent);
      } else {
        await writeFile(jsFile, header + content);
      }

      console.log(`✓ Added header to ${relative(packagePath, jsFile)}`);
    }
  } catch (error) {
    if ((error as any).code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Main function
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  const packagesDir = join(__dirname, '..', 'packages');
  const packages = ['logbooks-lib', 'logbooks-cli', 'logbooks-mcp'];

  console.log('Adding generated file headers...\n');

  for (const pkg of packages) {
    const packagePath = join(packagesDir, pkg);
    await addHeadersToPackage(packagePath);
  }

  console.log('\n✅ Headers added successfully!');
}

// Execute
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}
