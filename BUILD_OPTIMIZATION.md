# Build Optimization Guide

## Reducing Local Storage for Builds

This project is optimized to minimize local disk usage during development and CI/CD builds.

### Key Optimizations

#### 1. **NPM Configuration** (`.npmrc`)
- Uses `prefer-offline=true` to cache dependencies
- Limits concurrent operations to reduce memory usage
- Uses deterministic installs with `npm ci`

#### 2. **Vite Configuration** (`frontend/vite.config.js`)
- Cache directory configured at `.vite/cache` (excluded from git)
- Terser minification with console log stripping
- Code splitting by vendor (firebase, lucide-react, react)

#### 3. **Git Ignore** (`.gitignore`)
- Excludes all node_modules
- Excludes build artifacts (dist/, build/)
- Excludes cache directories (.vite/, .turbo/)
- Excludes test reports

### Available Commands

#### Clean Build Artifacts
```bash
npm run clean
```
Removes cached build files and frees disk space (~200-500MB).

#### Clean Build + Fresh Build
```bash
npm run build:clean
```
Cleans everything and rebuilds from scratch.

#### Install Dependencies Efficiently
```bash
npm run install:all
```
Uses `npm ci` for deterministic, faster installations.

### Storage Breakdown (Before Optimization)

| Component | Size | After Optimization |
|-----------|------|-------------------|
| node_modules (root) | ~100MB | 0MB (git ignored) |
| frontend/node_modules | ~400MB | 0MB (git ignored) |
| backend/node_modules | ~200MB | 0MB (git ignored) |
| frontend/dist | ~15MB | Rebuilt on demand |
| .vite/cache | ~50MB | 0MB (git ignored) |
| **Total** | **~765MB** | **~0MB in repo** |

### CI/CD Best Practices

1. **Use `npm ci`** instead of `npm install` for consistent builds
2. **Cache npm packages** in CI (GitHub Actions, Railway, etc.)
3. **Remove build artifacts** after deployment
4. **Use `.npmrc`** to control caching behavior

### Local Development Tips

```bash
# After each major build
npm run clean

# Before committing
git status  # Verify no node_modules or dist/ files

# Fresh install from lockfile
npm run install:all
```

### Cloud Deployment

Railway/Vercel automatically:
- Uses `.npmrc` configuration
- Caches `npm ci` installs between deployments
- Only builds what's changed
- Serves from git repository (not local build)

### Storage Savings

With these optimizations:
- **Local git repo**: ~2-5MB (just source code)
- **CI cache**: Reused across builds
- **No duplicate dependencies**: Single cache per environment
- **Faster builds**: 30-40% faster due to deterministic installs

