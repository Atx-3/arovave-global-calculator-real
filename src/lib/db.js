/**
 * Data Access Layer
 * Reads from JSON file via API for server-side, defaults for client-side
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

// Cache for settings data
let settingsCache = null;

// Fetch settings - try localStorage first, then API
async function fetchSettings() {
    if (typeof window === 'undefined') {
        // Server-side: use defaults
        return null;
    }

    if (settingsCache) {
        return settingsCache;
    }

    // 1. Try localStorage first (instant, works on Vercel)
    try {
        const stored = localStorage.getItem('arovave_all_settings');
        if (stored) {
            settingsCache = JSON.parse(stored);
            // Short cache for quick updates
            setTimeout(() => { settingsCache = null; }, 5000);
            return settingsCache;
        }
    } catch (e) {
        console.warn('localStorage read failed:', e);
    }

    // 2. Fallback to API
    try {
        const res = await fetch('/api/settings');
        if (res.ok) {
            settingsCache = await res.json();
            // Also save to localStorage for next time
            try {
                localStorage.setItem('arovave_all_settings', JSON.stringify(settingsCache));
            } catch (e) { /* ignore */ }
            setTimeout(() => { settingsCache = null; }, 5000);
            return settingsCache;
        }
    } catch (error) {
        console.error('Error fetching settings:', error);
    }
    return null;
}


// ============================================
// CONTAINER TYPES
// ============================================
export async function getContainerTypes() {
    const settings = await fetchSettings();
    const data = settings?.containers || CONTAINER_TYPES;
    return data.filter(c => c.is_active);
}

// ============================================
// PRODUCTS
// ============================================
export async function getProducts() {
    const settings = await fetchSettings();
    const data = settings?.products || PRODUCTS;
    return data.filter(p => p.active);
}

// ============================================
// FACTORY LOCATIONS
// ============================================
export async function getLocations() {
    const settings = await fetchSettings();
    return settings?.locations || LOCATIONS;
}

// ============================================
// INDIAN PORTS
// ============================================
export async function getPorts() {
    const settings = await fetchSettings();
    return settings?.ports || PORTS;
}

// ============================================
// COUNTRIES
// ============================================
export async function getCountries() {
    const settings = await fetchSettings();
    return settings?.countries || COUNTRIES;
}

// ============================================
// DESTINATION PORTS
// ============================================
export async function getDestinationPorts(countryId = null) {
    const settings = await fetchSettings();
    const data = settings?.destPorts || DESTINATION_PORTS;
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
    const settings = await fetchSettings();
    return settings?.certifications || CERTIFICATIONS;
}

// ============================================
// SETTINGS
// ============================================
export async function getSettings() {
    const settings = await fetchSettings();
    return settings?.settings || SETTINGS;
}

// ============================================
// CURRENCY
// ============================================
export async function getCurrencySettings(code = 'USD') {
    const settings = await fetchSettings();
    const defaultCurrency = CURRENCY_SETTINGS[code] || CURRENCY_SETTINGS.USD;

    // Override with dynamic settings if available
    if (settings?.settings && code === 'USD') {
        return {
            ...defaultCurrency,
            exchange_rate_to_inr: parseFloat(settings.settings.exchange_rate_usd) || defaultCurrency.exchange_rate_to_inr,
            bank_margin: parseFloat(settings.settings.bank_margin) || defaultCurrency.bank_margin
        };
    }

    return defaultCurrency;
}

// Clear cache (call after saving settings)
export function clearSettingsCache() {
    settingsCache = null;
}
