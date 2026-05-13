import { Request, Response, NextFunction } from "express";
import { createSessionClient, createAdminClient, createJwtClient, APPWRITE_CONFIG } from "../services/appwrite.service.js";
import { Query } from "node-appwrite";

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 1. Get session or JWT from various sources
    const session = req.cookies[`a_session_${APPWRITE_CONFIG.projectId}`] || req.headers["x-appwrite-session"];
    const jwt = req.headers["x-appwrite-jwt"];

    // console.log({
    //   session: session ? "present" : "missing",
    //   jwt: jwt ? "present" : "missing"
    // });

    if (!session && !jwt) {
      return res.status(401).json({ error: "Unauthorized: No authentication found" });
    }

    let appwriteUser;

    if (jwt) {
      // console.log("Auth Middleware: Validating with JWT");
      const { account } = createJwtClient(jwt as string);
      appwriteUser = await account.get();
    } else {
      // console.log("Auth Middleware: Validating with Session");
      const { account } = createSessionClient(session as string);
      appwriteUser = await account.get();
    }

    if (!appwriteUser) {
      console.error("Auth Middleware: No Appwrite user found");
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: "Invalid auth credentials" }
      });
    }

    // 2. Fetch full user profile from database using Admin Client
    const { databases } = createAdminClient();
    // console.log("Auth Middleware: Fetching profile for", appwriteUser.$id);
    const profile = await databases.getDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.userCollectionId,
      appwriteUser.$id
    );

    if (!profile) {
      // console.error("Auth Middleware: User profile document not found in DB");
      return res.status(404).json({
        error: { code: 'PROFILE_NOT_FOUND', message: "User profile not found" }
      });
    }

    // console.log("Auth Middleware: Success, profile attached");
    // 3. Attach user data to request object
    req.user = profile;

    next();
  } catch (error: any) {
    console.error("Auth Middleware Error:", error.message);
    res.status(401).json({
      error: { code: 'AUTH_FAILED', message: "Session validation failed: " + error.message }
    });
  }
};
