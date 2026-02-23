-- Add indexes for faster search performance
-- These indexes will speed up the ILIKE operations in PostgreSQL

-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_title_gin ON events USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_events_location_gin ON events USING gin(location gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(featured);

-- Venues table indexes
CREATE INDEX IF NOT EXISTS idx_venues_name_gin ON venues USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_venues_location_gin ON venues USING gin(location gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_venues_status ON venues(status);
CREATE INDEX IF NOT EXISTS idx_venues_featured ON venues(featured);

-- Posts table indexes
CREATE INDEX IF NOT EXISTS idx_posts_title_gin ON posts USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_featured ON posts(featured);

-- Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;
