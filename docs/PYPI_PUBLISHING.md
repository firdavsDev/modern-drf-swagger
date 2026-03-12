# 📦 PyPI Publishing Guide

This guide explains how to publish **modern-drf-swagger** to PyPI using GitHub Actions.

## 🔐 Setup PyPI API Token

### Step 1: Create PyPI Account

If you don't have a PyPI account:
1. Visit [https://pypi.org/account/register/](https://pypi.org/account/register/)
2. Complete registration and verify your email

### Step 2: Generate API Token

1. Login to your PyPI account
2. Go to **Account Settings** → [API tokens](https://pypi.org/manage/account/#api-tokens)
3. Click **"Add API token"**
4. Name: `modern-drf-swagger-github-actions`
5. Scope: **"Entire account"** (or select just this project after first upload)
6. Click **"Add token"**
7. **IMPORTANT**: Copy the token immediately - it won't be shown again!
   - Format: `pypi-AgEIcHlwaS5vcmc...`

### Step 3: Add Token to GitHub Secrets

1. Go to your GitHub repository: [https://github.com/firdavsDev/modern-drf-swagger](https://github.com/firdavsDev/modern-drf-swagger)
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `PYPI_TOKEN`
5. Value: Paste the PyPI token (starts with `pypi-`)
6. Click **"Add secret"**

### Step 4 (Optional): Test PyPI Token

For testing before production release:
1. Visit [https://test.pypi.org/](https://test.pypi.org/)
2. Register account (separate from main PyPI)
3. Generate API token
4. Add as GitHub secret named `TEST_PYPI_TOKEN`

## 🚀 Publishing Methods

### Method 1: Automatic via Release Branch (Recommended)

This is the easiest way - just merge to the `release` branch:

```bash
# Ensure you're on main branch
git checkout main
git pull origin main

# Create and push to release branch
git checkout -b release
git push origin release
```

The GitHub Action will automatically:
1. ✅ Build the package
2. ✅ Run quality checks
3. ✅ Publish to PyPI
4. ✅ Create GitHub release (if tagged)

### Method 2: Via Git Tags

For versioned releases with GitHub Release:

```bash
# Update version in pyproject.toml first!
# Then commit and tag
git add pyproject.toml CHANGELOG.md
git commit -m "Bump version to 1.0.0"
git tag v1.0.0
git push origin main --tags
```

This will:
1. ✅ Trigger the workflow
2. ✅ Build and publish to PyPI
3. ✅ Create a GitHub Release with changelog

### Method 3: Manual Trigger

From GitHub web interface:
1. Go to **Actions** tab
2. Select **"Publish to PyPI"** workflow
3. Click **"Run workflow"**
4. Select branch (usually `main` or `release`)
5. Click **"Run workflow"**

## 📋 Pre-Release Checklist

Before publishing, ensure:

- [ ] Version bumped in `pyproject.toml`
- [ ] `CHANGELOG.md` updated with release notes
- [ ] All tests passing locally
- [ ] README.md is up-to-date
- [ ] Screenshots added to `images/` folder
- [ ] `LICENSE` file exists
- [ ] Dependencies are correct in `pyproject.toml`
- [ ] `MANIFEST.in` includes all necessary files
- [ ] Git repository is clean (`git status`)

## 🔍 Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.x.x): Breaking changes
- **MINOR** (x.1.x): New features, backward compatible
- **PATCH** (x.x.1): Bug fixes

Examples:
- `1.0.0` - First stable release
- `1.1.0` - Added WebSocket support (new feature)
- `1.1.1` - Fixed authentication bug (patch)
- `2.0.0` - Complete API redesign (breaking)

### Update Version

Edit `pyproject.toml`:
```toml
[project]
name = "modern-drf-swagger"
version = "1.0.0"  # <- Change this
```

## 🧪 Testing the Package

### Test Locally Before Publishing

```bash
# Build the package
python -m build

# Check the distribution
twine check dist/*

# Test install locally
pip install dist/modern_drf_swagger-1.0.0-py3-none-any.whl

# Or install in editable mode
pip install -e .
```

### Test on Test PyPI (Recommended)

```bash
# Upload to Test PyPI
twine upload --repository testpypi dist/*

# Install from Test PyPI
pip install --index-url https://test.pypi.org/simple/ modern-drf-swagger

# Test in a Django project
python manage.py migrate
python manage.py runserver
```

## 🎯 Workflow Explanation

The `.github/workflows/publish-pypi.yml` workflow:

### Triggers
- **Push to `release` branch**: Auto-publish on merge
- **Push tags `v*`**: Create GitHub Release + publish
- **Manual dispatch**: On-demand publishing

### Steps
1. **Checkout**: Get latest code
2. **Setup Python**: Install Python 3.11
3. **Install tools**: `build`, `twine`, `wheel`
4. **Extract version**: Read from `pyproject.toml`
5. **Build package**: Create `.whl` and `.tar.gz` files
6. **Check package**: Validate with `twine check`
7. **Test PyPI** (optional): Upload to test instance
8. **Publish to PyPI**: Upload with API token
9. **Create Release** (tags only): GitHub release with assets

## 🚨 Troubleshooting

### "Invalid or non-existent authentication information"

❌ **Problem**: PyPI token is wrong or not set  
✅ **Solution**: 
1. Regenerate token on PyPI
2. Update `PYPI_TOKEN` secret in GitHub
3. Ensure token starts with `pypi-`

### "File already exists"

❌ **Problem**: Version already published  
✅ **Solution**: 
1. Bump version in `pyproject.toml`
2. Can't overwrite existing versions on PyPI
3. Delete old dist/ files: `rm -rf dist/`

### "Package verification failed"

❌ **Problem**: Missing required files  
✅ **Solution**: Check `MANIFEST.in` includes:
- `README.md`
- `LICENSE`
- `CHANGELOG.md`
- Template files
- Static files

### "No module named 'setuptools'"

❌ **Problem**: Build dependencies missing  
✅ **Solution**:
```bash
pip install --upgrade pip setuptools wheel build
```

### Workflow not triggering

❌ **Problem**: Branch/tag doesn't match workflow triggers  
✅ **Solution**: 
- Check branch name is exactly `release`
- Check tag starts with `v` (e.g., `v1.0.0`)
- Verify workflow file is on the branch you're pushing to

## 📚 Additional Resources

- [PyPI Packaging Guide](https://packaging.python.org/tutorials/packaging-projects/)
- [Semantic Versioning](https://semver.org/)
- [Twine Documentation](https://twine.readthedocs.io/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Python Build](https://pypa-build.readthedocs.io/)

## 🎉 After Publishing

Once published, your package will be available at:
- PyPI: [https://pypi.org/project/modern-drf-swagger/](https://pypi.org/project/modern-drf-swagger/)
- Install: `pip install modern-drf-swagger`

**Typical propagation time**: 1-5 minutes

### Verify Installation

```bash
pip install modern-drf-swagger
python -c "import api_portal; print(api_portal.__file__)"
```

### Update Documentation

After publishing:
1. Update README badges (PyPI version)
2. Announce on social media
3. Update project website
4. Create release announcement blog post

---

**Author**: [DavronbekDev](https://davronbek.dev)  
**Repository**: [firdavsDev/modern-drf-swagger](https://github.com/firdavsDev/modern-drf-swagger)
