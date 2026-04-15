import { load } from "@tauri-apps/plugin-store";

// Helper to lazily load the store
async function getStore() {
  return await load("credentials.bin");
}

// LEGACY: Single project support (for migration)
export interface StoredCredentials {
  projectUrl: string;
  serviceRoleKey: string;
  anonKey?: string;
  managementToken?: string;
}

// NEW: Multi-project support
export interface StoredProject {
  id: string;
  name: string;
  projectUrl: string;
  projectRef: string;
  serviceKey: string;
  anonKey?: string;
  managementToken?: string;
  createdAt: number;
  lastConnectedAt: number;
  isActive: boolean;
  color?: string;
}

// LEGACY: Save single project (deprecated, use saveProject)
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

// LEGACY: Get single project (deprecated, use getProjects)
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

// LEGACY: Clear single project (deprecated, use removeProject)
export async function clearCredentials() {
  const store = await getStore();
  await store.delete("projectUrl");
  await store.delete("serviceRoleKey");
  await store.delete("anonKey");
  await store.delete("managementToken");
  await store.save();
}

// NEW: Multi-project storage API

const PROJECTS_KEY = "projects_v2";

export async function saveProjects(projects: StoredProject[]): Promise<void> {
  const store = await getStore();
  await store.set(PROJECTS_KEY, projects);
  await store.save();
}

export async function getProjects(): Promise<StoredProject[]> {
  const store = await getStore();
  const projects = await store.get<StoredProject[]>(PROJECTS_KEY);
  
  // Migration: If no projects but legacy credentials exist, migrate them
  if (!projects || projects.length === 0) {
    const legacy = await getCredentials();
    if (legacy) {
      const migrated: StoredProject = {
        id: `proj_${Date.now()}`,
        name: "My Project",
        projectUrl: legacy.projectUrl,
        projectRef: extractProjectRef(legacy.projectUrl) || "unknown",
        serviceKey: legacy.serviceRoleKey,
        anonKey: legacy.anonKey,
        managementToken: legacy.managementToken,
        createdAt: Date.now(),
        lastConnectedAt: Date.now(),
        isActive: true,
      };
      await saveProjects([migrated]);
      await clearCredentials(); // Clean up legacy
      return [migrated];
    }
  }
  
  return projects || [];
}

export async function addProject(project: StoredProject): Promise<void> {
  const projects = await getProjects();
  await saveProjects([...projects, project]);
}

export async function updateProject(id: string, updates: Partial<StoredProject>): Promise<void> {
  const projects = await getProjects();
  const updated = projects.map((p) =>
    p.id === id ? { ...p, ...updates } : p
  );
  await saveProjects(updated);
}

export async function removeProject(id: string): Promise<void> {
  const projects = await getProjects();
  const filtered = projects.filter((p) => p.id !== id);
  await saveProjects(filtered);
}

// Helper
function extractProjectRef(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split('.');
    if (parts.length >= 2 && parts[1] === 'supabase') {
      return parts[0];
    }
    return null;
  } catch {
    return null;
  }
}
