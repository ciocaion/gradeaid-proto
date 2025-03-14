import { NextApiRequest, NextApiResponse } from 'next';
import { analyzeActivityImage } from '../../../server/ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, subject } = req.body;

    if (!image || !subject) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: !image ? 'Image is required' : 'Subject is required'
      });
    }

    const feedback = await analyzeActivityImage(image, subject);
    return res.status(200).json({ feedback });
  } catch (error) {
    console.error('Error analyzing activity:', error);
    return res.status(500).json({
      error: 'Error analyzing activity',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 