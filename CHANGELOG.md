# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2025-06-08

### Added
- Initial release of Fieldbooks field recording service
- Core library (`fieldbooks-lib`) with SQLite storage and Drizzle ORM
- CLI tool (`fieldbooks-cli`) with `add` and `list` commands
- MCP server (`fieldbooks-mcp`) for AI agent integration
- React Ink UI for enhanced CLI experience
- Support for entry types (update, decision, error, handoff, observation, task, checkpoint)
- Unified authors system supporting users, agents, and services
- Comprehensive test suite with Vitest achieving >95% coverage
- Database indexes for performance optimization
- GitHub Actions CI/CD pipeline with multi-platform testing
- ESLint and Prettier configuration for code quality
- TypeScript strict mode enforcement
- Retry logic for database operations
- Input validation with Zod
- Demo environment with setup scripts