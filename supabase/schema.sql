-- WhatsApp Agent: conversations table
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  phone_number text unique not null,
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
