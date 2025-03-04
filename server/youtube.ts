import { type VideoResult } from "./types";
import openai from "./openai";

// Function to check if content is appropriate using AI
async function validateContent(title: string, description: string): Promise<boolean> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a content moderator for an educational platform for children. Evaluate if the content is appropriate and educational. The content should be strictly educational and suitable for children."
        },
        {
          role: "user",
          content: `Please evaluate this educational video content. Return true only if it's appropriate for children and educational, false otherwise.
          Title: ${title}
          Description: ${description}

          Respond with JSON in this format: { "isAppropriate": boolean, "reason": "string" }`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.isAppropriate;
  } catch (error) {
    console.error('Error validating content:', error);
    return false;
  }
}

// Function to fetch educational YouTube Shorts
export async function fetchEducationalShorts(topic: string, isDanish = false): Promise<VideoResult[]> {
  try {
    const safeSearchParams = new URLSearchParams({
      part: 'snippet',
      q: `${topic} ${isDanish ? 'dansk' : ''} education tutorial lesson learn teach #shorts`,
      maxResults: '10',  // Increased to account for filtering
      type: 'video',
      videoDuration: 'short',
      relevanceLanguage: isDanish ? 'da' : 'en',
      regionCode: isDanish ? 'DK' : 'US',
      hl: isDanish ? 'da' : 'en',
      safeSearch: 'strict',
      videoEmbeddable: 'true',
      videoSyndicated: 'true',
      key: process.env.YOUTUBE_API_KEY!
    });

    console.log('Fetching YouTube shorts with params:', safeSearchParams.toString());

    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${safeSearchParams}`);

    if (!response.ok) {
      console.error('YouTube API error status:', response.status);
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Found total videos:', data.items?.length || 0);

    // Filter for educational content and language
    const validatedVideos = [];
    for (const item of data.items) {
      const title = item.snippet.title;
      const description = item.snippet.description;

      // Basic keyword filtering
      const educationalKeywords = ['learn', 'teach', 'tutorial', 'lesson', 'education', 'school', 'study'];
      const hasEducationalKeyword = educationalKeywords.some(keyword => 
        title.toLowerCase().includes(keyword) || description.toLowerCase().includes(keyword)
      );

      if (!hasEducationalKeyword) continue;

      // AI content validation
      const isAppropriate = await validateContent(title, description);
      if (!isAppropriate) {
        console.log('Filtered out inappropriate content:', title);
        continue;
      }

      validatedVideos.push({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.medium.url
      });

      // Stop once we have 3 valid videos
      if (validatedVideos.length >= 3) break;
    }

    console.log('Validated educational videos:', validatedVideos.length);
    return validatedVideos;

  } catch (error) {
    console.error('Error fetching YouTube shorts:', error);
    return [];
  }
}