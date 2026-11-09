import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';

/** Volta para a tela anterior ou, se não houver, substitui pela rota de fallback. */
export function useGoBack(fallback: Href) {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback);
    }
  }, [router, fallback]);
}
