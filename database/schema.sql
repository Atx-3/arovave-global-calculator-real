-- =====================================================
-- AROVAVE GLOBAL EXPORT RATE CALCULATOR v2
-- Container-Based FCL Export System
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CONTAINER TYPES (20FT / 40FT)
-- =====================================================
CREATE TABLE IF NOT EXISTS container_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    max_weight_kg DECIMAL(12, 2) NOT NULL DEFAULT 18000,
    max_volume_cbm DECIMAL(10, 2) NOT NULL DEFAULT 33,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PRODUCTS (Enhanced with container capacity)
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    hsn_code VARCHAR(20) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    base_price_usd DECIMAL(12, 4) NOT NULL,
    -- Container capacity: How much of this product fits in each container type
    qty_per_20ft DECIMAL(12, 2) DEFAULT NULL,
    qty_per_40ft DECIMAL(12, 2) DEFAULT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FACTORY LOCATIONS (with coordinates for distance)
-- =====================================================
CREATE TABLE IF NOT EXISTS factory_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    pincode VARCHAR(10),
    state VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDIAN PORTS
-- =====================================================
CREATE TABLE IF NOT EXISTS indian_ports (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    city VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    -- Port charges
    handling_per_container DECIMAL(12, 2) DEFAULT 0,
    cha_charges DECIMAL(12, 2) DEFAULT 0,
    customs_per_shipment DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- COUNTRIES
-- =====================================================
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(3) NOT NULL,
    -- ECGC Risk Category
    ecgc_risk_category VARCHAR(5) DEFAULT 'B',
    ecgc_rate_percent DECIMAL(5, 3) DEFAULT 0.50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DESTINATION PORTS
-- =====================================================
CREATE TABLE IF NOT EXISTS destination_ports (
    id SERIAL PRIMARY KEY,
    country_id INTEGER REFERENCES countries(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FREIGHT RATES (Per Container, by route)
-- =====================================================
CREATE TABLE IF NOT EXISTS freight_rates (
    id SERIAL PRIMARY KEY,
    origin_port_id INTEGER REFERENCES indian_ports(id),
    dest_port_id INTEGER REFERENCES destination_ports(id),
    container_type_id INTEGER REFERENCES container_types(id),
    -- Rate details
    rate_amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    -- Conversion factors
    freight_conversion_rate DECIMAL(10, 4) DEFAULT 1.0,
    gst_percent DECIMAL(5, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- LOCAL FREIGHT RATES (Factory to Port)
-- =====================================================
CREATE TABLE IF NOT EXISTS local_freight_rates (
    id SERIAL PRIMARY KEY,
    factory_id INTEGER REFERENCES factory_locations(id),
    port_id INTEGER REFERENCES indian_ports(id),
    container_type_id INTEGER REFERENCES container_types(id),
    -- Rate can be fixed or per-km
    rate_type VARCHAR(20) DEFAULT 'fixed',  -- 'fixed' or 'per_km'
    rate_amount DECIMAL(12, 2) NOT NULL,
    distance_km DECIMAL(10, 2) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- COST HEADS (Configurable charges)
-- =====================================================
CREATE TABLE IF NOT EXISTS cost_heads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,  -- 'handling', 'port', 'misc', 'certification'
    charge_type VARCHAR(20) NOT NULL DEFAULT 'per_shipment',  -- 'per_shipment', 'per_container', 'per_unit', 'percentage'
    calculation_base VARCHAR(20) DEFAULT 'fixed',  -- 'fixed', 'percentage'
    percentage_of VARCHAR(20) DEFAULT NULL,  -- 'ex_factory', 'fob', 'cif'
    base_amount DECIMAL(12, 2) DEFAULT 0,
    percentage_rate DECIMAL(5, 3) DEFAULT 0,
    gst_applicable BOOLEAN DEFAULT false,
    gst_rate DECIMAL(5, 2) DEFAULT 18,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CERTIFICATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS certifications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cost_flat DECIMAL(12, 2) DEFAULT 0,
    cost_percentage DECIMAL(5, 3) DEFAULT 0,
    percentage_of VARCHAR(20) DEFAULT 'ex_factory',
    charge_type VARCHAR(20) DEFAULT 'per_shipment',
    is_mandatory BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CURRENCY SETTINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS currency_settings (
    id SERIAL PRIMARY KEY,
    currency_code VARCHAR(3) NOT NULL UNIQUE,
    currency_name VARCHAR(50),
    exchange_rate_to_inr DECIMAL(12, 4) NOT NULL,
    bank_margin DECIMAL(5, 3) DEFAULT 0.50,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INSURANCE SETTINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS insurance_settings (
    id SERIAL PRIMARY KEY,
    rate_percent DECIMAL(5, 3) DEFAULT 0.50,
    calculation_base VARCHAR(20) DEFAULT 'cif',  -- 'fob' or 'cif'
    min_premium DECIMAL(12, 2) DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- BANK CHARGES
-- =====================================================
CREATE TABLE IF NOT EXISTS bank_charges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    charge_type VARCHAR(20) DEFAULT 'percentage',  -- 'fixed' or 'percentage'
    rate DECIMAL(5, 3) DEFAULT 0,
    fixed_amount DECIMAL(12, 2) DEFAULT 0,
    calculation_base VARCHAR(20) DEFAULT 'invoice',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PROFIT RULES
-- =====================================================
CREATE TABLE IF NOT EXISTS profit_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    profit_type VARCHAR(20) DEFAULT 'percentage',  -- 'percentage', 'per_container', 'per_unit', 'fixed'
    rate DECIMAL(5, 3) DEFAULT 0,
    fixed_amount DECIMAL(12, 2) DEFAULT 0,
    applies_to VARCHAR(20) DEFAULT 'total_cost',  -- 'ex_factory', 'fob', 'total_cost'
    -- Optional filters
    product_id INTEGER REFERENCES products(id),
    country_id INTEGER REFERENCES countries(id),
    container_type_id INTEGER REFERENCES container_types(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- GLOBAL SETTINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ADMIN USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ENABLE RLS (Development mode - allow all)
-- =====================================================
ALTER TABLE container_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE indian_ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE destination_ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE freight_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_freight_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow all operations for development
CREATE POLICY "Allow all on container_types" ON container_types FOR ALL USING (true);
CREATE POLICY "Allow all on products" ON products FOR ALL USING (true);
CREATE POLICY "Allow all on factory_locations" ON factory_locations FOR ALL USING (true);
CREATE POLICY "Allow all on indian_ports" ON indian_ports FOR ALL USING (true);
CREATE POLICY "Allow all on countries" ON countries FOR ALL USING (true);
CREATE POLICY "Allow all on destination_ports" ON destination_ports FOR ALL USING (true);
CREATE POLICY "Allow all on freight_rates" ON freight_rates FOR ALL USING (true);
CREATE POLICY "Allow all on local_freight_rates" ON local_freight_rates FOR ALL USING (true);
CREATE POLICY "Allow all on cost_heads" ON cost_heads FOR ALL USING (true);
CREATE POLICY "Allow all on certifications" ON certifications FOR ALL USING (true);
CREATE POLICY "Allow all on currency_settings" ON currency_settings FOR ALL USING (true);
CREATE POLICY "Allow all on insurance_settings" ON insurance_settings FOR ALL USING (true);
CREATE POLICY "Allow all on bank_charges" ON bank_charges FOR ALL USING (true);
CREATE POLICY "Allow all on profit_rules" ON profit_rules FOR ALL USING (true);
CREATE POLICY "Allow all on settings" ON settings FOR ALL USING (true);

-- =====================================================
-- SAMPLE DATA - CONTAINER TYPES
-- =====================================================
INSERT INTO container_types (name, code, max_weight_kg, max_volume_cbm, description) VALUES
('20 Feet Container', '20FT', 18000, 33, 'Standard 20-foot FCL container'),
('40 Feet Container', '40FT', 26000, 67, 'Standard 40-foot FCL container')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE DATA - PRODUCTS (with container capacity)
-- =====================================================
INSERT INTO products (name, hsn_code, unit, base_price_usd, qty_per_20ft, qty_per_40ft, active) VALUES
('Premium Basmati Rice', '10063020', 'KG', 1.50, 18000, 26000, true),
('Organic Turmeric Powder', '09103010', 'KG', 3.00, 16000, 24000, true),
('Cumin Seeds', '09093110', 'KG', 4.50, 15000, 22000, true),
('Black Pepper Whole', '09041110', 'KG', 8.00, 14000, 21000, true),
('Cardamom Green', '09083110', 'KG', 25.00, 12000, 18000, true),
('Indian Tea (CTC)', '09024010', 'KG', 2.80, 16000, 24000, true),
('Mango Pulp (Alphonso)', '08045020', 'KG', 2.50, 17000, 25000, true),
('Peanuts (Bold)', '12024190', 'KG', 1.20, 18000, 26000, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE DATA - FACTORY LOCATIONS
-- =====================================================
INSERT INTO factory_locations (name, pincode, state) VALUES
('Delhi NCR', '110001', 'Delhi'),
('Mumbai', '400001', 'Maharashtra'),
('Chennai', '600001', 'Tamil Nadu'),
('Bangalore', '560001', 'Karnataka'),
('Ahmedabad', '380001', 'Gujarat'),
('Kolkata', '700001', 'West Bengal')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE DATA - INDIAN PORTS
-- =====================================================
INSERT INTO indian_ports (name, code, city, handling_per_container, cha_charges, customs_per_shipment) VALUES
('Jawaharlal Nehru Port', 'INNSA', 'Mumbai', 180, 150, 100),
('Mundra Port', 'INMUN', 'Mundra', 150, 120, 80),
('Chennai Port', 'INMAA', 'Chennai', 160, 130, 90),
('Kolkata Port', 'INCCU', 'Kolkata', 170, 140, 95)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE DATA - COUNTRIES (with ECGC)
-- =====================================================
INSERT INTO countries (name, code, ecgc_risk_category, ecgc_rate_percent) VALUES
('United Arab Emirates', 'AE', 'A', 0.35),
('Saudi Arabia', 'SA', 'A', 0.40),
('United States', 'US', 'A', 0.30),
('United Kingdom', 'GB', 'A', 0.30),
('Germany', 'DE', 'A', 0.30),
('Singapore', 'SG', 'A', 0.25),
('Australia', 'AU', 'A', 0.30),
('Nigeria', 'NG', 'C', 0.80),
('Russia', 'RU', 'C', 0.75)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE DATA - DESTINATION PORTS
-- =====================================================
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'AE'), 'Jebel Ali Port', 'AEJEA'),
((SELECT id FROM countries WHERE code = 'AE'), 'Abu Dhabi Port', 'AEAUH'),
((SELECT id FROM countries WHERE code = 'SA'), 'Jeddah Islamic Port', 'SAJED'),
((SELECT id FROM countries WHERE code = 'US'), 'Los Angeles Port', 'USLAX'),
((SELECT id FROM countries WHERE code = 'US'), 'New York Port', 'USNYC'),
((SELECT id FROM countries WHERE code = 'GB'), 'Felixstowe Port', 'GBFXT'),
((SELECT id FROM countries WHERE code = 'DE'), 'Hamburg Port', 'DEHAM'),
((SELECT id FROM countries WHERE code = 'SG'), 'Singapore Port', 'SGSIN'),
((SELECT id FROM countries WHERE code = 'AU'), 'Melbourne Port', 'AUMEL')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE DATA - FREIGHT RATES
-- =====================================================
INSERT INTO freight_rates (origin_port_id, dest_port_id, container_type_id, rate_amount, currency, freight_conversion_rate, gst_percent) VALUES
-- JNPT to UAE (20FT & 40FT)
((SELECT id FROM indian_ports WHERE code = 'INNSA'), (SELECT id FROM destination_ports WHERE code = 'AEJEA'), (SELECT id FROM container_types WHERE code = '20FT'), 800, 'USD', 1.0, 5),
((SELECT id FROM indian_ports WHERE code = 'INNSA'), (SELECT id FROM destination_ports WHERE code = 'AEJEA'), (SELECT id FROM container_types WHERE code = '40FT'), 1400, 'USD', 1.0, 5),
-- JNPT to USA
((SELECT id FROM indian_ports WHERE code = 'INNSA'), (SELECT id FROM destination_ports WHERE code = 'USLAX'), (SELECT id FROM container_types WHERE code = '20FT'), 2200, 'USD', 1.0, 5),
((SELECT id FROM indian_ports WHERE code = 'INNSA'), (SELECT id FROM destination_ports WHERE code = 'USLAX'), (SELECT id FROM container_types WHERE code = '40FT'), 3800, 'USD', 1.0, 5),
-- JNPT to Singapore
((SELECT id FROM indian_ports WHERE code = 'INNSA'), (SELECT id FROM destination_ports WHERE code = 'SGSIN'), (SELECT id FROM container_types WHERE code = '20FT'), 600, 'USD', 1.0, 5),
((SELECT id FROM indian_ports WHERE code = 'INNSA'), (SELECT id FROM destination_ports WHERE code = 'SGSIN'), (SELECT id FROM container_types WHERE code = '40FT'), 1000, 'USD', 1.0, 5)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE DATA - LOCAL FREIGHT
-- =====================================================
INSERT INTO local_freight_rates (factory_id, port_id, container_type_id, rate_type, rate_amount, distance_km) VALUES
-- Delhi to JNPT
((SELECT id FROM factory_locations WHERE name = 'Delhi NCR'), (SELECT id FROM indian_ports WHERE code = 'INNSA'), (SELECT id FROM container_types WHERE code = '20FT'), 'fixed', 45000, 1400),
((SELECT id FROM factory_locations WHERE name = 'Delhi NCR'), (SELECT id FROM indian_ports WHERE code = 'INNSA'), (SELECT id FROM container_types WHERE code = '40FT'), 'fixed', 65000, 1400),
-- Mumbai to JNPT
((SELECT id FROM factory_locations WHERE name = 'Mumbai'), (SELECT id FROM indian_ports WHERE code = 'INNSA'), (SELECT id FROM container_types WHERE code = '20FT'), 'fixed', 8000, 50),
((SELECT id FROM factory_locations WHERE name = 'Mumbai'), (SELECT id FROM indian_ports WHERE code = 'INNSA'), (SELECT id FROM container_types WHERE code = '40FT'), 'fixed', 12000, 50)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE DATA - COST HEADS
-- =====================================================
INSERT INTO cost_heads (name, category, charge_type, calculation_base, base_amount, is_active, display_order) VALUES
('Loading Charges', 'handling', 'per_container', 'fixed', 3000, true, 1),
('Stuffing Charges', 'handling', 'per_container', 'fixed', 5000, true, 2),
('Port THC', 'port', 'per_container', 'fixed', 8000, true, 3),
('Customs Clearance', 'port', 'per_shipment', 'fixed', 5000, true, 4),
('Shipping Bill', 'port', 'per_shipment', 'fixed', 2000, true, 5),
('Miscellaneous', 'misc', 'per_shipment', 'fixed', 3000, true, 10)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE DATA - CERTIFICATIONS
-- =====================================================
INSERT INTO certifications (name, cost_flat, charge_type, is_mandatory) VALUES
('FSSAI License', 2000, 'per_shipment', false),
('APEDA Registration', 1500, 'per_shipment', false),
('Phytosanitary Certificate', 1200, 'per_shipment', false),
('Certificate of Origin', 800, 'per_shipment', false),
('Halal Certification', 3000, 'per_shipment', false),
('Organic Certification', 5000, 'per_shipment', false)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE DATA - CURRENCY SETTINGS
-- =====================================================
INSERT INTO currency_settings (currency_code, currency_name, exchange_rate_to_inr, bank_margin) VALUES
('USD', 'US Dollar', 83.50, 0.50),
('EUR', 'Euro', 91.00, 0.60),
('GBP', 'British Pound', 106.00, 0.55),
('AED', 'UAE Dirham', 22.75, 0.40)
ON CONFLICT (currency_code) DO UPDATE SET exchange_rate_to_inr = EXCLUDED.exchange_rate_to_inr;

-- =====================================================
-- SAMPLE DATA - INSURANCE
-- =====================================================
INSERT INTO insurance_settings (rate_percent, calculation_base, min_premium) VALUES
(0.50, 'cif', 5000)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE DATA - BANK CHARGES
-- =====================================================
INSERT INTO bank_charges (name, charge_type, rate, calculation_base, is_active) VALUES
('Bank Negotiation Charges', 'percentage', 0.15, 'invoice', true),
('Foreign Realization Charges', 'percentage', 0.10, 'invoice', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE DATA - PROFIT RULES
-- =====================================================
INSERT INTO profit_rules (name, profit_type, rate, applies_to, is_active) VALUES
('Standard Margin', 'percentage', 5.00, 'total_cost', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE DATA - SETTINGS
-- =====================================================
INSERT INTO settings (key, value, description) VALUES
('company_name', 'Arovave Global', 'Company name'),
('company_email', 'exports@arovaveglobal.com', 'Company email'),
('company_phone', '+91 98765 43210', 'Company phone'),
('default_currency', 'USD', 'Default display currency'),
('quotation_validity_days', '7', 'Quote validity'),
('gst_rate', '18', 'Default GST rate')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- =====================================================
-- ADMIN USER
-- =====================================================
INSERT INTO admin_users (username, password_hash, email) VALUES
('admin', 'admin123', 'admin@arovaveglobal.com')
ON CONFLICT (username) DO NOTHING;
