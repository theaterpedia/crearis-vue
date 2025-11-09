-- Temporary script to update existing images records
-- Adds alt_text field to img_thumb, img_square, img_wide, img_vert JSONB columns
-- Run this ONCE after updating the trigger in migration 019

-- Update img_thumb: add alt_text if not already present and alt_text field exists
UPDATE images
SET img_thumb = img_thumb || jsonb_build_object('alt_text', alt_text)
WHERE alt_text IS NOT NULL 
  AND alt_text != '' 
  AND img_thumb IS NOT NULL
  AND NOT (img_thumb ? 'alt_text');

-- Update img_square: add alt_text if not already present and alt_text field exists
UPDATE images
SET img_square = img_square || jsonb_build_object('alt_text', alt_text)
WHERE alt_text IS NOT NULL 
  AND alt_text != '' 
  AND img_square IS NOT NULL
  AND NOT (img_square ? 'alt_text');

-- Update img_wide: add alt_text if not already present and alt_text field exists
UPDATE images
SET img_wide = img_wide || jsonb_build_object('alt_text', alt_text)
WHERE alt_text IS NOT NULL 
  AND alt_text != '' 
  AND img_wide IS NOT NULL
  AND NOT (img_wide ? 'alt_text');

-- Update img_vert: add alt_text if not already present and alt_text field exists
UPDATE images
SET img_vert = img_vert || jsonb_build_object('alt_text', alt_text)
WHERE alt_text IS NOT NULL 
  AND alt_text != '' 
  AND img_vert IS NOT NULL
  AND NOT (img_vert ? 'alt_text');

-- Show summary of updates
SELECT 
    COUNT(*) FILTER (WHERE img_thumb ? 'alt_text') AS thumb_with_alt,
    COUNT(*) FILTER (WHERE img_square ? 'alt_text') AS square_with_alt,
    COUNT(*) FILTER (WHERE img_wide ? 'alt_text') AS wide_with_alt,
    COUNT(*) FILTER (WHERE img_vert ? 'alt_text') AS vert_with_alt,
    COUNT(*) FILTER (WHERE alt_text IS NOT NULL AND alt_text != '') AS total_with_alt_text
FROM images;
