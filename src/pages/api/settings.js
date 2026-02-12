import fs from 'fs';
import path from 'path';

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

// Try multiple paths for reading/writing settings
// On Vercel: /tmp is writable, project files are read-only
// On local dev: data/ folder works fine
function getDataPaths() {
    const paths = [];
    // 1. /tmp path (works on Vercel serverless)
    paths.push(path.join('/tmp', 'settings-data.json'));
    // 2. Local data folder (works in dev)
    paths.push(path.join(process.cwd(), 'data', 'settings-data.json'));
    return paths;
}

// Read data - try /tmp first, then local file
function readData() {
    const paths = getDataPaths();

    for (const filePath of paths) {
        try {
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf8');
                const parsed = JSON.parse(data);
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
            }
        } catch (error) {
            console.error(`Error reading ${filePath}:`, error.message);
        }
    }

    return DEFAULTS;
}

// Write data - try all writable paths
function writeData(data) {
    const paths = getDataPaths();
    let saved = false;

    for (const filePath of paths) {
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            saved = true;
            console.log(`Settings saved to: ${filePath}`);
        } catch (error) {
            console.warn(`Cannot write to ${filePath}: ${error.message}`);
        }
    }

    return saved;
}

export default function handler(req, res) {
    if (req.method === 'GET') {
        // Check if client sent localStorage data to sync
        const clientData = req.headers['x-client-settings'];
        if (clientData) {
            try {
                const parsed = JSON.parse(Buffer.from(clientData, 'base64').toString());
                // Client has data, write it to server for future reads
                writeData(parsed);
                return res.status(200).json(parsed);
            } catch (e) {
                // Ignore parse errors, fall through to server read
            }
        }

        const data = readData();
        res.status(200).json(data);
    } else if (req.method === 'POST') {
        const { category, data } = req.body;

        if (!category || !data) {
            return res.status(400).json({ error: 'Missing category or data' });
        }

        const allData = readData();
        allData[category] = data;

        const saved = writeData(allData);
        // Always return success + full data so client can save to localStorage
        res.status(200).json({
            success: true,
            message: 'Saved successfully',
            serverSaved: saved,
            allData: allData
        });
    } else if (req.method === 'PUT') {
        const newData = req.body;

        const saved = writeData(newData);
        res.status(200).json({
            success: true,
            message: 'All data saved',
            serverSaved: saved
        });
    } else {
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
