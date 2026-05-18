import ytdl from '@distube/ytdl-core';
import { AssemblyAI } from 'assemblyai';

const apiKey = '495b3cf18e0b49aa8fc56b325307d538';

async function testAssembly() {
  const videoId = '_EUU68RsX1I';
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  console.log(`[Test] 1. Extracting audio stream for video: ${videoId}`);
  
  try {
    // Get video info
    const info = await ytdl.getInfo(url);
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    
    // Choose the best quality M4A audio stream (AssemblyAI works great with M4A/AAC/WebM)
    const bestAudio = audioFormats.find(f => (f.container as string) === 'm4a') || audioFormats[0];
    if (!bestAudio || !bestAudio.url) {
      throw new Error('No direct audio stream URL could be found.');
    }
    
    console.log(`[Test] SUCCESS! Got signed direct audio URL: ${bestAudio.url.substring(0, 120)}...`);
    console.log(`[Test] 2. Connecting to AssemblyAI with API Key: ${apiKey}`);
    
    const client = new AssemblyAI({ apiKey });
    console.log(`[Test] Submitting audio stream for AI transcription (this will take 10-20 seconds)...`);
    
    const startTime = Date.now();
    const transcript = await client.transcripts.transcribe({
      audio: bestAudio.url,
      language_code: 'hi', // Enforce Hindi/Hinglish language model to get flawless results!
    });
    
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Test] AssemblyAI processing completed in ${durationSec} seconds!`);
    console.log(`[Test] Status: ${transcript.status}`);
    
    if (transcript.status === 'error') {
      console.error(`[Test] AssemblyAI error:`, transcript.error);
      return;
    }
    
    console.log(`\n[Test] SUCCESS! Transcript Preview (length ${transcript.text?.length || 0}):`);
    console.log(`"${transcript.text?.substring(0, 500)}..."`);
  } catch (error: any) {
    console.error(`[Test] FAILED:`, error.message || error);
  }
}

testAssembly();
