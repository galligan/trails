# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive test suite with Vitest achieving >95% coverage
- Database migration system with Drizzle Kit
- Performance indexes on commonly queried fields
- GitHub Actions CI/CD pipeline with multi-platform testing
- ESLint and Prettier configuration for code quality
- TypeScript strict mode enforcement
- Dependabot configuration for automated dependency updates
- CodeQL security analysis

### Changed
- Updated all dependencies to latest versions
- Upgraded better-sqlite3 to v11.10.0 for Node.js v23 compatibility
- Upgraded @modelcontextprotocol/sdk from v0.5.0 to v1.12.1
- Replaced manual SQL schema creation with Drizzle migrations
- Improved TypeScript types throughout the codebase
- Enhanced error handling with proper type guards

### Fixed
- Fixed missing newlines at end of files
- Removed trailing whitespace from all source files
- Replaced `any` types with proper TypeScript types
- Fixed foreign key constraint handling in tests

## [0.0.1] - 2025-01-06

### Added
- Initial release of Trails context-log service
- Core library (`@trails/lib`) with SQLite storage
- CLI tool (`@trails/cli`) with add and tail commands
- MCP server (`@trails/server`) for AI agent integration
- Basic demo environment with setup scripts
- README documentation with usage examples