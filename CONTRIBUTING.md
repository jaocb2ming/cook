# Contributing to Intimacy Hub

Thank you for your interest in contributing to Intimacy Hub!

## Development Setup

1. Open the project in **WeChat Developer Tools**
2. Use "Compile" (Ctrl/Cmd + B) to build
3. Test changes in the simulator or on a real device

## Code Style

- **Indentation**: 2 spaces
- **Semicolons**: Required
- **Quotes**: Single quotes preferred
- **Naming**: camelCase for functions/variables

## Key Technical Constraints

- Date handling: iOS requires `/` not `-` in date strings
- Use synchronous storage methods (`wx.setStorageSync`, `wx.getStorageSync`)
- Clear intervals in both `onHide()` and `onUnload()` lifecycle hooks
- CommonJS only (`require` / `module.exports`)

## Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
