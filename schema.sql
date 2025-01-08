-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE delivery_status AS ENUM ('pending', 'loading', 'preloaded', 'in_transit', 'completed', 'canceled');
CREATE TYPE vehicle_type AS ENUM ('box_truck', 'tractor_trailer');
CREATE TYPE user_role AS ENUM ('admin', 'dispatch', 'driver', 'store_manager');
CREATE TYPE run_type AS ENUM ('Morning', 'Afternoon', 'ADC');

-- Create drivers table
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    has_cdl BOOLEAN NOT NULL DEFAULT false,
    cdl_number TEXT,
    cdl_expiration_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create stores table
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_number VARCHAR(10) NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Insert actual store data
INSERT INTO stores (department_number, name) VALUES
('9011', 'Tri-County'),
('9012', 'Cheviot'),
('9014', 'Independence'),
('9015', 'Hamilton'),
('9016', 'Oakley'),
('9017', 'Lebanon'),
('9018', 'Loveland'),
('9019', 'Bellevue'),
('9020', 'Harrison'),
('9021', 'Florence'),
('9023', 'Batesville'),
('9024', 'Fairfield'),
('9025', 'Mason'),
('9026', 'Beechmont'),
('9027', 'Mt. Washington'),
('9029', 'Montgomery'),
('9030', 'Oxford'),
('9031', 'West Chester'),
('9032', 'Lawrenceburg'),
('9033', 'Deerfield');

-- Create store_supplies table
CREATE TABLE store_supplies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    store_name TEXT,
    department_number VARCHAR(10),
    sleeves INTEGER DEFAULT 0,
    caps INTEGER DEFAULT 0,
    canvases INTEGER DEFAULT 0,
    totes INTEGER DEFAULT 0,
    hardlines_raw INTEGER DEFAULT 0,
    softlines_raw INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    UNIQUE(store_id)
);

-- Insert actual par levels for each store
WITH store_par_levels AS (
    SELECT 
        s.id as store_id,
        s.department_number,
        CASE s.department_number
            WHEN '9011' THEN 40 WHEN '9012' THEN 10 WHEN '9014' THEN 12
            WHEN '9015' THEN 10 WHEN '9016' THEN 20 WHEN '9017' THEN 20
            WHEN '9018' THEN 30 WHEN '9019' THEN 30 WHEN '9020' THEN 20
            WHEN '9021' THEN 20 WHEN '9023' THEN 14 WHEN '9024' THEN 23
            WHEN '9025' THEN 5  WHEN '9026' THEN 20 WHEN '9027' THEN 12
            WHEN '9029' THEN 12 WHEN '9030' THEN 10 WHEN '9031' THEN 12
            WHEN '9032' THEN 12 WHEN '9033' THEN 30
        END as sleeves,
        CASE s.department_number
            WHEN '9011' THEN 80 WHEN '9012' THEN 20 WHEN '9014' THEN 24
            WHEN '9015' THEN 20 WHEN '9016' THEN 40 WHEN '9017' THEN 40
            WHEN '9018' THEN 60 WHEN '9019' THEN 60 WHEN '9020' THEN 40
            WHEN '9021' THEN 40 WHEN '9023' THEN 28 WHEN '9024' THEN 46
            WHEN '9025' THEN 10 WHEN '9026' THEN 40 WHEN '9027' THEN 24
            WHEN '9029' THEN 24 WHEN '9030' THEN 20 WHEN '9031' THEN 24
            WHEN '9032' THEN 24 WHEN '9033' THEN 60
        END as caps,
        12 as canvases,
        CASE s.department_number
            WHEN '9011' THEN 4 WHEN '9012' THEN 2 WHEN '9014' THEN 2
            WHEN '9015' THEN 2 WHEN '9016' THEN 4 WHEN '9017' THEN 2
            WHEN '9018' THEN 4 WHEN '9019' THEN 3 WHEN '9020' THEN 2
            WHEN '9021' THEN 4 WHEN '9023' THEN 2 WHEN '9024' THEN 3
            WHEN '9025' THEN 2 WHEN '9026' THEN 2 WHEN '9027' THEN 2
            WHEN '9029' THEN 2 WHEN '9030' THEN 2 WHEN '9031' THEN 2
            WHEN '9032' THEN 2 WHEN '9033' THEN 3
        END as totes,
        CASE s.department_number
            WHEN '9011' THEN 20 WHEN '9012' THEN 5  WHEN '9014' THEN 10
            WHEN '9015' THEN 12 WHEN '9016' THEN 20 WHEN '9017' THEN 17
            WHEN '9018' THEN 20 WHEN '9019' THEN 15 WHEN '9020' THEN 12
            WHEN '9021' THEN 20 WHEN '9023' THEN 12 WHEN '9024' THEN 20
            WHEN '9025' THEN 6  WHEN '9026' THEN 18 WHEN '9027' THEN 6
            WHEN '9029' THEN 6  WHEN '9030' THEN 6  WHEN '9031' THEN 14
            WHEN '9032' THEN 10 WHEN '9033' THEN 20
        END as hardlines_raw,
        CASE s.department_number
            WHEN '9011' THEN 20 WHEN '9012' THEN 5  WHEN '9014' THEN 10
            WHEN '9015' THEN 12 WHEN '9016' THEN 20 WHEN '9017' THEN 17
            WHEN '9018' THEN 20 WHEN '9019' THEN 15 WHEN '9020' THEN 12
            WHEN '9021' THEN 20 WHEN '9023' THEN 12 WHEN '9024' THEN 20
            WHEN '9025' THEN 6  WHEN '9026' THEN 18 WHEN '9027' THEN 6
            WHEN '9029' THEN 6  WHEN '9030' THEN 6  WHEN '9031' THEN 14
            WHEN '9032' THEN 10 WHEN '9033' THEN 20
        END as softlines_raw
    FROM stores s
)
INSERT INTO store_supplies (
    store_id,
    store_name,
    department_number,
    sleeves,
    caps,
    canvases,
    totes,
    hardlines_raw,
    softlines_raw
)
SELECT 
    spl.store_id,
    s.name,
    s.department_number,
    spl.sleeves,
    spl.caps,
    spl.canvases,
    spl.totes,
    spl.hardlines_raw,
    spl.softlines_raw
FROM store_par_levels spl
JOIN stores s ON s.id = spl.store_id;

-- Container counts table
CREATE TABLE container_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    opener_name TEXT,
    arrival_time TIMESTAMP WITH TIME ZONE,
    donation_count INTEGER DEFAULT 0,
    trailer_fullness INTEGER DEFAULT 0,
    hardlines_raw INTEGER DEFAULT 0,
    softlines_raw INTEGER DEFAULT 0,
    canvases INTEGER DEFAULT 0,
    sleeves INTEGER DEFAULT 0,
    caps INTEGER DEFAULT 0,
    totes INTEGER DEFAULT 0
);

-- Active delivery runs table
CREATE TABLE active_delivery_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    driver_id UUID REFERENCES drivers(id),
    store_name TEXT NOT NULL,
    department_number TEXT NOT NULL,
    run_type run_type NOT NULL,
    truck_type vehicle_type NOT NULL,
    position INTEGER NOT NULL,
    status delivery_status NOT NULL DEFAULT 'pending',
    start_time TIMESTAMP WITH TIME ZONE,
    preload_time TIMESTAMP WITH TIME ZONE,
    complete_time TIMESTAMP WITH TIME ZONE,
    depart_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Run supply needs view
CREATE OR REPLACE VIEW run_supply_needs AS
WITH daily_counts AS (
    SELECT DISTINCT store_id
    FROM container_counts
    WHERE DATE(submitted_at) = CURRENT_DATE
),
store_totals AS (
    SELECT 
        store_id,
        SUM(sleeves) as total_sleeves,
        SUM(caps) as total_caps,
        SUM(canvases) as total_canvases,
        SUM(totes) as total_totes,
        SUM(hardlines_raw) as total_hardlines,
        SUM(softlines_raw) as total_softlines
    FROM container_counts
    WHERE DATE(submitted_at) = CURRENT_DATE
    GROUP BY store_id
)
SELECT 
    r.id as run_id,
    r.store_id,
    s.name as store_name,
    s.department_number,
    COALESCE(st.total_sleeves, 0) as sleeves_needed,
    COALESCE(st.total_caps, 0) as caps_needed,
    COALESCE(st.total_canvases, 0) as canvases_needed,
    COALESCE(st.total_totes, 0) as totes_needed,
    COALESCE(st.total_hardlines, 0) as hardlines_needed,
    COALESCE(st.total_softlines, 0) as softlines_needed
FROM active_delivery_runs r
JOIN stores s ON r.store_id = s.id
LEFT JOIN store_totals st ON r.store_id = st.store_id
WHERE DATE(r.created_at) = CURRENT_DATE;

-- Row Level Security (RLS) Policies
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_supplies ENABLE ROW LEVEL SECURITY;
ALTER TABLE container_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_delivery_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Create policies that allow authenticated users to perform all operations
CREATE POLICY "Allow authenticated users full access to stores"
    ON stores FOR ALL TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users full access to store_supplies"
    ON store_supplies FOR ALL TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users full access to container_counts"
    ON container_counts FOR ALL TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users full access to active_delivery_runs"
    ON active_delivery_runs FOR ALL TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users full access to drivers"
    ON drivers FOR ALL TO authenticated
    USING (true);

-- Indexes for better query performance
CREATE INDEX idx_stores_department_number ON stores(department_number);
CREATE INDEX idx_container_counts_submitted_at ON container_counts(submitted_at);
CREATE INDEX idx_active_delivery_runs_run_type ON active_delivery_runs(run_type);
CREATE INDEX idx_active_delivery_runs_status ON active_delivery_runs(status);
CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_is_active ON drivers(is_active);
