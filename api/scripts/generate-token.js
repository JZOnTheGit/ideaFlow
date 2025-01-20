import { GoogleAuth } from 'google-auth-library';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateToken() {
  // Load the service account key JSON file
  const keyPath = join(__dirname, '..', 'service-account.json');
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