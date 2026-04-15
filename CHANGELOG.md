# Changelog

## [2026-04-16]
### 초기 배포
- 프로젝트 서버 배포 완료 (`/opt/sports-predict` on Hetzner)
- Docker Compose: sp-backend, sp-db (PostgreSQL 16), sp-redis (Redis 7), sp-nginx
- nginx 포트 8081 (기존 APEX 프로젝트 80/443 충돌 회피)
- 방화벽 8081/tcp 개방
- 프론트엔드 빌드 + 서빙 확인 (http://95.216.149.254:8081)
- 백엔드 Health API, Odds API, Stats API, Predictions API 정상 동작 확인
- deploy.sh SSH 호스트 `cococoin`으로 수정, server_name 범용(`_`) 설정

## [2026-04-15]
### 프로젝트 초기 셋업
- FastAPI 백엔드 (asyncpg, ELO+포아송 하이브리드 예측 모델)
- React + Vite + TypeScript + Tailwind 프론트엔드 (Dashboard, Matches, ValueBets)
- Docker Compose 구성 (backend, postgres, redis, nginx)
- The Odds API + API-Sports 연동
