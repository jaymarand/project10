-- Add fl_driver_id column to active_delivery_runs table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'active_delivery_runs' AND column_name = 'fl_driver_id') THEN
        ALTER TABLE active_delivery_runs ADD COLUMN fl_driver_id UUID REFERENCES drivers(id);
    END IF;
END $$;
