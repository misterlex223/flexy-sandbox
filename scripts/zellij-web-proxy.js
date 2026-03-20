#!/usr/bin/env node
/**
 * Zellij Web Proxy
 *
 * Simple HTTP proxy that forwards requests from 0.0.0.0:9681 to 127.0.0.1:9682
 * This allows Cloudflare Tunnel to connect without requiring Zellij to bind to 0.0.0.0
 * (which would force SSL requirement)
 *
 * Architecture:
 *   Cloudflare Tunnel --> Proxy (0.0.0.0:9681) --> Zellij (127.0.0.1:9682)
 */

const http = require('http');

const PROXY_PORT = 9681;
const ZELLIJ_HOST = '127.0.0.1';
const ZELLIJ_PORT = 9682;

// Log helper
const log = (msg) => console.log(`[zellij-proxy] ${msg}`);

// Create proxy server
const server = http.createServer((clientReq, clientRes) => {
  const { method, url, headers } = clientReq;

  // Prepare options for Zellij
  const options = {
    hostname: ZELLIJ_HOST,
    port: ZELLIJ_PORT,
    path: url,
    method: method,
    headers: {
      ...headers,
      host: `localhost:${ZELLIJ_PORT}`, // Override host header
    },
  };

  // Forward request to Zellij
  const proxyReq = http.request(options, (proxyRes) => {
    // Copy status code and headers
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);

    // Pipe response back to client
    proxyRes.pipe(clientRes);
  });

  proxyReq.on('error', (err) => {
    log(`Error forwarding request: ${err.message}`);
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'Content-Type': 'text/plain' });
      clientRes.end('Bad Gateway: Unable to connect to Zellij');
    }
  });

  // Handle upgrade requests (WebSocket)
  clientReq.on('upgrade', (headBuffer) => {
    // For WebSocket upgrades, we need special handling
    // This is handled separately below
  });

  // Pipe client request to Zellij
  clientReq.pipe(proxyReq);
});

// Handle WebSocket upgrade
server.on('upgrade', (req, socket, head) => {
  const url = req.url;
  const headers = {
    ...req.headers,
    host: `localhost:${ZELLIJ_PORT}`,
  };

  // Connect to Zellij
  const zellijSocket = require('net').createConnection(ZELLIJ_PORT, ZELLIJ_HOST, () => {
    // Send upgrade request to Zellij
    const upgradeRequest =
      `${req.method} ${url} HTTP/1.1\r\n` +
      Object.entries(headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\r\n') +
      '\r\n\r\n';

    zellijSocket.write(upgradeRequest);
    if (head.length > 0) {
      zellijSocket.write(head);
    }
  });

  zellijSocket.on('data', (data) => {
    socket.write(data);
  });

  zellijSocket.on('end', () => {
    socket.end();
  });

  zellijSocket.on('error', (err) => {
    log(`WebSocket upgrade error: ${err.message}`);
    socket.destroy();
  });

  socket.on('data', (data) => {
    zellijSocket.write(data);
  });

  socket.on('end', () => {
    zellijSocket.end();
  });

  socket.on('error', (err) => {
    log(`Socket error: ${err.message}`);
    zellijSocket.destroy();
  });
});

// Start proxy server
server.listen(PROXY_PORT, '0.0.0.0', () => {
  log(`Proxy listening on 0.0.0.0:${PROXY_PORT} -> forwarding to ${ZELLIJ_HOST}:${ZELLIJ_PORT}`);
});

server.on('error', (err) => {
  log(`Server error: ${err.message}`);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down...');
  server.close(() => {
    log('Proxy server closed');
    process.exit(0);
  });
});
