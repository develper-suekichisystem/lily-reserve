import liff from '@line/liff';

const LIFF_ID = import.meta.env.VITE_LIFF_ID as string;

export async function initLiff(): Promise<void> {
  await liff.init({ liffId: LIFF_ID });
}

export async function getLineProfile() {
  if (!liff.isLoggedIn()) return null;
  return liff.getProfile();
}

export { liff };
