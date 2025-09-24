#!/usr/bin/env node

/**
 * BarangayLink v2 Database Initialization Script
 * 
 * This script initializes the Convex database with all required data:
 * - User levels and permissions
 * - Sample users for testing
 * - Sample projects and events
 * - Chat rooms
 * - Initial notifications
 * 
 * Usage: node scripts/initDatabase.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 BarangayLink v2 Database Initialization');
console.log('==========================================');

// Check if we're in the right directory
const packageJsonPath = path.join(process.cwd(), 'package.json');
try {
  const packageJson = require(packageJsonPath);
  if (packageJson.name !== 'barangaylink-v2') {
    console.error('❌ Error: Please run this script from the BarangayLink v2 root directory');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error: package.json not found. Please run this script from the project root directory');
  process.exit(1);
}

async function runCommand(command, description) {
  console.log(`\n📋 ${description}...`);
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    console.log(`✅ ${description} completed successfully`);
    if (output.trim()) {
      console.log(output);
    }
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(error.stdout || error.message);
    return false;
  }
}

async function initializeDatabase() {
  console.log('\n🔧 Starting database initialization process...\n');

  // Step 1: Check Convex connection
  const convexStatus = await runCommand(
    'npx convex run databaseManager:getDatabaseStatus',
    'Checking Convex connection'
  );

  if (!convexStatus) {
    console.log('\n⚠️  Convex connection failed. Starting Convex dev server...');
    console.log('Please run "npx convex dev" in another terminal and then run this script again.');
    return false;
  }

  // Step 2: Initialize the database
  const initResult = await runCommand(
    'npx convex run databaseManager:initializeDatabase',
    'Initializing database with all required data'
  );

  if (!initResult) {
    console.error('\n❌ Database initialization failed');
    return false;
  }

  // Step 3: Verify initialization
  const verifyResult = await runCommand(
    'npx convex run databaseManager:getDatabaseStatus',
    'Verifying database initialization'
  );

  if (!verifyResult) {
    console.error('\n❌ Database verification failed');
    return false;
  }

  console.log('\n🎉 Database initialization completed successfully!');
  console.log('\n📊 Your BarangayLink v2 database now includes:');
  console.log('   ✅ User levels (WORKER, BUILDER, MANAGER, ADMIN)');
  console.log('   ✅ Sample users for testing');
  console.log('   ✅ Sample projects and events');
  console.log('   ✅ Chat rooms for communication');
  console.log('   ✅ Initial notifications');
  
  console.log('\n🚀 Next steps:');
  console.log('   1. Start your development server: npm run dev');
  console.log('   2. Navigate to /dashboard after authentication');
  console.log('   3. Test different user roles and permissions');
  
  console.log('\n📧 Sample user accounts created:');
  console.log('   • admin@barangaylink.local (ADMIN)');
  console.log('   • manager@barangaylink.local (MANAGER)');
  console.log('   • builder@barangaylink.local (BUILDER)');
  console.log('   • worker@barangaylink.local (WORKER)');
  
  console.log('\n💡 Tip: Use these sample accounts for testing different role permissions');

  return true;
}

// Run the initialization
initializeDatabase().then(success => {
  if (success) {
    console.log('\n✨ Database is ready for BarangayLink v2!');
    process.exit(0);
  } else {
    console.log('\n💥 Database initialization failed. Please check the errors above.');
    process.exit(1);
  }
}).catch(error => {
  console.error('\n💥 Unexpected error during initialization:', error);
  process.exit(1);
});
