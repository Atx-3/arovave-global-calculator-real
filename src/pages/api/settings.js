import fs from 'fs';
import path from 'path';

// Path to the settings data file
const DATA_FILE = path.join(process.cwd(), 'data', 'settings-data.json');

// Default settings from settings.js
import {
    CONTAINER_TYPES,
    PRODUCTS,
    LOCATIONS,
    PORTS,
    COUNTRIES,
    DESTINATION_PORTS,
    CERTIFICATIONS,
    SETTINGS,
} from '@/lib/settings';

const DEFAULTS = {
    products: PRODUCTS,
    locations: LOCATIONS,
    ports: PORTS,
    countries: COUNTRIES,
    destPorts: DESTINATION_PORTS,
    containers: CONTAINER_TYPES,
    certifications: CERTIFICATIONS,
    settings: SETTINGS,
};

// Read data from file
function readData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            // Create file with defaults if doesn't exist
            fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULTS, null, 2));
            return DEFAULTS;
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(data);

        // Merge with defaults for any missing keys
        return {
            products: parsed.products?.length ? parsed.products : DEFAULTS.products,
            locations: parsed.locations?.length ? parsed.locations : DEFAULTS.locations,
            ports: parsed.ports?.length ? parsed.ports : DEFAULTS.ports,
            countries: parsed.countries?.length ? parsed.countries : DEFAULTS.countries,
            destPorts: parsed.destPorts?.length ? parsed.destPorts : DEFAULTS.destPorts,
            containers: parsed.containers?.length ? parsed.containers : DEFAULTS.containers,
            certifications: parsed.certifications?.length ? parsed.certifications : DEFAULTS.certifications,
            settings: Object.keys(parsed.settings || {}).length ? parsed.settings : DEFAULTS.settings,
        };
    } catch (error) {
        console.error('Error reading settings file:', error);
        return DEFAULTS;
    }
}

// Write data to file
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing settings file:', error);
        return false;
    }
}

export default function handler(req, res) {
    if (req.method === 'GET') {
        // Return all settings data
        const data = readData();
        res.status(200).json(data);
    } else if (req.method === 'POST') {
        // Save specific category
        const { category, data } = req.body;

        if (!category || !data) {
            return res.status(400).json({ error: 'Missing category or data' });
        }

        const allData = readData();
        allData[category] = data;

        if (writeData(allData)) {
            res.status(200).json({ success: true, message: 'Saved successfully' });
        } else {
            res.status(500).json({ error: 'Failed to save' });
        }
    } else if (req.method === 'PUT') {
        // Save all data at once
        const newData = req.body;

        if (writeData(newData)) {
            res.status(200).json({ success: true, message: 'All data saved' });
        } else {
            res.status(500).json({ error: 'Failed to save' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
