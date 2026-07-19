

## [Unreleased] - AUDIT FIX SPRINT-001
### Added
- Global JwtAuthGuard and PermissionsGuard.
- Security decorators (@Public, @RequirePermissions, @CurrentUser).
### Changed
- Protected all 54 endpoints globally in AppModule.


## [Unreleased] - AUDIT FIX SPRINT-001B
### Added
- Bcrypt hashing with Lazy Migration.
- ThrottlerGuard for rate limiting /auth/login.
- Refresh token rotation and DB revocation.
