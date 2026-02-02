/**
 * Pincode-based Distance Calculator
 * Offline distance calculation using coordinates
 * No external API required
 */

// Major Indian city/area coordinates (approximate center points)
// Format: pincode prefix (first 2-3 digits) -> { lat, lng, name }
const PINCODE_COORDINATES = {
    // Delhi NCR (110xxx)
    '110': { lat: 28.6139, lng: 77.2090, name: 'Delhi' },
    '201': { lat: 28.6304, lng: 77.4460, name: 'Ghaziabad' },
    '122': { lat: 28.4595, lng: 77.0266, name: 'Gurgaon' },
    '121': { lat: 28.4089, lng: 77.3178, name: 'Faridabad' },

    // Mumbai (400xxx)
    '400': { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
    '401': { lat: 19.2183, lng: 72.9781, name: 'Thane' },
    '410': { lat: 18.8584, lng: 73.2918, name: 'Panvel/Navi Mumbai' },

    // Chennai (600xxx)
    '600': { lat: 13.0827, lng: 80.2707, name: 'Chennai' },
    '601': { lat: 12.9909, lng: 80.2161, name: 'Kanchipuram' },

    // Bangalore (560xxx)
    '560': { lat: 12.9716, lng: 77.5946, name: 'Bangalore' },

    // Ahmedabad (380xxx)
    '380': { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad' },
    '382': { lat: 23.0469, lng: 72.6520, name: 'Gandhinagar' },

    // Kolkata (700xxx)
    '700': { lat: 22.5726, lng: 88.3639, name: 'Kolkata' },

    // Hyderabad (500xxx)
    '500': { lat: 17.3850, lng: 78.4867, name: 'Hyderabad' },

    // Pune (411xxx)
    '411': { lat: 18.5204, lng: 73.8567, name: 'Pune' },

    // Jaipur (302xxx)
    '302': { lat: 26.9124, lng: 75.7873, name: 'Jaipur' },

    // Lucknow (226xxx)
    '226': { lat: 26.8467, lng: 80.9462, name: 'Lucknow' },

    // Surat (395xxx)
    '395': { lat: 21.1702, lng: 72.8311, name: 'Surat' },

    // Vadodara (390xxx)
    '390': { lat: 22.3072, lng: 73.1812, name: 'Vadodara' },

    // Indore (452xxx)
    '452': { lat: 22.7196, lng: 75.8577, name: 'Indore' },

    // Nagpur (440xxx)
    '440': { lat: 21.1458, lng: 79.0882, name: 'Nagpur' },

    // Coimbatore (641xxx)
    '641': { lat: 11.0168, lng: 76.9558, name: 'Coimbatore' },

    // Kochi (682xxx)
    '682': { lat: 9.9312, lng: 76.2673, name: 'Kochi' },

    // Visakhapatnam (530xxx)
    '530': { lat: 17.6868, lng: 83.2185, name: 'Visakhapatnam' },

    // Rajkot (360xxx)
    '360': { lat: 22.3039, lng: 70.8022, name: 'Rajkot' },

    // Mundra Port area (370xxx)
    '370': { lat: 22.8386, lng: 69.7159, name: 'Mundra/Kutch' },
};

// Major port coordinates
const PORT_COORDINATES = {
    'INNSA': { lat: 18.9488, lng: 72.9512, name: 'JNPT Mumbai' },      // Jawaharlal Nehru Port
    'INMUN': { lat: 22.8386, lng: 69.7159, name: 'Mundra Port' },       // Mundra Port
    'INMAA': { lat: 13.0878, lng: 80.2915, name: 'Chennai Port' },      // Chennai Port
    'INBLR': { lat: 12.9716, lng: 77.5946, name: 'Bangalore ICD' },     // Bangalore (ICD)
    'INDEL': { lat: 28.5921, lng: 77.2304, name: 'Delhi ICD' },         // Delhi (ICD Tughlakabad)
    'INCCU': { lat: 22.3569, lng: 88.4040, name: 'Kolkata Port' },      // Kolkata/Haldia Port
    'INPAV': { lat: 20.2961, lng: 85.8245, name: 'Paradip Port' },      // Paradip Port
    'INVTZ': { lat: 17.6868, lng: 83.2870, name: 'Vizag Port' },        // Visakhapatnam Port
    'INCOK': { lat: 9.9658, lng: 76.2674, name: 'Kochi Port' },         // Cochin Port
    'INTUT': { lat: 8.7642, lng: 78.1348, name: 'Tuticorin Port' },     // Tuticorin Port
    'INKTP': { lat: 12.6950, lng: 74.8520, name: 'Mangalore Port' },    // New Mangalore Port
    'INPBD': { lat: 21.6346, lng: 69.6092, name: 'Pipavav Port' },      // Pipavav Port
    'INKAK': { lat: 22.4548, lng: 70.0655, name: 'Kandla Port' },       // Kandla Port
    'INHZA': { lat: 21.7051, lng: 72.1893, name: 'Hazira Port' },       // Hazira Port
};

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function calculateHaversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Add 30% for road distance (approximate)
    return Math.round(distance * 1.3);
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Get coordinates from pincode
 * @param {string} pincode - 6 digit pincode
 * @returns {object|null} { lat, lng, name } or null if not found
 */
export function getCoordinatesFromPincode(pincode) {
    if (!pincode || pincode.length < 3) return null;

    // Try full 6 digit match first
    const pin6 = pincode.substring(0, 6);
    const pin3 = pincode.substring(0, 3);
    const pin2 = pincode.substring(0, 2);

    // Check 3-digit prefix
    if (PINCODE_COORDINATES[pin3]) {
        return PINCODE_COORDINATES[pin3];
    }

    // Check 2-digit prefix for broader regions
    if (PINCODE_COORDINATES[pin2]) {
        return PINCODE_COORDINATES[pin2];
    }

    return null;
}

/**
 * Get coordinates for a port by code
 * @param {string} portCode - Port code like 'INNSA'
 * @returns {object|null} { lat, lng, name }
 */
export function getPortCoordinates(portCode) {
    return PORT_COORDINATES[portCode] || null;
}

/**
 * Calculate distance between a pincode and a port
 * @param {string} pincode - Source pincode
 * @param {string} portCode - Destination port code
 * @param {string} [portPincode] - Optional destination port pincode override
 * @returns {object} { distance, from, to } or { error }
 */
export function calculateDistanceFromPincodeToPort(pincode, portCode, portPincode = null) {
    const sourceCoords = getCoordinatesFromPincode(pincode);
    let destCoords = null;

    // Try port pincode first if available
    if (portPincode) {
        destCoords = getCoordinatesFromPincode(portPincode);
    }

    // Fallback to port code lookup if no pincode or pincode invalid
    if (!destCoords) {
        destCoords = getPortCoordinates(portCode);
    }

    if (!sourceCoords) {
        return { error: `Pincode ${pincode} not found in database` };
    }

    if (!destCoords) {
        return { error: `Port coordinates not found (Code: ${portCode}, Pin: ${portPincode})` };
    }

    const distance = calculateHaversineDistance(
        sourceCoords.lat, sourceCoords.lng,
        destCoords.lat, destCoords.lng
    );

    return {
        distance,
        from: sourceCoords.name,
        to: destCoords.name,
        fromCoords: sourceCoords,
        toCoords: destCoords
    };
}

/**
 * Calculate local freight cost based on distance
 * @param {number} distanceKm - Distance in km
 * @param {string} containerType - '20FT' or '40FT'
 * @param {number} ratePerKm20ft - Rate per km for 20FT
 * @param {number} ratePerKm40ft - Rate per km for 40FT
 * @param {number} minCharge - Minimum freight charge
 * @returns {number} Freight cost in INR
 */
export function calculateFreightFromDistance(distanceKm, containerType, ratePerKm20ft = 45, ratePerKm40ft = 65, minCharge = 5000) {
    const rate = containerType === '40FT' ? ratePerKm40ft : ratePerKm20ft;
    const cost = distanceKm * rate;
    return Math.max(cost, minCharge);
}

// Export coordinates for reference
export { PINCODE_COORDINATES, PORT_COORDINATES };
