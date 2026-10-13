// # Central switches: change these without changing the game engine.
export const gameConfig = {
  name: '一锅端', tagline: '萌物满锅 · 快乐开消',
  maxRevivesPerLevel: 1, adDurationSeconds: 10,
  dailyLimit: null as number | null,
  allowSpeechFallback: false,
  visibilityThreshold: Number.EPSILON,
  holdingPhrase: '蒋雨童最棒', maxHoldingCapacity: 4,
  unlockPhrase: '蒋雨童发大财', toolPhrase: '蒋雨童是天才',
  saveKey: 'one-pot-save-v1',
} as const;
