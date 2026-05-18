import { YoutubeTranscript } from 'youtube-transcript';

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

    try {
      console.log(`[YoutubeTranscriptService] Fetching transcript for videoId: ${videoId}`);
      const segments = await YoutubeTranscript.fetchTranscript(videoId, options);

      if (!segments || segments.length === 0) {
        throw new Error('No transcript segments returned for this video');
      }

      // Process and compile full text by joining the segments
      const fullText = segments.map((seg: any) => seg.text).join(' ');

      return {
        videoId,
        segments: segments.map((seg: any) => ({
          text: seg.text,
          start: seg.offset, // Map 'offset' to 'start' for cleaner semantic naming
          duration: seg.duration,
        })),
        fullText,
      };
    } catch (error: any) {
      console.error(`[YoutubeTranscriptService] Fetch failed for ${videoId}:`, error);
      const msg = error?.message || error;
      throw new Error(`Failed to retrieve transcript: ${msg}`);
    }
  }
}
