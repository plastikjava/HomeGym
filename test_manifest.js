const http = require('http');
const { exec } = require('child_process');

const server = exec('npm start');
setTimeout(() => {
  http.get('http://localhost:3000', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log('HTML length:', data.length);
      console.log('Contains manifest:', data.includes('manifest.webmanifest'));
      server.kill();
    });
  }).on('error', (err) => {
    console.error('Error:', err.message);
    server.kill();
  });
}, 3000);
