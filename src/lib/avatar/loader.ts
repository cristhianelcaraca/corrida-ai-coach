// loader.ts — lê um ficheiro (.glb / .fbx) incluído na app e devolve os bytes (ArrayBuffer).
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const LOOKUP = new Uint8Array(256).fill(255);
for (let i = 0; i < CHARS.length; i++) LOOKUP[CHARS.charCodeAt(i)] = i;

/** Converte texto base64 em bytes (feito à mão porque o React Native não tem tudo o que o browser tem). */
export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, "");
  const len = Math.floor((clean.length * 3) / 4);
  const bytes = new Uint8Array(len);
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const a = LOOKUP[clean.charCodeAt(i)];
    const b = LOOKUP[clean.charCodeAt(i + 1)];
    const c = i + 2 < clean.length ? LOOKUP[clean.charCodeAt(i + 2)] : 0;
    const d = i + 3 < clean.length ? LOOKUP[clean.charCodeAt(i + 3)] : 0;
    if (p < len) bytes[p++] = (a << 2) | (b >> 4);
    if (p < len) bytes[p++] = ((b & 15) << 4) | (c >> 2);
    if (p < len) bytes[p++] = ((c & 3) << 6) | d;
  }
  return bytes.buffer;
}

// guardamos o resultado para não ler o mesmo ficheiro várias vezes
const cache = new Map<number, Promise<ArrayBuffer>>();

export function loadBinary(moduleId: number): Promise<ArrayBuffer> {
  let p = cache.get(moduleId);
  if (!p) {
    p = (async () => {
      const asset = Asset.fromModule(moduleId);
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;
      if (!uri) throw new Error("Ficheiro não encontrado");
      if (Platform.OS === "web") return (await fetch(uri)).arrayBuffer();
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      return base64ToArrayBuffer(base64);
    })();
    p.catch(() => cache.delete(moduleId)); // se falhar, deixa tentar de novo
    cache.set(moduleId, p);
  }
  return p;
}
