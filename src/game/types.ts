// # Serializable gameplay data; renderers and platform services stay separate.
export type ItemKind = 'shrimp' | 'dumpling' | 'broccoli' | 'chicken' | 'mushroom' | 'cabbage' | 'corn' | 'tofu' | 'crab' | 'fishball' | 'beef' | 'lotus' | 'carrot' | 'egg' | 'wonton' | 'lettuce' | 'siu-mai' | 'bun' | 'strawberry' | 'orange' | 'watermelon' | 'cake' | 'donut' | 'sushi' | 'sausage' | 'grapes' | 'peach' | 'ice-pop';
export type ToolKind = 'shuffle' | 'match' | 'return';
export type GameStatus = 'LOADING' | 'READY' | 'PLAYING' | 'PAUSED' | 'VOICE_CHALLENGE' | 'FAILED' | 'AD' | 'REVIVING' | 'LEVEL_COMPLETE' | 'GAME_COMPLETE';
export type Inventory = Record<ToolKind, number>;
// # Foods retain their depth and opacity; a click opens space for local, slow physical displacement.
export interface FoodItem { id: number; kind: ItemKind; x: number; y: number; z: number; depth: number; angle: number; size: number; phase: number; }
export interface Target { kind: ItemKind | null; count: number; locked: boolean; }
export interface LevelConfig {
  level: number; categoryCount: number; totalItems: number; targetTrayCount: number; lockedTrayCount: number;
  floatSpeed: number; rotationSpeed: number; overlapFactor: number; rareItemRatio: number;
  initialToolCount: Inventory; specialRules: string[]; depthLayers: number; refreshMs: number;
}
export interface GameSnapshot {
  status: GameStatus; level: number; board: FoodItem[]; targets: Target[]; holding: FoodItem[]; holdingCapacity: number;
  tools: Inventory; eliminated: number; total: number; revives: number; revision: number;
}
export type GameEffect = { type: 'pick' | 'match' | 'shuffle' | 'return' | 'unlock' | 'complete' | 'fail' | 'revive' | 'reward'; item?: FoodItem; tray?: number; slot?: number; holding?: number; items?: FoodItem[]; kind?: ItemKind; tool?: ToolKind };
