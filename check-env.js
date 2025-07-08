require('dotenv').config();

console.log('🔍 Checking environment configuration...');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

if (!process.env.FRONTEND_URL) {
  console.log('❌ FRONTEND_URL is not set!');
  console.log('💡 Add this to your .env file:');
  console.log('FRONTEND_URL=http://localhost:3039');
} else {
  console.log('✅ FRONTEND_URL is configured');
}

console.log('\n📝 Make sure your .env file has:');
console.log('FRONTEND_URL=http://localhost:3039');
console.log('NODE_ENV=development');
console.log('PORT=5000'); 