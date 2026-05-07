import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GameLoop } from './GameLoop';
import { InputManager } from './InputManager';
import { eventBus } from './EventBus';
import { Horse } from '../horse/Horse';
import { HorseController } from '../horse/HorseController';
import { HorsePhysics } from '../horse/HorsePhysics';
import { HorseAnimator } from '../horse/HorseAnimator';
import { HorseStats } from '../horse/HorseStats';
import { World } from '../world/World';
import { Terrain } from '../world/Terrain';
import { DayNight } from '../world/DayNight';
import { Weather } from '../world/Weather';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { CombatSystem } from '../systems/CombatSystem';
import { GrazingSystem } from '../systems/GrazingSystem';
import { AgingSystem } from '../systems/AgingSystem';
import { ParticleSystem } from '../systems/ParticleSystem';
import { GameMode } from '../systems/GameMode';
import { HUD } from '../ui/HUD';
import { TitleScreen } from '../ui/TitleScreen';
import { GameOver } from '../ui/GameOver';
import { AudioManager } from '../audio/AudioManager';
import { RivalStallion } from '../entities/RivalStallion';
import { Mare } from '../entities/Mare';
import { Predator } from '../entities/Predator';
import { Rabbit } from '../entities/Rabbit';

export class Game {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  input: InputManager;
  physicsSystem: PhysicsSystem;
  terrain: Terrain;
  world: World;
  dayNight: DayNight;
  weather: Weather;
  horse: Horse;
  horseController: HorseController;
  horsePhysics: HorsePhysics;
  horseAnimator: HorseAnimator;
  horseStats: HorseStats;
  combatSystem: CombatSystem;
  grazingSystem: GrazingSystem;
  agingSystem: AgingSystem;
  particleSystem: ParticleSystem;
  hud: HUD;
  titleScreen: TitleScreen;
  gameOver: GameOver;
  audio: AudioManager;
  rivals: RivalStallion[] = [];
  mares: Mare[] = [];
  predators: Predator[] = [];
  rabbits: Rabbit[] = [];
  gameLoop: GameLoop;

  // Camera state
  cameraYaw = 0;
  cameraPitch = 0.3;
  cameraDistance = 12;
  cameraMouseOffset = 0; // Mouse offset from horse direction
  screenShake = 0;

  // Game state
  state: 'title' | 'playing' | 'gameover' = 'title';
  gameMode: GameMode = 'survival';
  totalTime = 0;
  distanceTraveled = 0;
  fightsWon = 0;
  objectsCrashedInto = 0;
  lastHorsePos = new THREE.Vector3();

  constructor() {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x88aacc, 100, 400);

    this.camera = new THREE.PerspectiveCamera(
      65,
      window.innerWidth / window.innerHeight,
      0.5,
      600
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.input = new InputManager();
    this.audio = new AudioManager();

    // Physics
    this.physicsSystem = new PhysicsSystem();

    // Terrain & World
    this.terrain = new Terrain(this.scene, this.physicsSystem);
    this.world = new World(this.scene, this.terrain, this.physicsSystem);
    this.dayNight = new DayNight(this.scene);
    this.weather = new Weather(this.scene);

    // Horse
    this.horse = new Horse(this.scene);
    this.horseStats = new HorseStats();
    this.horsePhysics = new HorsePhysics(this.physicsSystem, this.terrain);
    this.horseAnimator = new HorseAnimator(this.horse);
    this.horseController = new HorseController(
      this.input,
      this.horsePhysics,
      this.horseAnimator,
      this.horseStats,
      this.audio
    );

    // Systems
    this.combatSystem = new CombatSystem(this.audio);
    this.grazingSystem = new GrazingSystem(this.terrain);
    this.grazingSystem.setAnimator(this.horseAnimator);
    this.grazingSystem.setAudio(this.audio);
    this.agingSystem = new AgingSystem();
    this.particleSystem = new ParticleSystem(this.scene);

    // Entities
    this.spawnEntities();

    // UI
    this.hud = new HUD();
    this.titleScreen = new TitleScreen();
    this.gameOver = new GameOver();

    // Game loop
    this.gameLoop = new GameLoop(
      (dt) => this.update(dt),
      (alpha) => this.render(alpha)
    );

    // Listen to events
    eventBus.on('horse-died', () => this.onGameOver());
    eventBus.on('fight-won', () => this.fightsWon++);
    eventBus.on('object-crashed', () => this.objectsCrashedInto++);

    // Draw title screen horse
    this.titleScreen.drawHorseSilhouette();

    // Start the loop (title screen is visible)
    this.gameLoop.start();
  }

  private spawnEntities(): void {
    // Spawn rival stallions
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const dist = 80 + Math.random() * 100;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = this.terrain.getHeightAt(x, z);
      const rival = new RivalStallion(this.scene, this.physicsSystem, x, y, z);
      this.rivals.push(rival);
    }

    // Spawn mares in groups
    for (let g = 0; g < 2; g++) {
      const cx = (Math.random() - 0.5) * 200;
      const cz = (Math.random() - 0.5) * 200;
      for (let i = 0; i < 3; i++) {
        const x = cx + (Math.random() - 0.5) * 20;
        const z = cz + (Math.random() - 0.5) * 20;
        const y = this.terrain.getHeightAt(x, z);
        const mare = new Mare(this.scene, this.physicsSystem, x, y, z);
        this.mares.push(mare);
      }
    }

    // Spawn predator (wolf)
    {
      const x = 60 + Math.random() * 40;
      const z = 60 + Math.random() * 40;
      const y = this.terrain.getHeightAt(x, z);
      const pred = new Predator(this.scene, this.physicsSystem, x, y, z);
      pred.setAudio(this.audio);
      this.predators.push(pred);
    }

    // Spawn rabbits
    for (let i = 0; i < 12; i++) {
      const x = (Math.random() - 0.5) * 300;
      const z = (Math.random() - 0.5) * 300;
      const y = this.terrain.getHeightAt(x, z);
      const rabbit = new Rabbit(this.scene, x, y, z);
      this.rabbits.push(rabbit);
    }
  }

  startGame(): void {
    this.state = 'playing';
    this.gameMode = this.titleScreen.selectedMode;
    this.titleScreen.hide();
    this.hud.show();
    this.totalTime = 0;
    this.distanceTraveled = 0;
    this.fightsWon = 0;
    this.objectsCrashedInto = 0;

    // Place horse at a nice spawn
    const spawnX = 0;
    const spawnZ = 0;
    const spawnY = this.terrain.getHeightAt(spawnX, spawnZ) + 3;
    this.horsePhysics.body.position.set(spawnX, spawnY, spawnZ);
    this.horsePhysics.body.velocity.set(0, 0, 0);
    this.horsePhysics.body.angularVelocity.set(0, 0, 0);
    this.horseStats.reset();
    this.horsePhysics.ragdollMode = false;
    this.horsePhysics.ragdollTimer = 0;
    this.lastHorsePos.set(spawnX, spawnY, spawnZ);

    // Apply mode-specific logic
    if (this.gameMode === 'laststand') {
      // Spawn extra predator for Last Stand mode
      if (this.predators.length < 2) {
        const x = 30 + Math.random() * 40;
        const z = 30 + Math.random() * 40;
        const y = this.terrain.getHeightAt(x, z);
        const pred = new Predator(this.scene, this.physicsSystem, x, y, z);
        pred.setAudio(this.audio);
        this.predators.push(pred);
      }
    }

    this.audio.startAmbientWind();
  }

  private onGameOver(): void {
    this.state = 'gameover';
    this.hud.hide();
    this.gameOver.show({
      distanceTraveled: Math.floor(this.distanceTraveled),
      fightsWon: this.fightsWon,
      objectsCrashedInto: this.objectsCrashedInto,
      timeSurvived: Math.floor(this.totalTime),
      age: this.horseStats.ageLabel,
    });
    this.audio.stopAmbientWind();
  }

  restartGame(): void {
    this.gameOver.hide();
    this.horseStats.reset();
    this.horsePhysics.ragdollMode = false;
    this.horsePhysics.ragdollTimer = 0;
    this.startGame();
  }

  update(dt: number): void {
    if (this.state === 'title') {
      if (this.input.consumeKey('Enter')) {
        this.startGame();
      }
      return;
    }

    if (this.state === 'gameover') {
      if (this.input.consumeKey('Enter')) {
        this.restartGame();
      }
      return;
    }

    this.totalTime += dt;

    // Physics
    this.physicsSystem.update(dt);

    // Horse
    this.horseController.update(dt);
    this.horsePhysics.update(dt);

    // Sync horse mesh to physics
    const pos = this.horsePhysics.body.position;
    this.horse.group.position.set(pos.x, pos.y, pos.z);

    // Track distance
    const currentPos = new THREE.Vector3(pos.x, pos.y, pos.z);
    this.distanceTraveled += currentPos.distanceTo(this.lastHorsePos);
    this.lastHorsePos.copy(currentPos);

    // Horse rotation from controller
    this.horse.group.rotation.y = this.horseController.facing;

    // Animate
    this.horseAnimator.update(dt, this.horseController.speed, this.horsePhysics.ragdollMode);

    // Scale horse based on age
    const ageScale = this.agingSystem.getScale(this.horseStats.age);
    this.horse.group.scale.setScalar(ageScale);

    // Stats
    this.horseStats.update(dt, this.horseController.speed > 0, this.horseController.speed > 15);

    // Stamina warning sound when low
    if (this.horseStats.stamina < 20) {
      this.audio.playStaminaWarning();
    }

    // Systems
    const horsePos3 = new THREE.Vector3(pos.x, pos.y, pos.z);
    this.grazingSystem.update(dt, horsePos3, this.horseStats, this.horseController.speed);
    this.agingSystem.update(dt, this.horseStats);
    this.particleSystem.update(dt, horsePos3, this.horseController.speed, this.horsePhysics);

    // Combat with rivals
    for (const rival of this.rivals) {
      rival.update(dt, horsePos3, this.terrain);
      this.combatSystem.checkCollision(
        this.horsePhysics,
        this.horseStats,
        rival,
        this.horseController.speed
      );
    }

    // Mares
    const predatorPositions = this.predators.map(p => new THREE.Vector3(p.body.position.x, p.body.position.y, p.body.position.z));
    for (const mare of this.mares) {
      mare.update(dt, horsePos3, this.terrain, predatorPositions);
    }

    // Predators
    for (const pred of this.predators) {
      pred.update(dt, horsePos3, this.terrain);
      this.combatSystem.checkPredatorCollision(
        this.horsePhysics,
        this.horseStats,
        pred,
        this.horseController.speed
      );
    }

    // Rabbits
    for (const rabbit of this.rabbits) {
      rabbit.update(dt, horsePos3);
    }

    // Screen shake from sprinting
    if (this.horseController.speed > 18) {
      this.screenShake = Math.min(this.screenShake + dt * 2, 0.3);
    } else {
      this.screenShake *= 0.9;
    }

    // Day/Night
    this.dayNight.update(dt);

    // Weather
    this.weather.update(dt, horsePos3);

    // Collision with world objects
    this.world.checkCollisions(horsePos3, this.horsePhysics, this.horseController.speed);

    // HUD
    this.hud.update(this.horseStats, this.agingSystem);

    // Minimap
    this.hud.updateMinimap(
      horsePos3,
      this.terrain,
      this.rivals,
      this.mares,
      this.predators
    );

    // Update camera
    this.updateCamera(dt);
  }

  updateCamera(dt: number): void {
    const mouse = this.input.consumeMouseDelta();
    if (this.input.pointerLocked) {
      this.cameraMouseOffset -= mouse.dx * 0.003;
      this.cameraPitch -= mouse.dy * 0.003;
      this.cameraPitch = Math.max(-0.5, Math.min(1.2, this.cameraPitch));
    }

    // Clamp mouse offset so camera can't go completely around
    this.cameraMouseOffset = Math.max(-1.5, Math.min(1.5, this.cameraMouseOffset));

    // Bind camera yaw to horse facing direction with mouse offset
    this.cameraYaw = this.horseController.facing + this.cameraMouseOffset;

    const horsePos = this.horse.group.position;
    const targetX = horsePos.x - Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;
    const targetY = horsePos.y + Math.sin(this.cameraPitch) * this.cameraDistance + 3;
    const targetZ = horsePos.z - Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;

    // Smooth camera
    this.camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.08);

    // Screen shake
    if (this.screenShake > 0.01) {
      this.camera.position.x += (Math.random() - 0.5) * this.screenShake;
      this.camera.position.y += (Math.random() - 0.5) * this.screenShake;
    }

    this.camera.lookAt(horsePos.x, horsePos.y + 2, horsePos.z);

    // Clamp camera above terrain
    const camTerrainY = this.terrain.getHeightAt(this.camera.position.x, this.camera.position.z);
    if (this.camera.position.y < camTerrainY + 1) {
      this.camera.position.y = camTerrainY + 1;
    }
  }

  render(_alpha: number): void {
    this.renderer.render(this.scene, this.camera);
  }
}
