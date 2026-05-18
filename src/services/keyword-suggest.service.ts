export class KeywordSuggestService {
  /**
   * Fetches active search autocompletes from the public YouTube suggest API.
   * Format returned is: ["base keyword", ["suggestion 1", "suggestion 2", ...]]
   */
  static async fetchSuggestions(query: string): Promise<string[]> {
    try {
      const cleaned = query.trim();
      if (!cleaned) return [];

      const url = `https://suggestqueries-google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(cleaned)}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Autocomplete query failed with status: ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data) && data[1] && Array.isArray(data[1])) {
        return data[1].map((item: any) => String(item).trim()).filter(Boolean);
      }

      return [];
    } catch (e: any) {
      console.error('[KeywordSuggestService] Fetch Error:', e);
      throw new Error(`Failed to fetch autocomplete suggestions: ${e.message}`);
    }
  }
}
