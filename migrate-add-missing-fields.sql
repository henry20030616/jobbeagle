-- Migration: Add missing fields to existing tables
-- Run this SQL in your Supabase SQL Editor if tables already exist

-- Add missing columns to analysis_reports table
ALTER TABLE analysis_reports 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS analysis_data JSONB,
  ADD COLUMN IF NOT EXISTS content TEXT;

-- If report_data exists but analysis_data doesn't, copy the data
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analysis_reports' AND column_name = 'report_data'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'analysis_reports' AND column_name = 'analysis_data'
  ) THEN
    ALTER TABLE analysis_reports RENAME COLUMN report_data TO analysis_data;
  END IF;
END $$;

-- Add missing column to resume_history table
ALTER TABLE resume_history 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analysis_reports_user_id ON analysis_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_history_user_id ON resume_history(user_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Allow all operations on analysis_reports" ON analysis_reports;
DROP POLICY IF EXISTS "Allow all operations on resume_history" ON resume_history;

-- Users can only see their own reports
CREATE POLICY "Users can only see their own reports" ON analysis_reports
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
  
-- Users can only insert their own reports
CREATE POLICY "Users can only insert their own reports" ON analysis_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can only see their own resume history
CREATE POLICY "Users can only see their own resume history" ON resume_history
  FOR SELECT USING (auth.uid() = user_id);
  
-- Users can only insert their own resume history
CREATE POLICY "Users can only insert their own resume history" ON resume_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
-- Users can only delete their own resume history
CREATE POLICY "Users can only delete their own resume history" ON resume_history
  FOR DELETE USING (auth.uid() = user_id);
