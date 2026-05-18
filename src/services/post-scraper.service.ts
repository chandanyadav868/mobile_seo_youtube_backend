export class PostScraperService {
  /**
   * Scrapes a public YouTube Community Post to extract high-resolution uncropped photo attachments and author info.
   */
  static async fetchPostImages(postUrl: string): Promise<{
    authorName: string;
    authorAvatarUrl: string;
    contentText: string;
    images: Array<{ thumbUrl: string; rawUrl: string }>;
  }> {
    try {
      // 1. Extract canonical Post ID (typically 36 characters starting with 'Ug')
      const postIdMatch = postUrl.match(/(Ug[a-zA-Z0-9_-]{34})/);
      if (!postIdMatch) {
        throw new Error('Invalid YouTube post URL. Could not extract a valid community post ID.');
      }
      const postId = postIdMatch[1];
      const canonicalUrl = `https://www.youtube.com/post/${postId}`;

      // 2. Fetch the page HTML with browser headers
      const response = await fetch(canonicalUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load community post page (status ${response.status}).`);
      }

      const html = await response.text();

      // 3. Extract ytInitialData safely using our fast linear brace balancer
      const searchStr = 'ytInitialData = ';
      const index = html.indexOf(searchStr);
      if (index === -1) {
        throw new Error('Failed to parse community post data feed structure.');
      }
      const start = html.indexOf('{', index);
      if (start === -1) {
        throw new Error('Could not find JSON structure in post feed.');
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
        throw new Error('Unbalanced JSON braces in post feed data.');
      }

      const jsonStr = html.slice(start, end + 1);
      let ytInitialData: any = null;
      try {
        ytInitialData = JSON.parse(jsonStr);
      } catch (e) {
        throw new Error('Failed to decode post JSON block.');
      }

      // 4. Traverse tree to locate backstagePostRenderer and backstageImageRenderer elements
      let authorName = 'YouTube Creator';
      let authorAvatarUrl = '';
      let contentText = '';
      const imageRenderers: any[] = [];

      const traverse = (obj: any) => {
        if (!obj || typeof obj !== 'object') return;

        // Extract post details from backstagePostRenderer
        if (obj.backstagePostRenderer) {
          const bpr = obj.backstagePostRenderer;
          authorName = bpr.authorText?.runs?.[0]?.text || bpr.authorText?.simpleText || authorName;
          
          const avatarThumbs = bpr.authorThumbnail?.thumbnails;
          if (avatarThumbs && avatarThumbs.length > 0) {
            authorAvatarUrl = avatarThumbs[avatarThumbs.length - 1].url || authorAvatarUrl;
            if (authorAvatarUrl.startsWith('//')) {
              authorAvatarUrl = 'https:' + authorAvatarUrl;
            }
          }

          contentText = bpr.backstagePostContent?.runs?.map((r: any) => r.text).join('') || bpr.backstagePostContent?.simpleText || contentText;
        }

        // Collect all image attachments
        if (obj.backstageImageRenderer) {
          imageRenderers.push(obj.backstageImageRenderer);
        }

        for (const k of Object.keys(obj)) {
          traverse(obj[k]);
        }
      };

      traverse(ytInitialData);

      // 5. Map image objects to thumbnail and maximum uncropped raw resolution URLs
      const images = imageRenderers.map((imgRenderer: any) => {
        const thumbList = imgRenderer.image?.thumbnails || [];
        const thumbUrl = thumbList.length > 0 ? thumbList[thumbList.length - 1].url : '';
        
        let normalizedThumbUrl = thumbUrl;
        if (normalizedThumbUrl.startsWith('//')) {
          normalizedThumbUrl = 'https:' + normalizedThumbUrl;
        }

        // Strip cropping suffix and append "=s0" to retrieve original raw HD resolution photo
        const rawUrl = normalizedThumbUrl.includes('=')
          ? normalizedThumbUrl.split('=')[0] + '=s0'
          : normalizedThumbUrl;

        return {
          thumbUrl: normalizedThumbUrl,
          rawUrl,
        };
      });

      // Filter out empty entries and ensure uniqueness
      const uniqueImages: Array<{ thumbUrl: string; rawUrl: string }> = [];
      for (const img of images) {
        if (img.thumbUrl && !uniqueImages.some(x => x.thumbUrl === img.thumbUrl)) {
          uniqueImages.push(img);
        }
      }

      return {
        authorName,
        authorAvatarUrl,
        contentText,
        images: uniqueImages,
      };
    } catch (e: any) {
      console.error('[PostScraperService] Error:', e);
      throw new Error(e.message || 'Failed to scrape YouTube Community Post');
    }
  }
}
