#!/bin/bash
set -e

echo "=== Sports Predict 배포 ==="

TARGET=${1:-all}
SERVER="cococoin-old"
REMOTE_DIR="/opt/sports-predict"

# 1. git push
echo "→ git push..."
git add -A && git commit -m "deploy: $(date +%Y%m%d-%H%M%S)" 2>/dev/null && git push || git push

# 2. 서버 pull
echo "→ 서버 git pull..."
ssh $SERVER "cd $REMOTE_DIR && git fetch origin && git reset --hard origin/main"

# 3. 빌드 & 재시작
if [[ "$TARGET" == "all" || "$TARGET" == "backend" ]]; then
    echo "→ 백엔드 빌드 & 재시작..."
    ssh $SERVER "cd $REMOTE_DIR && docker compose build backend && docker compose up -d backend"
fi

if [[ "$TARGET" == "all" || "$TARGET" == "frontend" ]]; then
    echo "→ 프론트엔드 빌드..."
    ssh $SERVER "cd $REMOTE_DIR/frontend && npm install && npm run build"
    ssh $SERVER "docker restart sp-nginx"
fi

# 4. 검증
echo "→ 검증..."
sleep 3
ssh $SERVER "curl -s http://localhost:80/health"
echo ""
echo "→ HEAD: $(git rev-parse --short HEAD)"
ssh $SERVER "cd $REMOTE_DIR && git rev-parse --short HEAD"

echo "=== 배포 완료 ==="
