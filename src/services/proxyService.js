const PROXY_URL = process.env.REACT_APP_PROXY_URL || 'https://your-proxy-server.com/proxy';

export const fetchWithProxy = async (url) => {
  try {
    const response = await fetch(`${PROXY_URL}?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch PDF');
    }
    
    return response;
  } catch (error) {
    throw new Error('Failed to fetch through proxy: ' + error.message);
  }
}; 