import { load } from "@tauri-apps/plugin-store";

// Helper to lazily load the store
async function getStore() {
  return await load("credentials.bin");
}

export interface StoredCredentials {
  projectUrl: string;
  serviceRoleKey: string;
  anonKey?: string;
  managementToken?: string;
}

export async function saveCredentials(
  projectUrl: string, 
  serviceRoleKey: string,
  anonKey?: string,
  managementToken?: string
) {
  const store = await getStore();
  await store.set("projectUrl", projectUrl);
  await store.set("serviceRoleKey", serviceRoleKey);
  if (anonKey) {
    await store.set("anonKey", anonKey);
  }
  if (managementToken) {
    await store.set("managementToken", managementToken);
  }
  await store.save();
}

export async function getCredentials(): Promise<StoredCredentials | null> {
  const store = await getStore();
  const projectUrl = await store.get<string>("projectUrl");
  const serviceRoleKey = await store.get<string>("serviceRoleKey");
  const anonKey = await store.get<string>("anonKey");
  const managementToken = await store.get<string>("managementToken");
  
  if (projectUrl && serviceRoleKey) {
    return { projectUrl, serviceRoleKey, anonKey, managementToken };
  }
  return null;
}

export async function clearCredentials() {
  const store = await getStore();
  await store.delete("projectUrl");
  await store.delete("serviceRoleKey");
  await store.delete("anonKey");
  await store.delete("managementToken");
  await store.save();
}
