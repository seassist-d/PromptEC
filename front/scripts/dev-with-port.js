#!/usr/bin/env node

const { spawn } = require('child_process');
const net = require('net');

// 利用可能なポートを検索する関数
function findAvailablePort(startPort = 3000, maxPort = 3010) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        if (startPort < maxPort) {
          findAvailablePort(startPort + 1, maxPort).then(resolve).catch(reject);
        } else {
          reject(new Error(`No available ports found between ${startPort} and ${maxPort}`));
        }
      } else {
        reject(err);
      }
    });
  });
}

// メイン処理
async function startDevServer() {
  try {
    const port = await findAvailablePort();
    console.log(`🚀 Starting development server on port ${port}...`);
    
    const child = spawn('npx', ['next', 'dev', '--turbopack', '--port', port.toString()], {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      console.log(`Development server exited with code ${code}`);
    });
    
    child.on('error', (err) => {
      console.error('Failed to start development server:', err);
    });
    
  } catch (error) {
    console.error('Error finding available port:', error);
    process.exit(1);
  }
}

startDevServer();
