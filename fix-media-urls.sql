-- Fix Media URLs Script
-- This fixes old URLs that are missing the full object storage path
-- 
-- IMPORTANT: Backup your database before running this!
-- 
-- This script will:
-- 1. Identify media records with incomplete URLs (missing /replit-objstore- prefix)
-- 2. Update them to use the full object storage path
-- 
-- HOW TO USE:
-- Option A: Via Replit Database Tool
--   1. Open Database pane in Replit
--   2. Switch to PRODUCTION database
--   3. Copy and paste this query
--   4. Click "Run"
--
-- Option B: Via psql command line
--   psql $DATABASE_URL -f fix-media-urls.sql

-- First, check how many records need fixing
SELECT 
  id, 
  name,
  filename,
  url as old_url
FROM media 
WHERE url NOT LIKE '/replit-objstore-%'
  AND url LIKE '/%';

-- Uncomment the UPDATE statement below after reviewing the SELECT results
-- This will fix all URLs by adding the proper prefix

/*
UPDATE media 
SET url = '/replit-objstore-85caca72-fd47-41c6-a360-3c3d4b8873eb/public' || url
WHERE url NOT LIKE '/replit-objstore-%'
  AND url LIKE '/%';
*/

-- After running, verify the fixes:
-- SELECT id, name, url FROM media ORDER BY id DESC LIMIT 10;
