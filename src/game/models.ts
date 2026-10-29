// Low-poly original character models built from primitives, with simple
// procedural walk animation.

import * as THREE from 'three';
import type { Character } from '../shared/protocol';
import { glow } from './textures';

export interface Rig {
  root: THREE.Group;
  body: THREE.Group;
  head: THREE.Object3D;
  armL: THREE.Object3D;
  armR: THREE.Object3D;
  legL?: THREE.Object3D;
  legR?: THREE.Object3D;
  /** Where Granny's lantern light should follow. */
  lanternAnchor?: THREE.Object3D;
  phase: number;
}

const lambert = (color: number, emissive = 0) => new THREE.MeshLambertMaterial({ color, emissive });

function limb(len: number, radius: number, m: THREE.Material): THREE.Group {
  // Pivot at the top so rotation.x swings the limb.
  const g = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.85, len, 7), m);
  mesh.position.y = -len / 2;
  g.add(mesh);
  return g;
}

export function createGranny(): Rig {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const skin = lambert(0xb9b39a);
  const dress = lambert(0x2b1d33);
  const shawl = lambert(0x4d4a45);
  // Long dress (hunched)
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.42, 1.15, 10), dress);
  skirt.position.y = 0.58;
  body.add(skirt);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.5, 10), dress);
  torso.position.set(0, 1.35, 0.06);
  torso.rotation.x = 0.35;
  body.add(torso);
  const wrap = new THREE.Mesh(new THREE.SphereGeometry(0.29, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), shawl);
  wrap.position.set(0, 1.42, 0.08);
  wrap.rotation.x = 0.35;
  body.add(wrap);
  // Apron
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.7), lambert(0x6d6555));
  apron.position.set(0, 0.75, 0.33);
  apron.rotation.x = -0.25;
  body.add(apron);
  // Head
  const head = new THREE.Group();
  head.position.set(0, 1.68, 0.2);
  body.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), skin);
  skull.scale.set(1, 1.12, 1);
  head.add(skull);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.2), lambert(0xc9c6c0));
  hair.position.y = 0.03;
  hair.rotation.x = -0.25;
  head.add(hair);
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), lambert(0xc9c6c0));
  bun.position.set(0, 0.12, -0.14);
  head.add(bun);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 6), skin);
  nose.position.set(0, -0.01, 0.18);
  nose.rotation.x = Math.PI / 2.4;
  head.add(nose);
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.02), lambert(0x200808));
  mouth.position.set(0, -0.09, 0.15);
  head.add(mouth);
  // Glowing eyes (also make Granny visible in the dark - fair warning!)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffe08a });
  const eyeGlow = new THREE.SpriteMaterial({ map: glow('rgba(255,200,90,0.8)'), depthWrite: false, transparent: true });
  for (const sx of [-0.06, 0.06]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), eyeMat);
    eye.position.set(sx, 0.04, 0.15);
    head.add(eye);
    const sp = new THREE.Sprite(eyeGlow);
    sp.position.copy(eye.position);
    sp.scale.setScalar(0.14);
    head.add(sp);
  }
  // Round glasses
  const glassMat = lambert(0x222222);
  for (const sx of [-0.065, 0.065]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.006, 6, 14), glassMat);
    rim.position.set(sx, 0.04, 0.165);
    head.add(rim);
  }
  // Arms
  const armL = limb(0.62, 0.05, dress);
  armL.position.set(-0.26, 1.5, 0.12);
  body.add(armL);
  const armR = limb(0.62, 0.05, dress);
  armR.position.set(0.26, 1.5, 0.12);
  body.add(armR);
  for (const arm of [armL, armR]) {
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), skin);
    hand.position.y = -0.64;
    arm.add(hand);
  }
  // Lantern in the right hand (a gentle warning glow for the survivor).
  const lanternG = new THREE.Group();
  lanternG.position.y = -0.72;
  armR.add(lanternG);
  const cage = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.12), lambert(0x1a1a1a));
  lanternG.add(cage);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffa040 }));
  lanternG.add(flame);
  return { root, body, head, armL, armR, lanternAnchor: lanternG, phase: 0 };
}

const KID_STYLE: Record<Character, { shirt: number; pants: number; hair: number; skin: number; long: boolean }> = {
  ahmed: { shirt: 0x2d5fa8, pants: 0x2a2f3a, hair: 0x1b120c, skin: 0xc49a76, long: false },
  miral: { shirt: 0x9b3d8f, pants: 0x3a2a4a, hair: 0x2a160c, skin: 0xd2a684, long: true },
};

export function createKid(character: Character): Rig {
  const st = KID_STYLE[character];
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const skin = lambert(st.skin);
  const shirt = lambert(st.shirt);
  const pants = lambert(st.pants);
  const legL = limb(0.6, 0.075, pants);
  legL.position.set(-0.1, 0.62, 0);
  body.add(legL);
  const legR = limb(0.6, 0.075, pants);
  legR.position.set(0.1, 0.62, 0);
  body.add(legR);
  for (const leg of [legL, legR]) {
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.22), lambert(0xeeeeee));
    shoe.position.set(0, -0.6, 0.04);
    leg.add(shoe);
  }
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.24), shirt);
  torso.position.y = 0.88;
  body.add(torso);
  if (st.long) {
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.25, 10), shirt);
    skirt.position.y = 0.58;
    body.add(skirt);
  }
  const head = new THREE.Group();
  head.position.y = 1.32;
  body.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), skin);
  head.add(skull);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), lambert(st.hair));
  hair.position.y = 0.02;
  hair.rotation.x = -0.2;
  head.add(hair);
  if (st.long) {
    const pony = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.35, 6), lambert(st.hair));
    pony.position.set(0, -0.08, -0.16);
    pony.rotation.x = 0.3;
    head.add(pony);
  }
  for (const sx of [-0.055, 0.055]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), lambert(0x111111));
    eye.position.set(sx, 0.02, 0.145);
    head.add(eye);
  }
  const armL = limb(0.5, 0.06, shirt);
  armL.position.set(-0.26, 1.1, 0);
  body.add(armL);
  const armR = limb(0.5, 0.06, shirt);
  armR.position.set(0.26, 1.1, 0);
  body.add(armR);
  // Flashlight held in the right hand.
  const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.18, 8), lambert(0x333333));
  torch.position.set(0, -0.5, 0.06);
  torch.rotation.x = Math.PI / 2;
  armR.add(torch);
  return { root, body, head, armL, armR, legL, legR, lanternAnchor: torch, phase: 0 };
}

/** Procedural walk / idle animation. */
export function animateRig(rig: Rig, dt: number, speed: number, crouch: boolean, granny: boolean): void {
  const moving = speed > 0.2;
  rig.phase += dt * (moving ? 3 + speed * 1.6 : 1.2);
  const swing = moving ? Math.min(0.9, 0.25 + speed * 0.12) : 0.04;
  const s = Math.sin(rig.phase);
  rig.armL.rotation.x = s * swing;
  rig.armR.rotation.x = granny ? -0.5 - Math.abs(s) * 0.15 : -s * swing; // Granny holds her lantern up.
  if (rig.legL && rig.legR) {
    rig.legL.rotation.x = -s * swing;
    rig.legR.rotation.x = s * swing;
  }
  rig.body.position.y = moving ? Math.abs(Math.cos(rig.phase)) * 0.05 : Math.sin(rig.phase) * 0.008;
  rig.body.scale.y = crouch ? 0.62 : 1;
  if (granny) {
    // Creepy head tilt.
    rig.head.rotation.z = Math.sin(rig.phase * 0.35) * 0.18;
    rig.body.rotation.z = moving ? Math.sin(rig.phase) * 0.06 : 0;
  }
}
