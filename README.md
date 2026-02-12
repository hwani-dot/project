# 운세 웹앱

오늘의 운세, 타로, 오하아사(별자리 순위)를 한 번에 제공하는 모바일 우선 웹앱입니다.

## 기능

1. **오늘의 운세** - 생년월일/닉네임 기반 개인화 운세 (총운, 연애, 금전, 학업, 건강)
2. **타로** - 1장 또는 3장 스프레드
3. **오하아사** - 날짜별 12별자리 운세 순위 (1~12위, 날짜 선택 가능)

## 기술 스택

- Next.js 16 (App Router) + TypeScript
- TailwindCSS + shadcn/ui
- SQLite + Prisma
- OpenAI API (서버에서만 호출)

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 변수를 설정합니다:

```env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="your-openai-api-key"
```

### 3. 데이터베이스 마이그레이션

```bash
npx prisma migrate dev
```

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

### 5. 프로덕션 빌드

```bash
npm run build
npm start
```

## 폴더 구조

```
src/
├── app/
│   ├── api/fortune/        # API 라우트
│   │   ├── today/           # 오늘의 운세
│   │   ├── tarot/           # 타로
│   │   └── ohahasa/         # 오하아사
│   ├── api/share/           # 공유 저장
│   ├── service/             # 결과 페이지
│   │   ├── today/
│   │   ├── tarot/
│   │   └── ohahasa/
│   ├── start/               # 정보 입력
│   ├── history/             # 히스토리
│   └── r/[id]/              # 공유 링크
├── components/
│   ├── ui/                  # shadcn 컴포넌트
│   └── fortune/              # Disclaimer 등
├── data/
│   ├── zodiac.ts            # 12별자리 정의
│   └── tarot.json           # 78장 타로 카드 메타데이터
├── lib/
│   ├── zodiac.ts            # 생일→별자리 매핑
│   ├── history.ts           # localStorage 히스토리
│   ├── seed.ts              # 결정론적 셔플
│   └── prisma.ts            # Prisma 클라이언트
└── types/
    └── fortune.ts           # API 응답 타입
```

## 주요 라우팅

| 경로 | 설명 |
|------|------|
| `/` | 랜딩 (3가지 기능 카드) |
| `/start` | 개인정보 입력 (stepper 폼) |
| `/service/today` | 오늘의 운세 결과 |
| `/service/tarot` | 타로 결과 |
| `/service/ohahasa` | 오하아사 (날짜별 별자리 순위) |
| `/history` | 최근 결과 목록 |
| `/r/[id]` | 공유된 결과 페이지 |

## 5일 개발 플랜

| 일차 | 작업 |
|------|------|
| 1일차 | 프로젝트 스캐폴딩, 폴더 구조, 데이터(zodiac, tarot) |
| 2일차 | 랜딩, start, 오하아사 그리드 UI |
| 3일차 | API 라우트 (today, tarot, ohahasa), JSON 스키마 |
| 4일차 | 로컬 히스토리, 공유 저장, /r/[id] |
| 5일차 | 다듬기, 배포(Vercel), README |

## 배포 (Vercel)

- Vercel 프로젝트에 연결 후 배포
- `DATABASE_URL`은 SQLite 파일 경로 대신 Vercel Postgres 또는 별도 DB 사용 권장
- `OPENAI_API_KEY` 반드시 환경 변수로 설정

## 면책

본 서비스는 오락/참고용이며, 과학적 근거가 없습니다. 모든 결과 페이지 하단에 면책 문구가 표시됩니다.
