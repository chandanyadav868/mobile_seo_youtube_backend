async function testInvidious(videoId: string) {
  console.log(`[Test] Extracting direct audio URL via Invidious for video: ${videoId}`);
  
  const instances = [
    'https://yewtu.be',
    'https://invidious.flokinet.to',
    'https://invidious.projectsegfaut.im',
    'https://inv.vern.cc'
  ];

  for (const instance of instances) {
    try {
      const url = `${instance}/api/v1/videos/${videoId}`;
      console.log(`[Test] Querying Invidious instance: ${url}`);
      
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      });

      console.log(`[Invidious] Response Status: ${resp.status}`);
      if (resp.ok) {
        const data: any = await resp.json();
        const audioFormats = data.adaptiveFormats?.filter((f: any) => f.type && f.type.startsWith('audio/')) || [];
        console.log(`[Invidious] Found ${audioFormats.length} audio formats!`);
        
        if (audioFormats.length > 0) {
          const bestAudio = audioFormats[0];
          console.log(`[Invidious] SUCCESS! Audio Format: ${bestAudio.type}`);
          console.log(`[Invidious] Direct Audio Stream URL:`);
          console.log(bestAudio.url);
          return bestAudio.url;
        } else {
          console.log(`[Invidious] No audio formats in response.`);
        }
      }
    } catch (err: any) {
      console.error(`[Invidious] Error:`, err.message);
    }
  }
  throw new Error('Failed to extract audio stream URL from all Invidious instances.');
}

testInvidious('_EUU68RsX1I');
