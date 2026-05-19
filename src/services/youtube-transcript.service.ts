import { YoutubeTranscript } from 'youtube-transcript';

// Helper to decode HTML entities in transcripts
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#123;/g, '{')
    .replace(/&#125;/g, '}')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

// Custom Fetch interceptor that forces region/language context and reinforces desktop web headers
const customFetch = (url: string, init?: any) => {
  let modifiedInit = { ...init };

  if (url.includes('youtubei/v1/player') && modifiedInit?.body) {
    try {
      const bodyObj = JSON.parse(modifiedInit.body);
      if (bodyObj.context && bodyObj.context.client) {
        // Enforce host language and geo region context to bypass localized datacenter blocks
        bodyObj.context.client.hl = 'en';
        bodyObj.context.client.gl = 'US';
        modifiedInit.body = JSON.stringify(bodyObj);
      }
    } catch (e) {
      console.warn('[TranscriptService] Interceptor failed to inject context:', e);
    }
  }

  // Inject high-reputation desktop web browser headers to bypass simple bot blockers
  modifiedInit.headers = {
    ...(modifiedInit.headers || {}),
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };

  return fetch(url, modifiedInit);
};

export class YoutubeTranscriptService {
  /**
   * Helper to extract the 11-character video ID from various YouTube URL formats or raw IDs.
   */
  static extractVideoId(input: string): string | null {
    if (!input) return null;
    const trimmed = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = trimmed.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  /**
   * Fetches transcript segments for a given video ID or URL, processes them,
   * and returns both the raw segments and a combined full-text block.
   */
  static async fetchTranscript(videoIdOrUrl: string, options?: { lang?: string }) {
    const videoId = this.extractVideoId(videoIdOrUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube video ID or URL');
    }

    // Layer 1: Enhanced Library Fetch (using custom fetch interceptor + browser headers + geo overrides)
    try {
      console.log(`[YoutubeTranscriptService] [Layer 1] Fetching transcript via library for videoId: ${videoId}`);
      const segments = await YoutubeTranscript.fetchTranscript(videoId, {
        ...(options || {}),
        fetch: customFetch as any,
      });

      if (segments && segments.length > 0) {
        const fullText = segments.map((seg: any) => seg.text).join(' ');
        console.log(`[YoutubeTranscriptService] [Layer 1] SUCCESS! Fetched ${segments.length} segments for videoId: ${videoId}`);
        console.log(`[YoutubeTranscriptService] Transcript preview: "${fullText.substring(0, 300)}..."`);
        return {
          videoId,
          segments: segments.map((seg: any) => ({
            text: seg.text,
            start: seg.offset,
            duration: seg.duration,
          })),
          fullText,
        };
      }
    } catch (primaryError: any) {
      console.warn(`[YoutubeTranscriptService] [Layer 1] failed: ${primaryError.message || primaryError}. Trying Layer 2 fallback...`);
    }

    // Layer 2: Custom Desktop Web player client fallback (extremely stable on datacenter IPs)
    try {
      console.log(`[YoutubeTranscriptService] [Layer 2] Fetching transcript via Web client fallback for videoId: ${videoId}`);
      const result = await this.fetchFallbackWeb(videoId);
      console.log(`[YoutubeTranscriptService] [Layer 2] SUCCESS! Fetched ${result.segments.length} segments for videoId: ${videoId}`);
      console.log(`[YoutubeTranscriptService] Transcript preview: "${result.fullText.substring(0, 300)}..."`);
      return result;
    } catch (fallbackError: any) {
      console.error(`[YoutubeTranscriptService] All layers failed for ${videoId}:`, fallbackError);
      throw new Error(`Failed to retrieve transcript: ${fallbackError.message || fallbackError}`);
    }
  }

  /**
   * Direct Web Player API client query fallback
   */
  private static async fetchFallbackWeb(videoId: string) {
    const INNERTUBE_API_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
    const body = {
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20240215.00.00',
          hl: 'en',
          gl: 'US',
        }
      },
      videoId: videoId,
    };

    const resp = await fetch(INNERTUBE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      throw new Error(`InnerTube web API returned status: ${resp.status}`);
    }

    const data = await resp.json();
    const captionTracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!Array.isArray(captionTracks) || captionTracks.length === 0) {
      throw new Error('No caption tracks or transcripts found on this video');
    }

    // Select the best available track (default to English if present, else pick first available)
    const track = captionTracks.find((t: any) => t.languageCode === 'en') || captionTracks[0];
    const transcriptURL = track.baseUrl;

    const transcriptResp = await fetch(transcriptURL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      }
    });

    if (!transcriptResp.ok) {
      throw new Error(`Failed to fetch XML captions from YouTube`);
    }

    const xml = await transcriptResp.text();
    const RE_XML_TRANSCRIPT = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
    const classicResults = [...xml.matchAll(RE_XML_TRANSCRIPT)];

    if (classicResults.length === 0) {
      throw new Error('Transcript XML parsing returned empty matches');
    }

    const segments = classicResults.map((result) => ({
      text: decodeEntities(result[3]),
      start: parseFloat(result[1]),
      duration: parseFloat(result[2]),
    }));

    const fullText = segments.map((seg: any) => seg.text).join(' ');

    return {
      videoId,
      segments,
      fullText,
    };
  }
}
