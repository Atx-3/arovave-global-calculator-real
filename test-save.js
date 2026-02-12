// Quick test script to verify location save API
const http = require('http');

const testData = {
    category: 'locations',
    data: [
        { id: 1, name: 'Delhi NCR', pincode: '110001', state: 'Delhi' },
        { id: 2, name: 'Mumbai', pincode: '400001', state: 'Maharashtra' },
        { id: 6, name: 'Test Location', pincode: '302001', state: 'Rajasthan' }
    ]
};

const body = JSON.stringify(testData);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/settings',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);

        // Now verify by reading back
        http.get('http://localhost:3000/api/settings', (res2) => {
            let data2 = '';
            res2.on('data', chunk => data2 += chunk);
            res2.on('end', () => {
                const parsed = JSON.parse(data2);
                console.log('\n--- Saved locations ---');
                console.log(JSON.stringify(parsed.locations, null, 2));
                console.log('\nTotal locations:', parsed.locations.length);
            });
        });
    });
});

req.write(body);
req.end();
