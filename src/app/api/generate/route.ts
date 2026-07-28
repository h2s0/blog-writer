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
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const rawText =
      response.content[0].type === 'text' ? response.content[0].text : ''
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

  return `당신은 사용자의 블로그 글을 대신 써주는 AI입니다.

아래는 이 사용자가 직접 쓴 블로그 글 샘플입니다. 이 글들의 말투, 문체, 표현 방식, 이모지 사용 패턴을 완벽히 학습하여 새 글을 작성하세요.

${sampleText}

## 반드시 지켜야 할 규칙

1. 위 샘플의 말투와 문체를 그대로 유지하세요. AI가 쓴 것처럼 느껴지면 안 됩니다.
2. 사진 위치는 [사진 1], [사진 2] 형태로 본문 중간중간에 자연스럽게 배치하세요.
3. 마크다운 서식(##, **, 백틱 등)을 절대 사용하지 마세요. 네이버 블로그에 바로 복붙할 수 있는 순수 텍스트만 출력하세요.
4. 응답의 첫 줄은 반드시 "제목: {글 제목}" 형식으로 시작하세요. 제목에는 마크다운이나 특수기호를 쓰지 마세요. 그다음 빈 줄을 하나 넣고 이어서 본문을 작성하세요.
5. SEO 키워드가 제공된 경우, 제목에 그 키워드를 자연스럽게 포함하세요. 키워드가 없다면 방문한 업체 이름이나 글의 특징을 살려 자유롭게 제목을 지으세요.
6. 제공된 정보(장소, 이용한 서비스 등)를 자연스럽게 녹여 쓰세요.
7. 사진 설명을 보고 실제로 그 장소에 방문한 것처럼 생생하게 묘사하세요.`
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
