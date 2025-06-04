import {
  confirm,
  intro,
  isCancel,
  note,
  outro,
  select,
  spinner,
  text,
} from '@clack/prompts';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Helper to get current script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Configuration File Contents (Dynamically Loaded) ---
// Removed hardcoded constants

// --- Helper Functions ---

// Updated function to load file content from a specific template directory
async function loadTemplateFile(
  templateDir: string,
  relativePath: string
): Promise<string> {
  // Special case for .gitignore which is renamed to avoid npm ignoring it
  const actualPath =
    relativePath === '.gitignore' ? 'gitignore.template' : relativePath;

  const filePath = path.resolve(__dirname, templateDir, actualPath);
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error: unknown) {
    console.error(
      `Error reading template file ${path.join(templateDir, actualPath)}:`,
      (error as Error).message
    );
    throw new Error(
      `Template file ${path.join(templateDir, actualPath)} not found or unreadable.`
    );
  }
}

async function createProjectStructure(projectPath: string): Promise<void> {
  const s = spinner();
  s.start('Creating project directories...');
  try {
    await fs.mkdir(projectPath, { recursive: true });
    await fs.mkdir(path.join(projectPath, 'src'), { recursive: true });
    s.stop('Project directories created.');
  } catch (error: unknown) {
    s.stop(`Error creating directories: ${(error as Error).message}`, 1);
    throw error; // Re-throw to stop execution
  }
}

// Updated function to load base package.json from template and modify it
async function createPackageJson(
  projectPath: string,
  projectName: string,
  useJest: boolean,
  useHusky: boolean,
  templateDir: string
): Promise<void> {
  const s = spinner();
  s.start('Generating package.json...');

  try {
    // Load base package.json from the selected template directory
    const packageJsonString = await loadTemplateFile(
      templateDir,
      'package.json'
    );
    const packageJson = JSON.parse(packageJsonString);

    // Set project name
    packageJson.name = projectName;

    // Ensure scripts and devDependencies objects exist
    if (!packageJson.scripts) packageJson.scripts = {};
    if (!packageJson.devDependencies) packageJson.devDependencies = {};

    // Add Jest if selected (ensure versions are appropriate or managed elsewhere)
    if (useJest) {
      packageJson.scripts['test'] = 'jest';
      packageJson.devDependencies['jest'] = '^29.7.0'; // Example version
      packageJson.devDependencies['@types/jest'] = '^29.5.12'; // Example version
      packageJson.devDependencies['ts-jest'] = '^29.2.3'; // Example version
    }

    // Add Husky/Lint-Staged if selected
    if (useHusky) {
      packageJson.scripts['prepare'] = 'husky';
      packageJson.devDependencies['husky'] = '^9.1.4'; // Example version
      packageJson.devDependencies['lint-staged'] = '^15.2.7'; // Example version
    }

    // Write the modified package.json
    await fs.writeFile(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    s.stop('package.json generated.');
  } catch (error: unknown) {
    let message = 'Error generating package.json';
    if (error instanceof Error) {
      message += `: ${error.message}`;
    }
    s.stop(message, 1);
    throw error;
  }
}

// Updated function to load optional files internally
async function createConfigFiles(
  projectPath: string,
  useJest: boolean,
  useHusky: boolean,
  templateDir: string,
  // Core config content is still passed in
  tsconfigContent: string,
  eslintConfigContent: string,
  prettierrcContent: string,
  gitignoreContent: string,
  editorconfigContent: string
): Promise<void> {
  const s = spinner();
  s.start('Creating configuration files...');
  const promises = [];

  // Base configs - use passed parameters
  promises.push(
    fs.writeFile(path.join(projectPath, '.editorconfig'), editorconfigContent)
  );
  promises.push(
    fs.writeFile(path.join(projectPath, '.gitignore'), gitignoreContent)
  );
  promises.push(
    fs.writeFile(path.join(projectPath, '.prettierrc'), prettierrcContent)
  );

  // tsconfig.json (conditional types modification)
  let tsConfig = tsconfigContent;
  if (useJest) {
    try {
      const tsConfigObj = JSON.parse(tsConfig);
      if (!tsConfigObj.compilerOptions) tsConfigObj.compilerOptions = {};
      if (!tsConfigObj.compilerOptions.types)
        tsConfigObj.compilerOptions.types = ['node'];
      if (!tsConfigObj.compilerOptions.types.includes('jest')) {
        tsConfigObj.compilerOptions.types.push('jest');
      }
      tsConfig = JSON.stringify(tsConfigObj, null, 2);
    } catch {
      console.warn(
        'Warning: Could not parse tsconfig.json to add Jest types. Using original content.'
      );
      tsConfig = tsconfigContent; // Revert to original if parse fails
    }
  }
  promises.push(
    fs.writeFile(path.join(projectPath, 'tsconfig.json'), tsConfig)
  );

  // eslint.config.mjs (conditional globals modification)
  let eslintConfig = eslintConfigContent;
  if (useJest) {
    if (!eslintConfig.includes('...globals.jest,')) {
      eslintConfig = eslintConfig.replace(
        '...globals.node,',
        '...globals.node,\n        ...globals.jest,'
      );
    }
  }
  promises.push(
    fs.writeFile(path.join(projectPath, 'eslint.config.mjs'), eslintConfig)
  );

  // Load and write Jest config conditionally
  if (useJest) {
    promises.push(
      (async () => {
        try {
          const jestConfigContent = await loadTemplateFile(
            templateDir,
            'jest.config.ts'
          ); // Load inside
          await fs.writeFile(
            path.join(projectPath, 'jest.config.ts'),
            jestConfigContent
          );
        } catch {
          console.warn(
            `Warning: Could not load or write jest.config.ts from ${templateDir}. Skipping.`
          );
          // Decide if this should be a fatal error
        }
      })()
    );
  }

  // Load and write Husky/Lint-Staged config conditionally
  if (useHusky) {
    // Write lint-staged config
    promises.push(
      (async () => {
        try {
          const lintStagedConfigContent = await loadTemplateFile(
            templateDir,
            'lint-staged.config.js'
          ); // Load inside
          await fs.writeFile(
            path.join(projectPath, 'lint-staged.config.js'),
            lintStagedConfigContent
          );
        } catch {
          console.warn(
            `Warning: Could not load or write lint-staged.config.js from ${templateDir}. Skipping.`
          );
          // Decide if this should be a fatal error
        }
      })()
    );

    // Create .husky directory and pre-commit hook
    const huskyDir = path.join(projectPath, '.husky');
    const HUSKY_PRECOMMIT_CONTENT_BASE = `#!/usr/bin/env sh\n. "$(dirname -- "$0")/_/husky.sh"\n\necho "Running pre-commit hooks..."\n`;
    const HUSKY_PRECOMMIT_LINTSTAGED = `npx lint-staged`;
    const HUSKY_PRECOMMIT_TEST = `npm test -- --passWithNoTests`;

    promises.push(
      fs.mkdir(huskyDir, { recursive: true }).then(async () => {
        let preCommitContent = HUSKY_PRECOMMIT_CONTENT_BASE;
        preCommitContent += `${HUSKY_PRECOMMIT_LINTSTAGED}\n`;
        if (useJest) {
          preCommitContent += `${HUSKY_PRECOMMIT_TEST}\n`;
        }
        const hookPath = path.join(huskyDir, 'pre-commit');
        await fs.writeFile(hookPath, preCommitContent);
        await fs.chmod(hookPath, 0o755);
      })
    );
  }

  // Basic src/index.ts
  const BASE_INDEX_TS_CONTENT = `console.log('Hello, World!');\n`;
  promises.push(
    fs.writeFile(
      path.join(projectPath, 'src', 'index.ts'),
      BASE_INDEX_TS_CONTENT
    )
  );

  const dockerfilePath = path.resolve(__dirname, templateDir, 'Dockerfile');
  try {
    const dockerfileContent = await fs.readFile(dockerfilePath, 'utf-8');
    promises.push(
      fs.writeFile(path.join(projectPath, 'Dockerfile'), dockerfileContent)
    );
  } catch {
    console.warn(
      `Warning: Could not load or write Dockerfile from ${templateDir}. Skipping.`
    );
  }

  try {
    await Promise.all(promises);
    s.stop('Configuration files created.');
  } catch (error: unknown) {
    s.stop(`Error writing config files: ${(error as Error).message}`, 1);
    throw error;
  }
}

// --- Main CLI Logic ---

async function main() {
  console.clear();
  intro(`🚀 Let's create your Node.js project!`);

  const projectName = await text({
    message: 'What is the name of your project?',
    placeholder: 'my-node-app',
    validate(value) {
      if (value.length === 0) return 'Project name cannot be empty!';
      if (!/^[a-z0-9\-_]+$/.test(value))
        return 'Use lowercase letters, numbers, hyphens, or underscores.';
      // Return undefined if valid
      return undefined;
    },
  });

  if (isCancel(projectName)) {
    outro('👋 Project creation cancelled.');
    return;
  }

  // Select Template Type
  const templateType = await select({
    message: 'Select a project template:',
    options: [
      { value: 'node', label: 'Node.js Base' },
      { value: 'node-fastify', label: 'Node.js + Fastify' },
      // Add more templates here
    ],
  });

  if (isCancel(templateType)) {
    outro('👋 Project creation cancelled.');
    return;
  }

  const templateDir = `templates/${templateType}`;

  const useJest = await confirm({
    message: 'Add Jest for testing?',
    initialValue: true,
  });

  if (isCancel(useJest)) {
    outro('👋 Project creation cancelled.');
    return;
  }

  const useHusky = await confirm({
    message: 'Add Husky + Lint-Staged for pre-commit hooks?',
    initialValue: true,
  });

  if (isCancel(useHusky)) {
    outro('👋 Project creation cancelled.');
    return;
  }

  // --- Load Core Configs --- (Do this after confirming options)
  let tsconfigContent = '';
  let eslintConfigContent = '';
  let prettierrcContent = '';
  let gitignoreContent = '';
  let editorconfigContent = '';

  const sLoad = spinner();
  sLoad.start('Loading template configuration...');
  try {
    // Load core files from the selected template directory
    tsconfigContent = await loadTemplateFile(templateDir, 'tsconfig.json');
    eslintConfigContent = await loadTemplateFile(
      templateDir,
      'eslint.config.mjs'
    );
    prettierrcContent = await loadTemplateFile(templateDir, '.prettierrc');
    gitignoreContent = await loadTemplateFile(templateDir, '.gitignore');
    editorconfigContent = await loadTemplateFile(templateDir, '.editorconfig');
    sLoad.stop('Template configuration loaded.');
  } catch (error: unknown) {
    sLoad.stop(
      `Failed to load template configuration: ${(error as Error).message}`,
      1
    );
    outro(
      '❌ Critical error: Could not load base configuration files from template.'
    );
    return; // Exit if core files are missing
  }
  // ------------------------

  const projectPath = path.resolve(process.cwd(), projectName as string);

  note(`Project will be created at: ${projectPath}`);

  try {
    await createProjectStructure(projectPath);
    // Pass templateDir to createPackageJson
    await createPackageJson(
      projectPath,
      projectName as string,
      useJest as boolean,
      useHusky as boolean,
      templateDir
    );
    // Pass templateDir and loaded core config content to createConfigFiles
    await createConfigFiles(
      projectPath,
      useJest as boolean,
      useHusky as boolean,
      templateDir,
      tsconfigContent,
      eslintConfigContent,
      prettierrcContent,
      gitignoreContent,
      editorconfigContent
    );

    outro(`✅ Success! Your project '${projectName}' is ready.

Next steps:
1. cd ${projectName}
2. npm install (or yarn install / pnpm install)
${useHusky ? '3. If using npm, run `npm run prepare` to setup Husky hooks.' : ''}
4. Start developing: npm run dev`);
  } catch (error) {
    outro(
      `❌ An error occurred during project creation. Please check the logs above.`
    );
    throw error;
  }
}

main().catch(error => {
  console.error('CLI Error:', error);
});
