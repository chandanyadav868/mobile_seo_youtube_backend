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
