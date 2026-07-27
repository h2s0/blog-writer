-- ============================================================
-- blog-writer 초기 스키마
-- Supabase 대시보드 > SQL Editor 에서 실행
-- ============================================================

-- UUID 확장 활성화
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. 말투 학습 샘플
-- ============================================================
create table style_samples (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

alter table style_samples enable row level security;

create policy "본인 샘플만 조회" on style_samples
  for select using (auth.uid() = user_id);

create policy "본인 샘플만 생성" on style_samples
  for insert with check (auth.uid() = user_id);

create policy "본인 샘플만 삭제" on style_samples
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 2. 글 생성 요청/결과
-- ============================================================
create table posts (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  title          text,
  location       text,
  hours          text,
  menu_items     jsonb,
  extra_info     text,
  generated_text text,
  status         text not null default 'draft'
                 check (status in ('draft', 'generating', 'done')),
  created_at     timestamptz not null default now()
);

alter table posts enable row level security;

create policy "본인 글만 조회" on posts
  for select using (auth.uid() = user_id);

create policy "본인 글만 생성" on posts
  for insert with check (auth.uid() = user_id);

create policy "본인 글만 수정" on posts
  for update using (auth.uid() = user_id);

create policy "본인 글만 삭제" on posts
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 3. 업로드 사진
-- ============================================================
create table post_images (
  id         uuid primary key default uuid_generate_v4(),
  post_id    uuid not null references posts(id) on delete cascade,
  storage_url text not null,
  sort_order  int not null default 0
);

alter table post_images enable row level security;

create policy "본인 글 사진만 조회" on post_images
  for select using (
    exists (
      select 1 from posts
      where posts.id = post_images.post_id
        and posts.user_id = auth.uid()
    )
  );

create policy "본인 글 사진만 생성" on post_images
  for insert with check (
    exists (
      select 1 from posts
      where posts.id = post_images.post_id
        and posts.user_id = auth.uid()
    )
  );

create policy "본인 글 사진만 삭제" on post_images
  for delete using (
    exists (
      select 1 from posts
      where posts.id = post_images.post_id
        and posts.user_id = auth.uid()
    )
  );

-- ============================================================
-- 4. 구독/사용량
-- ============================================================
create table subscriptions (
  id                          uuid primary key default uuid_generate_v4(),
  user_id                     uuid not null unique references auth.users(id) on delete cascade,
  plan                        text not null default 'free'
                              check (plan in ('free', 'pro')),
  generation_count_this_month int not null default 0,
  renewed_at                  timestamptz not null default now()
);

alter table subscriptions enable row level security;

create policy "본인 구독 정보만 조회" on subscriptions
  for select using (auth.uid() = user_id);

-- 신규 가입 시 free 플랜 자동 생성
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into subscriptions (user_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- 5. Storage 버킷
-- ============================================================
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict do nothing;

create policy "인증된 사용자만 업로드" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-images');

create policy "누구나 조회 가능" on storage.objects
  for select using (bucket_id = 'post-images');

create policy "본인 파일만 삭제" on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);
