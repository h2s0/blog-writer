import { NextRequest, NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client'
import { createServerClient } from '@/lib/supabase/server'

interface GenerateRequest {
  postId: string
  userId: string
  samples: string[]
  location: string
  hours: string
  menuItems: string
  extraInfo: string
  imageUrls: string[]
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body: GenerateRequest = await req.json()
  const { postId, userId, samples, location, hours, menuItems, extraInfo, imageUrls } = body

  const supabase = await createServerClient()

  try {
    const systemPrompt = buildSystemPrompt(samples)
    const userMessage = await buildUserMessage({ location, hours, menuItems, extraInfo, imageUrls })

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const generatedText =
      response.content[0].type === 'text' ? response.content[0].text : ''

    await supabase
      .from('posts')
      .update({ generated_text: generatedText, status: 'done' })
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
4. 글 제목은 출력하지 마세요. 본문만 작성하세요.
5. 제공된 정보(위치, 영업시간, 메뉴, 가격 등)를 자연스럽게 녹여 쓰세요.
6. 사진 설명을 보고 실제로 그 장소에 방문한 것처럼 생생하게 묘사하세요.`
}

async function buildUserMessage({
  location,
  hours,
  menuItems,
  extraInfo,
  imageUrls,
}: Omit<GenerateRequest, 'postId' | 'userId' | 'samples'>): Promise<
  Anthropic.MessageParam['content']
> {
  const infoText = [
    location && `장소: ${location}`,
    hours && `영업시간: ${hours}`,
    menuItems && `메뉴:\n${menuItems}`,
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
