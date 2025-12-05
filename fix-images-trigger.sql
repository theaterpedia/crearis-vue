-- Fix trigger functions to use r_creator instead of r_owner
-- (Migration 050 renamed the columns but 047's triggers still referenced r_owner)

-- Images trigger
CREATE OR REPLACE FUNCTION trigger_images_visibility()
RETURNS trigger AS $$
DECLARE
    v_visibility RECORD;
BEGIN
    SELECT * INTO v_visibility FROM compute_role_visibility(48, NEW.status);
    NEW.r_anonym := v_visibility.r_anonym;
    NEW.r_partner := v_visibility.r_partner;
    NEW.r_participant := v_visibility.r_participant;
    NEW.r_member := v_visibility.r_member;
    NEW.r_creator := v_visibility.r_creator;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Projects trigger
CREATE OR REPLACE FUNCTION trigger_projects_visibility()
RETURNS trigger AS $$
DECLARE
    v_visibility RECORD;
BEGIN
    SELECT * INTO v_visibility FROM compute_role_visibility(8, NEW.status);
    NEW.r_anonym := v_visibility.r_anonym;
    NEW.r_partner := v_visibility.r_partner;
    NEW.r_participant := v_visibility.r_participant;
    NEW.r_member := v_visibility.r_member;
    NEW.r_creator := v_visibility.r_creator;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
