-- Migration 003: Entity Task Triggers for PostgreSQL
-- Creates triggers for automatic main-task creation

-- Function to create main task
CREATE OR REPLACE FUNCTION create_main_task()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO tasks (id, title, category, status, record_type, record_id)
    VALUES (
        gen_random_uuid()::text,
        '{{main-title}}',
        'main',
        'new',
        TG_ARGV[0],
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to delete main task
CREATE OR REPLACE FUNCTION delete_main_task()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM tasks 
    WHERE record_type = TG_ARGV[0]
      AND record_id = OLD.id 
      AND category = 'main';
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers for events
DROP TRIGGER IF EXISTS create_event_main_task ON events;
CREATE TRIGGER create_event_main_task
AFTER INSERT ON events
FOR EACH ROW
EXECUTE FUNCTION create_main_task('event');

DROP TRIGGER IF EXISTS delete_event_main_task ON events;
CREATE TRIGGER delete_event_main_task
BEFORE DELETE ON events
FOR EACH ROW
EXECUTE FUNCTION delete_main_task('event');

-- Triggers for posts
DROP TRIGGER IF EXISTS create_post_main_task ON posts;
CREATE TRIGGER create_post_main_task
AFTER INSERT ON posts
FOR EACH ROW
EXECUTE FUNCTION create_main_task('post');

DROP TRIGGER IF EXISTS delete_post_main_task ON posts;
CREATE TRIGGER delete_post_main_task
BEFORE DELETE ON posts
FOR EACH ROW
EXECUTE FUNCTION delete_main_task('post');

-- Triggers for locations
DROP TRIGGER IF EXISTS create_location_main_task ON locations;
CREATE TRIGGER create_location_main_task
AFTER INSERT ON locations
FOR EACH ROW
EXECUTE FUNCTION create_main_task('location');

DROP TRIGGER IF EXISTS delete_location_main_task ON locations;
CREATE TRIGGER delete_location_main_task
BEFORE DELETE ON locations
FOR EACH ROW
EXECUTE FUNCTION delete_main_task('location');

-- Triggers for instructors
DROP TRIGGER IF EXISTS create_instructor_main_task ON instructors;
CREATE TRIGGER create_instructor_main_task
AFTER INSERT ON instructors
FOR EACH ROW
EXECUTE FUNCTION create_main_task('instructor');

DROP TRIGGER IF EXISTS delete_instructor_main_task ON instructors;
CREATE TRIGGER delete_instructor_main_task
BEFORE DELETE ON instructors
FOR EACH ROW
EXECUTE FUNCTION delete_main_task('instructor');

-- Triggers for participants
DROP TRIGGER IF EXISTS create_participant_main_task ON participants;
CREATE TRIGGER create_participant_main_task
AFTER INSERT ON participants
FOR EACH ROW
EXECUTE FUNCTION create_main_task('participant');

DROP TRIGGER IF EXISTS delete_participant_main_task ON participants;
CREATE TRIGGER delete_participant_main_task
BEFORE DELETE ON participants
FOR EACH ROW
EXECUTE FUNCTION delete_main_task('participant');
