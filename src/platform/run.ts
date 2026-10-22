import RundotGameAPI from '@series-inc/rundot-game-sdk/api';

/** SDK initialization is explicit. Do not silently pretend platform services work. */
export async function initializeRunPlatform(): Promise<void> {
  await RundotGameAPI.initializeAsync();
}
