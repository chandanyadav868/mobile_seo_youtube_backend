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

export class ChannelSpyService {
  /**
   * Helper to clean up channel handles.
   * Ensures handles start with '@' if it's a handle, or handles custom paths.
   */
  static formatHandle(input: string): string {
    const cleaned = input.trim();
    if (!cleaned) throw new Error('Channel handle or path is required');
    
    // If it's a full URL, extract the channel name
    // e.g. https://www.youtube.com/@MrBeast/videos
    if (cleaned.includes('youtube.com/')) {
      const match = cleaned.match(/youtube\.com\/(?:@|c\/|user\/|channel\/)?([a-zA-Z0-9_.-]+)/);
      if (match) {
        return match[1].startsWith('@') ? match[1] : `@${match[1]}`;
      }
    }
    
    // If it starts with @ or is a raw channel ID, return as is
    if (cleaned.startsWith('@') || cleaned.startsWith('UC')) {
      return cleaned;
    }
    
    // Otherwise add @
    return `@${cleaned}`;
  }

  /**
   * Scrapes a channel's videos tab to fetch the latest 20 videos.
   */
  static async fetchChannelVideos(handleInput: string) {
    try {
      const handle = this.formatHandle(handleInput);
      const url = `https://www.youtube.com/${handle}/videos`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        throw new Error(`YouTube returned status ${response.status} for channel ${handle}`);
      }

      const html = await response.text();

      // Extract ytInitialData safely using a linear brace balancer (no backtracking hangs)
      const searchStr = 'ytInitialData = ';
      const index = html.indexOf(searchStr);
      if (index === -1) {
        throw new Error('Could not find channel page data structure');
      }
      const start = html.indexOf('{', index);
      if (start === -1) {
        throw new Error('Could not find JSON start in channel data');
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
        throw new Error('Unbalanced JSON braces in channel data');
      }

      const jsonStr = html.slice(start, end + 1);
      let ytInitialData: any = null;
      try {
        ytInitialData = JSON.parse(jsonStr);
      } catch (e) {
        throw new Error('Failed to parse channel JSON state');
      }

      // Try to navigate the tabs to find the videos tab
      const tabs = ytInitialData?.contents?.twoColumnBrowseResultsRenderer?.tabs;
      if (!tabs || !Array.isArray(tabs)) {
        throw new Error('No channel content structure discovered');
      }

      // Find the videos tab
      const videosTab = tabs.find((t: any) => {
        const titleText = t.tabRenderer?.title;
        return titleText === 'Videos' || titleText === 'videos' || t.tabRenderer?.selected === true;
      }) || tabs[1] || tabs[0];

      const richGrid = videosTab?.tabRenderer?.content?.richGridRenderer;
      const contents = richGrid?.contents;
      if (!contents || !Array.isArray(contents)) {
        throw new Error('No video items discovered on this channel. Make sure the channel exists and has public videos.');
      }

      // Helper function to parse accessibility duration to standard duration e.g. "12 minutes, 54 seconds" -> "12:54"
      const parseAccessibilityDuration = (label: string): string => {
        const hourMatch = label.match(/(\d+)\s*hour/i);
        const minMatch = label.match(/(\d+)\s*minute/i);
        const secMatch = label.match(/(\d+)\s*second/i);

        const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
        const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;
        const seconds = secMatch ? parseInt(secMatch[1], 10) : 0;

        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        if (minutes > 0) {
          return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        if (seconds > 0) {
          return `0:${seconds.toString().padStart(2, '0')}`;
        }
        return label;
      };

      const videos: any[] = [];
      for (const item of contents) {
        const videoRenderer = item?.richItemRenderer?.content?.videoRenderer;
        const lockupViewModel = item?.richItemRenderer?.content?.lockupViewModel;

        if (videoRenderer) {
          const videoId = videoRenderer.videoId;
          if (!videoId) continue;

          const rawTitle = videoRenderer.title?.runs?.[0]?.text || videoRenderer.title?.accessibility?.accessibilityData?.label || 'Unknown Title';
          const title = decodeEntities(rawTitle);
          
          // Parse View Count
          const viewsRaw = videoRenderer.viewCountText?.simpleText || videoRenderer.viewCountText?.runs?.[0]?.text || '0 views';
          const viewsMatch = viewsRaw.match(/([\d,]+)/);
          const views = viewsMatch ? parseInt(viewsMatch[1].replace(/,/g, ''), 10) : 0;

          // Parse Duration
          const duration = videoRenderer.lengthText?.simpleText || 'N/A';

          // Parse Relative Publish Date
          const publishDate = videoRenderer.publishedTimeText?.simpleText || 'Recently';

          // Thumbnails
          const thumbs = videoRenderer.thumbnail?.thumbnails;
          const thumbnailUrl = thumbs?.[thumbs.length - 1]?.url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

          videos.push({
            videoId,
            title,
            views,
            viewsText: viewsRaw,
            duration,
            publishDate,
            thumbnailUrl,
          });
        } else if (lockupViewModel) {
          const videoId = lockupViewModel.contentId;
          if (!videoId) continue;

          const metaModel = lockupViewModel.metadata?.lockupMetadataViewModel;
          const rawTitle = metaModel?.title?.content || 'Unknown Title';
          const title = decodeEntities(rawTitle);

          // Thumbnail
          const thumbSources = lockupViewModel.contentImage?.thumbnailViewModel?.image?.sources || [];
          const thumbnailUrl = thumbSources.length > 0
            ? thumbSources[thumbSources.length - 1].url
            : `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

          // Metadata Rows (Views, Publish Date)
          const parts = metaModel?.metadata?.contentMetadataViewModel?.metadataRows?.[0]?.metadataParts || [];
          const viewsRaw = parts[0]?.text?.content || '0 views';
          const publishDate = parts[1]?.text?.content || 'Recently';

          // Parse numeric views
          let views = 0;
          const cleanedViews = viewsRaw.toLowerCase();
          const numberMatch = cleanedViews.match(/([\d.]+)/);
          if (numberMatch) {
            const num = parseFloat(numberMatch[1]);
            if (cleanedViews.includes('k')) {
              views = Math.round(num * 1000);
            } else if (cleanedViews.includes('m')) {
              views = Math.round(num * 1000000);
            } else if (cleanedViews.includes('b')) {
              views = Math.round(num * 1000000000);
            } else {
              views = Math.round(num);
            }
          }

          // Parse Duration from overlays or accessibility labels
          let duration = 'N/A';
          const overlays = lockupViewModel.contentImage?.thumbnailViewModel?.overlays || [];
          for (const ov of overlays) {
            const timeStatus = ov?.thumbnailOverlayTimeStatusRenderer;
            if (timeStatus?.text?.simpleText) {
              duration = timeStatus.text.simpleText;
              break;
            }
            const badgeViewModel = ov?.thumbnailOverlayBadgeViewModel;
            const timeLabel = badgeViewModel?.rendererContext?.accessibilityContext?.label;
            if (timeLabel) {
              duration = parseAccessibilityDuration(timeLabel);
              break;
            }
          }

          // Fallback duration parsing from global accessibility label
          if (duration === 'N/A') {
            const globalLabel = lockupViewModel.rendererContext?.accessibilityContext?.label || '';
            if (globalLabel && title) {
              const cleanedTitle = title.replace(/\s+/g, ' ').trim();
              const cleanedLabel = globalLabel.replace(/\s+/g, ' ').trim();
              if (cleanedLabel.toLowerCase().startsWith(cleanedTitle.toLowerCase())) {
                const durationPart = cleanedLabel.substring(cleanedTitle.length).trim();
                if (durationPart) {
                  duration = parseAccessibilityDuration(durationPart);
                }
              }
            }
          }

          videos.push({
            videoId,
            title,
            views,
            viewsText: viewsRaw,
            duration,
            publishDate,
            thumbnailUrl,
          });
        }

        // Limit to 20 videos
        if (videos.length >= 20) break;
      }

      // Extract channel name & avatar from meta tags
      const channelNameMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/);
      const channelName = channelNameMatch ? decodeEntities(channelNameMatch[1]) : handle;
      const avatarMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/);
      const avatarUrl = avatarMatch ? avatarMatch[1] : '';

      return {
        channelName,
        handle,
        avatarUrl,
        videos,
      };
    } catch (e: any) {
      console.error('[ChannelSpyService] Error:', e);
      throw new Error(`Failed to spy channel: ${e.message}`);
    }
  }
}
