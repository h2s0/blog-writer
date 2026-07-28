import { NextRequest, NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'
import { createServerClient } from '@/lib/supabase/server'

interface GenerateRequest {
  postId: string
  userId: string
  samples: string[]
  keyword: string
  location: string
  menuItems: string
  extraInfo: string
  imageUrls: string[]
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body: GenerateRequest = await req.json()
  const { postId, userId, samples, keyword, location, menuItems, extraInfo, imageUrls } = body

  const supabase = await createServerClient()

  try {
    const systemPrompt = buildSystemPrompt(samples)
    const userMessage = await buildUserMessage({ keyword, location, menuItems, extraInfo, imageUrls })

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: systemPrompt,
      tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 3 }],
      messages: [{ role: 'user', content: userMessage }],
    })

    const rawText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
    const { title, body: generatedText } = parseGeneratedResponse(rawText)

    await supabase
      .from('posts')
      .update({ title, generated_text: generatedText, status: 'done' })
      .eq('id', postId)
      .eq('user_id', userId)

    return NextResponse.json({ ok: true })
  } catch {
    await supabase
      .from('posts')
      .update({ status: 'draft' })
      .eq('id', postId)
      .eq('user_id', userId)

    return NextResponse.json({ error: '생성 실패' }, { status: 500 })
  }
}

function buildSystemPrompt(samples: string[]): string {
  const sampleText = samples
    .map((s, i) => `[샘플 ${i + 1}]\n${s}`)
    .join('\n\n')

  return `당신은 사용자의 블로그 글을 대신 써주는 AI입니다. 업로드된 샘플의 말투를 학습하고, 사용자가 제공한 기본 정보와 사진을 바탕으로 블로그에 바로 올릴 후기 글을 작성합니다.

아래는 이 사용자가 직접 쓴 블로그 글 샘플입니다. 이 글들의 말투, 문체, 표현 방식, 이모지 사용 패턴을 완벽히 학습하여 새 글을 작성하세요.

${sampleText}

## 정보 처리 원칙

1. 필수 정보는 업체명, 시킨 메뉴(또는 이용한 서비스), 그에 대한 감상 세 가지입니다. 이 중 하나라도 내용이 비어있거나 알 수 없으면 본문을 작성하지 말고, 어떤 정보가 부족한지 짧게 안내하는 메시지만 출력하세요.
2. 위치 설명(가까운 역에서 도보 몇 분 등)이나 영업시간처럼 사용자가 알려주지 않은 정보는 web_search 도구로 검색해서 채우세요. 검색으로도 확인되지 않으면 구체적인 수치나 사실을 지어내지 말고, 방문 전 확인을 권하는 정도의 일반적인 문구로 대체하세요.
3. 화장실/주차 정보, 특별했던 에피소드, 업체 측에서 넣어달라고 요청한 내용 등은 사용자가 "추가 정보"로 제공한 경우에만 선택적으로 반영하세요.
4. 본문은 공백 제외 최소 1000자 이상 작성하세요. 제공된 정보만으로 1000자를 채우기 어렵다면 본문 대신, 채워야 할 감상이나 디테일을 구체적으로 묻는 질문 목록을 출력하세요.

## 글 구성 순서

아래 순서를 기본 골격으로 삼아 자연스럽게 이어지는 글을 쓰세요. 해당하는 사진이나 정보가 없는 항목은 자연스럽게 생략하세요.

1. 인사말 (썸네일이 될 만한 사진을 글 도입부에 배치)
2. 위치 정보 — 업체 이름과 대략적인 위치, 가까운 역/정류장에서 도보 시간 등
3. 외관 사진과 짧은 설명
4. 영업시간
5. 메뉴판 사진과 전체적인 메뉴 구성 코멘트
6. 실제로 시킨 메뉴 사진, 가격 정보, 맛에 대한 한줄평
7. 내부 사진과 설명 — 좌석 구성(단체석/개인석 수 등) 정보가 주어졌다면 반영하고, 없다면 언급하지 마세요
8. 화장실, 주차 정보 (제공된 경우에만)
9. 마무리 — 어떤 사람에게 추천하고 싶은지로 정리

## 사진 배치 규칙

5. 제공된 각 사진의 내용을 보고 외관/내부/메뉴판/음식 중 어디에 해당하는지 스스로 판단한 뒤, 위 글 구성 중 알맞은 위치에 [사진 1], [사진 2] 형태로 자연스럽게 배치하세요.

## 서식 규칙

6. 마크다운 서식(##, **, 백틱 등)을 절대 사용하지 마세요. 네이버 블로그에 바로 복붙할 수 있는 순수 텍스트만 출력하세요.
7. 위치, 영업시간, 내부 사진 등 주제가 바뀌는 지점에는 ▶, ◆ 같은 기호나 이모지로 시작하는 짧은 소제목 줄을 넣어 눈에 띄게 구분하세요. 마크다운 굵게/글자 크기는 쓸 수 없으니 기호로 대체합니다.
8. 한 문장이 끝나면 반드시 줄바꿈하세요. 문장이 길어지면 모바일 화면에서 읽기 좋도록 적절한 지점에서 한 번 더 줄바꿈하세요. 문장을 줄줄이 이어 쓰지 마세요.
9. 응답의 첫 줄은 반드시 "제목: {글 제목}" 형식으로 시작하세요. 제목에는 마크다운이나 특수기호를 쓰지 마세요. 그다음 빈 줄을 하나 넣고 이어서 본문을 작성하세요.
10. SEO 키워드가 제공된 경우, 제목에 그 키워드를 자연스럽게 포함하세요. 키워드가 없다면 방문한 업체 이름이나 글의 특징을 살려 자유롭게 제목을 지으세요.
11. 위 샘플의 말투와 문체를 그대로 유지하세요. AI가 쓴 것처럼 느껴지면 안 됩니다.
12. 사진 설명을 보고 실제로 그 장소에 방문한 것처럼 생생하게 묘사하세요.`
}

function parseGeneratedResponse(rawText: string): { title: string | null; body: string } {
  const match = rawText.match(/^제목:\s*(.+)\r?\n\r?\n?([\s\S]*)$/)
  if (!match) return { title: null, body: rawText.trim() }
  return { title: match[1].trim(), body: match[2].trim() }
}

async function buildUserMessage({
  keyword,
  location,
  menuItems,
  extraInfo,
  imageUrls,
}: Omit<GenerateRequest, 'postId' | 'userId' | 'samples'>): Promise<
  Anthropic.MessageParam['content']
> {
  const infoText = [
    keyword && `SEO 키워드: ${keyword}`,
    location && `방문한 업체: ${location}`,
    menuItems && `이용한 서비스:\n${menuItems}`,
    extraInfo && `추가 정보: ${extraInfo}`,
    `사진 수: ${imageUrls.length}장`,
  ]
    .filter(Boolean)
    .join('\n')

  if (imageUrls.length === 0) {
    return `다음 정보로 블로그 후기 글을 작성해주세요.\n\n${infoText}`
  }

  const content: Anthropic.MessageParam['content'] = []

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i]
    content.push({
      type: 'text',
      text: `[사진 ${i + 1}]`,
    })

    const imageResponse = await fetch(url)
    const imageBuffer = await imageResponse.arrayBuffer()
    const base64 = Buffer.from(imageBuffer).toString('base64')
    const mediaType = (imageResponse.headers.get('content-type') ?? 'image/jpeg') as
      | 'image/jpeg'
      | 'image/png'
      | 'image/gif'
      | 'image/webp'

    content.push({
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: base64 },
    })
  }

  content.push({
    type: 'text',
    text: `위 사진들을 참고하여 다음 정보로 블로그 후기 글을 작성해주세요.\n\n${infoText}\n\n사진은 본문에서 [사진 1], [사진 2] 형태로 적절한 위치에 배치하세요.`,
  })

  return content
}

// Anthropic SDK 타입 import
import type Anthropic from '@anthropic-ai/sdk'
