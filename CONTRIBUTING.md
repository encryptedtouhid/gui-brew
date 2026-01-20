# Contributing to GuiBrew

Thank you for your interest in contributing to GuiBrew! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Your macOS version and Homebrew version
- Screenshots if applicable

### Suggesting Features

Have an idea for a new feature? Open an issue with:

- A clear description of the feature
- Why it would be useful
- Any mockups or examples (optional)

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/encryptedtouhid/GuiBrew.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Test your changes thoroughly
   - Update documentation if needed

4. **Commit your changes**
   ```bash
   git commit -m "Add: brief description of your changes"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Provide a clear description of your changes
   - Reference any related issues

## Code Style Guidelines

### JavaScript
- Use `const` and `let`, avoid `var`
- Use async/await for asynchronous operations
- Add comments for complex logic
- Use meaningful variable and function names

### CSS
- Use CSS variables for colors and common values
- Follow the existing naming conventions
- Keep selectors specific but not overly complex

### HTML
- Use semantic HTML elements
- Keep accessibility in mind
- Maintain consistent indentation

## Project Structure

```
GuiBrew/
├── src/
│   ├── main.js              # Electron main process
│   ├── preload.js           # IPC bridge (secure context)
│   ├── services/
│   │   └── brewService.js   # Homebrew command wrapper
│   └── renderer/
│       ├── index.html       # UI structure
│       ├── styles.css       # Styling
│       └── renderer.js      # UI logic
├── assets/
│   └── icons/               # Application icons
└── package.json
```

## Development Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm start

# Run with logging enabled
npm run dev
```

## Testing Your Changes

Before submitting a PR, please ensure:

- [ ] The app starts without errors
- [ ] Your feature works as expected
- [ ] Existing features still work
- [ ] No console errors or warnings
- [ ] UI looks consistent with the existing design

## Questions?

If you have questions, feel free to open an issue with the "question" label.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow

Thank you for contributing!
