import { type VideoResult } from "./types";

// Function to fetch educational YouTube Shorts
export async function fetchEducationalShorts(topic: string, maxResults = 3): Promise<VideoResult[]> {
  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: `${topic} dansk educational #shorts`,  // Add 'dansk' to prioritize Danish content
      maxResults: maxResults.toString(),
      type: 'video',
      videoDuration: 'short',
      relevanceLanguage: 'da',
      regionCode: 'DK',
      hl: 'da',
      key: process.env.YOUTUBE_API_KEY!
    });

    console.log('Fetching YouTube shorts with params:', params.toString());

    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);

    if (!response.ok) {
      console.error('YouTube API error status:', response.status);
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Found total videos:', data.items?.length || 0);

    // Enhanced Danish content detection
    const danishVideos = data.items.filter((item: any) => {
      const title = item.snippet.title.toLowerCase();
      const description = item.snippet.description.toLowerCase();

      // Common Danish words and patterns
      const danishMarkers = [
        'æ', 'ø', 'å',  // Danish characters
        ' og ', ' at ', ' i ', ' på ', ' med ',  // Common Danish words
        'dansk', 'danmark', 'danske',  // Country/language references
        'skole', 'læring', 'undervisning'  // Educational terms
      ];

      return danishMarkers.some(marker => 
        title.includes(marker) || description.includes(marker)
      );
    });

    console.log('Filtered Danish videos:', danishVideos.length);

    // If no Danish videos found, return a subset of all videos
    const videosToUse = danishVideos.length > 0 ? danishVideos : data.items.slice(0, maxResults);

    return videosToUse.map((item: any) => ({
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