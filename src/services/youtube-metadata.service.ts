export class YoutubeMetadataService {
  /**
   * Helper to parse and extract the 11-character YouTube video ID.
   * Supports raw IDs, youtube.com/watch?v=..., youtu.be/..., shorts, etc.
   */
  static extractVideoId(input: string): string {
    const cleaned = input.trim();
    if (cleaned.length === 11) return cleaned;

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
    const match = cleaned.match(regExp);

    if (match && match[2].length === 11) {
      return match[2];
    }
    
    // Fallback: Check for Shorts URL
    const shortsRegExp = /shorts\/([a-zA-Z0-9_-]{11})/;
    const shortsMatch = cleaned.match(shortsRegExp);
    if (shortsMatch && shortsMatch[1].length === 11) {
      return shortsMatch[1];
    }

    throw new Error('Invalid YouTube video ID or URL format');
  }

  /**
   * Performs zero-quota watch-page scraping to extract title, description, tags, channel, and metrics.
   */
  static async fetchMetadata(videoIdOrUrl: string) {
    try {
      const videoId = this.extractVideoId(videoIdOrUrl);
      const url = `https://www.youtube.com/watch?v=${videoId}`;

      // Mimic a standard desktop browser request to receive identical meta headers
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        throw new Error(`YouTube watch page returned status: ${response.status}`);
      }

      const html = await response.text();

      // Helper helper to decode standard HTML Entities
      const decodeHtmlEntities = (str: string): string => {
        return str
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"');
      };

      // Extract and parse ytInitialPlayerResponse safely using a linear brace balancer (no backtracking hangs)
      let playerResponse: any = null;
      const searchStr = 'ytInitialPlayerResponse = ';
      const index = html.indexOf(searchStr);
      if (index !== -1) {
        const start = html.indexOf('{', index);
        if (start !== -1) {
          let braceCount = 0;
          let end = -1;
          for (let i = start; i < html.length; i++) {
            const char = html[i];
            if (char === '{') {
              braceCount++;
            } else if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                end = i;
                break;
              }
            }
          }
          if (end !== -1) {
            const jsonStr = html.slice(start, end + 1);
            try {
              playerResponse = JSON.parse(jsonStr);
            } catch (e) {
              console.error("Failed to parse ytInitialPlayerResponse", e);
            }
          }
        }
      }

      // 1. Title
      let title = '';
      if (playerResponse?.videoDetails?.title) {
        title = playerResponse.videoDetails.title;
      } else {
        const titleMatch = 
          html.match(/<meta\s+name="title"\s+content="([^"]*)"/) ||
          html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/);
        title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : 'Unknown Title';
      }

      // 2. Description
      let description = '';
      if (playerResponse?.videoDetails?.shortDescription) {
        description = playerResponse.videoDetails.shortDescription;
      } else {
        const descMatch =
          html.match(/<meta\s+name="description"\s+content="([^"]*)"/) ||
          html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/);
        description = descMatch ? decodeHtmlEntities(descMatch[1] || '') : '';
      }

      // 3. Tags
      let tags: string[] = [];
      if (playerResponse?.videoDetails?.keywords && Array.isArray(playerResponse.videoDetails.keywords)) {
        tags = playerResponse.videoDetails.keywords;
      } else {
        const keywordsMatch = html.match(/<meta\s+name="keywords"\s+content="([^"]*)"/);
        const keywordsRaw = keywordsMatch ? decodeHtmlEntities(keywordsMatch[1]) : '';
        tags = keywordsRaw ? keywordsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];
      }

      // 4. Channel Details
      let channelName = '';
      if (playerResponse?.videoDetails?.author) {
        channelName = playerResponse.videoDetails.author;
      } else {
        const channelMatch = html.match(/<link\s+itemprop="name"\s+content="([^"]*)"/);
        channelName = channelMatch ? decodeHtmlEntities(channelMatch[1]) : 'Unknown Channel';
      }

      // 5. Views
      let views = 0;
      if (playerResponse?.videoDetails?.viewCount) {
        views = parseInt(playerResponse.videoDetails.viewCount, 10) || 0;
      } else {
        const viewsMatch = html.match(/<meta\s+itemprop="interactionCount"\s+content="([^"]*)"/);
        views = viewsMatch ? parseInt(viewsMatch[1], 10) : 0;
      }

      // 6. Publish Date
      const dateMatch = html.match(/<meta\s+itemprop="datePublished"\s+content="([^"]*)"/);
      const publishDate = dateMatch ? dateMatch[1] : '';

      // 7. Thumbnail og:image
      let thumbnailUrl = '';
      if (playerResponse?.videoDetails?.thumbnail?.thumbnails?.length) {
        const thumbs = playerResponse.videoDetails.thumbnail.thumbnails;
        thumbnailUrl = thumbs[thumbs.length - 1].url;
      } else {
        const thumbMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/);
        thumbnailUrl = thumbMatch ? thumbMatch[1] : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }

      return {
        videoId,
        title,
        description,
        tags,
        channelName,
        views,
        publishDate,
        thumbnailUrl,
      };
    } catch (error: any) {
      console.error('[YoutubeMetadataService] Scraping Error:', error);
      throw new Error(`Failed to scrape YouTube metadata: ${error.message}`);
    }
  }
}
