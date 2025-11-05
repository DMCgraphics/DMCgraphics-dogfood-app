#!/bin/bash

# ================================================
# Environment Switcher Script
# ================================================
# Usage:
#   ./scripts/switch-env.sh test        # Switch to test environment
#   ./scripts/switch-env.sh production  # Switch to production environment
#   ./scripts/switch-env.sh prod        # Alias for production
#   ./scripts/switch-env.sh status      # Show current environment
# ================================================

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Function to show current environment
show_status() {
    echo -e "${BLUE}Current environment status:${NC}"

    if [ -f "$PROJECT_ROOT/.env.local" ]; then
        # Check which database URL is in use
        CURRENT_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" "$PROJECT_ROOT/.env.local" | cut -d '=' -f2)

        if [[ $CURRENT_URL == *"wfjgcglyhnagnomdlgmd"* ]]; then
            echo -e "${GREEN}✓ TEST environment (wfjgcglyhnagnomdlgmd)${NC}"
        elif [[ $CURRENT_URL == *"tczvietgpixwonpqaotl"* ]]; then
            echo -e "${YELLOW}⚠ PRODUCTION environment (tczvietgpixwonpqaotl)${NC}"
        else
            echo -e "${RED}? Unknown environment${NC}"
        fi

        # Show Stripe mode
        STRIPE_KEY=$(grep "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "$PROJECT_ROOT/.env.local" | cut -d '=' -f2)
        if [[ $STRIPE_KEY == pk_test_* ]]; then
            echo -e "  Stripe: ${GREEN}TEST mode${NC}"
        elif [[ $STRIPE_KEY == pk_live_* ]]; then
            echo -e "  Stripe: ${YELLOW}LIVE mode${NC}"
        else
            echo -e "  Stripe: ${RED}Not configured${NC}"
        fi
    else
        echo -e "${RED}✗ No .env.local file found${NC}"
        echo -e "  Run: ${BLUE}./scripts/switch-env.sh test${NC} to set up test environment"
    fi
}

# Function to switch environment
switch_env() {
    local ENV=$1
    local SOURCE_FILE=""
    local ENV_NAME=""

    case $ENV in
        test)
            SOURCE_FILE="$PROJECT_ROOT/.env.local.test"
            ENV_NAME="TEST"
            ;;
        production|prod)
            SOURCE_FILE="$PROJECT_ROOT/.env.local.production"
            ENV_NAME="PRODUCTION"
            ;;
        *)
            echo -e "${RED}Error: Invalid environment '$ENV'${NC}"
            echo ""
            echo "Usage:"
            echo "  ./scripts/switch-env.sh test        # Switch to test environment"
            echo "  ./scripts/switch-env.sh production  # Switch to production environment"
            echo "  ./scripts/switch-env.sh status      # Show current environment"
            exit 1
            ;;
    esac

    # Check if source file exists
    if [ ! -f "$SOURCE_FILE" ]; then
        echo -e "${RED}Error: Template file not found: $SOURCE_FILE${NC}"
        exit 1
    fi

    # Backup existing .env.local if it exists
    if [ -f "$PROJECT_ROOT/.env.local" ]; then
        BACKUP_FILE="$PROJECT_ROOT/.env.local.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$PROJECT_ROOT/.env.local" "$BACKUP_FILE"
        echo -e "${BLUE}ℹ Backed up existing .env.local to ${BACKUP_FILE}${NC}"
    fi

    # Copy template to .env.local
    cp "$SOURCE_FILE" "$PROJECT_ROOT/.env.local"

    # Show success message
    echo ""
    echo -e "${GREEN}✓ Switched to $ENV_NAME environment${NC}"
    echo ""

    # Show warnings for production
    if [ "$ENV" = "production" ] || [ "$ENV" = "prod" ]; then
        echo -e "${YELLOW}⚠⚠⚠ WARNING ⚠⚠⚠${NC}"
        echo -e "${YELLOW}You are now using the PRODUCTION database and LIVE Stripe!${NC}"
        echo -e "${YELLOW}• Real customer data will be affected${NC}"
        echo -e "${YELLOW}• Real credit cards will be charged${NC}"
        echo -e "${YELLOW}• Make sure you have LIVE Stripe keys configured${NC}"
        echo ""
    else
        echo -e "${GREEN}✓ Safe testing environment${NC}"
        echo -e "  • Separate test database"
        echo -e "  • Stripe test mode (use card: 4242 4242 4242 4242)"
        echo -e "  • No impact on production data"
        echo ""
    fi

    # Remind to restart dev server
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "  1. Restart your dev server: ${GREEN}npm run dev${NC}"
    echo -e "  2. Verify environment: ${GREEN}./scripts/switch-env.sh status${NC}"
    echo ""
}

# Main script logic
if [ $# -eq 0 ]; then
    show_status
else
    case $1 in
        status)
            show_status
            ;;
        *)
            switch_env "$1"
            ;;
    esac
fi
