import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  googleAiApiKey: process.env.GOOGLE_AI_API_KEY || '',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  appwrite: {
    endpoint: process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
    projectId: process.env.APPWRITE_PROJECT_ID || '',
    databaseId: process.env.APPWRITE_DATABASE_ID || '',
    collectionId: process.env.APPWRITE_COLLECTION_ID || '',
    apiKey: process.env.APPWRITE_API_KEY || '',
  },
};
