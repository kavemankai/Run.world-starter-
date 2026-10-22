import RundotGameAPI from "@series-inc/rundot-game-sdk/api";

/** Host pause includes overlays that do not trigger document.visibilitychange. */
export async function initializeRunPlatform(
  onPause: () => void,
): Promise<{ local: boolean }> {
  await RundotGameAPI.initializeAsync();
  RundotGameAPI.lifecycles.onPause(onPause);
  RundotGameAPI.lifecycles.onSleep(onPause);
  // Resuming is deliberately a player action, including after a host RESUME event.
  return { local: RundotGameAPI.system.getEnvironment().isDevelopment };
}
