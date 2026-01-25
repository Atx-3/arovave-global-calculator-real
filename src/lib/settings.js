/**
 * Calculator Settings Configuration
 * Edit this file to update products, ports, freight rates, etc.
 * No database or Supabase required - all data is stored here.
 */

// ============================================
// CONTAINER TYPES
// ============================================
export const CONTAINER_TYPES = [
    { id: 1, name: '20 Feet Container', code: '20FT', max_weight_kg: 18000, max_volume_cbm: 33, is_active: true },
    { id: 2, name: '40 Feet Container', code: '40FT', max_weight_kg: 26000, max_volume_cbm: 67, is_active: true },
];

// ============================================
// PRODUCTS
// ============================================
export const PRODUCTS = [
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
// FACTORY LOCATIONS (Manufacturing Locations)
// ============================================
export const LOCATIONS = [
    { id: 1, name: 'Delhi NCR', pincode: '110001', state: 'Delhi' },
    { id: 2, name: 'Mumbai', pincode: '400001', state: 'Maharashtra' },
    { id: 3, name: 'Chennai', pincode: '600001', state: 'Tamil Nadu' },
    { id: 4, name: 'Bangalore', pincode: '560001', state: 'Karnataka' },
    { id: 5, name: 'Ahmedabad', pincode: '380001', state: 'Gujarat' },
];

// ============================================
// INDIAN PORTS (Loading Ports)
// ============================================
export const PORTS = [
    { id: 1, name: 'Jawaharlal Nehru Port (JNPT)', code: 'INNSA', city: 'Mumbai', handling_per_container: 8000, cha_charges: 7500, customs_per_shipment: 5000 },
    { id: 2, name: 'Mundra Port', code: 'INMUN', city: 'Mundra', handling_per_container: 7000, cha_charges: 6000, customs_per_shipment: 4500 },
    { id: 3, name: 'Chennai Port', code: 'INMAA', city: 'Chennai', handling_per_container: 7500, cha_charges: 6500, customs_per_shipment: 4800 },
];

// ============================================
// DESTINATION COUNTRIES
// ============================================
export const COUNTRIES = [
    { id: 1, name: 'United Arab Emirates', code: 'AE', ecgc_risk_category: 'A', ecgc_rate_percent: 0.35 },
    { id: 2, name: 'Saudi Arabia', code: 'SA', ecgc_risk_category: 'A', ecgc_rate_percent: 0.40 },
    { id: 3, name: 'United States', code: 'US', ecgc_risk_category: 'A', ecgc_rate_percent: 0.30 },
    { id: 4, name: 'United Kingdom', code: 'GB', ecgc_risk_category: 'A', ecgc_rate_percent: 0.30 },
    { id: 5, name: 'Germany', code: 'DE', ecgc_risk_category: 'A', ecgc_rate_percent: 0.30 },
    { id: 6, name: 'Singapore', code: 'SG', ecgc_risk_category: 'A', ecgc_rate_percent: 0.25 },
    { id: 7, name: 'Australia', code: 'AU', ecgc_risk_category: 'A', ecgc_rate_percent: 0.30 },
];

// ============================================
// DESTINATION PORTS
// ============================================
export const DESTINATION_PORTS = [
    { id: 1, country_id: 1, name: 'Jebel Ali Port', code: 'AEJEA' },
    { id: 2, country_id: 1, name: 'Abu Dhabi Port', code: 'AEAUH' },
    { id: 3, country_id: 2, name: 'Jeddah Port', code: 'SAJED' },
    { id: 4, country_id: 3, name: 'Los Angeles Port', code: 'USLAX' },
    { id: 5, country_id: 3, name: 'New York Port', code: 'USNYC' },
    { id: 6, country_id: 4, name: 'Felixstowe Port', code: 'GBFXT' },
    { id: 7, country_id: 5, name: 'Hamburg Port', code: 'DEHAM' },
    { id: 8, country_id: 6, name: 'Singapore Port', code: 'SGSIN' },
    { id: 9, country_id: 7, name: 'Melbourne Port', code: 'AUMEL' },
];

// ============================================
// OCEAN FREIGHT RATES (USD per container)
// Key: "originPortId_destPortId_containerTypeId"
// ============================================
export const FREIGHT_RATES = {
    // From JNPT (port 1)
    '1_1_1': { rate_amount: 800, currency: 'USD', gst_percent: 5 },   // JNPT -> Jebel Ali, 20FT
    '1_1_2': { rate_amount: 1400, currency: 'USD', gst_percent: 5 },  // JNPT -> Jebel Ali, 40FT
    '1_4_1': { rate_amount: 2200, currency: 'USD', gst_percent: 5 },  // JNPT -> Los Angeles, 20FT
    '1_4_2': { rate_amount: 3800, currency: 'USD', gst_percent: 5 },  // JNPT -> Los Angeles, 40FT
    '1_8_1': { rate_amount: 600, currency: 'USD', gst_percent: 5 },   // JNPT -> Singapore, 20FT
    '1_8_2': { rate_amount: 1000, currency: 'USD', gst_percent: 5 },  // JNPT -> Singapore, 40FT
};

// Default freight rate if not found
export const DEFAULT_FREIGHT_RATE = { rate_amount: 1000, currency: 'USD', gst_percent: 5 };

// ============================================
// LOCAL FREIGHT RATES (INR per container)
// Key: "factoryId_portId_containerTypeId"
// ============================================
export const LOCAL_FREIGHT_RATES = {
    '1_1_1': 45000,  // Delhi -> JNPT, 20FT
    '1_1_2': 65000,  // Delhi -> JNPT, 40FT
    '2_1_1': 8000,   // Mumbai -> JNPT, 20FT
    '2_1_2': 12000,  // Mumbai -> JNPT, 40FT
    '5_2_1': 15000,  // Ahmedabad -> Mundra, 20FT
    '5_2_2': 22000,  // Ahmedabad -> Mundra, 40FT
};

// Default local freight if not found
export const DEFAULT_LOCAL_FREIGHT = 25000;

// ============================================
// COST HEADS (Handling Charges)
// ============================================
export const COST_HEADS = [
    { id: 1, name: 'Loading Charges', category: 'handling', charge_type: 'per_container', base_amount: 3000, is_active: true },
    { id: 2, name: 'Stuffing Charges', category: 'handling', charge_type: 'per_container', base_amount: 5000, is_active: true },
    { id: 3, name: 'Palletization', category: 'handling', charge_type: 'per_container', base_amount: 4000, is_active: true },
    { id: 4, name: 'Shipping Bill', category: 'port', charge_type: 'per_shipment', base_amount: 2500, is_active: true },
    { id: 5, name: 'Miscellaneous', category: 'misc', charge_type: 'per_shipment', base_amount: 3000, is_active: true },
];

// ============================================
// CERTIFICATIONS (Optional)
// ============================================
export const CERTIFICATIONS = [
    { id: 1, name: 'FSSAI License', cost_flat: 2000, charge_type: 'per_shipment', is_mandatory: false },
    { id: 2, name: 'APEDA Registration', cost_flat: 1500, charge_type: 'per_shipment', is_mandatory: false },
    { id: 3, name: 'Phytosanitary Certificate', cost_flat: 1200, charge_type: 'per_shipment', is_mandatory: false },
    { id: 4, name: 'Certificate of Origin', cost_flat: 800, charge_type: 'per_shipment', is_mandatory: false },
    { id: 5, name: 'Halal Certification', cost_flat: 3000, charge_type: 'per_shipment', is_mandatory: false },
    { id: 6, name: 'Organic Certification', cost_flat: 5000, charge_type: 'per_shipment', is_mandatory: false },
];

// ============================================
// CURRENCY SETTINGS
// ============================================
export const CURRENCY_SETTINGS = {
    USD: {
        currency_code: 'USD',
        currency_name: 'US Dollar',
        exchange_rate_to_inr: 83.50,
        bank_margin: 0.50
    },
    EUR: {
        currency_code: 'EUR',
        currency_name: 'Euro',
        exchange_rate_to_inr: 91.00,
        bank_margin: 0.60
    },
};

// ============================================
// GENERAL SETTINGS
// ============================================
export const SETTINGS = {
    insurance_rate: '0.50',
    min_insurance: '5000',
    bank_charge_rate: '0.25',
    profit_rate: '5.0',
    profit_type: 'percentage',
    company_name: 'Arovave Global',
    exchange_rate_usd: '83.50',
    bank_margin: '0.50',
    // Local freight rate per km (INR)
    freight_rate_per_km_20ft: '45',
    freight_rate_per_km_40ft: '65',
    min_freight_charge: '5000',
};
