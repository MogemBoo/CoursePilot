-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create an enum for content types
create type content_type_enum as enum ('slide', 'pdf', 'code', 'note');
create type category_enum as enum ('theory', 'lab');

-- Table for Course Materials (slides, PDFs, etc.)
create table course_materials (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  file_path text, -- Path in Supabase Storage
  storage_url text, -- Public URL if needed
  extracted_text text, -- Text content for search
  type content_type_enum not null,
  category category_enum not null,
  week text,
  topic text,
  tags text[], -- Array of strings
  embedding vector(1536), -- OpenAI embedding size
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table course_materials enable row level security;

-- Create specific policies (Adjust as needed)
-- allow read access to everyone equivalent to public
create policy "Public materials are viewable by everyone"
  on course_materials for select
  using ( true );

-- allow insert access to authenticated users only (Admins/Instructors)
create policy "Authenticated users can insert materials"
  on course_materials for insert
  with check ( auth.role() = 'authenticated' );

-- Table for Chat Sessions
create table chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table chat_sessions enable row level security;

create policy "Users can see their own chat sessions"
  on chat_sessions for select
  using ( auth.uid() = user_id );

create policy "Users can create their own chat sessions"
  on chat_sessions for insert
  with check ( auth.uid() = user_id );

-- Table for Chat Messages
create table chat_messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references chat_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table chat_messages enable row level security;

create policy "Users can see messages in their sessions"
  on chat_messages for select
  using ( exists (
    select 1 from chat_sessions
    where chat_sessions.id = chat_messages.session_id
    and chat_sessions.user_id = auth.uid()
  ));

create policy "Users can insert messages in their sessions"
  on chat_messages for insert
  with check ( exists (
    select 1 from chat_sessions
    where chat_sessions.id = chat_messages.session_id
    and chat_sessions.user_id = auth.uid()
  ));

-- Table for Generated Learning Materials (Part 3)
create table generated_materials (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  prompt text not null,
  content text not null,
  type text check (type in ('theory', 'lab')),
  is_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table generated_materials enable row level security;

create policy "Users can view generated materials"
  on generated_materials for select
  using ( true );

create policy "Authenticated users can create generated materials"
  on generated_materials for insert
  with check ( auth.role() = 'authenticated' );

-- Function to match documents (Vector Search)
create or replace function match_materials (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  content_text text,
  similarity float
)
language plpgsql
stable
as $$
begin
  return query (
    select
      course_materials.id,
      course_materials.title,
      course_materials.extracted_text as content_text,
      1 - (course_materials.embedding <=> query_embedding) as similarity
    from course_materials
    where 1 - (course_materials.embedding <=> query_embedding) > match_threshold
    order by similarity desc
    limit match_count
  );
end;
$$;
