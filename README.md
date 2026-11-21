# FiveYears, 오년의 기록

같은 날의 다섯 해를 한 펼침면에 겹쳐 쓰는 종이 다이어리 웹 앱입니다. 오늘 날짜를 펼치면 2023년부터 2027년까지 다섯 칸이 나란히 놓이고, 오른쪽 페이지에는 그날의 프리노트, 기분과 날씨, 사진 세 장, 해마다의 한 줄이 남습니다. 모든 기록은 브라우저의 `localStorage`에만 저장됩니다.

- 스택: React 19 + TypeScript + Vite 7 + Tailwind CSS 4 (preflight) + lucide-react + framer-motion
- 기본 언어: 한국어. 헤더와 설정에서 English, 日本語로 전환할 수 있습니다.
- 배포: `base: './'` 상대 경로. GitHub Pages 하위 경로, Vercel, Netlify, 정적 호스팅 어디서든 `dist`만 올리면 동작합니다.

## 실행

```bash
npm install
npm run dev      # 개발 서버
npm run build    # tsc --noEmit + vite build → dist/
npm run preview  # dist 미리보기
```

Node 20.19 이상 또는 22.12 이상을 권장합니다. (Vite 7 기준. Node 22.11에서도 빌드는 성공하지만 버전 경고가 출력됩니다.)

## 요구사항 대응

| 항목 | 구현 |
| --- | --- |
| F1 5년 펼침면 | `#E8E2D9` 책상, 버건디 레더 커버, `#FAF7F0` 종이에 19px 모눈, 중앙 제본선. 좌측 5개년 타임라인, 우측 프리노트와 스크랩보드. 768px 이하에서는 상단 세그먼트 탭으로 좌우 페이지 전환 |
| F2 날짜 탐색 | 우측 가장자리 12개월 계단식 인덱스(모바일은 가로 월 스트립), 이전 날과 다음 날, 오늘로 이동, 미니 캘린더(기록한 날 점 표시), 랜덤 시간여행 |
| F3 기록과 회고 | 연도 칸 클릭 즉시 인라인 편집, 500ms 디바운스 자동 저장(`five_years_diary_v1`), 우측 하단 `저장됨 ✓`, 연도별 요일 자동 계산, 올해 강조, `N년 전 오늘의 기록이 기다리고 있어요` 배지와 해당 칸 포커스, 과거 연도 소급 입력, 2월 29일 페이지와 윤년이 아닌 해의 비활성 안내 |
| F4 타임머신 데모 | 첫 진입 배너와 헤더 토글. 오늘 기준 앞뒤 2일, 2023년부터 2026년까지 취업 준비에서 신입, 프로젝트 리드, 현재의 여유로 이어지는 한국어 샘플 일기 20편과 프리노트, 기분과 날씨, 해마다의 한 줄. 데모는 실제 기록 위에 얹히는 층이라 끄면 원래 기록만 남고, 데모 위에 쓴 글은 내 기록으로 저장됩니다 |
| F5 통계와 백업 | 연간 잔디(연도 5행 × 주 53열), 기록한 날, 일기 편수, 연속 기록과 최장 기록, 가장 많이 쓴 달, JSON 내보내기와 불러오기, 설정에서 시작 연도, 명조와 고딕, 이름, 언어 변경 |

### 사진 처리

최대 3장. `createImageBitmap`으로 읽어 가로 800px, JPEG 품질 0.7로 다시 그린 뒤 Base64 data URL로 저장합니다. 원본 파일은 서버로 전송되지 않습니다.

### 데이터

`localStorage` 키 하나에 전체 상태가 들어갑니다.

```json
{
  "version": 1,
  "startYear": 2023,
  "userName": "",
  "font": "serif",
  "lang": "ko",
  "demoActive": false,
  "entries": { "2026-11-21": "..." },
  "notes": {
    "11-21": {
      "freeNote": "",
      "mood": "calm",
      "weather": "sun",
      "photos": ["data:image/jpeg;base64,..."],
      "highlights": { "2024": "..." }
    }
  }
}
```

`entries`는 연도별 기록(YYYY-MM-DD), `notes`는 날짜별 공통 페이지(MM-DD)입니다. 백업 파일은 같은 구조의 JSON이며, 불러오기 전에 덮어쓰기 확인을 거칩니다.

## 디자인과 검증

- 디자인 시스템은 `src/styles/app.css`의 `:root` 토큰 한 곳에서만 색과 글꼴을 정의합니다. oklch 색, 4px 간격, 명조(Noto Serif KR)와 고딕(Pretendard), 표지 숫자(Playfair Display) 세 벌의 글꼴.
- Hallmark `sloplint` (v2.0.0, `--scope app --genre editorial`): 정적 검사와 렌더 검사 모두 **0 FAIL, 0 REFLEX, 0 WARN**.
- Playwright E2E `tests/e2e.py`: **58/58 통과**. 데모 채우기, 인라인 편집과 새로고침 유지, 월 인덱스, 2월 29일 윤년 처리, 통계, 설정의 글꼴과 시작 연도와 언어, JSON 내보내기와 불러오기, 기분과 하이라이트, 사진 리사이즈(800px JPEG), 랜덤 시간여행, 320px부터 1920px까지 가로 오버플로 0, 콘솔 에러 0.
- 경계 동작 `tests/edge.py`: **13/13 통과**. 데모를 끈 뒤 내 기록 유지, 잘못된 백업 파일 안내, 언어 전환과 새로고침 유지, 사진 4장 선택 시 3장만 저장하고 안내 표시.
- 스크린샷: `browser/fiveyears-desktop.png`, `browser/fiveyears-demo.png`, `browser/fiveyears-mobile.png`, `browser/fiveyears-stats.png`.

### Astryx 기준 점검

Astryx는 Meta의 디자인 시스템이라 이 프로젝트에는 `@astryxdesign/cli`나 Astryx 컴포넌트가 설치되어 있지 않습니다. Astryx 문서는 설치된 invocation이 없을 때 다른 버전의 CLI를 내려받아 검사하지 말고 증거 공백을 밝히라고 하므로, 공개된 Design Conventions의 객관 항목을 렌더된 화면과 DOM에서 확인했습니다.

- 토큰: 모든 색과 글꼴이 `:root` 토큰에서만 나옵니다 (sloplint 48 통과).
- 4px 그리드: `padding`/`margin`/`gap` 값이 모두 4px 배수입니다 (sloplint 24b 통과).
- AA 대비: 본문, 아이콘, 필드 테두리 대비가 기준을 넘습니다 (sloplint 40 통과).
- 모션 안전: `prefers-reduced-motion: reduce`에서 transition이 0.01ms로 떨어지고, framer-motion은 `useReducedMotion`을 따릅니다.
- 포커스: 모든 상호작용 요소에 즉시 표시되는 `:focus-visible`이 있고, 모달은 Tab 순환을 가둡니다.
- 아이콘: lucide 한 라이브러리만 쓰고 SVG 9개 모두 `aria-hidden` 또는 이름을 가집니다.
- 반지름: 역할별 토큰(2, 3, 4, 6, 8, 10, 12, 14, 999)만 쓰고 리터럴이 없습니다.
- 문서: `lang`, `title`, meta description, h1 하나, h1에서 h2, h3로 이어지는 제목 순서를 확인했습니다.
- 확인하지 못한 항목: Astryx 컴포넌트가 화면의 패턴을 소유하는지. 이 프로젝트는 Astryx 앱이 아니라 React 자체 컴포넌트를 씁니다.

## 배포

`dist` 폴더를 그대로 올리면 됩니다. 저장소를 GitHub에 올리고 Pages를 Actions로 배포하려면 포함된 `.github/workflows/deploy.yml`을 사용하세요. 설정에서 Pages 소스를 `GitHub Actions`로 두면 `main` 브랜치 푸시마다 빌드와 배포가 실행됩니다.

## 알려진 한계

- 기록은 브라우저 저장소에만 있습니다. 기기를 바꾸거나 저장소를 지우면 사라지므로 설정의 JSON 내보내기로 백업해야 합니다.
- 사진은 리사이즈해도 3장이면 수백 KB가 되므로 `localStorage` 한도(보통 5MB)에 유의해야 합니다. 한도를 넘으면 저장이 실패하고 상태 표시가 조용해집니다.
- 데모 기록은 앱을 연 날의 앞뒤 날짜를 기준으로 만들어지므로 날짜가 바뀌면 데모의 날짜도 함께 움직입니다.
- 2월 29일은 다섯 해 중 윤년인 해에만 쓸 수 있고, 나머지 해에는 안내 문구가 표시됩니다.
