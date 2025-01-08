-- Add is_active column to drivers table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'drivers' AND column_name = 'is_active') THEN
        ALTER TABLE drivers ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;

-- Create index for is_active if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                  WHERE tablename = 'drivers' AND indexname = 'idx_drivers_is_active') THEN
        CREATE INDEX idx_drivers_is_active ON drivers(is_active);
    END IF;
END $$;

-- Create or replace the active drivers view
CREATE OR REPLACE VIEW active_drivers_view AS
SELECT 
    d.id,
    d.user_id,
    d.first_name,
    d.last_name,
    d.has_cdl,
    d.cdl_number,
    d.cdl_expiration_date,
    d.is_active,
    d.created_at,
    au.email,
    au.raw_user_meta_data->>'role' as role
FROM drivers d
JOIN auth.users au ON d.user_id = au.id
WHERE au.raw_user_meta_data->>'role' = 'driver';
