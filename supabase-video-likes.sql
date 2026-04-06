-- ============================================================
-- Video Likes Migration
-- 在 Supabase SQL Editor 執行此檔案
-- ============================================================

CREATE TABLE IF NOT EXISTS video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read likes" ON video_likes;
CREATE POLICY "Anyone can read likes" ON video_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users manage own likes" ON video_likes;
CREATE POLICY "Auth users manage own likes" ON video_likes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
