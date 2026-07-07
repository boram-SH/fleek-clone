# Fleek Clone — 로컬 오프라인 운동 기록 앱

운동앱 **Fleek**(안드로이드)의 핵심 기능을 조사해 로컬 우선(offline-first) PWA로 재구축한 프로젝트입니다.
조사 과정과 설계는 [PLAN.md](PLAN.md), 원본 리서치는 [docs/](docs/) 참고.

## 실행

```bash
npm install
npm run dev      # http://localhost:5199
npm run build    # dist/ 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

안드로이드 폰에서 쓰려면: 같은 Wi-Fi에서 `npx vite --host`로 띄운 뒤 폰 브라우저로 접속 →
"홈 화면에 추가"(PWA 설치). 모든 데이터는 기기 localStorage에만 저장됩니다(서버 없음).

## 기능

- **운동 라이브러리** — 57개 시드 종목(주동근/협응근 매핑) + 커스텀 운동(통계 동급 지원)
- **루틴 빌더** — 운동 순서·목표 세트/횟수/무게·운동별 휴식 시간, 타깃 근육 해부도 미리보기
- **워크아웃 로깅** — 이전 기록 자동 채움, 세트 타입(웜업 W/드롭 D/실패 F — 세트 번호 탭으로 전환),
  세트 완료 시 휴식 타이머 자동 시작(+15/−15/건너뛰기, 종료 알림음), 진행 중 세션은 새로고침에도 유지
- **운동 요약** — 회차·시간·볼륨·칼로리(MET 추정)·강도(kg/min) + 세션 근육 히트맵 + PR 배지
- **기록** — 월 캘린더 + 일별 리스트, 과거 기록 수정/삭제/반복
- **운동별 기록** — Top Records(1RM MAX·WEIGHT MAX·VOLUME MAX), 최근 기록, e1RM/볼륨 추이 차트
- **통계** — 근육 피로도 해부도(지수 감쇠 모델 + 14일 시간 슬라이더), Used Muscle(7/30/90일/전체), 주간 볼륨
- **설정** — 체중, 기본 휴식 시간, JSON 백업 내보내기/가져오기

## 구조

```
src/
  types.ts            도메인 타입 (Exercise/Routine/Workout/Set)
  store.tsx           전역 상태 + localStorage 영속화
  data/               시드 운동 57종, 근육 17부위 정의
  lib/
    formulas.ts       Epley 1RM, 볼륨, 포맷터
    fatigue.ts        근육 피로도 엔진 (감쇠 τ: 대근육 34h / 소근육 22h)
    history.ts        이전 세트, Top Records, PR 감지, 주간/차트 시리즈
    storage.ts        localStorage 로드/저장/백업
  components/         BodyMap(해부도 SVG), 차트, 휴식 타이머, 운동 선택기 등
  screens/            홈 · 루틴 · 로깅 · 기록 · 통계 · 라이브러리
```

Fleek이 공개하지 않은 피로도 공식은 업계 표준(Fitbod/Hevy 관례)으로 재구성했습니다 —
세트 임펄스(주동 1.0/협응 0.5) × 지수 감쇠, 하드세트 6개 ≈ 피로 100%, 7일 창.
