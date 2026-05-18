import { YoutubeTranscript } from 'youtube-transcript';

async function testLibraryUrl() {
  const videoId = '_EUU68RsX1I';
  console.log(`[Test] Running youtube-transcript library fetch...`);
  
  // Monkey patch fetch to see what URLs are being fetched
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url: any, init: any) => {
    console.log(`[Fetch Intercept] URL:`, url);
    return originalFetch(url, init);
  };
  
  try {
    const result = await YoutubeTranscript.fetchTranscript(videoId);
    console.log(`[Test] Library fetch succeeded! Length: ${result.length}`);
  } catch (error: any) {
    console.error(`[Test] Library failed:`, error.message);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

testLibraryUrl();
