// First-person controller for the local player (survivor or Granny),
// moved with Rapier's kinematic character controller.

import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { TUNING, type Role } from '../shared/protocol';
import type { Input } from './input';
import { Stamina } from './stamina';

const RADIUS = 0.3;
const HALF = 0.55;
const EYE_STAND = 1.55;
const EYE_CROUCH = 0.95;
const EYE_GRANNY = 1.72;

export class LocalPlayer {
  readonly collider: RAPIER.Collider;
  readonly controller: RAPIER.KinematicCharacterController;
  readonly camera: THREE.PerspectiveCamera;
  readonly flashlight: THREE.SpotLight;
  readonly lantern: THREE.PointLight;
  role: Role = 'survivor';
  yaw = 0;
  pitch = 0;
  crouch = false;
  lightOn = true;
  running = false;
  moving = false;
  speed = 0;
  frozen = true;
  readonly stamina = new Stamina(0.2, 0.12);
  private vy = 0;
  private eye = EYE_STAND;
  private bob = 0;
  private stepAcc = 0;
  private readonly world: RAPIER.World;

  constructor(world: RAPIER.World, camera: THREE.PerspectiveCamera, scene: THREE.Scene, shadows: boolean) {
    this.world = world;
    this.camera = camera;
    this.collider = world.createCollider(
      RAPIER.ColliderDesc.capsule(HALF, RADIUS).setTranslation(0, HALF + RADIUS, 0),
    );
    this.controller = world.createCharacterController(0.02);
    this.controller.enableAutostep(0.3, 0.2, true);
    this.controller.enableSnapToGround(0.3);
    this.controller.setSlideEnabled(true);
    this.controller.setApplyImpulsesToDynamicBodies(false);

    scene.add(camera);
    this.flashlight = new THREE.SpotLight(0xfff1d0, 14, 22, 0.42, 0.45, 1.4);
    this.flashlight.position.set(0.15, -0.15, 0.1);
    this.flashlight.target.position.set(0, 0, -5);
    this.flashlight.castShadow = shadows;
    this.flashlight.shadow.mapSize.set(512, 512);
    this.flashlight.shadow.camera.near = 0.2;
    camera.add(this.flashlight);
    camera.add(this.flashlight.target);
    // Granny's own lantern glow (seen from her point of view).
    this.lantern = new THREE.PointLight(0xff9a40, 0, 10, 1.4);
    this.lantern.position.set(0.3, -0.5, -0.3);
    camera.add(this.lantern);
  }

  setRole(role: Role): void {
    this.role = role;
    this.crouch = false;
    this.stamina.reset();
    // Granny tires more slowly but the survivor sprints faster.
    this.stamina.drainPerSec = role === 'granny' ? 0.12 : 0.2;
    this.stamina.regenPerSec = role === 'granny' ? 0.14 : 0.12;
    this.lantern.intensity = role === 'granny' ? 4 : 0;
    this.lightOn = role === 'survivor';
    this.applyLight();
  }

  toggleLight(): void {
    if (this.role !== 'survivor') return;
    this.lightOn = !this.lightOn;
    this.applyLight();
  }

  // Lights are dimmed rather than hidden so shaders never need recompiling.
  private applyLight(): void {
    this.flashlight.intensity = this.lightOn ? 14 : 0;
  }

  get position(): THREE.Vector3 {
    const t = this.collider.translation();
    return new THREE.Vector3(t.x, t.y - HALF - RADIUS, t.z);
  }

  teleport(x: number, z: number, yaw?: number, y = 0): void {
    this.collider.setTranslation({ x, y: y + HALF + RADIUS, z });
    this.vy = 0;
    if (yaw !== undefined) {
      this.yaw = yaw;
      this.pitch = 0;
    }
    this.syncCamera(0);
  }

  setEnabled(on: boolean): void {
    this.collider.setEnabled(on);
  }

  /** Returns true when a footstep should be played this frame. */
  update(dt: number, input: Input, sensitivity: number, invertY: boolean): boolean {
    const look = input.consumeLook();
    const sens = 0.0022 * sensitivity;
    this.yaw -= look.x * sens;
    this.pitch -= look.y * sens * (invertY ? -1 : 1);
    this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));

    const mv = this.frozen ? { x: 0, y: 0 } : input.move();
    const wantsMove = Math.hypot(mv.x, mv.y) > 0.05;
    const wantsRun = input.wantsRun() && wantsMove && !this.crouch;
    this.stamina.update(dt, wantsRun);
    this.running = wantsRun && this.stamina.canRun();
    const g = this.role === 'granny';
    const speed = g
      ? (this.running ? TUNING.grannyRun : TUNING.grannyWalk)
      : this.crouch ? TUNING.survivorCrouch : this.running ? TUNING.survivorRun : TUNING.survivorWalk;
    // Forward = -z when yaw = 0.
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    const fx = -sin, fz = -cos, rx = cos, rz = -sin;
    const dx = (fx * mv.y + rx * mv.x) * speed * dt;
    const dz = (fz * mv.y + rz * mv.x) * speed * dt;
    this.vy = Math.max(this.vy - 20 * dt, -20);
    const desired = { x: dx, y: this.vy * dt, z: dz };
    this.controller.computeColliderMovement(this.collider, desired);
    const m = this.controller.computedMovement();
    if (this.controller.computedGrounded()) this.vy = 0;
    const t = this.collider.translation();
    this.collider.setTranslation({ x: t.x + m.x, y: t.y + m.y, z: t.z + m.z });
    const moved = Math.hypot(m.x, m.z);
    this.speed = moved / Math.max(dt, 1e-4);
    this.moving = this.speed > 0.3;
    if (!this.moving) this.running = false;

    this.syncCamera(dt);
    this.stepAcc += moved;
    const stride = this.running ? 1.5 : this.crouch ? 0.9 : 1.2;
    if (this.stepAcc >= stride) {
      this.stepAcc = 0;
      return true;
    }
    return false;
  }

  private syncCamera(dt: number): void {
    const target = this.role === 'granny' ? EYE_GRANNY : this.crouch ? EYE_CROUCH : EYE_STAND;
    this.eye += (target - this.eye) * Math.min(1, dt * 10);
    this.bob += dt * (this.moving ? (this.running ? 13 : 8) : 0);
    const bobAmt = this.moving ? (this.running ? 0.06 : 0.035) : 0;
    const p = this.collider.translation();
    this.camera.position.set(p.x, p.y - HALF - RADIUS + this.eye + Math.sin(this.bob) * bobAmt, p.z);
    this.camera.rotation.set(this.pitch, this.yaw, Math.sin(this.bob * 0.5) * bobAmt * 0.3, 'YXZ');
  }

  /** Point the camera from a fixed spot (used while hiding). */
  viewFrom(x: number, y: number, z: number, yaw: number): void {
    this.camera.position.set(x, y, z);
    this.camera.rotation.set(this.pitch * 0.3, yaw + Math.max(-0.5, Math.min(0.5, this.yaw - yaw)), 0, 'YXZ');
  }

  dispose(): void {
    this.world.removeCharacterController(this.controller);
    this.world.removeCollider(this.collider, false);
    this.flashlight.removeFromParent();
    this.lantern.removeFromParent();
  }
}
