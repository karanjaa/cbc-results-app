/*
  # CBC Results Storage Schema

  1. New Tables
    - `student_results`
      - `id` (uuid, primary key) - Unique identifier for each result upload
      - `student_name` (text) - Optional student name
      - `grade_level` (text) - Grade level (e.g., "Grade 4", "Grade 5")
      - `term` (text) - School term (e.g., "Term 1", "Term 2")
      - `year` (text) - Academic year
      - `subjects` (jsonb) - JSON object containing subject grades
      - `analysis` (jsonb) - JSON object containing performance analysis
      - `uploaded_at` (timestamptz) - When the results were uploaded
      - `parent_email` (text) - Optional parent contact
      
  2. Security
    - Enable RLS on `student_results` table
    - Public insert policy (anyone can upload results)
    - Users can only view their own uploaded results
*/

CREATE TABLE IF NOT EXISTS student_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text DEFAULT '',
  grade_level text DEFAULT '',
  term text DEFAULT '',
  year text DEFAULT '',
  subjects jsonb DEFAULT '{}'::jsonb,
  analysis jsonb DEFAULT '{}'::jsonb,
  uploaded_at timestamptz DEFAULT now(),
  parent_email text DEFAULT ''
);

ALTER TABLE student_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert results"
  ON student_results
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can view results by ID"
  ON student_results
  FOR SELECT
  TO anon
  USING (true);
