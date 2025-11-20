/**
 * Migration 023: Add 'local' to media_adapter_type enum
 * 
 * Adds support for locally uploaded images stored on the server filesystem.
 */

export default `
-- Add 'local' to media_adapter_type enum
ALTER TYPE media_adapter_type ADD VALUE IF NOT EXISTS 'local';
`;
