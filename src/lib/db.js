import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// ============================================
// DEMO DATA - CONTAINER TYPES
// ============================================
const DEMO_CONTAINER_TYPES = [
    { id: 1, name: '20 Feet Container', code: '20FT', max_weight_kg: 18000, max_volume_cbm: 33, is_active: true },
    { id: 2, name: '40 Feet Container', code: '40FT', max_weight_kg: 26000, max_volume_cbm: 67, is_active: true },
];

// ============================================
// DEMO DATA - PRODUCTS
// ============================================
const DEMO_PRODUCTS = [
    { id: 1, name: 'Premium Basmati Rice', hsn_code: '10063020', unit: 'KG', base_price_usd: 1.50, qty_per_20ft: 18000, qty_per_40ft: 26000, active: true },
    { id: 2, name: 'Organic Turmeric Powder', hsn_code: '09103010', unit: 'KG', base_price_usd: 3.00, qty_per_20ft: 16000, qty_per_40ft: 24000, active: true },
    { id: 3, name: 'Cumin Seeds', hsn_code: '09093110', unit: 'KG', base_price_usd: 4.50, qty_per_20ft: 15000, qty_per_40ft: 22000, active: true },
    { id: 4, name: 'Black Pepper Whole', hsn_code: '09041110', unit: 'KG', base_price_usd: 8.00, qty_per_20ft: 14000, qty_per_40ft: 21000, active: true },
    { id: 5, name: 'Cardamom Green', hsn_code: '09083110', unit: 'KG', base_price_usd: 25.00, qty_per_20ft: 12000, qty_per_40ft: 18000, active: true },
    { id: 6, name: 'Indian Tea (CTC)', hsn_code: '09024010', unit: 'KG', base_price_usd: 2.80, qty_per_20ft: 16000, qty_per_40ft: 24000, active: true },
    { id: 7, name: 'Mango Pulp', hsn_code: '08045020', unit: 'KG', base_price_usd: 2.50, qty_per_20ft: 17000, qty_per_40ft: 25000, active: true },
    { id: 8, name: 'Peanuts (Bold)', hsn_code: '12024190', unit: 'KG', base_price_usd: 1.20, qty_per_20ft: 18000, qty_per_40ft: 26000, active: true },
];

// ============================================
// DEMO DATA - LOCATIONS
// ============================================
const DEMO_LOCATIONS = [
    { id: 1, name: 'Delhi NCR', pincode: '110001', state: 'Delhi' },
    { id: 2, name: 'Mumbai', pincode: '400001', state: 'Maharashtra' },
    { id: 3, name: 'Chennai', pincode: '600001', state: 'Tamil Nadu' },
    { id: 4, name: 'Bangalore', pincode: '560001', state: 'Karnataka' },
    { id: 5, name: 'Ahmedabad', pincode: '380001', state: 'Gujarat' },
];

// ============================================
// DEMO DATA - INDIAN PORTS
// ============================================
const DEMO_PORTS = [
    { id: 1, name: 'Jawaharlal Nehru Port (JNPT)', code: 'INNSA', city: 'Mumbai', handling_per_container: 8000, cha_charges: 7500, customs_per_shipment: 5000 },
    { id: 2, name: 'Mundra Port', code: 'INMUN', city: 'Mundra', handling_per_container: 7000, cha_charges: 6000, customs_per_shipment: 4500 },
    { id: 3, name: 'Chennai Port', code: 'INMAA', city: 'Chennai', handling_per_container: 7500, cha_charges: 6500, customs_per_shipment: 4800 },
];

// ============================================
// DEMO DATA - COUNTRIES
// ============================================
const DEMO_COUNTRIES = [
    { id: 1, name: 'United Arab Emirates', code: 'AE', ecgc_risk_category: 'A', ecgc_rate_percent: 0.35 },
    { id: 2, name: 'Saudi Arabia', code: 'SA', ecgc_risk_category: 'A', ecgc_rate_percent: 0.40 },
    { id: 3, name: 'United States', code: 'US', ecgc_risk_category: 'A', ecgc_rate_percent: 0.30 },
    { id: 4, name: 'United Kingdom', code: 'GB', ecgc_risk_category: 'A', ecgc_rate_percent: 0.30 },
    { id: 5, name: 'Germany', code: 'DE', ecgc_risk_category: 'A', ecgc_rate_percent: 0.30 },
    { id: 6, name: 'Singapore', code: 'SG', ecgc_risk_category: 'A', ecgc_rate_percent: 0.25 },
    { id: 7, name: 'Australia', code: 'AU', ecgc_risk_category: 'A', ecgc_rate_percent: 0.30 },
];

// ============================================
// DEMO DATA - DESTINATION PORTS
// ============================================
const DEMO_DESTINATION_PORTS = [
    { id: 1, country_id: 1, name: 'Jebel Ali Port', code: 'AEJEA', countries: { name: 'UAE' } },
    { id: 2, country_id: 1, name: 'Abu Dhabi Port', code: 'AEAUH', countries: { name: 'UAE' } },
    { id: 3, country_id: 2, name: 'Jeddah Port', code: 'SAJED', countries: { name: 'Saudi Arabia' } },
    { id: 4, country_id: 3, name: 'Los Angeles Port', code: 'USLAX', countries: { name: 'USA' } },
    { id: 5, country_id: 3, name: 'New York Port', code: 'USNYC', countries: { name: 'USA' } },
    { id: 6, country_id: 4, name: 'Felixstowe Port', code: 'GBFXT', countries: { name: 'UK' } },
    { id: 7, country_id: 5, name: 'Hamburg Port', code: 'DEHAM', countries: { name: 'Germany' } },
    { id: 8, country_id: 6, name: 'Singapore Port', code: 'SGSIN', countries: { name: 'Singapore' } },
    { id: 9, country_id: 7, name: 'Melbourne Port', code: 'AUMEL', countries: { name: 'Australia' } },
];

// ============================================
// DEMO DATA - FREIGHT RATES
// ============================================
const DEMO_FREIGHT_RATES = [
    // UAE
    { id: 1, origin_port_id: 1, dest_port_id: 1, container_type_id: 1, rate_amount: 800, currency: 'USD', freight_conversion_rate: 1.0, gst_percent: 5 },
    { id: 2, origin_port_id: 1, dest_port_id: 1, container_type_id: 2, rate_amount: 1400, currency: 'USD', freight_conversion_rate: 1.0, gst_percent: 5 },
    // USA
    { id: 3, origin_port_id: 1, dest_port_id: 4, container_type_id: 1, rate_amount: 2200, currency: 'USD', freight_conversion_rate: 1.0, gst_percent: 5 },
    { id: 4, origin_port_id: 1, dest_port_id: 4, container_type_id: 2, rate_amount: 3800, currency: 'USD', freight_conversion_rate: 1.0, gst_percent: 5 },
    // Singapore
    { id: 5, origin_port_id: 1, dest_port_id: 8, container_type_id: 1, rate_amount: 600, currency: 'USD', freight_conversion_rate: 1.0, gst_percent: 5 },
    { id: 6, origin_port_id: 1, dest_port_id: 8, container_type_id: 2, rate_amount: 1000, currency: 'USD', freight_conversion_rate: 1.0, gst_percent: 5 },
];

// ============================================
// DEMO DATA - LOCAL FREIGHT
// ============================================
const DEMO_LOCAL_FREIGHT = [
    { id: 1, factory_id: 1, port_id: 1, container_type_id: 1, rate_type: 'fixed', rate_amount: 45000, distance_km: 1400 },
    { id: 2, factory_id: 1, port_id: 1, container_type_id: 2, rate_type: 'fixed', rate_amount: 65000, distance_km: 1400 },
    { id: 3, factory_id: 2, port_id: 1, container_type_id: 1, rate_type: 'fixed', rate_amount: 8000, distance_km: 50 },
    { id: 4, factory_id: 2, port_id: 1, container_type_id: 2, rate_type: 'fixed', rate_amount: 12000, distance_km: 50 },
    { id: 5, factory_id: 5, port_id: 2, container_type_id: 1, rate_type: 'fixed', rate_amount: 15000, distance_km: 350 },
    { id: 6, factory_id: 5, port_id: 2, container_type_id: 2, rate_type: 'fixed', rate_amount: 22000, distance_km: 350 },
];

// ============================================
// DEMO DATA - COST HEADS
// ============================================
const DEMO_COST_HEADS = [
    { id: 1, name: 'Loading Charges', category: 'handling', charge_type: 'per_container', calculation_base: 'fixed', base_amount: 3000, is_active: true, display_order: 1 },
    { id: 2, name: 'Stuffing Charges', category: 'handling', charge_type: 'per_container', calculation_base: 'fixed', base_amount: 5000, is_active: true, display_order: 2 },
    { id: 3, name: 'Palletization', category: 'handling', charge_type: 'per_container', calculation_base: 'fixed', base_amount: 4000, is_active: true, display_order: 3 },
    { id: 4, name: 'Shipping Bill', category: 'port', charge_type: 'per_shipment', calculation_base: 'fixed', base_amount: 2500, is_active: true, display_order: 4 },
    { id: 5, name: 'Miscellaneous', category: 'misc', charge_type: 'per_shipment', calculation_base: 'fixed', base_amount: 3000, is_active: true, display_order: 10 },
];

// ============================================
// DEMO DATA - CERTIFICATIONS
// ============================================
const DEMO_CERTIFICATIONS = [
    { id: 1, name: 'FSSAI License', cost_flat: 2000, cost_percentage: 0, charge_type: 'per_shipment', is_mandatory: false },
    { id: 2, name: 'APEDA Registration', cost_flat: 1500, cost_percentage: 0, charge_type: 'per_shipment', is_mandatory: false },
    { id: 3, name: 'Phytosanitary Certificate', cost_flat: 1200, cost_percentage: 0, charge_type: 'per_shipment', is_mandatory: false },
    { id: 4, name: 'Certificate of Origin', cost_flat: 800, cost_percentage: 0, charge_type: 'per_shipment', is_mandatory: false },
    { id: 5, name: 'Halal Certification', cost_flat: 3000, cost_percentage: 0, charge_type: 'per_shipment', is_mandatory: false },
    { id: 6, name: 'Organic Certification', cost_flat: 5000, cost_percentage: 0, charge_type: 'per_shipment', is_mandatory: false },
];

// ============================================
// DEMO DATA - CURRENCY SETTINGS
// ============================================
const DEMO_CURRENCY = {
    USD: { currency_code: 'USD', currency_name: 'US Dollar', exchange_rate_to_inr: 83.50, bank_margin: 0.50 },
    EUR: { currency_code: 'EUR', currency_name: 'Euro', exchange_rate_to_inr: 91.00, bank_margin: 0.60 },
};

// ============================================
// DEMO DATA - SETTINGS
// ============================================
const DEMO_SETTINGS = {
    insurance_rate: '0.50',
    min_insurance: '5000',
    bank_charge_rate: '0.25',
    profit_rate: '5.0',
    profit_type: 'percentage',
    company_name: 'Arovave Global',
    exchange_rate_usd: '83.50',
    bank_margin: '0.50',
};

// ============================================
// CONTAINER TYPES
// ============================================
export async function getContainerTypes() {
    if (!supabase) return DEMO_CONTAINER_TYPES.filter(c => c.is_active);

    const { data, error } = await supabase
        .from('container_types')
        .select('*')
        .eq('is_active', true)
        .order('id');

    if (error) throw error;
    return data;
}

// ============================================
// PRODUCTS
// ============================================
export async function getProducts() {
    if (!supabase) return DEMO_PRODUCTS.filter(p => p.active);

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name');

    if (error) throw error;
    return data;
}

export async function getAllProducts() {
    if (!supabase) return DEMO_PRODUCTS;

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

    if (error) throw error;
    return data;
}

export async function createProduct(product) {
    if (!supabase) {
        const newProduct = { ...product, id: Date.now() };
        DEMO_PRODUCTS.push(newProduct);
        return newProduct;
    }

    const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateProduct(id, updates) {
    if (!supabase) {
        const idx = DEMO_PRODUCTS.findIndex(p => p.id === id);
        if (idx !== -1) DEMO_PRODUCTS[idx] = { ...DEMO_PRODUCTS[idx], ...updates };
        return DEMO_PRODUCTS[idx];
    }

    const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteProduct(id) {
    if (!supabase) {
        const idx = DEMO_PRODUCTS.findIndex(p => p.id === id);
        if (idx !== -1) DEMO_PRODUCTS.splice(idx, 1);
        return true;
    }

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    return true;
}

// ============================================
// FACTORY LOCATIONS
// ============================================
export async function getLocations() {
    if (!supabase) return DEMO_LOCATIONS;

    const { data, error } = await supabase
        .from('factory_locations')
        .select('*')
        .order('name');

    if (error) throw error;
    return data;
}

export async function createLocation(location) {
    if (!supabase) {
        const newItem = { ...location, id: Date.now() };
        DEMO_LOCATIONS.push(newItem);
        return newItem;
    }
    const { data, error } = await supabase.from('factory_locations').insert([location]).select().single();
    if (error) throw error;
    return data;
}

export async function updateLocation(id, updates) {
    if (!supabase) {
        const idx = DEMO_LOCATIONS.findIndex(p => p.id === id);
        if (idx !== -1) DEMO_LOCATIONS[idx] = { ...DEMO_LOCATIONS[idx], ...updates };
        return DEMO_LOCATIONS[idx];
    }
    const { data, error } = await supabase.from('factory_locations').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
}

export async function deleteLocation(id) {
    if (!supabase) {
        const idx = DEMO_LOCATIONS.findIndex(p => p.id === id);
        if (idx !== -1) DEMO_LOCATIONS.splice(idx, 1);
        return true;
    }
    const { error } = await supabase.from('factory_locations').delete().eq('id', id);
    if (error) throw error;
    return true;
}

// ============================================
// INDIAN PORTS
// ============================================
export async function getPorts() {
    if (!supabase) return DEMO_PORTS;

    const { data, error } = await supabase
        .from('indian_ports')
        .select('*')
        .order('name');

    if (error) throw error;
    return data;
}

export async function createPort(port) {
    if (!supabase) {
        const newItem = { ...port, id: Date.now() };
        DEMO_PORTS.push(newItem);
        return newItem;
    }
    const { data, error } = await supabase.from('indian_ports').insert([port]).select().single();
    if (error) throw error;
    return data;
}

export async function updatePort(id, updates) {
    if (!supabase) {
        const idx = DEMO_PORTS.findIndex(p => p.id === id);
        if (idx !== -1) DEMO_PORTS[idx] = { ...DEMO_PORTS[idx], ...updates };
        return DEMO_PORTS[idx];
    }
    const { data, error } = await supabase.from('indian_ports').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
}

export async function deletePort(id) {
    if (!supabase) {
        const idx = DEMO_PORTS.findIndex(p => p.id === id);
        if (idx !== -1) DEMO_PORTS.splice(idx, 1);
        return true;
    }
    const { error } = await supabase.from('indian_ports').delete().eq('id', id);
    if (error) throw error;
    return true;
}

// ============================================
// COUNTRIES
// ============================================
export async function getCountries() {
    if (!supabase) return DEMO_COUNTRIES;

    const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');

    if (error) throw error;
    return data;
}

export async function createCountry(country) {
    if (!supabase) {
        const newItem = { ...country, id: Date.now() };
        DEMO_COUNTRIES.push(newItem);
        return newItem;
    }
    const { data, error } = await supabase.from('countries').insert([country]).select().single();
    if (error) throw error;
    return data;
}

export async function updateCountry(id, updates) {
    if (!supabase) {
        const idx = DEMO_COUNTRIES.findIndex(p => p.id === id);
        if (idx !== -1) DEMO_COUNTRIES[idx] = { ...DEMO_COUNTRIES[idx], ...updates };
        return DEMO_COUNTRIES[idx];
    }
    const { data, error } = await supabase.from('countries').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
}

export async function deleteCountry(id) {
    if (!supabase) {
        const idx = DEMO_COUNTRIES.findIndex(p => p.id === id);
        if (idx !== -1) DEMO_COUNTRIES.splice(idx, 1);
        return true;
    }
    const { error } = await supabase.from('countries').delete().eq('id', id);
    if (error) throw error;
    return true;
}

// ============================================
// DESTINATION PORTS
// ============================================
export async function getDestinationPorts(countryId = null) {
    if (!supabase) {
        if (countryId) {
            return DEMO_DESTINATION_PORTS.filter(p => p.country_id === parseInt(countryId));
        }
        return DEMO_DESTINATION_PORTS;
    }

    let query = supabase.from('destination_ports').select('*, countries(name)').order('name');
    if (countryId) query = query.eq('country_id', countryId);

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

export async function createDestinationPort(port) {
    if (!supabase) {
        const country = DEMO_COUNTRIES.find(c => c.id === port.country_id);
        const newItem = { ...port, id: Date.now(), countries: { name: country?.name } };
        DEMO_DESTINATION_PORTS.push(newItem);
        return newItem;
    }
    const { data, error } = await supabase.from('destination_ports').insert([port]).select().single();
    if (error) throw error;
    return data;
}

export async function updateDestinationPort(id, updates) {
    if (!supabase) {
        const idx = DEMO_DESTINATION_PORTS.findIndex(p => p.id === id);
        if (idx !== -1) DEMO_DESTINATION_PORTS[idx] = { ...DEMO_DESTINATION_PORTS[idx], ...updates };
        return DEMO_DESTINATION_PORTS[idx];
    }
    const { data, error } = await supabase.from('destination_ports').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
}

export async function deleteDestinationPort(id) {
    if (!supabase) {
        const idx = DEMO_DESTINATION_PORTS.findIndex(p => p.id === id);
        if (idx !== -1) DEMO_DESTINATION_PORTS.splice(idx, 1);
        return true;
    }
    const { error } = await supabase.from('destination_ports').delete().eq('id', id);
    if (error) throw error;
    return true;
}

// ============================================
// FREIGHT RATES
// ============================================
export async function getFreightRate(originPortId, destPortId, containerTypeId) {
    if (!supabase) {
        return DEMO_FREIGHT_RATES.find(f =>
            f.origin_port_id === parseInt(originPortId) &&
            f.dest_port_id === parseInt(destPortId) &&
            f.container_type_id === parseInt(containerTypeId)
        ) || { rate_amount: 1000, currency: 'USD', freight_conversion_rate: 1.0, gst_percent: 5 };
    }

    const { data, error } = await supabase
        .from('freight_rates')
        .select('*')
        .eq('origin_port_id', originPortId)
        .eq('dest_port_id', destPortId)
        .eq('container_type_id', containerTypeId)
        .eq('is_active', true)
        .single();

    if (error) return { rate_amount: 1000, currency: 'USD', freight_conversion_rate: 1.0, gst_percent: 5 };
    return data;
}

// ============================================
// LOCAL FREIGHT RATES
// ============================================
export async function getLocalFreightRate(factoryId, portId, containerTypeId) {
    if (!supabase) {
        const rate = DEMO_LOCAL_FREIGHT.find(f =>
            f.factory_id === parseInt(factoryId) &&
            f.port_id === parseInt(portId) &&
            f.container_type_id === parseInt(containerTypeId)
        );
        return rate?.rate_amount || 25000;
    }

    const { data, error } = await supabase
        .from('local_freight_rates')
        .select('*')
        .eq('factory_id', factoryId)
        .eq('port_id', portId)
        .eq('container_type_id', containerTypeId)
        .single();

    if (error) return 25000;
    return data?.rate_amount || 25000;
}

// ============================================
// COST HEADS
// ============================================
export async function getCostHeads() {
    if (!supabase) return DEMO_COST_HEADS.filter(c => c.is_active);

    const { data, error } = await supabase
        .from('cost_heads')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

    if (error) throw error;
    return data;
}

// ============================================
// CERTIFICATIONS
// ============================================
export async function getCertifications() {
    if (!supabase) return DEMO_CERTIFICATIONS;

    const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .order('name');

    if (error) throw error;
    return data;
}

export async function createCertification(cert) {
    if (!supabase) {
        const newItem = { ...cert, id: Date.now() };
        DEMO_CERTIFICATIONS.push(newItem);
        return newItem;
    }
    const { data, error } = await supabase.from('certifications').insert([cert]).select().single();
    if (error) throw error;
    return data;
}

export async function updateCertification(id, updates) {
    if (!supabase) {
        const idx = DEMO_CERTIFICATIONS.findIndex(p => p.id === id);
        if (idx !== -1) DEMO_CERTIFICATIONS[idx] = { ...DEMO_CERTIFICATIONS[idx], ...updates };
        return DEMO_CERTIFICATIONS[idx];
    }
    const { data, error } = await supabase.from('certifications').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
}

export async function deleteCertification(id) {
    if (!supabase) {
        const idx = DEMO_CERTIFICATIONS.findIndex(p => p.id === id);
        if (idx !== -1) DEMO_CERTIFICATIONS.splice(idx, 1);
        return true;
    }
    const { error } = await supabase.from('certifications').delete().eq('id', id);
    if (error) throw error;
    return true;
}

// ============================================
// SETTINGS
// ============================================
export async function getSettings() {
    if (!supabase) return DEMO_SETTINGS;

    const { data, error } = await supabase.from('settings').select('*');
    if (error) throw error;

    const settings = {};
    data.forEach(item => { settings[item.key] = item.value; });
    return settings;
}

export async function updateSetting(key, value) {
    if (!supabase) {
        DEMO_SETTINGS[key] = value;
        return { key, value };
    }
    const { data, error } = await supabase.from('settings').upsert([{ key, value }], { onConflict: 'key' }).select().single();
    if (error) throw error;
    return data;
}

// ============================================
// CURRENCY
// ============================================
export async function getCurrencySettings(code = 'USD') {
    if (!supabase) return DEMO_CURRENCY[code] || DEMO_CURRENCY.USD;

    const { data, error } = await supabase
        .from('currency_settings')
        .select('*')
        .eq('currency_code', code)
        .single();

    if (error) return DEMO_CURRENCY.USD;
    return data;
}

// ============================================
// ADMIN AUTH
// ============================================
export async function adminLogin(username, password) {
    if (username === 'admin' && password === 'admin123') {
        return { username: 'admin', email: 'admin@arovaveglobal.com' };
    }
    throw new Error('Invalid credentials');
}

export const isDemoMode = !isSupabaseConfigured;
