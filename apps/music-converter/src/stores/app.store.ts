import { proxy, useSnapshot } from "valtio";
import { parseMusicFileNCM } from "@/stores/ncm";
import { sha256 } from "./sha256";

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
  const id = await sha256(await file.arrayBuffer());

  appStore.targets[id] = {
    id,
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
