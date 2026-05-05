import { Client, Account, Databases, Users } from "node-appwrite";
import { config } from "../config/index.js";

// Note: For Backend, we need API Key and Project ID
const APPWRITE_CONFIG = {
  endpoint: config.appwrite.endpoint,
  projectId: config.appwrite.projectId,
  apiKey: config.appwrite.apiKey,
  databaseId: config.appwrite.databaseId,
  userCollectionId: config.appwrite.collectionId,
};

export const createAdminClient = () => {
  const client = new Client()
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId)
    .setKey(APPWRITE_CONFIG.apiKey);

  return {
    get account() {
      return new Account(client);
    },
    get databases() {
      return new Databases(client);
    },
    get users() {
      return new Users(client);
    },
  };
};

export const createSessionClient = (session: string) => {
  const client = new Client()
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

  if (session) {
    client.setSession(session);
  }

  return {
    get account() {
      return new Account(client);
    },
  };
};

export const createJwtClient = (jwt: string) => {
  const client = new Client()
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

  if (jwt) {
    client.setJWT(jwt);
  }

  return {
    get account() {
      return new Account(client);
    },
  };
};

export { APPWRITE_CONFIG };
