import { type VideoResult } from "./types";

// Function to fetch educational YouTube Shorts
export async function fetchEducationalShorts(topic: string, maxResults = 3): Promise<VideoResult[]> {
  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: `${topic} educational #shorts`,
      maxResults: maxResults.toString(),
      type: 'video',
      videoDuration: 'short', // Only fetch short videos
      key: process.env.YOUTUBE_API_KEY!
    });

    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.medium.url
    }));
  } catch (error) {
    console.error('Error fetching YouTube shorts:', error);
    return [];
  }
}
