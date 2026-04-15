# Changelog

## [2026-04-16]
### 시간 표기 — 브라우저 로컬 시간
- `Matches.tsx`, `Predictions.tsx`: 경기 시간을 KST 고정에서 **접속자 브라우저 로컬 시간**으로 변경 (`toLocaleString(undefined, ...)`)

### 경기 예측 UI 추가 (A+C 방식)
- `frontend/src/pages/Predictions.tsx` 신규 생성 — 리그 선택 후 "예측 실행" 버튼으로 오늘 경기 홈승/무/원정승 확률 표 표시
- `Layout.tsx` — 사이드바에 "경기 예측" 메뉴 추가 (Sparkles 아이콘)
- `App.tsx` — `/predictions` 라우트 추가
- `Dashboard.tsx` — 대시보드 진입 시 EPL 오늘 경기 예측 자동 로드, 요약 카드 실시간 반영, "예측 페이지" 링크 추가

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
