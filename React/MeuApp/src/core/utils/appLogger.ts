function log(scope: string, message: string) {
  if (__DEV__) {
    console.log(`[${scope}] ${message}`);
  }
}

export const AppLogger = {
  auth: (message: string) => log('AUTH', message),
  session: (message: string) => log('SESSION', message),
  splash: (message: string) => log('SPLASH', message),
  familia: (message: string) => log('FAMILIA', message),
  home: (message: string) => log('HOME', message),

  error(scope: string, message: string, error?: unknown) {
    if (!__DEV__) return;

    console.warn(`[${scope}][ERROR] ${message}`);

    if (error != null) {
      const type = error instanceof Error ? error.name : typeof error;
      console.warn(`[${scope}][ERROR] Tipo: ${type}`);

      if (error instanceof Error && error.stack) {
        console.warn(`[${scope}][STACK] ${error.stack}`);
      }
    }
  },
};
