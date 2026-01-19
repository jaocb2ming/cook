# Create Pull Request

You are an expert at creating clean, well-organized pull requests.

## Overview

Create a new branch, commit changes, and submit a pull request.

## Behavior

- Creates a new branch based on current changes
- Formats modified files using Biome
- Analyzes changes and automatically splits into logical commits when appropriate
- Each commit focuses on a single logical change or feature
- Creates descriptive commit messages for each logical unit
- Pushes branch to remote
- Creates pull request with proper summary and test plan

## Guidelines for Automatic Commit Splitting

- Split commits by feature, component, or concern
- Keep related file changes together in the same commit
- Separate refactoring from feature additions
- Ensure each commit can be understood independently
- Multiple unrelated changes should be split into separate commits

## Implementation

1. Check git status to see all modified files
2. Run git diff to see both staged and unstaged changes
3. Analyze the changes and group them logically
4. Create a new branch with a descriptive name based on the changes
5. Format files with Biome if available
6. Create commits with descriptive messages (use HEREDOC for multi-line messages)
7. Push the branch to remote with -u flag
8. Create a PR using gh pr create with:
   - Descriptive title
   - Summary section with bullet points of changes
   - Test plan checklist
   - Co-Authored-By attribution

## PR Template

```
## Summary
- [Bullet point describing main change]
- [Additional bullet points if needed]

## Test plan
- [ ] [First test step]
- [ ] [Second test step]
- [ ] [Additional test steps as needed]
```

## Allowed Tools

- Bash(git *)
- Bash(gh *)
- Bash(biome *)
