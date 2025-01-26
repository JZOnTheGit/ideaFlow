const COHERE_API_KEY = process.env.REACT_APP_COHERE_API_KEY;
const COHERE_API_URL = 'https://api.cohere.ai/v1/generate';

const generatePrompts = {
  twitter: (content) => ({
    prompt: `Create exactly 4 engaging tweets from this content. Include emojis and hashtags in each tweet:

    Content: ${content}

    Format each tweet exactly like this:
    [POST 1]
    🚀 Your tweet text here #hashtag1 #hashtag2
    [POST 2]
    💡 Your tweet text here #hashtag1 #hashtag2
    [POST 3]
    ✨ Your tweet text here #hashtag1 #hashtag2
    [POST 4]
    🎯 Your tweet text here #hashtag1 #hashtag2`,
    model: 'command',
    temperature: 0.8,
    max_tokens: 1000,
    k: 0,
    stop_sequences: [],
    return_likelihoods: 'NONE',
  }),

  tiktok: (content) => ({
    prompt: `Create exactly 4 viral TikTok video concepts from this content:

    Content: ${content}

    Respond with exactly 4 concepts in this format:
    [CONCEPT 1]
    Title: Your catchy title
    Hook: Your attention-grabbing opening hook
    Description: Brief, engaging video description
    Key Points: • Point 1
                • Point 2
                • Point 3
    Hashtags: #viral #trending #relevant`,
    model: 'command',
    temperature: 0.8,
    max_tokens: 1000,
    k: 0,
    stop_sequences: ["[CONCEPT 5]"],
    return_likelihoods: 'NONE'
  }),

  youtube: (content) => ({
    prompt: `Create exactly 4 YouTube video ideas from this content:

    Content: ${content}

    Respond with exactly 4 video ideas in this format:
    [VIDEO 1]
    Title: Your catchy title
    Description: Compelling video description
    Key Points: • Main point 1
                • Main point 2
                • Main point 3
    Target Audience: Specific target audience
    Duration: Suggested length`,
    model: 'command',
    temperature: 0.8,
    max_tokens: 1000,
    k: 0,
    stop_sequences: ["[VIDEO 5]"],
    return_likelihoods: 'NONE'
  })
};

export const generateContent = async (content, type) => {
  try {
    if (!content) {
      throw new Error('Content is required');
    }

    if (content.length > 100000) {
      throw new Error('Content is too long. Please upload a shorter document');
    }

    if (!generatePrompts[type]) {
      throw new Error(`Invalid content type: ${type}`);
    }

    const requestBody = generatePrompts[type](content);
    console.log('Request body:', requestBody);

    const response = await fetch(COHERE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your Cohere API key configuration.');
      }
      throw new Error('Failed to generate content');
    }

    const data = await response.json();
    
    if (!data.generations || !data.generations[0]) {
      throw new Error('No content generated');
    }

    return {
      content: data.generations[0].text,
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('Generation error:', error);
    throw error;
  }
}; 