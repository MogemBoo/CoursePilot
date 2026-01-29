
const http = require('http');

console.log("Fetching from http://localhost:8000/api/content...");

http.get('http://localhost:8000/api/content', (res) => {
    let data = '';

    console.log(`Status: ${res.statusCode}`);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log(`Data Type: ${typeof json}`);
            if (Array.isArray(json)) {
                console.log(`Count: ${json.length}`);
                if (json.length > 0) {
                    console.log("First Item:", JSON.stringify(json[0], null, 2));
                } else {
                    console.log("Array is empty.");
                }
            } else {
                console.log("Response is not an array:", JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.error("Failed to parse JSON. Raw response:", data.substring(0, 200));
        }
    });

}).on('error', (err) => {
    console.error("Request Error: " + err.message);
});
