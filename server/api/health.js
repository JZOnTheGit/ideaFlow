// Edge function to bypass Vercel authentication
export const config = {
  runtime: 'edge',
  regions: ['lhr1']  // London region, you can change this
};

export default function handler(req) {
  return new Response(
    JSON.stringify({ status: 'ok' }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    }
  );
} 