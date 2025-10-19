// Diagnostic script to check Liveblocks configuration
console.log('\n🔍 Checking Liveblocks Configuration...\n');

// Check if running in Node.js (server-side)
console.log('✅ Environment:', process.env.NODE_ENV || 'development');

// Check for LIVEBLOCKS_SECRET_KEY
const secretKey = process.env.LIVEBLOCKS_SECRET_KEY;

if (!secretKey) {
  console.log('❌ LIVEBLOCKS_SECRET_KEY is NOT set');
  console.log('💡 Add this to your .env.local file:');
  console.log('   LIVEBLOCKS_SECRET_KEY=sk_prod_...\n');
  process.exit(1);
}

// Check key format
console.log('✅ LIVEBLOCKS_SECRET_KEY is set');

if (!secretKey.startsWith('sk_')) {
  console.log('⚠️  WARNING: Secret key should start with "sk_"');
  console.log('   Current key starts with:', secretKey.substring(0, 5) + '...');
  console.log('   Make sure you copied the SECRET KEY (not public key)\n');
} else {
  console.log('✅ Secret key format looks correct (starts with "sk_")');
  console.log('   Key preview:', secretKey.substring(0, 10) + '...' + secretKey.substring(secretKey.length - 4));
}

// Check key length
if (secretKey.length < 40) {
  console.log('⚠️  WARNING: Secret key seems too short');
  console.log('   Length:', secretKey.length, 'characters');
  console.log('   Expected: 40+ characters\n');
} else {
  console.log('✅ Secret key length looks correct:', secretKey.length, 'characters');
}

console.log('\n📋 Next Steps:');
console.log('1. If key is correct, restart your dev server: npm run dev');
console.log('2. Clear browser cache and cookies');
console.log('3. Try posting a comment again');
console.log('4. Check browser console for errors (F12)\n');
