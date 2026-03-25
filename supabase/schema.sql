-- Conversations table (WhatsApp + Instagram)
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  phone_number text unique,
  platform text not null default 'whatsapp',
  ig_user_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- WhatsApp Agent: messages table
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_messages_conversation on messages(conversation_id, created_at);
create index if not exists idx_conversations_updated on conversations(updated_at desc);

-- Enable RLS
alter table conversations enable row level security;
alter table messages enable row level security;

-- Service role bypasses RLS automatically.
-- Authenticated users can read all conversations and messages:
create policy "auth_read_conversations" on conversations
  for select to authenticated using (true);

create policy "auth_read_messages" on messages
  for select to authenticated using (true);

-- Enable realtime
alter publication supabase_realtime add table conversations;
alter publication supabase_realtime add table messages;

-- ============================================================
-- Instagram Posts (scheduling + history)
-- ============================================================
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  topic text,
  angle text,
  format text default 'фото-пост',
  caption text not null,
  hashtags text,
  image_url text not null,
  image_preview text,
  status text not null default 'draft'
    check (status in ('draft','scheduled','publishing','published','failed')),
  scheduled_at timestamptz,
  published_at timestamptz,
  instagram_media_id text,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_posts_status on posts(status);
create index if not exists idx_posts_scheduled on posts(scheduled_at)
  where status = 'scheduled';

-- ============================================================
-- A/B Tests
-- ============================================================
create table if not exists ab_tests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  campaign_id text,
  ad_set_id text,
  status text not null default 'draft'
    check (status in ('draft','active','completed')),
  winner_variant_id uuid,
  created_at timestamptz default now()
);

create table if not exists ab_test_variants (
  id uuid primary key default gen_random_uuid(),
  ab_test_id uuid not null references ab_tests(id) on delete cascade,
  variant_label text not null,
  primary_text text not null,
  headline text not null,
  call_to_action text not null,
  image_base64 text,
  meta_ad_id text,
  meta_creative_id text,
  created_at timestamptz default now()
);

create index if not exists idx_ab_variants_test on ab_test_variants(ab_test_id);

-- ============================================================
-- Instagram Polling: processed items tracking
-- ============================================================
create table if not exists ig_processed_items (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('comment', 'dm')),
  ig_item_id text not null unique,
  ig_media_id text,
  ig_user_id text,
  reply_text text,
  status text not null default 'processed'
    check (status in ('processed', 'skipped', 'failed')),
  created_at timestamptz default now()
);

create index if not exists idx_ig_processed_item on ig_processed_items(ig_item_id);

-- Instagram conversation support
create unique index if not exists idx_conversations_ig_user
  on conversations(ig_user_id) where ig_user_id is not null;
