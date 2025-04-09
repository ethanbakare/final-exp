# Final-Exp

## 🌟 Overview

Final-Exp is an advanced Next.js-based monorepo using a workspace architecture that enables multiple projects to coexist within a single codebase. This approach offers several advantages:

- **Independent Project Development**: Each project maintains isolated dependencies
- **Shared Core Infrastructure**: Common utilities and code shared across projects
- **Reduced Duplication**: Centralized configuration and shared components
- **Simplified Maintenance**: Update core features in one place

This README serves as both a guide for developers and a context document for AI assistants working with the codebase.

## 📊 Project Structure

```
final-exp/
├── src/
│   ├── pages/              # Next.js pages directory
│   │   ├── api/            # API routes
│   │   │   └── projectA/   # Project-specific API routes
│   │   │   └── projectB/   # Project-specific API routes
│   │   ├── projectA/       # Project-specific pages
│   │   └── projectB/       # Project-specific pages
│   ├── projects/           # Individual project workspaces
│   │   ├── projectA/       # Project-specific workspace
│   │   │   ├── components/ # UI components
│   │   │   ├── hooks/      # Custom React hooks
│   │   │   ├── types/      # TypeScript type definitions
│   │   │   ├── package.json# Project-specific dependencies
│   │   │   └── tsconfig.json # Project-specific TS config
│   │   └── projectB/       # Another project workspace
│   └── styles/             # Global styles
├── .env                    # Environment variables
├── package.json            # Root package.json with workspace config
├── tsconfig.json           # Root TypeScript configuration
└── next.config.mjs         # Next.js configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js v16 or higher
- npm v8 or higher
- Git

### First-Time Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/final-exp.git
   cd final-exp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration values
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser


### Creating a New Project

1. Create the project directory structure:
   ```bash
   # Create project directories
   mkdir -p src/projects/newproject/{components,hooks,types}
   mkdir -p src/pages/newproject
   mkdir -p src/pages/api/newproject
   ```

2. Initialize as a workspace:
   ```bash
   npm init -w ./src/projects/newproject
   ```

3. Update the project's package.json:
   ```json
   {
     "name": "@master-exp/newproject",
     "version": "1.0.0",
     "dependencies": {}
   }
   ```

4. Create project-specific tsconfig.json:
   ```bash
   cat > src/projects/newproject/tsconfig.json << EOF
   {
     "extends": "../../../tsconfig.json",
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "*": ["types/*"]
       }
     }
   }
   EOF
   ```

5. Create an index page:
   ```bash
   cat > src/pages/newproject/index.tsx << EOF
   import React from 'react';
   
   export default function NewProjectIndex() {
     return (
       <div>
         <h1>New Project</h1>
       </div>
     );
   }
   EOF
   ```

### Installing Dependencies

Dependencies can be installed at two levels: root-level and project-level.

#### Root-Level Dependencies (shared across all projects)

```bash
npm install package-name
```

#### Project-Level Dependencies (specific to a single project)

```bash
npm install package-name -w @master-exp/projectname
```

#### Development Dependencies

```bash
npm install --save-dev package-name -w @master-exp/projectname
```

### Running Project-Specific Scripts

You can run scripts defined in a project's package.json:

```bash
npm run scriptname -w @master-exp/projectname
```

## 📝 Development Guidelines

### Importing from Project Workspaces

Use path aliases to import from project workspaces:

```typescript
// Importing from the same project
import { MyComponent } from './components/MyComponent';

// Importing from project workspace
import { MyComponent } from '@/projects/projectname/components/MyComponent';

// Importing a hook
import { useMyHook } from '@/projects/projectname/hooks/useMyHook';
```

### Creating API Routes

API routes should be placed in the `src/pages/api/projectname/` directory:

```typescript
// src/pages/api/projectname/route.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check request method
  if (req.method === 'GET') {
    // Handle GET request
    return res.status(200).json({ message: 'Success' });
  }
  
  // Handle other methods or return error
  return res.status(405).json({ error: 'Method not allowed' });
}
```

### Working with Styles

Global styles are stored in `src/styles/` and can be imported in `_app.tsx`. 
Project-specific styles should be kept within the project's components using CSS Modules or styled-components.

## 🧩 Key Technical Concepts

### Workspace Architecture

The workspace architecture allows each project to have its own dependencies while sharing a common infrastructure. This is configured in the root package.json:

```json
{
  "workspaces": [
    "src/projects/*"
  ]
}
```

### Path Aliases

Path aliases make imports cleaner and more maintainable. These are configured in the root tsconfig.json:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@projectname/*": ["./src/projects/projectname/*"]
    }
  }
}
```

### Next.js API Routes

API routes provide serverless functions that can be accessed via HTTP. These are automatically configured based on their location in the `pages/api` directory.

## 🛠️ Common Tasks

### Building for Production

```bash
npm run build
```

This generates an optimized production build in the `.next` directory.

### Running in Production Mode

```bash
npm start
```

### Linting and Type Checking

```bash
# Run ESLint
npm run lint

# Run TypeScript type checking
npm run typecheck
```

## 🔍 Cursor IDE Tips

Cursor IDE provides enhanced capabilities for working with this monorepo:

1. **Jump to Definition**: Use `Cmd+Click` (Mac) or `Ctrl+Click` (Windows) on import statements to navigate directly to the source file.

2. **Workspace Search**: Use `Cmd+Shift+F` (Mac) or `Ctrl+Shift+F` (Windows) to search across the entire monorepo.

3. **Project-Specific Search**: Focus your search by specifying a directory:
   ```
   src/projects/projectname: search term
   ```

4. **AI-Assisted Code Generation**: When creating new components or features, you can ask the AI assistant to:
   - "Create a new component in the projectname workspace"
   - "Add an API route to handle user authentication for projectname"
   - "Update the tsconfig for projectname to add a new path alias"

5. **Context-Aware Code Understanding**: The AI can quickly understand:
   - Project dependencies and relationships
   - Import structures and path aliases 
   - Next.js routing patterns specific to this monorepo

## ⚠️ Troubleshooting

### Common Issues

1. **Dependency Conflicts**:
   - **Symptom**: Unexpected behavior or errors when using dependencies
   - **Solution**: Ensure dependencies are installed at the correct level (root vs project-specific)
   ```bash
   # Check for duplicate dependencies
   npm ls package-name
   ```

2. **TypeScript Path Resolution Errors**:
   - **Symptom**: "Cannot find module" or "Cannot resolve path" errors
   - **Solution**: Verify tsconfig.json path mappings match your import statements
   ```bash
   # Restart TypeScript server in your IDE
   # In VSCode: Cmd+Shift+P > TypeScript: Restart TS Server
   ```

3. **Workspace Package Not Found**:
   - **Symptom**: Error when installing dependencies with -w flag
   - **Solution**: Ensure the workspace name matches exactly what's in package.json
   ```bash
   # Verify workspace names
   cat package.json | grep workspaces -A 5
   ```

### Debugging Tips

1. Check workspace configuration in root package.json
2. Verify project name in project-specific package.json
3. Confirm TypeScript path aliases in tsconfig.json
4. Review dependency installation location

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v7/using-npm/workspaces)

## 📜 License

[MIT License](LICENSE)