# Contributing to Crearis Demo Data Server

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/demo-data.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit and push to your fork
7. Open a Pull Request

## Development Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Initialize database
curl -X POST http://localhost:3000/api/demo/sync
```

## Code Style

- Use TypeScript for all new code
- Follow existing code formatting (2 spaces indentation)
- Use meaningful variable and function names
- Add comments for complex logic

## Commit Messages

Use clear, descriptive commit messages:

- `feat: add new feature`
- `fix: resolve bug in X`
- `docs: update documentation`
- `refactor: restructure code`
- `test: add tests for Y`
- `chore: update dependencies`

## Pull Request Process

1. Update documentation for any changed functionality
2. Ensure your code passes all checks
3. Update the README.md if needed
4. Reference any related issues in your PR description
5. Wait for review from maintainers

## Reporting Bugs

Use the GitHub issue tracker to report bugs. Include:

- Clear description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (Node version, OS, etc.)

## Feature Requests

Feature requests are welcome! Please:

- Check if the feature already exists
- Clearly describe the feature and its use case
- Explain why it would be valuable

## Questions?

Open an issue with the "question" label or reach out to maintainers.

Thank you for contributing! 🎭
