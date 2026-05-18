import { youtubeDl } from 'youtube-dl-exec';
import { AssemblyAI } from 'assemblyai';

const apiKey = '495b3cf18e0b49aa8fc56b325307d538';
const videoId = '29UWtlXFogw'; // The video URL you provided

async function testAssemblyYtdlp() {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  console.log(`[Test] 1. Launching yt-dlp to extract audio stream for video: ${videoId}`);
  const startTime = Date.now();

  try {
    // Call yt-dlp to dump media stream metadata in JSON format
    const output: any = await youtubeDl(youtubeUrl, {
      dumpSingleJson: true,
      noWarnings: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
    });

    console.log(`[Test] yt-dlp successfully retrieved metadata!`);

    // Locate the best audio-only format (usually container 'm4a')
    const formats = output.formats || [];
    const bestAudio = formats
      .reverse()
      .find((f: any) => f.vcodec === 'none' && f.acodec !== 'none' && f.ext === 'm4a') ||
      formats.find((f: any) => f.vcodec === 'none' && f.acodec !== 'none');

    if (!bestAudio || !bestAudio.url) {
      throw new Error('No playable audio-only stream was found in yt-dlp output.');
    }

    console.log(`[Test] SUCCESS! Signed Audio Stream URL extracted:`);
    console.log(`${bestAudio.url.substring(0, 150)}...`);

    console.log(`\n[Test] 2. Submitting to AssemblyAI with API Key: ${apiKey}`);
    const client = new AssemblyAI({ apiKey });

    const transcript = await client.transcripts.transcribe({
      audio: bestAudio.url,
      speech_models: ["universal-3-pro", "universal-2"]
    });

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n[Test] SUCCESS! AssemblyAI completed in ${durationSec} seconds!`);
    console.log(`[Test] Status: ${transcript.status}`);

    if (transcript.status === 'error') {
      console.error(`[Test] AssemblyAI error:`, transcript.error);
      return;
    }

    console.log(`\n[Test] Full Transcript Text Preview:`);
    console.log(`"${transcript.text}"`);
  } catch (error: any) {
    console.error(`\n[Test] FAILED:`, error.message || error);
  }
}

testAssemblyYtdlp();
