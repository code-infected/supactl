import { load } from "@tauri-apps/plugin-store";

// Helper to lazily load the store
async function getStore() {
  return await load("credentials.bin");
}

export async function saveCredentials(projectUrl: string, serviceRoleKey: string) {
  const store = await getStore();
  await store.set("projectUrl", projectUrl);
  await store.set("serviceRoleKey", serviceRoleKey);
  await store.save();
}

export async function getCredentials() {
  const store = await getStore();
  const projectUrl = await store.get<string>("projectUrl");
  const serviceRoleKey = await store.get<string>("serviceRoleKey");
  
  if (projectUrl && serviceRoleKey) {
    return { projectUrl, serviceRoleKey };
  }
  return null;
}

export async function clearCredentials() {
  const store = await getStore();
  await store.delete("projectUrl");
  await store.delete("serviceRoleKey");
  await store.save();
}
