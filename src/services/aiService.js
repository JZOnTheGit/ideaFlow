import { rateLimit } from '../utils/rateLimiter';
import { auth } from '../firebase/firebase';

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
    Hashtags: #viral #trending #relevant

    [CONCEPT 2]
    Title: {title}
    Hook: {hook}
    Description: {description}
    Key Points: {points}
    Hashtags: {hashtags}

    [CONCEPT 3]
    Title: {title}
    Hook: {hook}
    Description: {description}
    Key Points: {points}
    Hashtags: {hashtags}

    [CONCEPT 4]
    Title: {title}
    Hook: {hook}
    Description: {description}
    Key Points: {points}
    Hashtags: {hashtags}`,
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
    Duration: Suggested length

    [VIDEO 2]
    Title: {title}
    Description: {description}
    Key Points: {points}
    Target Audience: {audience}
    Duration: {duration}

    [VIDEO 3]
    Title: {title}
    Description: {description}
    Key Points: {points}
    Target Audience: {audience}
    Duration: {duration}

    [VIDEO 4]
    Title: {title}
    Description: {description}
    Key Points: {points}
    Target Audience: {audience}
    Duration: {duration}`,
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
    // First check rate limit with backend
    const response = await fetch('https://idea-flow-server.vercel.app/check-rate-limit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: auth.currentUser.uid
      })
    });

    if (!response.ok) {
      throw new Error('Rate limit check failed');
    }

    // Then generate content using Cohere API directly
    const prompt = generatePrompts[type];
    if (!prompt) {
      throw new Error(`Invalid content type: ${type}`);
    }
    const requestBody = prompt(content);
    console.log('Using API key:', COHERE_API_KEY); // Debug line

    if (!COHERE_API_KEY) {
      throw new Error('API key is not configured');
    }

    const cohereResponse = await fetch(COHERE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await cohereResponse.json();

    if (!cohereResponse.ok) {
      throw new Error(data.message || 'Failed to generate content');
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