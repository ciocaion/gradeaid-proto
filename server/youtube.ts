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
      relevanceLanguage: 'da', // Prefer Danish content
      regionCode: 'DK', // Danish region
      hl: 'da', // Set interface language to Danish
      key: process.env.YOUTUBE_API_KEY!
    });

    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Filter videos that have Danish titles or descriptions
    const danishVideos = data.items.filter((item: any) => {
      const title = item.snippet.title.toLowerCase();
      const description = item.snippet.description.toLowerCase();
      // Look for Danish characters or common Danish words
      return title.includes('æ') || title.includes('ø') || title.includes('å') ||
             description.includes('æ') || description.includes('ø') || description.includes('å') ||
             title.includes(' og ') || title.includes(' at ') || title.includes(' i ') ||
             description.includes(' og ') || description.includes(' at ') || description.includes(' i ');
    });

    return danishVideos.map((item: any) => ({
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