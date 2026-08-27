export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    process.on('unhandledRejection', (reason, promise) => {
      console.error('⚠️ [GLOBAL] Caught Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (err) => {
      console.error('⚠️ [GLOBAL] Caught Uncaught Exception:', err);
    });
  }
}