const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

async function generateToken() {
  // Load the service account key JSON file
  const keyPath = path.join(__dirname, '..', 'ai-ideagenproject-firebase-adminsdk-fbsvc-d7167ab101.json');
  const keyFile = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

  // Create a new GoogleAuth instance
  const auth = new GoogleAuth({
    credentials: keyFile,
    scopes: ['https://www.googleapis.com/auth/datastore']
  });

  // Get the access token
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  console.log('Access Token:', token.token);
}

generateToken().catch(console.error); 