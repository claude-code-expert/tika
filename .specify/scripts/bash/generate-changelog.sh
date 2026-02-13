#!/bin/bash
# generate-changelog.sh
# Generates changelog entry from current git state
#
# Usage:
#   ./generate-changelog.sh "Change summary"
#   ./generate-changelog.sh "Change summary" --json
#
# Example:
#   ./generate-changelog.sh "TC-API-001 테스트 5개 추가"
#   ./generate-changelog.sh "DB 설정 업데이트" --json

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
SUMMARY="$1"
JSON_MODE=false

if [[ "$2" == "--json" ]]; then
  JSON_MODE=true
fi

# Validate summary
if [ -z "$SUMMARY" ]; then
  if [ "$JSON_MODE" = true ]; then
    echo '{"error": "MISSING_SUMMARY", "message": "Please provide a change summary"}'
    exit 1
  else
    echo -e "${RED}Error: Please provide a change summary${NC}"
    echo "Usage: $0 \"Change summary\" [--json]"
    exit 1
  fi
fi

# Check if in git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  if [ "$JSON_MODE" = true ]; then
    echo '{"error": "NOT_GIT_REPO", "message": "Not in a git repository"}'
    exit 1
  else
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
  fi
fi

# Get current branch
get_current_branch() {
  git branch --show-current
}

# Get current date and time
get_datetime() {
  date +"%Y-%m-%d %H:%M"
}

# Get just date
get_date() {
  date +"%Y-%m-%d"
}

# Get changed files (staged and unstaged)
get_changed_files() {
  # Combine staged and unstaged changes, ensure proper format
  {
    git diff --cached --name-status 2>/dev/null || true
    git diff --name-status 2>/dev/null || true
  } | grep -v '^$' | sort -u
}

# Get file change stats
get_file_stats() {
  local file="$1"
  local additions=0
  local deletions=0

  # Check staged changes
  if git diff --cached --numstat -- "$file" &>/dev/null; then
    local stats=$(git diff --cached --numstat -- "$file" | head -n 1)
    if [ -n "$stats" ]; then
      additions=$(echo "$stats" | awk '{print $1}')
      deletions=$(echo "$stats" | awk '{print $2}')
    fi
  fi

  # Check unstaged changes
  if git diff --numstat -- "$file" &>/dev/null; then
    local ustats=$(git diff --numstat -- "$file" | head -n 1)
    if [ -n "$ustats" ]; then
      local uadd=$(echo "$ustats" | awk '{print $1}')
      local udel=$(echo "$ustats" | awk '{print $2}')
      additions=$((additions + uadd))
      deletions=$((deletions + udel))
    fi
  fi

  echo "+$additions, -$deletions lines"
}

# Determine change type from git file_status
determine_change_type() {
  local file_status="$1"
  case "$file_status" in
    A) echo "Added" ;;
    M) echo "Modified" ;;
    D) echo "Removed" ;;
    R*) echo "Renamed" ;;
    C*) echo "Copied" ;;
    *) echo "Modified" ;;
  esac
}

# Format changelog entry
format_changelog_entry() {
  local branch="$1"
  local datetime="$2"
  local summary="$3"
  local changes="$4"
  local files="$5"

  cat << EOF
## [$branch] - $datetime

### 🎯 Prompt
> "$summary"

### ✅ Changes
$changes

### 📁 Files Modified
$files

---

EOF
}

# Format for JSON output
format_json_output() {
  local branch="$1"
  local datetime="$2"
  local date="$3"
  local summary="$4"
  local changes="$5"
  local files="$6"

  # Escape for JSON (simpler approach - replace newlines with \n)
  summary=$(echo "$summary" | sed 's/"/\\"/g')
  changes=$(echo "$changes" | tr '\n' ' ' | sed 's/"/\\"/g')
  files=$(echo "$files" | tr '\n' ' ' | sed 's/"/\\"/g')

  cat << EOF
{
  "branch": "$branch",
  "datetime": "$datetime",
  "date": "$date",
  "summary": "$summary",
  "changes": "$changes",
  "files": "$files"
}
EOF
}

# Main execution
main() {
  local branch=$(get_current_branch)
  local datetime=$(get_datetime)
  local date=$(get_date)

  # Check for changes
  local changed_files=$(get_changed_files)

  if [ -z "$changed_files" ]; then
    if [ "$JSON_MODE" = true ]; then
      echo '{"error": "NO_CHANGES", "message": "No changes detected"}'
      exit 1
    else
      echo -e "${YELLOW}Warning: No changes detected${NC}"
      echo "Staged files: $(git diff --cached --name-only | wc -l)"
      echo "Unstaged files: $(git diff --name-only | wc -l)"
      exit 0
    fi
  fi

  # Build changes list
  local changes_list=""
  local files_list=""

  # Parse changed files line by line using process substitution
  while IFS=$'\t' read -r file_status filepath; do
    # Skip empty lines
    if [ -z "$file_status" ] || [ -z "$filepath" ]; then
      continue
    fi

    local change_type=$(determine_change_type "$file_status")
    local file_stats=$(get_file_stats "$filepath")

    if [ -z "$changes_list" ]; then
      changes_list="- **$change_type**: \`$filepath\`"
      files_list="- \`$filepath\` ($file_stats)"
    else
      changes_list="$changes_list
- **$change_type**: \`$filepath\`"
      files_list="$files_list
- \`$filepath\` ($file_stats)"
    fi
  done < <(echo "$changed_files")

  # Output based on mode
  if [ "$JSON_MODE" = true ]; then
    format_json_output "$branch" "$datetime" "$date" "$SUMMARY" "$changes_list" "$files_list"
  else
    format_changelog_entry "$branch" "$datetime" "$SUMMARY" "$changes_list" "$files_list"
  fi
}

# Run main
main "$@"
