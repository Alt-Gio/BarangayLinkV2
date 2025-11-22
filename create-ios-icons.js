/**
 * iOS Icon Generator Script
 * Creates placeholder PNG icons for iOS devices
 * 
 * Usage: node create-ios-icons.js
 * 
 * IMPORTANT: Replace these placeholder images with your actual logo!
 * Use https://realfavicongenerator.net/ for professional icons
 */

const fs = require('fs');
const path = require('path');

// Icon sizes needed for iOS
const sizes = [
  { name: 'icon-72x72.png', size: 72 },
  { name: 'icon-96x96.png', size: 96 },
  { name: 'icon-128x128.png', size: 128 },
  { name: 'icon-144x144.png', size: 144 },
  { name: 'icon-152x152.png', size: 152 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-384x384.png', size: 384 },
  { name: 'icon-512x512.png', size: 512 },
];

// Apple-specific icons
const appleIcons = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'apple-touch-icon-precomposed.png', size: 180 },
];

// Create directories
const iconsDir = path.join(__dirname, 'public', 'icons');
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log('✅ Created /public/icons/ directory');
}

/**
 * Generate SVG placeholder icon
 */
function generateSVG(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#10b981"/>
  <g transform="translate(${size/2}, ${size/2})">
    <circle r="${size * 0.3}" fill="#ffffff" opacity="0.2"/>
    <text 
      x="0" 
      y="${size * 0.1}" 
      font-family="Arial, sans-serif" 
      font-size="${size * 0.25}" 
      font-weight="bold" 
      fill="#ffffff" 
      text-anchor="middle"
    >BL</text>
  </g>
  <text 
    x="${size/2}" 
    y="${size * 0.85}" 
    font-family="Arial, sans-serif" 
    font-size="${size * 0.08}" 
    fill="#ffffff" 
    text-anchor="middle"
    opacity="0.8"
  >BarangayLink</text>
</svg>`;
}

/**
 * Save SVG file (can be used directly or converted to PNG)
 */
function createPlaceholderSVG(filePath, size) {
  const svg = generateSVG(size);
  const svgPath = filePath.replace('.png', '.svg');
  fs.writeFileSync(svgPath, svg);
  return svgPath;
}

// Generate all icon sizes
console.log('\n🎨 Generating iOS icon placeholders...\n');

sizes.forEach(({ name, size }) => {
  const filePath = path.join(iconsDir, name);
  createPlaceholderSVG(filePath, size);
  console.log(`✅ Created ${name} (${size}x${size})`);
});

appleIcons.forEach(({ name, size }) => {
  const filePath = path.join(publicDir, name);
  createPlaceholderSVG(filePath, size);
  console.log(`✅ Created ${name} (${size}x${size})`);
});

console.log('\n⚠️  IMPORTANT NOTES:\n');
console.log('1. SVG files have been created as placeholders');
console.log('2. iOS Safari works best with PNG files');
console.log('3. Use one of these methods to convert SVG to PNG:\n');
console.log('   Option A: Use https://realfavicongenerator.net/ (Recommended)');
console.log('   - Upload your logo');
console.log('   - Download all generated icons');
console.log('   - Replace the SVG files\n');
console.log('   Option B: Use ImageMagick (if installed)');
console.log('   - Run: npm run convert-icons\n');
console.log('   Option C: Use online tool');
console.log('   - Visit https://cloudconvert.com/svg-to-png');
console.log('   - Convert each SVG file\n');
console.log('4. Test on iOS device after replacing with PNG files');
console.log('5. Clear browser cache on iPhone (Settings > Safari > Clear History)\n');

// Create a package.json script helper
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  // Add icon conversion script
  packageJson.scripts['convert-icons'] = 'echo "Install ImageMagick first: https://imagemagick.org/script/download.php" && for file in public/icons/*.svg; do convert "$file" "${file%.svg}.png"; done && for file in public/apple-*.svg; do convert "$file" "${file%.svg}.png"; done';
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Added "convert-icons" script to package.json\n');
}

console.log('🎉 Done! Next steps:');
console.log('1. Convert SVG to PNG using one of the methods above');
console.log('2. Deploy your changes');
console.log('3. Test on iPhone/iPad\n');
