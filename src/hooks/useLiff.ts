import { useState, useEffect } from 'react';
import { initLiff, getLineProfile, liff } from '../lib/liff';

interface LiffState {
  isReady: boolean;
  isLoggedIn: boolean;
  userId: string | null;
  displayName: string | null;
  pictureUrl: string | null;
  error: string | null;
}

const IS_DEV_MOCK =
  import.meta.env.DEV && import.meta.env.VITE_LIFF_ID === 'mock';

export function useLiff() {
  const [state, setState] = useState<LiffState>({
    isReady: false,
    isLoggedIn: false,
    userId: null,
    displayName: null,
    pictureUrl: null,
    error: null,
  });

  useEffect(() => {
    if (IS_DEV_MOCK) {
      setState({
        isReady: true,
        isLoggedIn: true,
        userId: 'dev-mock-user-001',
        displayName: 'テストユーザー',
        pictureUrl: null,
        error: null,
      });
      return;
    }

    async function init() {
      try {
        await initLiff();

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const profile = await getLineProfile();
        setState({
          isReady: true,
          isLoggedIn: true,
          userId: profile?.userId ?? null,
          displayName: profile?.displayName ?? null,
          pictureUrl: profile?.pictureUrl ?? null,
          error: null,
        });
      } catch (err) {
        setState(prev => ({
          ...prev,
          isReady: true,
          error: err instanceof Error ? err.message : 'LIFF初期化に失敗しました',
        }));
      }
    }

    init();
  }, []);

  return state;
}
