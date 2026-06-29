const http = require('http');
const { exec } = require('child_process');

const server = exec('npm start');
setTimeout(() => {
  http.get('http://localhost:3000/sw.js', (res) => {
    console.log('sw.js Status Code:', res.statusCode);
    console.log('sw.js Content-Type:', res.headers['content-type']);
    server.kill();
  }).on('error', (err) => {
    console.error('Error:', err.message);
    server.kill();
  });
}, 3000);
