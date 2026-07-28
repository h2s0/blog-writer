'use client'

import { useActionState, useRef, useState } from 'react'
import { createPost } from '@/actions/post'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ImageUploader } from '@/components/features/post/image-uploader'

interface FormState {
  error?: string
}

export function PostForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [imageUrls, setImageUrls] = useState<string[]>([])

  const [state, action, pending] = useActionState<FormState, FormData>(
    async (_, formData) => {
      imageUrls.forEach((url) => formData.append('image_urls', url))
      const result = await createPost(formData)
      return result ?? {}
    },
    {}
  )

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-8">
      {/* 기본 정보 */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium">기본 정보</h2>

        <div className="flex flex-col gap-2">
          <Label htmlFor="keyword">키워드 (선택)</Label>
          <Input
            id="keyword"
            name="keyword"
            placeholder="예: 을지로 감성카페 — 입력하면 글 제목에 반영돼요"
          />
          <p className="text-muted-foreground text-xs">
            글 제목은 AI가 자동으로 생성해요. 키워드를 넣으면 제목에 포함하고, 비워두면 알아서 지어드려요.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="location">방문한 업체 이름</Label>
          <Input
            id="location"
            name="location"
            placeholder="예: 카페 온도"
            required
          />
        </div>
      </div>

      <Separator />

      {/* 이용 내역 */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium">이용한 서비스</h2>
        <div className="flex flex-col gap-2">
          <Label htmlFor="menu_items">이용 내역</Label>
          <Textarea
            id="menu_items"
            name="menu_items"
            placeholder={`이용하신 메뉴나 서비스, 가격을 한 줄에 하나씩 적어주세요.\n예:\n아메리카노 4,500원\n젤네일 케어 35,000원`}
            rows={5}
          />
        </div>
      </div>

      <Separator />

      {/* 추가 정보 */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium">추가 정보 (선택)</h2>
        <div className="flex flex-col gap-2">
          <Label htmlFor="extra_info">특이사항 / 분위기 / 느낀 점</Label>
          <Textarea
            id="extra_info"
            name="extra_info"
            placeholder={`AI가 글을 쓸 때 참고할 내용을 자유롭게 적어주세요.\n예: 주차 가능, 반려동물 동반 가능, 콘센트 많음, 조용한 분위기, 직원이 친절했음`}
            rows={4}
          />
          <p className="text-muted-foreground text-xs">
            자세히 적을수록 더 자연스러운 글이 나와요.
          </p>
        </div>
      </div>

      <Separator />

      {/* 사진 업로드 */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium">사진</h2>
        <p className="text-muted-foreground text-sm">
          사진을 업로드하면 AI가 내용을 파악해서 글에 자연스럽게 반영해요.
        </p>
        <ImageUploader onUploadComplete={setImageUrls} />
      </div>

      {state.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? '글 생성 중...' : '글 생성하기'}
      </Button>
    </form>
  )
}
