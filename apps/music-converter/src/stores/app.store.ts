import { proxy, useSnapshot } from "valtio";
import { parseMusicFileNCM } from "@/stores/core.ncm.ts";

type Target = {
  id: string;
  name: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

type Info = {
  id: string;
  name: string;
  artists: string[];
  album: { name: string; image: string };
  data: Uint8Array<ArrayBuffer>;
};

interface AppStore {
  targets: Record<string, Target>;
  info: Record<string, Info>;
}
export const appStore = proxy<AppStore>({
  targets: {},
  info: {},
});
export const useAppStore = () => useSnapshot(appStore);

export async function appendTarget(file: File) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const sha256 = [...new Uint8Array(hashBuffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

  appStore.targets[sha256] = {
    id: sha256,
    name: file.name,
    size: file.size,
    arrayBuffer: () => file.arrayBuffer(),
  };
  appStore.targets = { ...appStore.targets };
}

export async function deleteTarget(id: string) {
  delete appStore.targets[id];
  delete appStore.info[id];
  appStore.targets = { ...appStore.targets };
  appStore.info = { ...appStore.info };
}

export async function parseInfo(id: string) {
  const arrBuffer = await appStore.targets[id]!.arrayBuffer();
  appStore.info[id] = { id, ...parseMusicFileNCM(arrBuffer) };
  appStore.info = { ...appStore.info };
}
