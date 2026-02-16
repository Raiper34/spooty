/**
 * Utility script to generate Apache MD5 password hashes for Spooty authentication
 *
 * Usage: node generate-password.js <password>
 * Example: node generate-password.js mypassword
 */

const apacheMd5 = require('apache-md5');

const password = process.argv[2];

if (!password) {
  console.error('Error: Password argument is required');
  console.log('\nUsage: node generate-password.js <password>');
  console.log('Example: node generate-password.js mypassword');
  process.exit(1);
}

const hash = apacheMd5(password);

console.log('\n========================================');
console.log('Apache MD5 Password Hash Generated');
console.log('========================================');
console.log('\nPassword:', password);
console.log('Hash:', hash);
console.log('\nAdd this to your .env file:');
console.log(`ADMIN_PASSWORD=${hash}`);
console.log('========================================\n');

