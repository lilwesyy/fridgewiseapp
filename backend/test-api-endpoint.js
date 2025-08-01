const fetch = require('node-fetch');

async function testAPIEndpoint() {
  const API_URL = 'http://localhost:3000'; // Cambia se il server è su un'altra porta
  
  console.log('🧪 TESTING API ENDPOINTS');
  console.log('========================');
  
  // Nota: In un ambiente reale, avresti bisogno di un token admin valido
  // Per ora testiamo solo se gli endpoint esistono
  
  const endpoints = [
    '/api/recipe/admin/cooked-pending',
    '/api/recipe/admin/pending'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing: ${endpoint}`);
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Nota: Senza token admin, otterremo 401, ma almeno sapremo se l'endpoint esistе
        }
      });
      
      console.log(`   Status: ${response.status}`);
      console.log(`   StatusText: ${response.statusText}`);
      
      if (response.status === 404) {
        console.log(`   ❌ ENDPOINT NON ESISTE`);
      } else if (response.status === 401) {
        console.log(`   ✅ ENDPOINT ESISTE (richiede autenticazione)`);
      } else {
        console.log(`   ✅ ENDPOINT ESISTE`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERRORE: ${error.message}`);
    }
  }
  
  console.log('\n========================');
  console.log('📋 CONCLUSIONI:');
  console.log('- Se /api/recipe/admin/cooked-pending restituisce 404, dobbiamo crearlo nel backend');
  console.log('- Se restituisce 401, esiste ed è quello che ci serve');
  console.log('- Il frontend dovrebbe fallback su /api/recipe/admin/pending se cooked-pending non esiste');
}

testAPIEndpoint().catch(console.log);