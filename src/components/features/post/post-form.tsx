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
          <Label htmlFor="title">글 제목 (선택)</Label>
          <Input id="title" name="title" placeholder="예: 을지로 분위기 맛집 카페" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="location">장소명 / 위치</Label>
          <Input
            id="location"
            name="location"
            placeholder="예: 카페 온도, 서울 을지로 3가"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="hours">영업시간</Label>
          <Input
            id="hours"
            name="hours"
            placeholder="예: 평일 11:00~21:00, 주말 10:00~22:00"
          />
        </div>
      </div>

      <Separator />

      {/* 메뉴 정보 */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-medium">메뉴 및 가격</h2>
        <div className="flex flex-col gap-2">
          <Label htmlFor="menu_items">메뉴 목록</Label>
          <Textarea
            id="menu_items"
            name="menu_items"
            placeholder={`한 줄에 하나씩 입력해주세요.\n예:\n아메리카노 4,500원\n카페라떼 5,000원\n시그니처 음료 6,500원`}
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
