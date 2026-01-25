/**
 * Data Access Layer
 * Uses settings.js for all data - no database required
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

// ============================================
// CONTAINER TYPES
// ============================================
export async function getContainerTypes() {
    return CONTAINER_TYPES.filter(c => c.is_active);
}

// ============================================
// PRODUCTS
// ============================================
export async function getProducts() {
    return PRODUCTS.filter(p => p.active);
}

// ============================================
// FACTORY LOCATIONS
// ============================================
export async function getLocations() {
    return LOCATIONS;
}

// ============================================
// INDIAN PORTS
// ============================================
export async function getPorts() {
    return PORTS;
}

// ============================================
// COUNTRIES
// ============================================
export async function getCountries() {
    return COUNTRIES;
}

// ============================================
// DESTINATION PORTS
// ============================================
export async function getDestinationPorts(countryId = null) {
    if (countryId) {
        return DESTINATION_PORTS.filter(p => p.country_id === parseInt(countryId));
    }
    return DESTINATION_PORTS;
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
    return CERTIFICATIONS;
}

// ============================================
// SETTINGS
// ============================================
export async function getSettings() {
    return SETTINGS;
}

// ============================================
// CURRENCY
// ============================================
export async function getCurrencySettings(code = 'USD') {
    return CURRENCY_SETTINGS[code] || CURRENCY_SETTINGS.USD;
}
