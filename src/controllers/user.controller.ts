import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { createAdminClient, APPWRITE_CONFIG } from "../services/appwrite.service.js";

export const addCoins = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { amount = 10 } = req.body;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { databases } = createAdminClient();
    
    // Parse existing coins
    let currentCoins = typeof user.coins === "string" ? parseInt(user.coins) : user.coins;
    if (isNaN(currentCoins)) currentCoins = 0;

    const newCoins = currentCoins + amount;

    // Update in Appwrite
    const updatedProfile = await databases.updateDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.userCollectionId,
      user.$id,
      {
        coins: newCoins.toString() // Store as string based on existing schema
      }
    );

    res.status(200).json({ 
      success: true, 
      coins: newCoins,
      message: `Added ${amount} coins successfully` 
    });
  } catch (error: any) {
    console.error("Add Coins Error:", error.message);
    res.status(500).json({ error: "Failed to add coins" });
  }
};

export const dailyLogin = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { databases } = createAdminClient();
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];
    
    // Check if lastLoginDate exists and matches today
    if (user.lastLoginDate === today) {
      return res.status(200).json({ 
        success: false, 
        message: "Daily login bonus already claimed today",
        coins: user.coins
      });
    }

    // Grant 20 coins
    let currentCoins = typeof user.coins === "string" ? parseInt(user.coins) : user.coins;
    if (isNaN(currentCoins)) currentCoins = 0;
    const newCoins = currentCoins + 20;

    try {
      // Attempt to update coins + lastLoginDate (requires the attribute to exist in collection)
      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.userCollectionId,
        user.$id,
        {
          coins: newCoins.toString(),
          lastLoginDate: today
        }
      );
    } catch (updateError: any) {
      // Fallback: update only coins if lastLoginDate attribute doesn't exist yet
      console.warn("Daily Login: lastLoginDate field may not exist in schema. Updating coins only.", updateError.message);
      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.userCollectionId,
        user.$id,
        { coins: newCoins.toString() }
      );
    }

    res.status(200).json({ 
      success: true, 
      coins: newCoins,
      message: "Claimed 20 daily login coins!" 
    });
  } catch (error: any) {
    console.error("Daily Login Error:", error.message);
    res.status(500).json({ error: "Failed to process daily login" });
  }
};

export const resetLlmLimits = async (req: any, res: Response) => {
  try {
    // This route is intended for a daily cron job
    // It resets remoteLlmCount for all users who have used it
    const { databases } = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    // 1. Fetch users who have a count > 0 (optimizing by only fetching those who need reset)
    // Note: Appwrite queries require the attribute to be indexed
    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.userCollectionId,
      [] // Add queries if needed, e.g., Query.greaterThan("remoteLlmCount", 0)
    );

    console.log(`[Reset] Found ${response.documents.length} users to check for LLM reset.`);

    // 2. Update each user
    const updatePromises = response.documents.map(user => {
      const currentCount = typeof user.remoteLlmCount === "string" ? parseInt(user.remoteLlmCount) : (user.remoteLlmCount || 0);

      // Even with lazy reset, a proactive reset ensures DB consistency
      if (currentCount > 0 || user.lastRemoteLlmDate !== today) {
        return databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.userCollectionId,
          user.$id,
          {
            remoteLlmCount: "0",
            lastRemoteLlmDate: today
          }
        ).catch(err => console.error(`Failed to reset user ${user.$id}:`, err.message));
      }
      return Promise.resolve();
    });

    await Promise.all(updatePromises);

    res.status(200).json({ 
      success: true, 
      message: `Successfully refreshed LLM limits for ${response.documents.length} users.` 
    });
  } catch (error: any) {
    console.error("Reset LLM Limits Error:", error.message);
    res.status(500).json({ error: "Failed to reset LLM limits" });
  }
};
