# Contributing to Alerto

Thank you for your interest in contributing to **Alerto**! We welcome contributions from the community.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

---

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

## Getting Started

### Prerequisites

- Node.js 16+ and npm 8+
- Git
- Firebase account
- Code editor (VS Code recommended)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/alerto.git
   cd alerto
   ```

3. Add upstream remote:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/alerto.git
   ```

4. Install dependencies:
   ```bash
   npm run setup
   ```

5. Set up your `.env` file with your own API keys

---

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding tests

### 2. Make Your Changes

- Write clean, readable code
- Follow our [Coding Standards](#coding-standards)
- Add comments for complex logic
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run the development server
npm run dev

# Build the project
npm run build

# Preview production build
npm run preview
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add new feature description"
```

Follow our [Commit Message Guidelines](#commit-message-guidelines).

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create a Pull Request

- Go to the original repository on GitHub
- Click "New Pull Request"
- Select your feature branch
- Fill in the PR template
- Wait for review

---

## Coding Standards

### JavaScript/React

- Use functional components with hooks
- Follow React best practices
- Use meaningful variable and function names
- Keep components small and focused
- Avoid inline styles (use Tailwind CSS)

### File Organization

```
src/
├── components/        # React components
│   ├── ui/           # Reusable UI components
│   └── Feature.jsx   # Feature-specific components
├── contexts/         # React contexts
├── firebase/         # Firebase services
├── services/         # External API services
└── utils/            # Utility functions
```

### Component Structure

```jsx
// Imports
import { useState } from 'react';
import { Button } from './ui/button';

// Component
export function MyComponent({ prop1, prop2 }) {
  // State
  const [state, setState] = useState(initialValue);

  // Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  // Handlers
  const handleClick = () => {
    // Handler logic
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Naming Conventions

- **Components**: PascalCase (`UserDashboard.jsx`)
- **Files**: camelCase (`weatherService.js`)
- **Functions**: camelCase (`getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **CSS Classes**: kebab-case (`user-dashboard`)

---

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

### Examples

```bash
feat(auth): add Google sign-in
fix(reports): resolve image upload issue
docs(readme): update installation instructions
refactor(weather): improve API error handling
```

---

## Pull Request Process

### Before Submitting

- [ ] Code follows our coding standards
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Commit messages follow guidelines
- [ ] Branch is up-to-date with main

### PR Template

When creating a PR, include:

1. **Description**: What does this PR do?
2. **Related Issues**: Link any related issues
3. **Type of Change**: Feature, bug fix, documentation, etc.
4. **Testing**: How did you test this?
5. **Screenshots**: If applicable
6. **Checklist**: Complete the checklist

### Review Process

1. At least one maintainer must review
2. All comments must be resolved
3. CI/CD checks must pass
4. No merge conflicts

---

## Reporting Bugs

### Before Reporting

1. Search existing issues
2. Check if it's already fixed in main branch
3. Gather reproduction steps

### Bug Report Template

```markdown
**Describe the bug**
A clear and concise description.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen.

**Screenshots**
If applicable.

**Environment:**
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Node version: [e.g. 18.0.0]

**Additional context**
Any other relevant information.
```

---

## Suggesting Enhancements

### Enhancement Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features.

**Additional context**
Any other context or screenshots.
```

---

## Development Tips

### Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Check environment setup
npm run check:env

# Create .env from template
npm run setup:env

# Clean and reinstall
npm run reinstall
```

### Debugging

- Use React DevTools extension
- Check browser console for errors
- Use Firebase Emulator for testing
- Test with different user roles (admin/user)

### Testing Firebase Locally

```bash
# Install Firebase Emulator
npm install -g firebase-tools

# Start emulators
firebase emulators:start
```

---

## Questions?

- 📧 Email: dev@alerto.ph
- 💬 Discord: [Join our server](https://discord.gg/alerto)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/alerto/issues)

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Alerto!** 🎉
