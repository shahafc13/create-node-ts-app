# Node.js Project Generator CLI

This is a command-line interface (CLI) tool built with Node.js and TypeScript to generate new Node.js projects based on predefined templates. It simplifies the setup process by providing a consistent structure and configuration.

## Features

- **Interactive Setup:** Uses `@clack/prompts` for a user-friendly setup experience.
- **Template-Based:** Generates projects from templates stored within the CLI project.
- **Configurable Options:** Allows users to choose:
  - Project Name
  - Base Template (e.g., Node.js Base, Node.js + Fastify)
  - Inclusion of Jest for testing.
  - Inclusion of Husky + Lint-Staged for pre-commit hooks.
- **Standard Tooling:** Generated projects come pre-configured with:
  - TypeScript
  - ESLint (with TypeScript support and Prettier integration)
  - Prettier
  - TSX for development (`npm run dev`)

## Usage

Currently, the primary way to run this CLI is from within its own development environment.

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd nodejs-typescript-boilerplate
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the generator:**
    ```bash
    npm run dev
    ```

This will start the interactive prompt:

- **Project Name:** Enter the desired name for your new project (e.g., `my-api`).
- **Template Selection:** Choose the base template (e.g., `Node.js Base`).
- **Add Jest?:** Confirm if you want to include Jest configuration and dependencies.
- **Add Husky?:** Confirm if you want to include Husky and Lint-Staged for pre-commit hooks.

The CLI will then create a new directory with the chosen project name in the location where you ran the command, populate it with the selected template files, and configure it according to your choices.

## Templates

Project templates are located in the `src/templates/` directory within this repository.

- `src/templates/node`: A basic Node.js setup with TypeScript.
- `src/templates/node-fastify`: A Node.js setup including the Fastify framework.

### Adding New Templates

1.  Create a new directory under `src/templates/` (e.g., `src/templates/node-express`).
2.  Populate this directory with all the necessary configuration files (`package.json`, `tsconfig.json`, `.gitignore`, etc.) and a basic `src/index.ts` for that template.
3.  Update the `select` options in `src/index.ts` within the `main` function to include your new template.

## Development (Contributing to this CLI)

1.  Clone the repository.
2.  Install dependencies: `npm install`.
3.  Run in development mode: `npm run dev`. This will execute the CLI script directly using `tsx`.
4.  Build the project (optional): `npm run build`.

Make changes to the generator logic in `src/index.ts` or modify/add templates in `src/templates/`.
