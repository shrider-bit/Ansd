// Layout of the Phase 1 haunted house. Pure data, shared by the client
// (meshes + physics), the server (validation + line of sight) and the AI.
// Coordinates are metres: x = east, z = south, y = up.

export const WALL_HEIGHT = 3;
export const WALL_THICKNESS = 0.2;
export const DOOR_WIDTH = 1.1;
export const ARCH_WIDTH = 1.6;
export const DOOR_HEIGHT = 2.15;

export interface Wall { x1: number; z1: number; x2: number; z2: number }

export type DoorKind = 'door' | 'arch' | 'front';
export interface DoorDef {
  id: string;
  x: number;
  z: number;
  /** Direction the wall runs in. */
  along: 'x' | 'z';
  kind: DoorKind;
}

export type FurnitureType =
  | 'bed' | 'wardrobe' | 'table' | 'chair' | 'sofa' | 'fireplace' | 'shelf'
  | 'counter' | 'fridge' | 'stove' | 'nightstand' | 'clock' | 'crate' | 'cabinet' | 'smalltable';

export interface Furniture {
  type: FurnitureType;
  x: number;
  z: number;
  /** Size along x. */
  w: number;
  /** Size along z. */
  d: number;
  h: number;
  /** Which way the front faces (unit vector). */
  fx?: number;
  fz?: number;
  hideId?: string;
}

export interface HideSpot {
  id: string;
  kind: 'wardrobe' | 'bed';
  x: number;
  z: number;
  /** Direction the opening faces (unit vector). */
  fx: number;
  fz: number;
  label: string;
}

export interface KeySpot { id: string; x: number; y: number; z: number; room: string }

export interface Room { name: string; x1: number; z1: number; x2: number; z2: number }

export interface Lamp { x: number; y: number; z: number; color: number; intensity: number; flicker: boolean }

export interface NavNode { id: string; x: number; z: number; patrol?: boolean }

export interface Level {
  walls: Wall[];
  doors: DoorDef[];
  furniture: Furniture[];
  hideSpots: HideSpot[];
  keySpots: KeySpot[];
  rooms: Room[];
  lamps: Lamp[];
  nav: { nodes: NavNode[]; edges: [string, string][] };
  spawns: { survivor: { x: number; z: number; yaw: number }; granny: { x: number; z: number; yaw: number } };
  /** Survivor escapes once past this z through the front door. */
  escapeZ: number;
  bounds: { x1: number; z1: number; x2: number; z2: number };
}

export const LEVEL: Level = {
  walls: [
    // Outer shell
    { x1: -10, z1: -8, x2: 10, z2: -8 },
    { x1: -10, z1: 8, x2: 10, z2: 8 },
    { x1: -10, z1: -8, x2: -10, z2: 8 },
    { x1: 10, z1: -8, x2: 10, z2: 8 },
    // Corridor walls
    { x1: -10, z1: 0, x2: 10, z2: 0 },
    { x1: -10, z1: -2, x2: 10, z2: -2 },
    // Front room dividers
    { x1: -2, z1: 0, x2: -2, z2: 8 },
    { x1: 3, z1: 0, x2: 3, z2: 8 },
    // Back room dividers
    { x1: -3, z1: -8, x2: -3, z2: -2 },
    { x1: 3, z1: -8, x2: 3, z2: -2 },
  ],
  doors: [
    { id: 'living', x: -6.5, z: 0, along: 'x', kind: 'door' },
    { id: 'hall_arch', x: 0.5, z: 0, along: 'x', kind: 'arch' },
    { id: 'dining', x: 6.5, z: 0, along: 'x', kind: 'door' },
    { id: 'bedroom', x: -6.5, z: -2, along: 'x', kind: 'door' },
    { id: 'storage', x: 0.5, z: -2, along: 'x', kind: 'door' },
    { id: 'kitchen', x: 6.5, z: -2, along: 'x', kind: 'door' },
    { id: 'living_arch', x: -2, z: 4, along: 'z', kind: 'arch' },
    { id: 'entrance_dining', x: 3, z: 4, along: 'z', kind: 'door' },
    { id: 'front', x: 0.5, z: 8, along: 'x', kind: 'front' },
  ],
  furniture: [
    // Living room (x -10..-2, z 0..8)
    { type: 'sofa', x: -6, z: 7.45, w: 3, d: 0.9, h: 0.9, fx: 0, fz: -1 },
    { type: 'table', x: -6, z: 6.1, w: 1.4, d: 0.7, h: 0.45 },
    { type: 'fireplace', x: -9.6, z: 4.5, w: 0.6, d: 2, h: 1.4, fx: 1, fz: 0 },
    { type: 'wardrobe', x: -9.6, z: 1.6, w: 0.6, d: 1.2, h: 2.2, fx: 1, fz: 0, hideId: 'wardrobe_living' },
    { type: 'shelf', x: -2.35, z: 6.8, w: 0.4, d: 1.6, h: 2 },
    // Entrance hall (x -2..3, z 0..8)
    { type: 'clock', x: -1.6, z: 1.0, w: 0.5, d: 0.4, h: 2.2 },
    { type: 'smalltable', x: 2.45, z: 7.2, w: 0.7, d: 0.9, h: 0.8 },
    // Dining room (x 3..10, z 0..8)
    { type: 'table', x: 7.5, z: 5.5, w: 2.4, d: 1.2, h: 0.8 },
    { type: 'chair', x: 7, z: 4.5, w: 0.5, d: 0.5, h: 0.95 },
    { type: 'chair', x: 8, z: 4.5, w: 0.5, d: 0.5, h: 0.95 },
    { type: 'chair', x: 7, z: 6.5, w: 0.5, d: 0.5, h: 0.95 },
    { type: 'chair', x: 8, z: 6.5, w: 0.5, d: 0.5, h: 0.95 },
    { type: 'cabinet', x: 9.65, z: 2, w: 0.5, d: 1.6, h: 1.2 },
    // Bedroom (x -10..-3, z -8..-2)
    { type: 'bed', x: -8.6, z: -6.4, w: 1.6, d: 2.2, h: 0.55, fx: 1, fz: 0, hideId: 'bed' },
    { type: 'nightstand', x: -9.6, z: -4.7, w: 0.5, d: 0.5, h: 0.6 },
    { type: 'wardrobe', x: -3.4, z: -6.6, w: 0.6, d: 1.2, h: 2.2, fx: -1, fz: 0, hideId: 'wardrobe_bedroom' },
    // Storage (x -3..3, z -8..-2)
    { type: 'shelf', x: -1.2, z: -7.7, w: 2.2, d: 0.5, h: 2.1 },
    { type: 'shelf', x: 1.8, z: -7.7, w: 2, d: 0.5, h: 2.1 },
    { type: 'crate', x: -2.4, z: -3.0, w: 0.8, d: 0.8, h: 0.8 },
    { type: 'crate', x: 2.4, z: -4.2, w: 0.9, d: 0.9, h: 0.9 },
    // Kitchen (x 3..10, z -8..-2)
    { type: 'counter', x: 6.5, z: -7.6, w: 5, d: 0.7, h: 0.92 },
    { type: 'stove', x: 9.55, z: -6.2, w: 0.7, d: 0.8, h: 0.92 },
    { type: 'fridge', x: 9.55, z: -3.1, w: 0.7, d: 0.8, h: 1.9 },
    { type: 'wardrobe', x: 3.4, z: -4.8, w: 0.6, d: 1.2, h: 2.2, fx: 1, fz: 0, hideId: 'pantry' },
  ],
  hideSpots: [
    { id: 'wardrobe_living', kind: 'wardrobe', x: -9.6, z: 1.6, fx: 1, fz: 0, label: 'Wardrobe' },
    { id: 'wardrobe_bedroom', kind: 'wardrobe', x: -3.4, z: -6.6, fx: -1, fz: 0, label: 'Wardrobe' },
    { id: 'pantry', kind: 'wardrobe', x: 3.4, z: -4.8, fx: 1, fz: 0, label: 'Pantry' },
    { id: 'bed', kind: 'bed', x: -8.6, z: -6.4, fx: 1, fz: 0, label: 'Under the bed' },
  ],
  keySpots: [
    { id: 'coffee_table', x: -6, y: 0.5, z: 6.1, room: 'Living Room' },
    { id: 'nightstand', x: -9.6, y: 0.65, z: -4.7, room: 'Bedroom' },
    { id: 'counter', x: 5.2, y: 0.97, z: -7.6, room: 'Kitchen' },
    { id: 'shelf', x: -1.2, y: 1.05, z: -7.6, room: 'Storage Room' },
    { id: 'dining_table', x: 8.2, y: 0.85, z: 5.4, room: 'Dining Room' },
    { id: 'crate', x: 2.4, y: 0.95, z: -4.2, room: 'Storage Room' },
  ],
  rooms: [
    { name: 'Living Room', x1: -10, z1: 0, x2: -2, z2: 8 },
    { name: 'Entrance Hall', x1: -2, z1: 0, x2: 3, z2: 8 },
    { name: 'Dining Room', x1: 3, z1: 0, x2: 10, z2: 8 },
    { name: 'Dark Hallway', x1: -10, z1: -2, x2: 10, z2: 0 },
    { name: 'Bedroom', x1: -10, z1: -8, x2: -3, z2: -2 },
    { name: 'Storage Room', x1: -3, z1: -8, x2: 3, z2: -2 },
    { name: 'Kitchen', x1: 3, z1: -8, x2: 10, z2: -2 },
    { name: 'Outside', x1: -30, z1: 8, x2: 30, z2: 30 },
  ],
  lamps: [
    { x: -6, y: 2.6, z: 4, color: 0xffb060, intensity: 5, flicker: false },
    { x: 0.5, y: 2.6, z: 5, color: 0xffa050, intensity: 4, flicker: true },
    { x: 6.5, y: 2.6, z: 3, color: 0xffc070, intensity: 4, flicker: false },
    { x: -4, y: 2.6, z: -1, color: 0xff9040, intensity: 2.5, flicker: true },
    { x: 5, y: 2.6, z: -1, color: 0xff9040, intensity: 2.5, flicker: false },
    { x: -6.5, y: 2.6, z: -4.5, color: 0xffa060, intensity: 3, flicker: false },
    { x: 0, y: 2.6, z: -5, color: 0x9fb4ff, intensity: 2, flicker: true },
    { x: 6.5, y: 2.6, z: -5, color: 0xffd080, intensity: 4, flicker: false },
  ],
  nav: {
    nodes: [
      { id: 'living', x: -6, z: 4.2, patrol: true },
      { id: 'living_door_n', x: -6.5, z: 1.0 },
      { id: 'living_arch_w', x: -3.2, z: 4 },
      { id: 'living_arch_e', x: -0.8, z: 4 },
      { id: 'entrance', x: 0.5, z: 4.5, patrol: true },
      { id: 'entrance_front', x: 0.5, z: 7.0 },
      { id: 'entrance_arch_s', x: 0.5, z: 1.0 },
      { id: 'dining_door_w', x: 1.9, z: 4 },
      { id: 'dining_door_e', x: 4.1, z: 4 },
      { id: 'dining', x: 5.0, z: 2.5, patrol: true },
      { id: 'dining_door_n', x: 6.5, z: 1.0 },
      { id: 'hall_w', x: -6.5, z: -1, patrol: true },
      { id: 'hall_c', x: 0.5, z: -1 },
      { id: 'hall_e', x: 6.5, z: -1, patrol: true },
      { id: 'bedroom_door_s', x: -6.5, z: -3.0 },
      { id: 'bedroom', x: -6.0, z: -5.2, patrol: true },
      { id: 'storage_door_s', x: 0.5, z: -3.0 },
      { id: 'storage', x: 0, z: -5.4, patrol: true },
      { id: 'kitchen_door_s', x: 6.5, z: -3.0 },
      { id: 'kitchen', x: 6.5, z: -5.2, patrol: true },
    ],
    edges: [
      ['living', 'living_door_n'],
      ['living_door_n', 'hall_w'],
      ['living', 'living_arch_w'],
      ['living_arch_w', 'living_arch_e'],
      ['living_arch_e', 'entrance'],
      ['entrance', 'entrance_front'],
      ['entrance', 'entrance_arch_s'],
      ['entrance_arch_s', 'hall_c'],
      ['entrance', 'dining_door_w'],
      ['dining_door_w', 'dining_door_e'],
      ['dining_door_e', 'dining'],
      ['dining', 'dining_door_n'],
      ['dining_door_n', 'hall_e'],
      ['hall_w', 'hall_c'],
      ['hall_c', 'hall_e'],
      ['hall_w', 'bedroom_door_s'],
      ['bedroom_door_s', 'bedroom'],
      ['hall_c', 'storage_door_s'],
      ['storage_door_s', 'storage'],
      ['hall_e', 'kitchen_door_s'],
      ['kitchen_door_s', 'kitchen'],
    ],
  },
  spawns: {
    survivor: { x: -5.6, z: -4.4, yaw: Math.PI },
    granny: { x: 6.5, z: -5.0, yaw: Math.PI },
  },
  escapeZ: 9.2,
  bounds: { x1: -10, z1: -8, x2: 10, z2: 12 },
};

export function doorWidth(d: DoorDef): number {
  return d.kind === 'arch' ? ARCH_WIDTH : DOOR_WIDTH;
}

export function roomAt(level: Level, x: number, z: number): string {
  for (const r of level.rooms) {
    if (x >= r.x1 && x <= r.x2 && z >= r.z1 && z <= r.z2) return r.name;
  }
  return 'Outside';
}

/** Where a player stands when they leave (or Granny inspects) a hiding spot. */
export function hideFront(h: HideSpot): { x: number; z: number } {
  const dist = h.kind === 'bed' ? 1.25 : 0.95;
  return { x: h.x + h.fx * dist, z: h.z + h.fz * dist };
}
