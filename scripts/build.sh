#!/bin/bash
# Build and Test Script for modern-drf-swagger
# Author: DavronbekDev (https://davronbek.dev)

set -e  # Exit on error

echo "🚀 Modern DRF Swagger - Build & Test Script"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check Python version
print_info "Checking Python version..."
python_version=$(python --version 2>&1 | awk '{print $2}')
print_success "Python $python_version detected"

# Clean previous builds
print_info "Cleaning previous builds..."
rm -rf build/ dist/ *.egg-info
print_success "Cleaned build directories"

# Install/upgrade build tools
print_info "Installing build tools..."
python -m pip install --upgrade pip setuptools wheel build twine
print_success "Build tools installed"

# Build the package
print_info "Building package..."
python -m build
print_success "Package built successfully"

# List built files
echo ""
print_info "Built files:"
ls -lh dist/

# Check package with twine
echo ""
print_info "Checking package with twine..."
twine check dist/*
print_success "Package validation passed"

# Extract version
version=$(grep '^version = ' pyproject.toml | sed 's/version = "\(.*\)"/\1/')
print_success "Package version: $version"

# Optional: Install locally for testing
echo ""
read -p "Do you want to install the package locally for testing? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    print_info "Installing package locally..."
    pip install -e .
    print_success "Package installed in editable mode"
    
    # Test import
    print_info "Testing import..."
    python -c "import modern_drf_swagger; print('Import successful!')"
    print_success "Package import works!"
fi

# Optional: Upload to Test PyPI
echo ""
read -p "Do you want to upload to Test PyPI? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    print_warning "Make sure you have Test PyPI credentials configured!"
    print_info "Uploading to Test PyPI..."
    twine upload --repository testpypi dist/* || print_warning "Test PyPI upload failed (may already exist)"
fi

# Show next steps
echo ""
print_success "Build complete! 🎉"
echo ""
print_info "Next steps:"
echo "  1. Test the package: pip install dist/modern_drf_swagger-${version}-py3-none-any.whl"
echo "  2. Test in sample project: cd samples && python manage.py runserver"
echo "  3. If everything works, publish to PyPI:"
echo "     - Commit changes: git add . && git commit -m 'Release v${version}'"
echo "     - Push to release branch: git push origin release"
echo "     - Or create tag: git tag v${version} && git push origin --tags"
echo ""
print_info "GitHub Actions will automatically publish to PyPI!"
echo ""
