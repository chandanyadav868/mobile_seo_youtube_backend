import { createAdminClient, APPWRITE_CONFIG } from '../services/appwrite.service.js';

export const deductCoins = async (user: any, amount: number): Promise<boolean> => {
  // 1. Premium users have unlimited access
  if (user?.plan === 'PREMIUM') {
    return true;
  }

  // 2. Parse existing coins
  let currentCoins = typeof user.coins === "string" ? parseInt(user.coins) : user.coins;
  if (isNaN(currentCoins)) currentCoins = 0;

  // 3. Check for sufficient balance
  if (currentCoins < amount) {
    return false;
  }

  // 4. Deduct coins and update database
  try {
    const { databases } = createAdminClient();
    const finalCoins = currentCoins - amount;
    
    console.log(`[Deduction] User: ${user.$id} | From: ${currentCoins} | Deduct: ${amount} | Final: ${finalCoins}`);
    
    await databases.updateDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.userCollectionId,
      user.$id,
      {
        coins: finalCoins.toString()
      }
    );
    return true;
  } catch (error) {
    console.error("Failed to deduct coins in DB:", error);
    return false; // Fail safe
  }
};
