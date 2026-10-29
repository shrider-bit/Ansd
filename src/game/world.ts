// Builds the haunted house: meshes (Three.js) + colliders (Rapier).

import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import {
  DOOR_HEIGHT, WALL_HEIGHT, WALL_THICKNESS, doorWidth,
  type DoorDef, type Furniture, type Level,
} from '../shared/level';
import { solidWallSegments } from '../shared/geometry';
import type { DoorState } from '../shared/protocol';
import { glow, grass, plaster, wallpaper, woodFloor, woodPanel } from './textures';
import type { Quality } from '../settings';

const OPEN_ANGLE = 1.75;

/** Scales a BoxGeometry's UVs so textures tile at `scale` metres. */
function boxUV(geo: THREE.BoxGeometry, w: number, h: number, d: number, scale = 2): THREE.BoxGeometry {
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const dims: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let face = 0; face < 6; face++) {
    const [su, sv] = dims[face];
    for (let i = 0; i < 4; i++) {
      const idx = face * 4 + i;
      uv.setXY(idx, uv.getX(idx) * su / scale, uv.getY(idx) * sv / scale);
    }
  }
  uv.needsUpdate = true;
  return geo;
}

export class DoorObj {
  readonly def: DoorDef;
  readonly pivot: THREE.Group;
  readonly body: RAPIER.RigidBody;
  readonly baseYaw: number;
  angle = 0;
  target = 0;
  state: DoorState;
  readonly center: THREE.Vector3;

  constructor(def: DoorDef, pivot: THREE.Group, body: RAPIER.RigidBody, baseYaw: number) {
    this.def = def;
    this.pivot = pivot;
    this.body = body;
    this.baseYaw = baseYaw;
    this.state = { open: false, dir: 1, locked: def.kind === 'front' };
    this.center = new THREE.Vector3(def.x, 1, def.z);
  }

  apply(state: DoorState): void {
    this.state = { ...state };
    this.target = state.open ? state.dir * OPEN_ANGLE : 0;
  }

  /** Snap without animation (used when a round starts). */
  snap(state: DoorState): void {
    this.apply(state);
    this.angle = this.target;
    this.sync();
  }

  update(dt: number): boolean {
    if (Math.abs(this.angle - this.target) < 1e-3) return false;
    const speed = 4.5;
    const delta = this.target - this.angle;
    this.angle += Math.sign(delta) * Math.min(Math.abs(delta), speed * dt);
    this.sync();
    return true;
  }

  private sync(): void {
    const yaw = this.baseYaw + this.angle;
    this.pivot.rotation.y = yaw;
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    this.body.setNextKinematicRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
  }
}

export interface FlickerLamp { light: THREE.PointLight; base: number; flicker: boolean; bulb: THREE.Mesh; phase: number }

export interface WorldObjects {
  doors: Map<string, DoorObj>;
  keyMesh: THREE.Group;
  lamps: FlickerLamp[];
  windows: THREE.MeshBasicMaterial[];
  hideMeshes: Map<string, THREE.Object3D>;
  wardrobeDoors: Map<string, THREE.Object3D[]>;
  moon: THREE.DirectionalLight;
  ambient: THREE.HemisphereLight;
}

export function buildWorld(scene: THREE.Scene, world: RAPIER.World, level: Level, quality: Quality): WorldObjects {
  const fixed = (x: number, y: number, z: number, hx: number, hy: number, hz: number) => {
    world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz).setTranslation(x, y, z));
  };

  // ---------- Materials ----------
  const mat = {
    floor: new THREE.MeshLambertMaterial({ map: woodFloor(1) }),
    ceiling: new THREE.MeshLambertMaterial({ map: plaster(2) }),
    wallA: new THREE.MeshLambertMaterial({ map: wallpaper('#3a2a2c', '#2f2224', 3) }),
    wallB: new THREE.MeshLambertMaterial({ map: wallpaper('#28352c', '#223027', 4) }),
    outer: new THREE.MeshLambertMaterial({ map: woodPanel(5, [48, 44, 42]) }),
    wood: new THREE.MeshLambertMaterial({ map: woodPanel(6) }),
    darkWood: new THREE.MeshLambertMaterial({ map: woodPanel(7, [40, 24, 14]) }),
    door: new THREE.MeshLambertMaterial({ map: woodPanel(8, [64, 36, 20]) }),
    frontDoor: new THREE.MeshLambertMaterial({ map: woodPanel(9, [52, 20, 18]) }),
    fabric: new THREE.MeshLambertMaterial({ color: 0x4a1f2a }),
    sheet: new THREE.MeshLambertMaterial({ color: 0x8d8778 }),
    metal: new THREE.MeshLambertMaterial({ color: 0x777b80 }),
    white: new THREE.MeshLambertMaterial({ color: 0xb8b2a2 }),
    stone: new THREE.MeshLambertMaterial({ color: 0x46423d }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc8a040, metalness: 0.8, roughness: 0.3 }),
    grass: new THREE.MeshLambertMaterial({ map: grass(10) }),
    fence: new THREE.MeshLambertMaterial({ color: 0x1a1a1a }),
    trunk: new THREE.MeshLambertMaterial({ color: 0x1e140c }),
  };

  const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene) => {
    const mesh = new THREE.Mesh(boxUV(new THREE.BoxGeometry(w, h, d), w, h, d), m);
    mesh.position.set(x, y, z);
    mesh.castShadow = quality === 'high';
    mesh.receiveShadow = quality !== 'low';
    parent.add(mesh);
    return mesh;
  };

  // ---------- Floors & ceiling ----------
  const b = { x1: -10, z1: -8, x2: 10, z2: 8 };
  const fw = b.x2 - b.x1, fd = b.z2 - b.z1;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(fw, fd), mat.floor);
  (mat.floor.map as THREE.Texture).repeat.set(fw / 3, fd / 3);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set((b.x1 + b.x2) / 2, 0, (b.z1 + b.z2) / 2);
  floor.receiveShadow = quality !== 'low';
  scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(fw, fd), mat.ceiling);
  (mat.ceiling.map as THREE.Texture).repeat.set(fw / 2, fd / 2);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(floor.position.x, WALL_HEIGHT, floor.position.z);
  scene.add(ceil);
  // One big ground collider covering house + garden.
  fixed(0, -0.5, 2, 40, 0.5, 40);

  // Garden
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), mat.grass);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.01, 0);
  scene.add(ground);
  // Porch & path
  box(4, 0.08, 3, mat.stone, 0.5, 0.04, 9.6);
  // Fence around the garden (visual + invisible boundary colliders)
  for (let x = -14; x <= 14; x += 0.5) {
    box(0.08, 1.6, 0.08, mat.fence, x, 0.8, 14);
    box(0.08, 1.6, 0.08, mat.fence, x, 0.8, -12);
  }
  for (let z = -12; z <= 14; z += 0.5) {
    box(0.08, 1.6, 0.08, mat.fence, -14, 0.8, z);
    box(0.08, 1.6, 0.08, mat.fence, 14, 0.8, z);
  }
  // Main gate (locked in Phase 1 - the front door is the way out for now)
  box(2.4, 2.2, 0.12, mat.fence, 0.5, 1.1, 14);
  // Dead trees
  const treeSpots = [[-10, 11], [8, 11.5], [-12, -4], [12, -6], [11, 4], [-12, 5], [-6, -10.5], [5, -10.5]];
  for (const [tx, tz] of treeSpots) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.3, 4.5, 6), mat.trunk);
    trunk.position.set(tx, 2.25, tz);
    scene.add(trunk);
    for (let i = 0; i < 3; i++) {
      const br = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.09, 1.8, 4), mat.trunk);
      br.position.set(tx + (i - 1) * 0.5, 3.2 + i * 0.3, tz);
      br.rotation.z = (i - 1) * 0.8 + 0.2;
      scene.add(br);
    }
    fixed(tx, 2, tz, 0.3, 2, 0.3);
  }
  fixed(0, 1, 14.3, 15, 1.5, 0.3);
  fixed(0, 1, -12.3, 15, 1.5, 0.3);
  fixed(-14.3, 1, 1, 0.3, 1.5, 14);
  fixed(14.3, 1, 1, 0.3, 1.5, 14);

  // ---------- Walls ----------
  const t = WALL_THICKNESS;
  for (const s of solidWallSegments(level)) {
    const alongX = s.z1 === s.z2;
    const len = alongX ? Math.abs(s.x2 - s.x1) : Math.abs(s.z2 - s.z1);
    const cx = (s.x1 + s.x2) / 2, cz = (s.z1 + s.z2) / 2;
    const outerWall = Math.abs(cx) >= 9.9 || Math.abs(cz) >= 7.9;
    const m = outerWall ? mat.outer : (cz > -1 ? mat.wallA : mat.wallB);
    const w = alongX ? len + t : t, d = alongX ? t : len + t;
    box(w, WALL_HEIGHT, d, m, cx, WALL_HEIGHT / 2, cz);
    fixed(cx, WALL_HEIGHT / 2, cz, w / 2, WALL_HEIGHT / 2, d / 2);
  }
  // Lintels above openings
  for (const d of level.doors) {
    const dw = doorWidth(d);
    const h = WALL_HEIGHT - DOOR_HEIGHT;
    const w = d.along === 'x' ? dw : t, dd = d.along === 'x' ? t : dw;
    box(w, h, dd, mat.wallA, d.x, DOOR_HEIGHT + h / 2, d.z);
    // Door frame trims
    const trim = 0.08;
    if (d.along === 'x') {
      box(trim, DOOR_HEIGHT, t + 0.06, mat.darkWood, d.x - dw / 2, DOOR_HEIGHT / 2, d.z);
      box(trim, DOOR_HEIGHT, t + 0.06, mat.darkWood, d.x + dw / 2, DOOR_HEIGHT / 2, d.z);
    } else {
      box(t + 0.06, DOOR_HEIGHT, trim, mat.darkWood, d.x, DOOR_HEIGHT / 2, d.z - dw / 2);
      box(t + 0.06, DOOR_HEIGHT, trim, mat.darkWood, d.x, DOOR_HEIGHT / 2, d.z + dw / 2);
    }
  }

  // ---------- Windows (moonlit) ----------
  const windows: THREE.MeshBasicMaterial[] = [];
  // [x, z, yaw]: yaw turns the pane so it faces into the house.
  const windowSpots: [number, number, number][] = [
    [-6, 7.88, Math.PI], [6.5, 7.88, Math.PI], [-6, -7.88, 0], [6.5, -7.88, 0],
    [-9.88, -5, Math.PI / 2], [9.88, 5, -Math.PI / 2], [9.88, -5, -Math.PI / 2],
  ];
  for (const [wx, wz, ry] of windowSpots) {
    const m = new THREE.MeshBasicMaterial({ color: 0x223355 });
    windows.push(m);
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.4), m));
    const bars = [[1.3, 0.06, 0, 0], [1.3, 0.06, 0, 0.7], [1.3, 0.06, 0, -0.7], [0.06, 1.5, 0, 0], [0.06, 1.5, 0.62, 0], [0.06, 1.5, -0.62, 0]];
    for (const [bw, bh, bx, by] of bars) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, 0.04), mat.darkWood);
      bar.position.set(bx, by, 0.01);
      g.add(bar);
    }
    g.position.set(wx, 1.6, wz);
    g.rotation.y = ry;
    scene.add(g);
  }

  // ---------- Doors ----------
  const doors = new Map<string, DoorObj>();
  for (const d of level.doors) {
    if (d.kind === 'arch') continue;
    const dw = doorWidth(d) - 0.04;
    const baseYaw = d.along === 'x' ? 0 : -Math.PI / 2;
    const hinge = d.along === 'x' ? new THREE.Vector3(d.x - dw / 2, 0, d.z) : new THREE.Vector3(d.x, 0, d.z - dw / 2);
    const pivot = new THREE.Group();
    pivot.position.copy(hinge);
    pivot.rotation.y = baseYaw;
    scene.add(pivot);
    const panelMat = d.kind === 'front' ? mat.frontDoor : mat.door;
    box(dw, DOOR_HEIGHT - 0.03, 0.07, panelMat, dw / 2, (DOOR_HEIGHT - 0.03) / 2, 0, pivot);
    // Raised panels
    box(dw * 0.7, 0.7, 0.09, mat.darkWood, dw / 2, 1.55, 0, pivot);
    box(dw * 0.7, 0.8, 0.09, mat.darkWood, dw / 2, 0.6, 0, pivot);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), mat.brass);
    knob.position.set(dw - 0.12, 1.0, 0.07);
    pivot.add(knob);
    const knob2 = knob.clone();
    knob2.position.z = -0.07;
    pivot.add(knob2);
    if (d.kind === 'front') {
      const lock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.12), mat.brass);
      lock.position.set(dw - 0.12, 1.2, 0);
      pivot.add(lock);
    }
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), baseYaw);
    const body = world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(hinge.x, 0, hinge.z).setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }),
    );
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(dw / 2, DOOR_HEIGHT / 2, 0.05).setTranslation(dw / 2, DOOR_HEIGHT / 2, 0),
      body,
    );
    doors.set(d.id, new DoorObj(d, pivot, body, baseYaw));
  }

  // ---------- Furniture ----------
  const hideMeshes = new Map<string, THREE.Object3D>();
  const wardrobeDoors = new Map<string, THREE.Object3D[]>();
  for (const f of level.furniture) {
    const g = buildFurniture(f, mat, box);
    scene.add(g);
    if (f.hideId) hideMeshes.set(f.hideId, g);
    if (f.type === 'wardrobe' && f.hideId) wardrobeDoors.set(f.hideId, g.userData.doors as THREE.Object3D[]);
    if (f.type === 'bed') {
      // Under-bed gap: collide with the mattress only so you can see underneath.
      fixed(f.x, 0.4, f.z, f.w / 2, 0.15, f.d / 2);
      // Legs keep you from walking under it.
      fixed(f.x, 0.2, f.z, f.w / 2 - 0.05, 0.2, f.d / 2 - 0.05);
    } else if (f.type === 'chair') {
      fixed(f.x, 0.45, f.z, f.w / 2 * 0.8, 0.45, f.d / 2 * 0.8);
    } else {
      fixed(f.x, f.h / 2, f.z, f.w / 2, f.h / 2, f.d / 2);
    }
  }

  // ---------- Key ----------
  const keyMesh = new THREE.Group();
  const keyMat = new THREE.MeshStandardMaterial({ color: 0xffc94a, emissive: 0x6a4a00, metalness: 0.9, roughness: 0.25 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 16), keyMat);
  ring.position.x = -0.1;
  keyMesh.add(ring);
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.025, 0.025), keyMat);
  shaft.position.x = 0.03;
  keyMesh.add(shaft);
  const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.025), keyMat);
  tooth.position.set(0.1, -0.03, 0);
  keyMesh.add(tooth);
  const sparkle = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow('rgba(255,210,90,0.9)'), depthWrite: false, transparent: true }));
  sparkle.scale.set(0.5, 0.5, 0.5);
  keyMesh.add(sparkle);
  scene.add(keyMesh);

  // ---------- Lights ----------
  const ambient = new THREE.HemisphereLight(0x4a5a80, 0x120c08, 0.35);
  scene.add(ambient);
  const moon = new THREE.DirectionalLight(0x8899cc, 0.35);
  moon.position.set(-20, 30, 25);
  scene.add(moon);
  const lamps: FlickerLamp[] = [];
  const maxLamps = quality === 'low' ? 5 : level.lamps.length;
  const bulbGeo = new THREE.SphereGeometry(0.09, 8, 6);
  level.lamps.forEach((l, i) => {
    // Lamp fixture
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, WALL_HEIGHT - l.y), mat.fence);
    cord.position.set(l.x, (WALL_HEIGHT + l.y) / 2, l.z);
    scene.add(cord);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.22, 10, 1, true), new THREE.MeshLambertMaterial({ color: 0x3a2a1a, side: THREE.DoubleSide }));
    shade.position.set(l.x, l.y + 0.05, l.z);
    scene.add(shade);
    const bulbMat = new THREE.MeshBasicMaterial({ color: l.color });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(l.x, l.y - 0.05, l.z);
    scene.add(bulb);
    if (i >= maxLamps) return;
    const light = new THREE.PointLight(l.color, l.intensity, 9, 1.6);
    light.position.set(l.x, l.y - 0.15, l.z);
    scene.add(light);
    lamps.push({ light, base: l.intensity, flicker: l.flicker, bulb, phase: i * 1.7 });
  });

  return { doors, keyMesh, lamps, windows, hideMeshes, wardrobeDoors, moon, ambient };
}

type BoxFn = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, parent?: THREE.Object3D) => THREE.Mesh;

function buildFurniture(f: Furniture, mat: Record<string, THREE.Material>, box: BoxFn): THREE.Group {
  const g = new THREE.Group();
  g.position.set(f.x, 0, f.z);
  const { w, d, h } = f;
  switch (f.type) {
    case 'wardrobe': {
      box(w, h, d, mat.darkWood, 0, h / 2, 0, g);
      box(w + 0.06, 0.08, d + 0.06, mat.wood, 0, h + 0.04, 0, g);
      // Two doors on the front face. Built in a local frame where the
      // front faces +z, each door pivoting at its outer edge.
      const fx = f.fx ?? 0, fz = f.fz ?? 1;
      const frame = new THREE.Group();
      frame.rotation.y = Math.atan2(fx, fz);
      g.add(frame);
      const faceW = Math.abs(fx) > 0 ? d : w;
      const depth = Math.abs(fx) > 0 ? w : d;
      const doors: THREE.Object3D[] = [];
      for (const side of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(side * faceW / 2, 0, depth / 2 + 0.025);
        pivot.userData.side = side;
        box(faceW / 2 - 0.02, h - 0.15, 0.04, mat.wood, -side * (faceW / 4), h / 2, 0, pivot);
        for (let i = 0; i < 6; i++) box(faceW / 2 - 0.1, 0.03, 0.05, mat.darkWood, -side * (faceW / 4), 1.1 + i * 0.12, 0.01, pivot);
        frame.add(pivot);
        doors.push(pivot);
      }
      g.userData.doors = doors;
      break;
    }
    case 'bed': {
      for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        box(0.08, 0.35, 0.08, mat.darkWood, lx * (w / 2 - 0.06), 0.175, lz * (d / 2 - 0.06), g);
      }
      box(w, 0.12, d, mat.darkWood, 0, 0.38, 0, g);
      box(w - 0.06, 0.16, d - 0.06, mat.sheet, 0, 0.52, 0, g);
      box(w * 0.7, 0.1, 0.35, mat.white, 0, 0.64, -d / 2 + 0.3, g);
      box(w, 1.1, 0.08, mat.darkWood, 0, 0.55, -d / 2, g);
      // Blanket hanging over the side
      box(0.04, 0.3, d * 0.8, mat.fabric, w / 2 + 0.02, 0.45, 0.1, g);
      break;
    }
    case 'table':
    case 'smalltable': {
      box(w, 0.06, d, mat.wood, 0, h - 0.03, 0, g);
      for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        box(0.06, h - 0.06, 0.06, mat.darkWood, lx * (w / 2 - 0.08), (h - 0.06) / 2, lz * (d / 2 - 0.08), g);
      }
      if (f.type === 'table' && h > 0.6) {
        // Candlestick
        box(0.05, 0.25, 0.05, mat.white, -0.4, h + 0.12, 0, g);
      }
      break;
    }
    case 'chair':
      box(w, 0.05, d, mat.wood, 0, 0.45, 0, g);
      for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(0.04, 0.45, 0.04, mat.darkWood, lx * (w / 2 - 0.04), 0.225, lz * (d / 2 - 0.04), g);
      box(w, 0.5, 0.04, mat.wood, 0, 0.72, (f.z > 5.5 ? 1 : -1) * (d / 2 - 0.02), g);
      break;
    case 'sofa':
      box(w, 0.45, d, mat.fabric, 0, 0.225, 0, g);
      box(w, 0.5, 0.2, mat.fabric, 0, 0.7, d / 2 - 0.1, g);
      box(0.2, 0.3, d, mat.fabric, -w / 2 + 0.1, 0.6, 0, g);
      box(0.2, 0.3, d, mat.fabric, w / 2 - 0.1, 0.6, 0, g);
      break;
    case 'fireplace': {
      box(w, h, d, mat.stone, 0, h / 2, 0, g);
      box(0.1, 0.7, 1.0, new THREE.MeshBasicMaterial({ color: 0x080404 }), (f.fx ?? 1) * (w / 2 + 0.001), 0.4, 0, g);
      box(w + 0.2, 0.1, d + 0.2, mat.darkWood, 0, h, 0, g);
      // Glowing embers
      const ember = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.6), new THREE.MeshBasicMaterial({ color: 0xff5010 }));
      ember.position.set((f.fx ?? 1) * 0.2, 0.08, 0);
      g.add(ember);
      break;
    }
    case 'shelf': {
      const alongX = w > d;
      box(w, h, d, mat.darkWood, 0, h / 2, alongX ? -d / 2 + 0.03 : 0, g).scale.set(alongX ? 1 : 1, 1, alongX ? 0.12 : 1);
      for (const sy of [0.05, 0.5, 1.0, 1.5, 2.0]) box(w, 0.04, d, mat.wood, 0, sy, 0, g);
      // Dusty jars and books
      for (let i = 0; i < 6; i++) {
        const c = new THREE.MeshLambertMaterial({ color: [0x5a3a2a, 0x2a4a3a, 0x6a6040, 0x3a2a4a][i % 4] });
        const along = (i / 5 - 0.5) * ((alongX ? w : d) - 0.3);
        box(0.12, 0.25, 0.12, c, alongX ? along : 0, i % 2 ? 1.65 : 0.65, alongX ? 0 : along, g);
      }
      break;
    }
    case 'counter':
      box(w, h - 0.05, d, mat.wood, 0, (h - 0.05) / 2, 0, g);
      box(w + 0.04, 0.05, d + 0.04, mat.stone, 0, h - 0.025, 0, g);
      box(0.6, 0.02, 0.4, mat.metal, 1, h + 0.005, 0, g);
      break;
    case 'stove':
      box(w, h, d, mat.metal, 0, h / 2, 0, g);
      box(0.4, 0.3, 0.3, new THREE.MeshLambertMaterial({ color: 0x222222 }), 0, h + 0.15, 0, g);
      break;
    case 'fridge':
      box(w, h, d, mat.white, 0, h / 2, 0, g);
      box(0.03, 0.4, 0.04, mat.metal, -w / 2 - 0.02, 1.2, 0.2, g);
      break;
    case 'nightstand':
      box(w, h, d, mat.wood, 0, h / 2, 0, g);
      break;
    case 'clock':
      box(w, h, d, mat.darkWood, 0, h / 2, 0, g);
      box(0.3, 0.3, 0.02, mat.white, 0, 1.8, d / 2 + 0.01, g);
      break;
    case 'crate':
      box(w, h, d, mat.wood, 0, h / 2, 0, g);
      box(w + 0.02, 0.08, d + 0.02, mat.darkWood, 0, h * 0.25, 0, g);
      box(w + 0.02, 0.08, d + 0.02, mat.darkWood, 0, h * 0.75, 0, g);
      break;
    case 'cabinet':
      box(w, h, d, mat.wood, 0, h / 2, 0, g);
      box(w + 0.04, 0.04, d + 0.04, mat.darkWood, 0, h, 0, g);
      break;
  }
  return g;
}

/** Animates wardrobe doors swinging open (0..1). */
export function setWardrobeOpen(doors: THREE.Object3D[] | undefined, amount: number): void {
  if (!doors) return;
  for (const p of doors) {
    p.rotation.y = (p.userData.side as number) * 1.4 * amount;
  }
}
