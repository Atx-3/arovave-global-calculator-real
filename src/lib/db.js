/**
 * Data Access Layer
 * Reads from localStorage if available, otherwise falls back to settings.js defaults
 */

import {
    CONTAINER_TYPES,
    PRODUCTS,
    LOCATIONS,
    PORTS,
    COUNTRIES,
    DESTINATION_PORTS,
    FREIGHT_RATES,
    DEFAULT_FREIGHT_RATE,
    LOCAL_FREIGHT_RATES,
    DEFAULT_LOCAL_FREIGHT,
    COST_HEADS,
    CERTIFICATIONS,
    CURRENCY_SETTINGS,
    SETTINGS,
} from './settings';

// Local storage keys (same as settings page)
const STORAGE_KEYS = {
    products: 'arovave_products',
    locations: 'arovave_locations',
    ports: 'arovave_ports',
    countries: 'arovave_countries',
    destPorts: 'arovave_dest_ports',
    containers: 'arovave_containers',
    certifications: 'arovave_certifications',
    settings: 'arovave_settings',
};

// Helper to load from localStorage with fallback
function loadFromStorage(key, defaults) {
    if (typeof window === 'undefined') return defaults;
    try {
        const stored = localStorage.getItem(STORAGE_KEYS[key]);
        return stored ? JSON.parse(stored) : defaults;
    } catch (e) {
        return defaults;
    }
}

// ============================================
// CONTAINER TYPES
// ============================================
export async function getContainerTypes() {
    const data = loadFromStorage('containers', CONTAINER_TYPES);
    return data.filter(c => c.is_active);
}

// ============================================
// PRODUCTS
// ============================================
export async function getProducts() {
    const data = loadFromStorage('products', PRODUCTS);
    return data.filter(p => p.active);
}

// ============================================
// FACTORY LOCATIONS
// ============================================
export async function getLocations() {
    return loadFromStorage('locations', LOCATIONS);
}

// ============================================
// INDIAN PORTS
// ============================================
export async function getPorts() {
    return loadFromStorage('ports', PORTS);
}

// ============================================
// COUNTRIES
// ============================================
export async function getCountries() {
    return loadFromStorage('countries', COUNTRIES);
}

// ============================================
// DESTINATION PORTS
// ============================================
export async function getDestinationPorts(countryId = null) {
    const data = loadFromStorage('destPorts', DESTINATION_PORTS);
    if (countryId) {
        return data.filter(p => p.country_id === parseInt(countryId));
    }
    return data;
}

// ============================================
// FREIGHT RATES
// ============================================
export async function getFreightRate(originPortId, destPortId, containerTypeId) {
    const key = `${originPortId}_${destPortId}_${containerTypeId}`;
    return FREIGHT_RATES[key] || DEFAULT_FREIGHT_RATE;
}

// ============================================
// LOCAL FREIGHT RATES
// ============================================
export async function getLocalFreightRate(factoryId, portId, containerTypeId) {
    const key = `${factoryId}_${portId}_${containerTypeId}`;
    return LOCAL_FREIGHT_RATES[key] || DEFAULT_LOCAL_FREIGHT;
}

// ============================================
// COST HEADS
// ============================================
export async function getCostHeads() {
    return COST_HEADS.filter(c => c.is_active);
}

// ============================================
// CERTIFICATIONS
// ============================================
export async function getCertifications() {
    return loadFromStorage('certifications', CERTIFICATIONS);
}

// ============================================
// SETTINGS
// ============================================
export async function getSettings() {
    return loadFromStorage('settings', SETTINGS);
}

// ============================================
// CURRENCY
// ============================================
export async function getCurrencySettings(code = 'USD') {
    return CURRENCY_SETTINGS[code] || CURRENCY_SETTINGS.USD;
}
