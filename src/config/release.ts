import { version, gameRelease } from '../../package.json';
// # The game and generated website metadata share the package's release information.
export const releaseInfo = { version, ...gameRelease };
