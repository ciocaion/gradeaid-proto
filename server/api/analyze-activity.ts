import { analyzeActivityImage } from '../ai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, subject } = body;

    if (!image || !subject) {
      return new Response(JSON.stringify({
        error: 'Missing required fields',
        details: !image ? 'Image is required' : 'Subject is required'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate base64 image format
    if (!/^[A-Za-z0-9+/=]+$/.test(image)) {
      return new Response(JSON.stringify({
        error: 'Invalid image format',
        details: 'Image must be a valid base64 string'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const feedback = await analyzeActivityImage(image, subject);
    return new Response(JSON.stringify({ feedback }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error analyzing activity:', error);
    return new Response(JSON.stringify({
      error: 'Error analyzing activity',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 