# CLAUDE.md — blog-writer

네이버 블로그 글 자동화 서비스. 사용자 말투를 학습해 정보+사진 입력만으로 복붙 가능한 완성본을 생성하는 웹 서비스.

> **중요**: Next.js 16은 v15 대비 breaking changes가 있음. 아래 패턴을 반드시 준수할 것.
> 모르는 API는 추측하지 말고 `node_modules/next/dist/docs/` 를 먼저 읽을 것.

---

## 기술 스택

| 영역 | 기술 | 버전 |
|---|---|---|
| 프레임워크 | Next.js App Router | 16.x |
| 언어 | TypeScript strict | 5.x |
| 스타일 | Tailwind CSS v4 | 4.x |
| 디자인 시스템 | shadcn/ui | 4.x (base-ui 기반) |
| DB/스토리지/인증 | Supabase | 2.x |
| AI | Anthropic Claude API | 0.x |
| 배포 | Vercel | — |

---

## 프로젝트 구조

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # 인증 route group
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/            # 보호된 route group
│   │   ├── layout.tsx          # 인증 guard
│   │   ├── dashboard/page.tsx
│   │   ├── posts/
│   │   └── settings/page.tsx
│   ├── api/                    # Route Handlers (외부 연동 전용)
│   ├── globals.css
│   └── layout.tsx
├── actions/                    # Server Functions (뮤테이션)
│   ├── post.ts
│   ├── style-sample.ts
│   └── image.ts
├── components/
│   ├── ui/                     # 디자인 시스템 Primitives
│   │   ├── button.tsx          # shadcn 기반 커스텀 컴포넌트
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   └── features/               # 기능 조합 컴포넌트
│       ├── style-sample/
│       ├── post-form/
│       ├── image-uploader/
│       └── post-preview/
├── hooks/                      # 커스텀 React 훅 (Client 전용)
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # createBrowserClient
│   │   └── server.ts           # createServerClient
│   ├── anthropic/
│   │   └── client.ts
│   └── utils.ts                # cn() 등
├── types/
│   ├── database.ts             # Supabase DB 타입
│   └── index.ts
└── constants/
    └── index.ts
```

---

## Next.js 16 핵심 패턴

### 1. 모든 Request API는 async (v16 breaking change)

`params`, `cookies`, `headers`, `draftMode` 모두 **반드시 await** 해야 함.

```tsx
// ✅ Good
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // ...
}

// ❌ Bad (v16에서 런타임 에러)
export default function Page({ params }: { params: { id: string } }) {
  const { id } = params.id
}
```

### 2. Server Components가 기본

레이아웃과 페이지는 기본적으로 Server Component. `'use client'`는 필요한 경우에만.

**`'use client'` 사용 조건:**
- `useState`, `useEffect` 등 React 훅 사용
- 이벤트 핸들러(`onClick`, `onChange` 등)
- 브라우저 전용 API (`localStorage`, `window` 등)
- 커스텀 훅

```tsx
// ✅ Good — Server Component에서 직접 데이터 페칭
export default async function PostList() {
  const supabase = await createServerClient()
  const { data } = await supabase.from('posts').select()
  return <PostCard posts={data ?? []} />
}

// ❌ Bad — 클라이언트에서 useEffect로 페칭
'use client'
export default function PostList() {
  const [posts, setPosts] = useState([])
  useEffect(() => { fetch('/api/posts').then(...) }, [])
}
```

### 3. 뮤테이션은 Server Functions (`actions/`)

`'use server'` 지시어를 파일 상단에 선언하거나 함수 내부에 인라인으로 선언.

```ts
// actions/post.ts
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(formData: FormData): Promise<void> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // ... 데이터 저장

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
```

**Route Handlers(`app/api/`)는 외부 연동 전용**: 웹훅 수신, 파일 스트리밍 등 Server Function으로 불가능한 경우에만.

### 4. 캐싱 — `use cache` 지시어 (v16 신규)

fetch는 기본적으로 캐시되지 않음. 캐시가 필요하면 `use cache` 사용.

```ts
import { cacheLife } from 'next/cache'

export async function getStyleSamples(userId: string) {
  'use cache'
  cacheLife('hours')
  const supabase = await createServerClient()
  const { data } = await supabase.from('style_samples').select().eq('user_id', userId)
  return data
}
```

### 5. Turbopack 기본 적용 (v16)

`next dev`, `next build` 모두 Turbopack이 기본. `--turbopack` 플래그 불필요.

---

## Supabase SSR 패턴 (`@supabase/ssr`)

```ts
// lib/supabase/server.ts — Server Component / Server Action / Route Handler용
import { createServerClient as _createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createServerClient() {
  const cookieStore = await cookies()
  return _createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

```ts
// lib/supabase/client.ts — Client Component 전용
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**절대 금지:**
- `@supabase/auth-helpers-nextjs` (deprecated)
- Server Component에서 `createBrowserClient` 사용
- Client Component에서 `createServerClient` 사용

---

## 디자인 시스템 규칙 (무조건 준수)

### 개발 순서
1. `components/ui/`에 디자인 시스템 프리미티브 먼저 구축
2. 프리미티브가 완성된 후 `components/features/`에서 조합

### 컴포넌트 계층

| 계층 | 위치 | 역할 | 예시 |
|---|---|---|---|
| Primitive | `components/ui/` | shadcn 기반, 재사용 가능한 최소 단위 | Button, Input, Card |
| Feature | `components/features/` | Primitive 조합, 도메인 특화 | PostForm, ImageUploader |
| Page | `app/**/page.tsx` | Feature 조합, 데이터 페칭 | — |

### 금지 패턴

```tsx
// ❌ Bad — feature 컴포넌트에서 raw Tailwind로 버튼 직접 구현
<button className="bg-blue-500 px-4 py-2 rounded-lg text-white hover:bg-blue-600">
  저장
</button>

// ✅ Good — 디자인 시스템 사용
import { Button } from '@/components/ui/button'
<Button variant="default">저장</Button>
```

```tsx
// ❌ Bad — Card를 div+className으로 직접 구현
<div className="bg-white rounded-xl shadow-md p-6">...</div>

// ✅ Good
import { Card, CardContent } from '@/components/ui/card'
<Card><CardContent>...</CardContent></Card>
```

**레이아웃/간격 Tailwind는 허용**: `flex`, `grid`, `gap-4`, `p-6`, `w-full` 등 레이아웃 관련 클래스는 feature 컴포넌트에서 직접 사용 가능.

---

## TypeScript 규칙

- **`strict: true`** — tsconfig.json 유지
- **`any` 완전 금지** — `unknown` + 타입 가드
- 모든 함수 반환 타입 명시
- 컴포넌트 props는 `interface`로 분리 정의
- Supabase 타입은 `types/database.ts`에서 중앙 관리

```ts
// ✅ Good
interface PostCardProps {
  post: Post
  onEdit?: (id: string) => void
}
export function PostCard({ post, onEdit }: PostCardProps) { ... }

// ❌ Bad
export function PostCard({ post, onEdit }: { post: any; onEdit: any }) { ... }
```

---

## 금지 안티패턴

| 안티패턴 | 이유 | 대안 |
|---|---|---|
| `any` 타입 | 타입 안전성 파괴 | `unknown` + 타입 가드 |
| `useEffect`로 서버 데이터 페칭 | 불필요한 클라이언트 번들, 워터폴 | Server Component + async/await |
| 3단계 이상 props drilling | 유지보수 불가 | React Context |
| 컴포넌트 200줄 초과 | 단일 책임 위반 | 컴포넌트 분리 |
| 매직 스트링/숫자 | 의도 불명확 | `constants/`에 상수 정의 |
| 비즈니스 로직을 UI 컴포넌트 내부에 | 재사용 불가 | `actions/` 또는 `hooks/`으로 분리 |
| Server Component에서 Route Handler 호출 | 불필요한 네트워크 왕복 | 직접 함수 호출 |
| 인라인 스타일 (`style={{}}`) | 디자인 시스템 우회 | Tailwind 토큰 |
| `default export` (Next.js pages 제외) | import 추적 어려움 | named export |
| `params`를 동기적으로 접근 | v16 breaking change | `await params` |
| `@supabase/auth-helpers-nextjs` | deprecated | `@supabase/ssr` |

---

## 네이밍 규칙

| 대상 | 규칙 | 예시 |
|---|---|---|
| 파일/디렉토리 | kebab-case | `post-card.tsx`, `use-posts.ts` |
| 컴포넌트 | PascalCase | `PostCard`, `ImageUploader` |
| 함수/변수 | camelCase | `createPost`, `isLoading` |
| 상수 | UPPER_SNAKE_CASE | `MAX_FREE_GENERATIONS` |
| 타입/인터페이스 | PascalCase | `Post`, `StyleSample` |
| Next.js 파일 | Next.js 규칙 (`page.tsx`, `layout.tsx`) | default export 사용 |
| 그 외 모든 컴포넌트/함수 | named export | `export function PostCard` |

---

## 환경변수

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=          # 클라이언트 노출 가능
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # 클라이언트 노출 가능
SUPABASE_SERVICE_ROLE_KEY=         # 서버 전용 — 절대 클라이언트 노출 금지
ANTHROPIC_API_KEY=                 # 서버 전용 — 절대 클라이언트 노출 금지
```

서버 전용 모듈 최상단에 `import 'server-only'` 추가 권장.

---

## DB 스키마 (Supabase)

```sql
-- 사용자별 스타일 학습 샘플
style_samples: id, user_id, content (text), created_at

-- 생성 요청/결과
posts: id, user_id, location, hours, menu_items (jsonb),
       generated_text, status ('draft'|'preview_ready'|'published'), created_at

-- 업로드 사진 + 분류 결과
post_images: id, post_id, storage_url,
             category ('exterior'|'interior'|'menu'|'food'|null),
             category_confirmed (boolean), sort_order

-- 구독 상태
subscriptions: id, user_id, plan ('free'|'pro'),
               generation_count_this_month, renewed_at
```

---

## MVP 개발 순서

1. **디자인 시스템** — `components/ui/` 프리미티브 완성
2. **Supabase 스키마** 마이그레이션
3. **인증** (Supabase Auth + route guard)
4. **정보 입력 폼** + 사진 업로드 UI
5. **Claude API 연동** (사진 분류 → 사용자 확인 → 텍스트 생성)
6. **완성본 미리보기** HTML 렌더링
7. **무료/구독 제한** 로직

---

## 커밋 규칙

### 메시지 형식

```
<type>(<scope>): <subject>
```

| type | 언제 |
|---|---|
| `feat` | 사용자에게 보이는 새 기능 |
| `fix` | 버그 수정 |
| `design` | `components/ui/` 추가/수정 |
| `refactor` | 동작 변경 없는 코드 개선 |
| `chore` | 의존성, 설정, 빌드 변경 |
| `docs` | 문서만 변경 |

scope 예시: `auth`, `post`, `image`, `design-system`, `db`, `config`

### 커밋 단위 원칙

- **레이어 단위로 커밋** — 설정 / 핵심 레이어(lib·types·constants) / 디자인 시스템 / 기능별 각각 분리
- **빌드·타입 에러 있는 상태로 커밋 금지** — 커밋 전 `npm run build` 통과 확인
- **관련 없는 변경 혼합 금지** — 디자인 시스템 작업 중 비즈니스 로직 수정이 생기면 별도 커밋
- **기능 단위 완성 즉시 커밋** — 오래 묵히지 않기
