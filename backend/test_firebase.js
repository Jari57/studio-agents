// Quick Firebase connectivity test
const admin = require('firebase-admin');

const FIREBASE_CONFIG = {
  type: 'service_account',
  project_id: 'studioagents-app',
  private_key_id: '4f9aafecec75ab4e23decdec5a0212046fd78697',
  client_email: 'firebase-adminsdk-fbsvc@studioagents-app.iam.gserviceaccount.com',
  client_id: '101326229195887107234',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40studioagents-app.iam.gserviceaccount.com',
  universe_domain: 'googleapis.com'
};

const FIREBASE_PRIVATE_KEY_B64 = 'LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tCk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRQzh5OWlpc1FBUkliTTMKdkJYVzc5VlNDMXMxSTh' +
  'FTGVvMHp3Y2RQWHpUS1FKMTUxTGhLK2c1ZTNZUTQ2VGxGd3NaZTZ1ODNQZkIxNjZjcAp3SjZJUkFtYUh4eDkydHRlL0pkcEl6aGJLL01oVXFVU1k0OUhGZXFEdE9SZVNJblQ2UWRMWVBoeXV5R3c5eVNOClJtZGorWkhzL2grdEIvRGFTdGhZMmI3ZmF4bnAwYVlDRDNhUzBVU0dUUEs1SGkwQ1ZDcE90TTcvK28vL2FLT2EKSEs2YjJoZzl6aHprMGVRNG5QOHMybElvbFg0cnV1RkovbzdlNjhYemZzTWNuYlVxMkJIZktNaVRnWm9QRnZMQQpLREFUekp3bXYwb01HcWNidDdET05WeEVGejlEV3o5N1F0MTJjc3lNcnF2QnZJeDAxNTg2UkFUcXJlVUNSTUFpCjN2ZTVRS1BuQWdNQkFBRUNnZ0VBUmp4YnVxSzRrS2NGNGwweGpzV29pWjQ1N3puKzdrTklWcEhua1FxdE8vVHYKNE13WFI2VmhSVCtKbWhhQnZRY3AvMVBOYkxLNVMxVkEyaEtUcDhRUUFtdENrVHVqVXVJTGZneWhRYUhIRUlXTApiWnptUjU3S29QYmg0b1YvNlBzUFFLYXhweFVoQXBIZTRrUG40TlNPeWlqOEpjWUhmMTVLd0RzNWZDcCsrSEhuCk5DLzh0Qi9CVW1lc1JNNUdUclV3eXAxKzlJbGZ4cExJeGJ5di9lZGxFUmNpMTJwQ29iUzllczhIS00rN2VnM0cKOW1xeUNiZXB2by9HTit0SHJCSElOMk42aWhyQW9jbkN5UWdaWGlidzY0RFZRZnhnQ0cvcFU3d0JzUXdrZTFMNApQcnBsTWJJVEJEWDJiSUYydU5vMEtNMTZ5MXBUamVzYlMxWDh6enZCYVFLQmdRRHFZb1Y2RE9RU3h5eGpFWTdmCjBNTjhTdlZOMmJqUVIwaU95WHZyMFJKVXhhRXpCaHlKZFhLc0lIMlhTQzRTbHVNaUhabSsyb1c4T0NGdUdzVVUKbGxDekd2cFdYZU1ubU9SZWpWaXFKYmowbkFNMThhV0JBMHpFalQ1cVphODRBdUJKdHBocXNPeWs4dTErT0VJVQpxSlM3SmlQYzJaWnJpbk5NTnIxZ0V0UER0UUtCZ1FET05RdlVqeDZsQU5DcmxGYlBla0JVSXdqMDA4NjZsZFpGCitHc0dYUi8reEtwbzkyYytwTTVWQnVyNzZrWnRJSTJGc2NvRVlGR01Obml0SXdLcHVOVThLc2VwbjBta1BJY08KUTA2c2VRZS9LWWRKZ2hYMHJ6Z05qWXhJRXJLd0tQOWo2b3NESDlUZ1JYQ2k2VkFaSUhOdXBaTTY0bTJ6aDhWdAptTVRZTTUrQ3F3S0JnQlZNSEhySm54UEJ1MXZKSmFWYXI5aWthd1BHNjg4cEd3TzJkU2NwV1RRUXZTUUl3eUVPClpmd1QrN1Y2WG8xYjNvbWtET3RWcWQ4L2JuSTF4b0NuWSsvU1hMcnFUeEN6Q05VNm5McmhNSnd4Yk8xQzV0b0IKTmNHS1lBaUU4dFh4RlBZOXZEMjlrOU10SzcxVFdWWE5ONjZGdWE2QXF2VmNvRHRsb2ZHUDVHUWRBb0dBSU5CbQpNb3dYNTFBSzVOTDFRWTBGd1ozVnBnZ3lwSlNGaFpyemhRNjZzYk1nSHhZSHN2dE03bERzZ2V3VkN2YWNMc05OCkQ0YzRVdVMwTFhFZDBsNWNhSGV5VURiTjVEblJrQjU3M1l4aEJEV2Fsc01CdFc5UXJ5OXdQR1BsVlkwZ253aksKMkZOdmI4VDlHSitpSkcxNmtRZitOdWVqWjJkYXJvY2FCQUdyQjRNQ2dZRUFnQWliL1B5eXMyd3JpZ0xrZFFscwpTSGdHOVg1blgxbXRxOHdYSGE1L0M0Z2RzczBxeURzbDNONWZOR1pTSHQrYlJxOFAyY2hpQjVxUXNGakpNVDM2CmxkaDB5Sy8ySG1PbWRXenUyeFdXeFNwcXVNQWRxN2lHendlTThIdi9BZTcxdGRZWVZMV2lzQnJVOWJ1RTIxWjEKd1N5OUhjTERJUjhRelJzWEZIT3JBaU09Ci0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS0K';

async function testFirebase() {
  console.log('🔍 Testing Firebase Admin SDK...\n');
  
  try {
    // Decode private key
    const privateKey = Buffer.from(FIREBASE_PRIVATE_KEY_B64, 'base64').toString('utf8');
    console.log('✅ Private key decoded successfully');
    console.log('   Key starts with:', privateKey.substring(0, 30));
    
    // Initialize Firebase
    const serviceAccount = {
      ...FIREBASE_CONFIG,
      private_key: privateKey
    };
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized\n');
    
    // Test Firestore with named database
    console.log('🔍 Testing Firestore write to studio-agents-db...');
    const { getFirestore } = require('firebase-admin/firestore');
    const db = getFirestore(admin.app(), 'studio-agents-db');
    
    await db.collection('_test_connection').doc('ping').set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      test: true
    });
    console.log('✅ Firestore write successful!\n');
    
    // Read it back
    const doc = await db.collection('_test_connection').doc('ping').get();
    console.log('✅ Firestore read successful:', doc.data());
    
    // Cleanup
    await db.collection('_test_connection').doc('ping').delete();
    console.log('✅ Cleanup complete\n');
    
    console.log('🎉 Firebase is fully functional!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Firebase Error:');
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    
    if (error.code === 5 || error.message.includes('NOT_FOUND')) {
      console.error('\n📋 DIAGNOSIS: Firestore database may not exist or service account key is invalid.');
      console.error('   FIX OPTIONS:');
      console.error('   1. Go to Firebase Console > Firestore Database > Create Database');
      console.error('   2. Or regenerate the service account key:');
      console.error('      - Firebase Console > Project Settings > Service Accounts');
      console.error('      - Generate New Private Key');
      console.error('      - Base64 encode it and update FIREBASE_PRIVATE_KEY_B64');
    }
    
    if (error.message.includes('invalid_grant') || error.message.includes('Invalid JWT')) {
      console.error('\n📋 DIAGNOSIS: Service account key has been rotated or deleted.');
      console.error('   FIX: Regenerate the service account key in Firebase Console.');
    }
    
    process.exit(1);
  }
}

testFirebase();
