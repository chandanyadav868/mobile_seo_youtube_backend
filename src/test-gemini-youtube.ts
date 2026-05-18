import { GoogleGenAI } from "@google/genai";
import { config } from "./config/index.js";

const ai = new GoogleGenAI({ apiKey: config.googleAiApiKey });

async function testGeminiYoutube() {
  const videoId = '_EUU68RsX1I';
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  console.log(`[Test] Asking Gemini to transcribe YouTube video: ${youtubeUrl}`);
  const startTime = Date.now();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Transcribe this YouTube video into high-fidelity text. Output the transcription only.' },
            {
              fileData: {
                fileUri: youtubeUrl,
                mimeType: 'video/mp4'
              }
            }
          ]
        }
      ]
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`\n[Test] SUCCESS! Gemini processed video in ${durationSec} seconds!`);
    console.log(`[Test] Transcript Length: ${text.length} characters`);
    console.log(`\n[Test] Transcript Preview:`);
    console.log(`"${text.substring(0, 500)}..."`);
  } catch (error: any) {
    console.error(`\n[Test] FAILED:`, error.message || error);
  }
}

testGeminiYoutube();
