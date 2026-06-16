const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const htmlPath = path.join(distDir, 'index.html');

// Copy icon for apple-touch-icon
const iconSrc = path.join(__dirname, '..', 'assets', 'icon.png');
const iconDest = path.join(distDir, 'apple-touch-icon.png');
fs.copyFileSync(iconSrc, iconDest);

// Inject PWA meta tags
let html = fs.readFileSync(htmlPath, 'utf8');

const pwaTags = [
  '    <meta name="apple-mobile-web-app-capable" content="yes" />',
  '    <meta name="apple-mobile-web-app-status-bar-style" content="black" />',
  '    <meta name="apple-mobile-web-app-title" content="Wakety" />',
  '    <meta name="theme-color" content="#0A0F1A" />',
  '    <link rel="apple-touch-icon" href="/Wakety/apple-touch-icon.png" />',
].join('\n');

html = html.replace('</head>', pwaTags + '\n  </head>');
fs.writeFileSync(htmlPath, html);

console.log('PWA meta tags injected.');
