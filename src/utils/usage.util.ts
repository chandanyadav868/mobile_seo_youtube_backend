import { createAdminClient, APPWRITE_CONFIG } from '../services/appwrite.service.js';

/**
 * Tracks and enforces daily remote LLM usage limits.
 * Free users are limited to 3 remote LLM calls per day.
 * Premium users have unlimited access.
 * 
 * @param user The user object from Appwrite
 * @returns Object { allowed: boolean, remaining?: number, message?: string }
 */
export const checkLlmUsage = async (user: any): Promise<{ allowed: boolean; remaining?: number; message?: string }> => {
    // 1. Premium users have no limits
    if (user?.plan === 'PREMIUM') {
        return { allowed: true };
    }

    const today = new Date().toISOString().split('T')[0];
    let currentCount = typeof user.remoteLlmCount === 'string' ? parseInt(user.remoteLlmCount) : (user.remoteLlmCount || 0);
    const lastDate = user.lastRemoteLlmDate;

    // 2. Reset count if it's a new day
    if (lastDate !== today) {
        currentCount = 0;
    }

    // 3. Check limit (3 per day for free users)
    if (currentCount >= 3) {
        return {
            allowed: false,
            message: "You have reached your daily limit of 3 remote AI analysis. Please use Local AI Chat or come back tomorrow!"
        };
    }

    // 4. Increment and update in background
    try {
        const { databases } = createAdminClient();
        const newCount = currentCount + 1;

        await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.userCollectionId,
            user.$id,
            {
                remoteLlmCount: newCount.toString(),
                lastRemoteLlmDate: today
            }
        );

        return { 
            allowed: true, 
            remaining: 3 - newCount 
        };
    } catch (error) {
        console.error("Failed to update LLM usage count:", error);
        // Fail-safe: allow the request but log the error
        return { allowed: true };
    }
};

/**
 * Tracks and enforces daily YouTube API usage.
 * 
 * @param user The user object from Appwrite
 */
export const checkYoutubeUsage = async (user: any): Promise<{ allowed: boolean; message?: string }> => {
    try {
        const today = new Date().toISOString().split('T')[0];
        let currentCount = typeof user.youtubeRequestCount === 'string' ? parseInt(user.youtubeRequestCount) : (user.youtubeRequestCount || 0);
        const lastDate = user.lastYoutubeRequestDate;

        // 1. Reset count if it's a new day
        if (lastDate !== today) {
            currentCount = 0;
        }

        // 2. Enforce Limit (50 per day)
        if (currentCount >= 50) {
            return {
                allowed: false,
                message: "You have reached your daily limit of 50 YouTube API requests. Please come back tomorrow!"
            };
        }

        const { databases } = createAdminClient();
        const newCount = currentCount + 1;

        await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.userCollectionId,
            user.$id,
            {
                youtubeRequestCount: newCount.toString(),
                lastYoutubeRequestDate: today
            }
        );
        
        console.log(`[YouTube Usage] User: ${user.$id} | Count: ${newCount} | Date: ${today}`);
        return { allowed: true };
    } catch (error) {
        console.error("Failed to update YouTube usage count:", error);
        // Fail-safe: allow the request if tracking fails
        return { allowed: true };
    }
};
