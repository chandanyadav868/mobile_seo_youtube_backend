// Helper to decode HTML entities in scraped strings
function decodeEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

export class SearchSpyService {
  /**
   * Scrapes organic search results for any given search term.
   */
  static async spyKeywordSearch(query: string): Promise<any[]> {
    try {
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        throw new Error(`YouTube search page failed with status: ${response.status}`);
      }

      const html = await response.text();

      // Extract ytInitialData safely using a linear brace balancer (no backtracking hangs)
      const searchStr = 'ytInitialData = ';
      const index = html.indexOf(searchStr);
      if (index === -1) {
        throw new Error('Failed to parse search initial data structure');
      }
      const start = html.indexOf('{', index);
      if (start === -1) {
        throw new Error('Could not find JSON start in search data');
      }

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

      if (end === -1) {
        throw new Error('Unbalanced JSON braces in search data');
      }

      const jsonStr = html.slice(start, end + 1);
      let ytInitialData: any = null;
      try {
        ytInitialData = JSON.parse(jsonStr);
      } catch (e) {
        throw new Error('Failed to decode search JSON block');
      }

      const videos: any[] = [];

      // Recursive tree traverser to gracefully extract all videoRenderers
      const traverse = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;

        if (obj.videoRenderer) {
          const vr = obj.videoRenderer;
          const videoId = vr.videoId;
          const rawTitle = vr.title?.runs?.[0]?.text || vr.title?.simpleText || 'Unknown Title';
          const title = decodeEntities(rawTitle);
          const rawChannel = vr.ownerText?.runs?.[0]?.text || vr.shortBylineText?.runs?.[0]?.text || 'Unknown Channel';
          const channelName = decodeEntities(rawChannel);
          
          // Parse views
          const viewsRaw = vr.viewCountText?.simpleText || vr.viewCountText?.runs?.[0]?.text || '0 views';
          const viewsMatch = viewsRaw.match(/([\d,]+)/);
          const views = viewsMatch ? parseInt(viewsMatch[1].replace(/,/g, ''), 10) : 0;

          // Parse length & relative date
          const duration = vr.lengthText?.simpleText || 'N/A';
          const publishDate = vr.publishedTimeText?.simpleText || 'Recently';
          const thumbs = vr.thumbnail?.thumbnails;
          const thumbnailUrl = thumbs?.[thumbs.length - 1]?.url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

          if (videoId && !videos.some(v => v.videoId === videoId)) {
            videos.push({
              videoId,
              title,
              channelName,
              views,
              viewsText: viewsRaw,
              duration,
              publishDate,
              thumbnailUrl,
            });
          }
        }

        for (const key of Object.keys(obj)) {
          traverse(obj[key]);
        }
      };

      traverse(ytInitialData);

      // Return top 15 organic search results
      return videos.slice(0, 15);
    } catch (e: any) {
      console.error('[SearchSpyService] Scraping Error:', e);
      throw new Error(`Failed to scrape keyword search rankings: ${e.message}`);
    }
  }
}
