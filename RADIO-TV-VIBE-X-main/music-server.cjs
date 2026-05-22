#!/usr/bin/env node
/**
 * VIBE-X Music Server
 * Serves MP3 files from the music_mp3 folder on your local network
 * Usage: node music-server.js [port]
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] || 344;
const MUSIC_DIR = path.join('/Users/333e/Desktop/VIBE-X');

// MIME types for audio
const MIME_TYPES = {
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
};

function getContentType(ext) {
  return MIME_TYPES[ext] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  // Parse URL and decode filename
  let urlPath;
  try {
    urlPath = decodeURIComponent(req.url.split('?')[0]);
  } catch (e) {
    res.writeHead(400);
    res.end('Bad URL');
    return;
  }

  // Remove leading slash
  const filename = urlPath.replace(/^\//, '');
  const filePath = path.join(MUSIC_DIR, filename);

  // Security: prevent directory traversal
  if (!filePath.startsWith(MUSIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404);
      res.end('File not found: ' + filename);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = getContentType(ext);

    // Stream the file
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Accept-Ranges': 'bytes',
      // Allow cross-origin for the app
      'Access-Control-Allow-Origin': '*',
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    stream.on('error', (e) => {
      console.error('Stream error:', e.message);
      res.end();
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎵 VIBE-X Music Server running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Serving: ${MUSIC_DIR}`);
  console.log(`🌐 Accessible at:`);
  console.log(`   Local:  http://localhost:${PORT}`);
  console.log(`   LAN:    http://10.0.0.83:${PORT}`);
  console.log('');
  console.log('Press Ctrl+C to stop');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  server.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.close();
  process.exit(0);
});