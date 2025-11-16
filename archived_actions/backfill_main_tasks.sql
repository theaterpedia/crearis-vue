-- Backfill Missing Main Tasks for Existing Entities
-- This script creates main tasks for all entities that don't have one yet

-- Insert main tasks for events without tasks
INSERT INTO tasks (id, title, category, status, record_type, record_id)
SELECT 
    gen_random_uuid()::text,
    '{{main-title}}',
    'main',
    'new',
    'event',
    e.id
FROM events e
LEFT JOIN tasks t ON t.record_type = 'event' AND t.record_id = e.id AND t.category = 'main'
WHERE t.id IS NULL;

-- Insert main tasks for posts without tasks
INSERT INTO tasks (id, title, category, status, record_type, record_id)
SELECT 
    gen_random_uuid()::text,
    '{{main-title}}',
    'main',
    'new',
    'post',
    p.id
FROM posts p
LEFT JOIN tasks t ON t.record_type = 'post' AND t.record_id = p.id AND t.category = 'main'
WHERE t.id IS NULL;

-- Insert main tasks for locations without tasks
INSERT INTO tasks (id, title, category, status, record_type, record_id)
SELECT 
    gen_random_uuid()::text,
    '{{main-title}}',
    'main',
    'new',
    'location',
    l.id
FROM locations l
LEFT JOIN tasks t ON t.record_type = 'location' AND t.record_id = l.id AND t.category = 'main'
WHERE t.id IS NULL;

-- Insert main tasks for instructors without tasks
INSERT INTO tasks (id, title, category, status, record_type, record_id)
SELECT 
    gen_random_uuid()::text,
    '{{main-title}}',
    'main',
    'new',
    'instructor',
    i.id
FROM instructors i
LEFT JOIN tasks t ON t.record_type = 'instructor' AND t.record_id = i.id AND t.category = 'main'
WHERE t.id IS NULL;

-- Insert main tasks for participants without tasks
INSERT INTO tasks (id, title, category, status, record_type, record_id)
SELECT 
    gen_random_uuid()::text,
    '{{main-title}}',
    'main',
    'new',
    'participant',
    p.id
FROM participants p
LEFT JOIN tasks t ON t.record_type = 'participant' AND t.record_id = p.id AND t.category = 'main'
WHERE t.id IS NULL;

-- Verify results
SELECT 
    'events' as entity_type,
    COUNT(*) as entity_count,
    (SELECT COUNT(*) FROM tasks WHERE record_type='event' AND category='main') as task_count
FROM events
UNION ALL
SELECT 
    'posts',
    COUNT(*),
    (SELECT COUNT(*) FROM tasks WHERE record_type='post' AND category='main')
FROM posts
UNION ALL
SELECT 
    'locations',
    COUNT(*),
    (SELECT COUNT(*) FROM tasks WHERE record_type='location' AND category='main')
FROM locations
UNION ALL
SELECT 
    'instructors',
    COUNT(*),
    (SELECT COUNT(*) FROM tasks WHERE record_type='instructor' AND category='main')
FROM instructors
UNION ALL
SELECT 
    'participants',
    COUNT(*),
    (SELECT COUNT(*) FROM tasks WHERE record_type='participant' AND category='main')
FROM participants
ORDER BY entity_type;
