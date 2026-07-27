import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { getStore } from "@netlify/blobs";

const STORE_NAME = "documents";
const LOCAL_DIR = join(process.cwd(), ".local-blobs");

// Netlify Blobs braucht einen Netlify-Ausführungskontext (Site-ID/Token werden
// dort automatisch injiziert). Lokal ohne `netlify dev` ist dieser Kontext
// nicht vorhanden, dann wird stattdessen ins lokale Dateisystem geschrieben.
function hasNetlifyContext() {
  return Boolean(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT);
}

function localPath(key: string) {
  return join(LOCAL_DIR, key.replace(/\//g, "_"));
}

export async function putBlob(key: string, data: Buffer) {
  if (!hasNetlifyContext()) {
    await mkdir(LOCAL_DIR, { recursive: true });
    await writeFile(localPath(key), data);
    return;
  }
  const store = getStore(STORE_NAME);
  const arrayBuffer = data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength
  ) as ArrayBuffer;
  await store.set(key, arrayBuffer);
}

export async function getBlob(key: string): Promise<Buffer | null> {
  if (!hasNetlifyContext()) {
    const path = localPath(key);
    if (!existsSync(path)) return null;
    return readFile(path);
  }
  const store = getStore(STORE_NAME);
  const arrayBuffer = await store.get(key, { type: "arrayBuffer" });
  if (!arrayBuffer) return null;
  return Buffer.from(arrayBuffer);
}

export async function deleteBlob(key: string) {
  if (!hasNetlifyContext()) {
    const path = localPath(key);
    if (existsSync(path)) await unlink(path);
    return;
  }
  const store = getStore(STORE_NAME);
  await store.delete(key);
}
