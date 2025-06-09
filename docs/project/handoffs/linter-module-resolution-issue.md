# Handoff: Linter Module Resolution Failures

**Date**: 2024-07-29  
**From**: Max (AI)  
**To**: Matt Galligan

## 1. Summary

The ESLint setup for this monorepo is exhibiting critical and persistent module resolution failures. It consistently reports that both external `node_modules` dependencies and local intra-project modules cannot be found, even when they are verifiably present. This makes the linter unreliable and an impediment to development.

## 2. Symptoms

The primary symptom is the ESLint process (likely via the editor's extension) reporting `no-unresolved` import errors for valid modules.

- **External Dependencies**: Falsely reports that packages like `drizzle-orm`, `fs-extra`, and `better-sqlite3` cannot be found.
  - *Example File*: `packages/fieldbooks-lib/src/db.ts`
- **Local Modules**: Falsely reports that local project files cannot be found.
  - *Example File*: `packages/fieldbooks-cli/src/index.ts` incorrectly flags the import of `./commands/init.js` even after the file has been created.

These errors persist even after cleaning the workspace and performing fresh dependency installations.

## 3. Impact

- **Blocks Development Workflow**: The high volume of false-positive errors makes it impossible to trust the linter's output.
- **Wastes Time**: Significant time has been spent debugging the tool instead of writing application code.
- **Erodes Tooling Confidence**: A linter that cannot be trusted is worse than no linter at all.

## 4. Investigation to Date

To rule out common issues, the following steps have already been taken without success:

1.  **Dependency Reinstallation**: Ran `pnpm install` multiple times.
2.  **Clean Workspace**: Executed `rm -rf node_modules pnpm-lock.yaml && pnpm install` to ensure a completely fresh state.
3.  **Verification**: Manually confirmed that the allegedly "missing" modules exist in `node_modules` and that their versions in `pnpm-lock.yaml` match the `package.json` files.
4.  **Documentation Review**: Confirmed that the import syntax for failing modules (e.g., `drizzle-orm`) is correct according to their official documentation.

The issue is not a simple case of missing dependencies.

## 5. Hypotheses

The root cause is likely a misconfiguration in how ESLint interacts with TypeScript and the `pnpm` monorepo structure. My primary hypotheses are:

1.  **Editor Integration Issue (High Confidence)**: The problem may lie with the editor's ESLint extension rather than ESLint itself. The extension might be using a different module resolution strategy or failing to correctly locate the root `eslint.config.mjs` and `tsconfig.json` files.
2.  **Import Resolver Configuration**: The `eslint-import-resolver-typescript` plugin may be misconfigured in `eslint.config.mjs`. It requires specific settings to understand `pnpm`'s symlinked `node_modules` structure and the TypeScript `paths` aliases used in a monorepo.
3.  **TypeScript `tsconfig.json` Conflict**: There may be a conflict between the root `tsconfig.json` and the package-specific ones, or the `paths` configuration may not be correctly set up to allow the resolver to find local package sources.

## 6. Recommended Next Steps

I recommend the following actions to isolate and resolve the issue:

1.  **Isolate the Linter**: Run ESLint directly from the command line on a specific file:
    ```bash
    pnpm -F fieldbooks-lib eslint src/db.ts
    ```
    - If this passes without error, the problem is almost certainly with the editor's ESLint extension and its configuration.
    - If this fails with the same errors, the problem is in the core ESLint configuration (`eslint.config.mjs`).

2.  **Inspect the Resolver Configuration**: Review `eslint.config.mjs`. Ensure the `settings` for `import/resolver` are correctly configured for a TypeScript monorepo using `pnpm`. It should look something like this:
    ```javascript
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    ```

3.  **Check `tsconfig.json`**: Verify that `baseUrl` and `paths` are correctly defined in the root `tsconfig.json` to create aliases for each package in the workspace (e.g., `"fieldbooks-lib/*": ["packages/fieldbooks-lib/src/*"]`).

This systematic approach should quickly determine whether the fault lies with the core configuration or the editor integration, leading to a much faster resolution. 