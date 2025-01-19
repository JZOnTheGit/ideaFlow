// Create a new file for URL handling
export const fetchUrlContent = async (url) => {
  try {
    // Use a CORS proxy service
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    
    if (!data.contents) {
      throw new Error('Failed to fetch content');
    }

    // Parse the HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(data.contents, 'text/html');
    
    // Get the main content (you can customize this based on your needs)
    const title = doc.querySelector('title')?.textContent || '';
    const mainContent = doc.querySelector('main, article, body')?.textContent || '';
    
    // Clean up the content
    const cleanContent = mainContent
      .replace(/\s+/g, ' ')
      .trim();

    return {
      title,
      content: cleanContent
    };
  } catch (error) {
    throw new Error(`Failed to fetch URL content: ${error.message}`);
  }
}; 