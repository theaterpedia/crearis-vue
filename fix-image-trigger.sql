-- Fix the update_entity_image_fields trigger function
-- Problem: Checking "shape_thumb IS NOT NULL" doesn't work when composite has only URL field set
-- Solution: Check "(shape_thumb).url IS NOT NULL" instead

CREATE OR REPLACE FUNCTION update_entity_image_fields()
RETURNS TRIGGER AS $$
DECLARE
    img_record RECORD;
    show_img BOOLEAN;
BEGIN
    -- If img_id is NULL, set all to defaults
    IF NEW.img_id IS NULL THEN
        NEW.img_show := FALSE;
        NEW.img_thumb := 'dummy';
        NEW.img_square := 'dummy';
        NEW.img_wide := 'dummy';
        NEW.img_vert := 'dummy';
        RETURN NEW;
    END IF;

    -- Fetch image data
    SELECT * INTO img_record FROM images WHERE id = NEW.img_id;

    IF NOT FOUND THEN
        NEW.img_show := FALSE;
        NEW.img_thumb := 'dummy';
        NEW.img_square := 'dummy';
        NEW.img_wide := 'dummy';
        NEW.img_vert := 'dummy';
        RETURN NEW;
    END IF;

    -- Compute img_show: true if status is ok (bits 6+7 = 0) or is_deprecated (bits 6+7 = 64)
    show_img := (get_byte(img_record.ctags, 0) & 192) IN (0, 64);
    NEW.img_show := show_img;

    -- Compute img_thumb
    IF NOT show_img THEN
        NEW.img_thumb := 'dummy';
    ELSIF (img_record.shape_thumb).url IS NOT NULL THEN
        NEW.img_thumb := reduce_image_shape(img_record.shape_thumb);
    ELSIF (img_record.shape_square).url IS NOT NULL THEN
        NEW.img_thumb := reduce_image_shape(img_record.shape_square);
    ELSE
        NEW.img_thumb := img_record.url;
    END IF;

    -- Compute img_square
    IF NOT show_img THEN
        NEW.img_square := 'dummy';
    ELSIF (img_record.shape_square).url IS NOT NULL THEN
        NEW.img_square := reduce_image_shape(img_record.shape_square);
    ELSE
        NEW.img_square := img_record.url;
    END IF;

    -- Compute img_wide
    IF NOT show_img THEN
        NEW.img_wide := 'dummy';
    ELSIF (img_record.shape_wide).url IS NOT NULL THEN
        NEW.img_wide := reduce_image_shape(img_record.shape_wide);
    ELSE
        NEW.img_wide := 'dummy';
    END IF;

    -- Compute img_vert
    IF NOT show_img THEN
        NEW.img_vert := 'dummy';
    ELSIF (img_record.shape_vertical).url IS NOT NULL THEN
        NEW.img_vert := reduce_image_shape(img_record.shape_vertical);
    ELSE
        NEW.img_vert := 'dummy';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
