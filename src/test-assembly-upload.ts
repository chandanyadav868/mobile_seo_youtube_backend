import { youtubeDl } from 'youtube-dl-exec';
import { AssemblyAI } from 'assemblyai';
import * as fs from 'fs';
import * as path from 'path';

const apiKey = '495b3cf18e0b49aa8fc56b325307d538';
const videoId = '29UWtlXFogw'; // The video URL you provided
const tempFilePath = path.resolve('temp_audio.m4a');

async function testAssemblyUpload() {
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  console.log(`[Test] 1. Downloading YouTube audio locally via yt-dlp to: ${tempFilePath}`);
  const startTime = Date.now();

  try {
    // Clean up old temp file if it exists
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    // Download the best audio in M4A format directly to the temp file path
    await youtubeDl(youtubeUrl, {
      output: tempFilePath,
      format: 'bestaudio[ext=m4a]/bestaudio',
      noWarnings: true,
    });

    console.log(`[Test] Download complete! Checking file size...`);
    const stats = fs.statSync(tempFilePath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`[Test] File successfully downloaded! Size: ${sizeInMB} MB`);

    console.log(`\n[Test] 2. Uploading local audio file to AssemblyAI secure storage...`);
    const client = new AssemblyAI({ apiKey });

    // Upload the local file buffer/stream directly to AssemblyAI
    const uploadResponse = await client.files.upload(tempFilePath);
    console.log(`[Test] Upload complete! Received private secure URL: ${uploadResponse}`);

    console.log(`\n[Test] 3. Starting AssemblyAI Speech-to-Text transcription...`);
    const transcript = await client.transcripts.transcribe({
      audio: uploadResponse, // Secure uploaded file URL
      speech_models: ["universal-3-pro", "universal-2"]
    });

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n[Test] SUCCESS! AssemblyAI completed in ${durationSec} seconds!`);
    console.log(`[Test] Status: ${transcript.status}`);

    if (transcript.status === 'error') {
      console.error(`[Test] AssemblyAI error:`, transcript.error);
      return;
    }

    console.log(`\n[Test] 4. Fetching sentence-level timing segments...`);
    const sentencesResponse = await client.transcripts.sentences(transcript.id);
    console.log(`[Test] Received ${sentencesResponse.sentences.length} sentence segments!`);
    if (sentencesResponse.sentences.length > 0) {
      console.log(`First Sentence Segment Timing:`, {
        text: sentencesResponse.sentences[0].text,
        startSec: sentencesResponse.sentences[0].start / 1000,
        durationSec: (sentencesResponse.sentences[0].end - sentencesResponse.sentences[0].start) / 1000
      });
    }

    console.log(`\n[Test] Full Transcript Text Preview:`);
    console.log(`"${transcript.text?.substring(0, 500)}..."`);
  } catch (error: any) {
    console.error(`\n[Test] FAILED:`, error.message || error);
  } finally {
    // 4. Clean up temporary audio file
    if (fs.existsSync(tempFilePath)) {
      console.log(`\n[Test] 4. Cleaning up temporary local file: ${tempFilePath}`);
      fs.unlinkSync(tempFilePath);
    }
  }
}

testAssemblyUpload();
