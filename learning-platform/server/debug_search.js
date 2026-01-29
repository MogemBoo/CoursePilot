
const http = require('http');

const query = 'checker';
const url = `http://localhost:8000/api/search?q=${query}`;

console.log(`Testing Search API: ${url}`);

http.get(url, (res) => {
    let data = '';
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Response Body Preview:');
        console.log(data.substring(0, 500)); // Print first 500 chars

        try {
            JSON.parse(data);
            console.log("JSON Parse: Success");
        } catch (e) {
            console.log("JSON Parse: Failed");
        }
    });

}).on('error', (err) => {
    console.error("Request Error:", err.message);
});
