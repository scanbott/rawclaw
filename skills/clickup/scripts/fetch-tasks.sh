#!/bin/bash
# Fetch all tasks assigned to Chris West from Founders Kanban
source ~/.zshrc
PROJECT_ROOT=$(git -C ~/BusinessOS rev-parse --show-toplevel 2>/dev/null || echo ~/BusinessOS)
source "$PROJECT_ROOT/.env"
curl -s -X GET "https://api.clickup.com/api/v2/list/901326628160/task?archived=false&include_closed=false&subtasks=true&assignees[]=144069077&page=0" \
  -H "Authorization: $CLICKUP_API_KEY" \
  -H "Content-Type: application/json"
