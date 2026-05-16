import * as THREE from "three";
import { createAudio } from "./audio.js";
import { requireElement } from "./dom.js";
import { seededWave } from "./math.js";
import { createSheepSystem } from "./sheep.js";
import { createToolKit } from "./tools.js";

/*
  Future Roundcraft ideas:
  - Monsters get angry when the player hits them.
  - Diamonds can later be found in secret treasure chests.
  - The pickaxe never breaks.
  - The pickaxe can later become stronger with fire/lava and diamond.
  - Befriending friendly creatures comes in a later version.
*/

const playerHeight = 1.7;
const walkSpeed = 7.2;
const movementSharpness = 16;
const gravity = 23;
const jumpSpeed = 8.4;
const mouseSensitivity = 0.00165;
const lookSharpness = 28;
const crystalMiningSeconds = 10;
const crystalReach = 7;
const volcanoDigSeconds = 6;
const volcanoDigReach = 10;
const houseDestroySeconds = 8;
const houseReach = 9;
const houseWoodRewardCount = 12;
const crystalAimDot = 0.96;
const volcanoAimDot = 0.5;
const worldHalfSize = 92;
const playerRadius = 0.55;
const volcanoBaseRadius = 17;
const volcanoTopRadius = 5.4;
const volcanoHeight = 14;
const volcanoTunnelHalfWidth = 2.35;
const volcanoTunnelHalfHeight = 2.2;
const pickaxeHitSeconds = 0.28;
const lavaBubbleSoundMinSeconds = 0.36;
const lavaBubbleSoundSpreadSeconds = 0.58;
const toolPickaxe = "Pickaxe";
const toolBow = "Bow";
const arrowSpeed = 24;
const arrowLifeSeconds = 4.2;
const arrowShotCooldownSeconds = 0.48;
const arrowHitPadding = 0.45;
const projectileObstacleRadius = 0.18;
const dragonFireObstacleRadius = 0.72;
const dragonFlightGroundClearance = 7;
const hotbarSlotCount = 8;
const backpackSlotCount = 18;
const initialSheepMinCount = 2;
const initialSheepMaxCount = 5;
const sheepSafeMinCount = 2;
const sheepRespawnSeconds = 30;
const sheepRespawnBatchMinCount = 1;
const sheepRespawnBatchMaxCount = 2;
const sheepMoveSpeed = 1.25;
const sheepTargetReach = 0.35;
const sheepTargetMinDistance = 5;
const sheepTargetMaxDistance = 13;
const sheepPickaxeReach = 3.4;
const sheepPickaxeHitSeconds = 0.42;
const sheepArrowHitPadding = 0.3;
const sheepObstacleRadius = 0.86;
const sheepObstacleHeight = 1.45;
const sheepMeatHealHearts = 1;
const dragonMeatHealHearts = 2;
const sheepStartMeadowRadius = 24;
const pathRadiusX = 21;
const pathRadiusZ = 15.12;
const sheepSpawnWorldPadding = 7;
const waterSurfaceY = 0.08;
const swimEyeHeight = 1.22;
const swimSpeed = 4.1;
const swimFloatSharpness = 10;
const lakeRadius = 12;
const riverHalfWidth = 2.2;
const maxPlayerHearts = 5;
const dragonMaxHealth = 12;
const dragonFireRange = 38;
const dragonFireCooldownSeconds = 1.25;
const dragonFireSpeed = 10.5;
const dragonFireLifeSeconds = 4.2;
const dragonFireHitRadius = 1.25;
const dragonBreathFlashSeconds = 0.48;
const dragonFireMouthX = 4.25;
const dragonFireTargetLowering = 0.55;
const flyingSpeed = 10;
const flyingVerticalSpeed = 8;
const dragonDeadGroundY = 1.15;
const volcanoCenter = new THREE.Vector3(0, 0, -34);
const sheepStartMeadowCenter = new THREE.Vector2(0, 12);
const pathCenter = new THREE.Vector2(0, -18);
const lakeCenter = new THREE.Vector2(30, 8);
const riverPath = [
  new THREE.Vector2(30, 8),
  new THREE.Vector2(18, 5),
  new THREE.Vector2(6, -4),
  new THREE.Vector2(-8, -8),
  new THREE.Vector2(-22, -6),
  new THREE.Vector2(-38, -15)
];

const startScreen = requireElement("startScreen");
const heartCountLabel = requireElement("heartCount");
const flyingStateLabel = requireElement("flyingState");
const toolStateLabel = requireElement("toolState");
const crystalCountLabel = requireElement("crystalCount");
const diamondCountLabel = requireElement("diamondCount");
const diamondPickaxeCountLabel = requireElement("diamondPickaxeCount");
const dragonMeatCountLabel = requireElement("dragonMeatCount");
const sheepMeatCountLabel = requireElement("sheepMeatCount");
const woodCountLabel = requireElement("woodCount");
const dragonPanel = requireElement("dragonPanel");
const dragonFill = requireElement("dragonFill");
const minePanel = requireElement("minePanel");
const mineLabel = requireElement("mineLabel");
const mineFill = requireElement("mineFill");
const message = requireElement("message");
const hotbar = requireElement("hotbar");
const backpackOverlay = requireElement("backpackOverlay");
const backpackHotbarSlots = requireElement("backpackHotbarSlots");
const backpackSlotsElement = requireElement("backpackSlots");
const heldItemLabel = requireElement("heldItemLabel");
const closeBackpackButton = requireElement("closeBackpack");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x82c8f0);
scene.fog = new THREE.Fog(0x82c8f0, 58, 145);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 450);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const player = camera;
player.position.set(0, playerHeight, 22);
player.rotation.order = "YXZ";
scene.add(player);

const clock = new THREE.Clock();
const velocity = new THREE.Vector3();
const forwardVector = new THREE.Vector3();
const rightVector = new THREE.Vector3();
const desiredMove = new THREE.Vector3();
const aimDirection = new THREE.Vector3();
const aimTarget = new THREE.Vector3();
const move = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  up: false,
  down: false
};
let canJump = false;
let mouseDown = false;
let gameStarted = false;
let pointerLocked = false;
let pointerLockFallback = false;
let dragLooking = false;
let lastDragX = 0;
let lastDragY = 0;
let yaw = 0;
let pitch = 0;
let targetYaw = 0;
let targetPitch = 0;
let activeCrystal = null;
let visibleCrystal = null;
let activeHouse = null;
let visibleHouse = null;
let activeVolcanoRock = false;
let visibleVolcanoRock = false;
let miningProgress = 0;
let volcanoTunnelOpen = false;
let messageTimer = 0;
let pickaxeSwing = 0;
let playerHearts = maxPlayerHearts;
let dragonHealth = dragonMaxHealth;
let dragonAlive = true;
let dragonDefeated = false;
let canFly = false;
let inventoryOpen = false;
let heldInventoryStack = null;
let restorePointerLockAfterBackpack = false;
let nextDragonFireTime = 0;
let dragonHitFlash = 0;
let dragonFalling = false;
let dragonBreathGlowSeconds = 0;
let activeTool = toolPickaxe;
let nextArrowShotTime = 0;
let bowKick = 0;
let nextPickaxeHitTime = 0;

const raycaster = new THREE.Raycaster();
const arrowRaycaster = new THREE.Raycaster();
const crystals = [];
const crystalParts = [];
const lavaBubbles = [];
const lavaSparks = [];
const lavaDrops = [];
const dragonParts = [];
const dragonFireballs = [];
const playerArrows = [];
const solidObstacles = [];
const volcanoRockParts = [];
const houseParts = [];
const dragonMouthPosition = new THREE.Vector3();
const dragonFireDirection = new THREE.Vector3();
const dragonFireTarget = new THREE.Vector3();
const dragonFacingDirection = new THREE.Vector3();
const arrowStartPosition = new THREE.Vector3();
const arrowDirection = new THREE.Vector3();
const arrowPreviousPosition = new THREE.Vector3();
const projectilePreviousPosition = new THREE.Vector3();
let volcanoTunnelGroup = null;

const inventoryItems = {
  pickaxe: { name: "Pickaxe", shortName: "Pick", tool: toolPickaxe },
  bow: { name: "Bow", shortName: "Bow", tool: toolBow },
  lavaCrystal: { name: "Lava Crystal", shortName: "Lava" },
  diamond: { name: "Diamond", shortName: "Dia" },
  diamondPickaxe: { name: "Diamond Pickaxe", shortName: "D Pick" },
  dragonMeat: { name: "Dragon Meat", shortName: "D Meat" },
  sheepMeat: { name: "Sheep Meat", shortName: "S Meat" },
  wood: { name: "Wood", shortName: "Wood" }
};
const hotbarSlots = Array.from({ length: hotbarSlotCount }, () => null);
hotbarSlots[0] = { itemId: "pickaxe", count: 1, locked: true };
hotbarSlots[1] = { itemId: "bow", count: 1, locked: true };
const backpackSlots = Array.from({ length: backpackSlotCount }, () => null);

const audio = createAudio({
  lavaBubbleSoundMinSeconds,
  lavaBubbleSoundSpreadSeconds,
  seededWave,
  showMessage
});
const sheepSystem = createSheepSystem({
  THREE,
  addSolidObstacle,
  arrowRaycaster,
  clock,
  collectSheepMeat,
  getActiveTool: () => activeTool,
  getGameStarted: () => gameStarted,
  getMouseDown: () => mouseDown,
  groundHeightAt,
  initialSheepMaxCount,
  initialSheepMinCount,
  isInsidePath,
  isInsideWater,
  pathCenter,
  playPickaxeHit: () => audio.playPickaxeHit(),
  player,
  raycaster,
  scene,
  sheepArrowHitPadding,
  sheepMeatMessage: showMessage,
  sheepMoveSpeed,
  sheepObstacleHeight,
  sheepObstacleRadius,
  sheepPickaxeHitSeconds,
  sheepPickaxeReach,
  sheepRespawnBatchMaxCount,
  sheepRespawnBatchMinCount,
  sheepRespawnSeconds,
  sheepSafeMinCount,
  sheepSpawnWorldPadding,
  sheepStartMeadowCenter,
  sheepStartMeadowRadius,
  sheepTargetMaxDistance,
  sheepTargetMinDistance,
  sheepTargetReach,
  solidObstacles,
  toolPickaxe,
  volcanoBaseRadius,
  volcanoCenter,
  worldHalfSize
});

addLights();
addSkyDetails();
addGround();
addWater();
addVolcano();
addCave();
addTreasureChest();
const house = addHouse();
addCrystals();
sheepSystem.addInitialSheep();
const dragon = addDragon();
const toolKit = createToolKit({ THREE, camera, scene });
const pickaxe = toolKit.addPickaxe();
const bow = toolKit.addBow();
updateToolVisibility();
updatePlayerHud();
updateInventoryHud();
updateDragonBar();

startScreen.addEventListener("click", () => {
  startGame();
});

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
document.addEventListener("mousedown", (event) => {
  if (inventoryOpen) {
    return;
  }

  if (event.button === 0 && gameStarted) {
    mouseDown = true;
    if (activeTool === toolBow) {
      shootArrow(clock.elapsedTime);
    }
  }
  if (event.button === 2 && gameStarted && !pointerLocked) {
    dragLooking = true;
    lastDragX = event.clientX;
    lastDragY = event.clientY;
  }
});
document.addEventListener("mouseup", (event) => {
  if (event.button === 0) {
    mouseDown = false;
  }
  if (event.button === 2) {
    dragLooking = false;
  }
});
document.addEventListener("mousemove", handleMouseLook);
document.addEventListener("pointerlockchange", handlePointerLockChange);
document.addEventListener("contextmenu", (event) => event.preventDefault());
backpackOverlay.addEventListener("click", handleBackpackClick);
closeBackpackButton.addEventListener("click", closeBackpack);
window.addEventListener("blur", stopPlayerInput);
window.addEventListener("resize", resize);

animate();

async function startGame() {
  gameStarted = true;
  startScreen.style.display = "none";
  audio.start();

  if (!("requestPointerLock" in renderer.domElement)) {
    pointerLockFallback = true;
    showMessage("Mouse lock is missing. Hold right mouse to look.");
    return;
  }

  try {
    await renderer.domElement.requestPointerLock();
    pointerLockFallback = false;
  } catch (error) {
    pointerLockFallback = true;
    showMessage("Test browser: hold right mouse to look.");
  }
}

function handlePointerLockChange() {
  pointerLocked = document.pointerLockElement === renderer.domElement;

  if (pointerLocked) {
    gameStarted = true;
    startScreen.style.display = "none";
    return;
  }

  if (inventoryOpen) {
    return;
  }

  if (gameStarted && !pointerLockFallback) {
    gameStarted = false;
    mouseDown = false;
    dragLooking = false;
    startScreen.style.display = "grid";
  }
}

function handleMouseLook(event) {
  if (!gameStarted) {
    return;
  }

  if (pointerLocked) {
    turnView(event.movementX, event.movementY);
    return;
  }

  if (!dragLooking) {
    return;
  }

  const movementX = event.clientX - lastDragX;
  const movementY = event.clientY - lastDragY;
  lastDragX = event.clientX;
  lastDragY = event.clientY;
  turnView(movementX, movementY);
}

function turnView(movementX, movementY) {
  targetYaw -= movementX * mouseSensitivity;
  targetPitch -= movementY * mouseSensitivity;
  targetPitch = THREE.MathUtils.clamp(targetPitch, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
}

function stopPlayerInput() {
  move.forward = false;
  move.backward = false;
  move.left = false;
  move.right = false;
  move.up = false;
  move.down = false;
  mouseDown = false;
  dragLooking = false;
}

function addLights() {
  const skyLight = new THREE.HemisphereLight(0xd7f2ff, 0x5a4028, 2.3);
  scene.add(skyLight);

  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(28, 48, 24);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -55;
  sun.shadow.camera.right = 55;
  sun.shadow.camera.top = 55;
  sun.shadow.camera.bottom = -55;
  scene.add(sun);

  const lavaLight = new THREE.PointLight(0xff5a19, 16, 42, 1.8);
  lavaLight.position.set(0, 7, -24);
  scene.add(lavaLight);
}

function addSkyDetails() {
  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(4.2, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0xffef89 })
  );
  sunMesh.position.set(55, 46, -76);
  scene.add(sunMesh);

  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0xf6fbff,
    emissive: 0xc8e5ff,
    emissiveIntensity: 0.12,
    roughness: 0.75
  });
  const cloudPositions = [
    [-38, 24, -58, 1.3],
    [-7, 27, -72, 1.05],
    [30, 22, -54, 1.18],
    [46, 25, -21, 0.95]
  ];

  for (const [x, y, z, scale] of cloudPositions) {
    scene.add(makeCloud(x, y, z, scale, cloudMaterial));
  }
}

function makeCloud(x, y, z, scale, material) {
  const cloud = new THREE.Group();
  cloud.position.set(x, y, z);

  const puffs = [
    [-1.6, 0, 0, 1.18],
    [-0.45, 0.28, 0.08, 1.38],
    [0.95, 0.05, -0.05, 1.12],
    [2.05, -0.04, 0.04, 0.92]
  ];

  for (const [px, py, pz, puffScale] of puffs) {
    const puff = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10), material);
    puff.position.set(px * scale, py * scale, pz * scale);
    puff.scale.set(1.8 * puffScale * scale, 0.72 * puffScale * scale, 0.82 * puffScale * scale);
    cloud.add(puff);
  }

  return cloud;
}

function addGround() {
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x6daf45,
    roughness: 0.92,
    metalness: 0
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220, 1, 1), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const pathMaterial = new THREE.MeshStandardMaterial({
    color: 0x6f5a3d,
    roughness: 0.95
  });
  const path = new THREE.Mesh(new THREE.CircleGeometry(21, 64), pathMaterial);
  path.position.set(0, 0.012, -18);
  path.rotation.x = -Math.PI / 2;
  path.scale.set(1, 0.72, 1);
  scene.add(path);
}

function addWater() {
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x2f9fd3,
    emissive: 0x0c5f8f,
    emissiveIntensity: 0.22,
    roughness: 0.42,
    metalness: 0,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide
  });

  const lake = new THREE.Mesh(new THREE.CircleGeometry(lakeRadius, 72), waterMaterial);
  lake.position.set(lakeCenter.x, waterSurfaceY, lakeCenter.y);
  lake.rotation.x = -Math.PI / 2;
  lake.scale.set(1.22, 0.82, 1);
  lake.receiveShadow = true;
  scene.add(lake);

  const river = new THREE.Mesh(makeRiverGeometry(), waterMaterial);
  river.position.y = waterSurfaceY + 0.01;
  river.receiveShadow = true;
  scene.add(river);
}

function makeRiverGeometry() {
  const vertices = [];
  const indices = [];

  for (let index = 0; index < riverPath.length; index += 1) {
    const point = riverPath[index];
    const previous = riverPath[Math.max(0, index - 1)];
    const next = riverPath[Math.min(riverPath.length - 1, index + 1)];
    const direction = new THREE.Vector2(next.x - previous.x, next.y - previous.y).normalize();
    const normal = new THREE.Vector2(-direction.y, direction.x);
    vertices.push(point.x + normal.x * riverHalfWidth, 0, point.y + normal.y * riverHalfWidth);
    vertices.push(point.x - normal.x * riverHalfWidth, 0, point.y - normal.y * riverHalfWidth);
  }

  for (let index = 0; index < riverPath.length - 1; index += 1) {
    const leftTop = index * 2;
    const rightTop = leftTop + 1;
    const leftBottom = leftTop + 2;
    const rightBottom = leftTop + 3;
    indices.push(leftTop, leftBottom, rightTop, rightTop, leftBottom, rightBottom);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function addVolcano() {
  const volcano = new THREE.Group();
  volcano.position.copy(volcanoCenter);
  scene.add(volcano);

  const volcanoMaterial = new THREE.MeshStandardMaterial({
    color: 0x4c3326,
    roughness: 0.88,
    metalness: 0,
    flatShading: false
  });

  const cone = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 17, 14, 96, 1, false), volcanoMaterial);
  cone.position.y = 7;
  cone.castShadow = true;
  cone.receiveShadow = true;
  volcano.add(cone);
  volcanoRockParts.push(cone);

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0x2f201a,
    roughness: 0.9
  });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(5.45, 0.7, 16, 96), rimMaterial);
  rim.position.y = 14.18;
  rim.rotation.x = Math.PI / 2;
  rim.castShadow = true;
  volcano.add(rim);
  volcanoRockParts.push(rim);

  const lavaMaterial = makeLavaMaterial();
  const lavaPool = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 4.8, 0.26, 80), lavaMaterial);
  lavaPool.position.y = 14.22;
  volcano.add(lavaPool);

  const flow = new THREE.Mesh(makeLavaFlowGeometry(), lavaMaterial);
  flow.position.y = 0.08;
  volcano.add(flow);

  for (let index = 0; index < 18; index += 1) {
    const bubble = makeBubble(index, volcano.localToWorld(new THREE.Vector3(
      Math.sin(index * 2.1) * 3.2,
      14.42,
      Math.cos(index * 1.7) * 3.2
    )));
    lavaBubbles.push(bubble);
    scene.add(bubble.mesh);
  }

  for (let index = 0; index < 18; index += 1) {
    const t = index / 17;
    const point = lavaFlowPoint(t);
    const bubble = makeBubble(50 + index, volcano.localToWorld(point.add(new THREE.Vector3(0, 0.22, 0))));
    lavaBubbles.push(bubble);
    scene.add(bubble.mesh);
  }

  for (let index = 0; index < 28; index += 1) {
    lavaSparks.push(makeSpark(index, new THREE.Vector3(0, 3.2, -19.5)));
  }

  for (let index = 0; index < 18; index += 1) {
    lavaDrops.push(makeLavaDrop(index, volcano));
  }

  volcanoTunnelGroup = makeVolcanoTunnel();
  volcanoTunnelGroup.visible = false;
  volcano.add(volcanoTunnelGroup);
}

function makeVolcanoTunnel() {
  const tunnel = new THREE.Group();

  const darkMaterial = new THREE.MeshBasicMaterial({
    color: 0x050607,
    side: THREE.DoubleSide
  });
  const emberMaterial = new THREE.MeshStandardMaterial({
    color: 0xff7a1a,
    emissive: 0xff3a0b,
    emissiveIntensity: 1,
    roughness: 0.4
  });

  const entranceShape = new THREE.Shape();
  entranceShape.moveTo(-volcanoTunnelHalfWidth, 0);
  entranceShape.lineTo(-volcanoTunnelHalfWidth, volcanoTunnelHalfHeight * 0.55);
  entranceShape.quadraticCurveTo(0, volcanoTunnelHalfHeight * 1.35, volcanoTunnelHalfWidth, volcanoTunnelHalfHeight * 0.55);
  entranceShape.lineTo(volcanoTunnelHalfWidth, 0);
  entranceShape.lineTo(-volcanoTunnelHalfWidth, 0);

  const frontEntrance = new THREE.Mesh(new THREE.ShapeGeometry(entranceShape), darkMaterial);
  frontEntrance.position.set(0, 0.08, volcanoBaseRadius + 0.03);
  tunnel.add(frontEntrance);

  const backEntrance = new THREE.Mesh(new THREE.ShapeGeometry(entranceShape), darkMaterial);
  backEntrance.position.set(0, 0.08, -volcanoBaseRadius - 0.03);
  backEntrance.rotation.y = Math.PI;
  tunnel.add(backEntrance);

  const tunnelFloor = new THREE.Mesh(new THREE.PlaneGeometry(volcanoTunnelHalfWidth * 1.9, volcanoBaseRadius * 2), darkMaterial);
  tunnelFloor.position.set(0, 0.055, 0);
  tunnelFloor.rotation.x = -Math.PI / 2;
  tunnel.add(tunnelFloor);

  for (let index = 0; index < 7; index += 1) {
    const ember = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), emberMaterial);
    ember.position.set(
      (seededWave(index + 31) - 0.5) * volcanoTunnelHalfWidth * 1.4,
      0.18,
      -volcanoBaseRadius + 4 + index * 4
    );
    tunnel.add(ember);
  }

  return tunnel;
}

function makeLavaMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xff6a18,
    emissive: 0xff2e08,
    emissiveIntensity: 1.65,
    roughness: 0.38,
    metalness: 0,
    transparent: true,
    opacity: 0.95,
    side: THREE.DoubleSide
  });
}

function makeLavaFlowGeometry() {
  const vertices = [];
  const indices = [];
  const segments = 24;

  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const center = lavaFlowPoint(t);
    const width = 1.75 + t * 1.4;
    vertices.push(center.x - width / 2, center.y, center.z);
    vertices.push(center.x + width / 2, center.y, center.z);
  }

  for (let index = 0; index < segments; index += 1) {
    const leftTop = index * 2;
    const rightTop = leftTop + 1;
    const leftBottom = leftTop + 2;
    const rightBottom = leftTop + 3;
    indices.push(leftTop, leftBottom, rightTop, rightTop, leftBottom, rightBottom);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function lavaFlowPoint(t) {
  return new THREE.Vector3(
    Math.sin(t * Math.PI * 2) * 0.38,
    14.15 - 13.95 * t,
    4.6 + 12.8 * t
  );
}

function makeBubble(seed, position) {
  const material = new THREE.MeshStandardMaterial({
    color: 0xffcf4a,
    emissive: 0xff5c0d,
    emissiveIntensity: 1.25,
    roughness: 0.2
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.18 + seededWave(seed) * 0.08, 12, 8), material);
  mesh.position.copy(position);
  return {
    mesh,
    seed,
    baseY: position.y,
    baseScale: 0.45 + seededWave(seed + 8) * 0.65
  };
}

function makeSpark(seed, origin) {
  const material = new THREE.MeshBasicMaterial({
    color: seed % 3 === 0 ? 0xfff07a : 0xff6c1c
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), material);
  scene.add(mesh);
  return {
    mesh,
    seed,
    origin,
    height: 1.8 + seededWave(seed + 3) * 3.8,
    side: 0.7 + seededWave(seed + 11) * 2.2,
    speed: 0.34 + seededWave(seed + 17) * 0.45
  };
}

function makeLavaDrop(seed, volcano) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.14 + seededWave(seed) * 0.07, 10, 8),
    new THREE.MeshStandardMaterial({
      color: 0xff8a20,
      emissive: 0xff2708,
      emissiveIntensity: 1.8,
      roughness: 0.3
    })
  );
  scene.add(mesh);
  return {
    mesh,
    seed,
    volcano,
    speed: 0.18 + seededWave(seed + 9) * 0.2
  };
}

function addCave() {
  const cave = new THREE.Group();
  cave.position.set(-17, 0, -9);
  scene.add(cave);

  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x5d5b56,
    roughness: 0.95,
    metalness: 0
  });
  const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x111416,
    roughness: 1,
    side: THREE.DoubleSide
  });

  const mound = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), rockMaterial);
  mound.scale.set(6.4, 3.2, 4.4);
  mound.position.y = 1.45;
  mound.castShadow = true;
  mound.receiveShadow = true;
  cave.add(mound);

  const entranceShape = new THREE.Shape();
  entranceShape.moveTo(-2.25, 0);
  entranceShape.lineTo(-2.25, 1.65);
  entranceShape.quadraticCurveTo(0, 3.75, 2.25, 1.65);
  entranceShape.lineTo(2.25, 0);
  entranceShape.lineTo(-2.25, 0);

  const entrance = new THREE.Mesh(new THREE.ShapeGeometry(entranceShape), darkMaterial);
  entrance.position.set(0, 0.05, 4.16);
  cave.add(entrance);

  const caveFloor = new THREE.Mesh(new THREE.CircleGeometry(2.35, 32), darkMaterial);
  caveFloor.position.set(0, 0.045, 3.35);
  caveFloor.rotation.x = -Math.PI / 2;
  caveFloor.scale.set(1, 0.7, 1);
  cave.add(caveFloor);

  const stonePositions = [
    [-2.7, 0.36, 3.92, 0.7],
    [-1.55, 2.25, 4.08, 0.62],
    [0, 3.12, 4.1, 0.68],
    [1.58, 2.2, 4.08, 0.58],
    [2.68, 0.38, 3.92, 0.72]
  ];

  for (const [x, y, z, scale] of stonePositions) {
    const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 0), rockMaterial);
    stone.position.set(x, y, z);
    stone.rotation.set(y * 0.2, x * 0.15, z * 0.1);
    stone.castShadow = true;
    cave.add(stone);
  }

  addSolidObstacle({
    name: "Cave",
    x: -17,
    z: -9,
    radius: 5.5,
    minY: 0,
    maxY: 4.9
  });
}

function addTreasureChest() {
  const chest = new THREE.Group();
  chest.position.set(-8.4, 0, 4.2);
  chest.rotation.y = 0.35;
  scene.add(chest);

  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x7b421e,
    roughness: 0.76
  });
  const darkWoodMaterial = new THREE.MeshStandardMaterial({
    color: 0x4c2715,
    roughness: 0.82
  });
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xf2c94c,
    emissive: 0x6a3d00,
    emissiveIntensity: 0.12,
    roughness: 0.34,
    metalness: 0.45
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.9, 1.5), woodMaterial);
  base.position.y = 0.48;
  base.castShadow = true;
  base.receiveShadow = true;
  chest.add(base);

  const lid = new THREE.Mesh(new THREE.BoxGeometry(2.68, 0.48, 1.58), darkWoodMaterial);
  lid.position.set(0, 1.14, -0.04);
  lid.rotation.x = -0.1;
  lid.castShadow = true;
  chest.add(lid);

  const leftBand = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.48, 1.68), goldMaterial);
  leftBand.position.set(-0.78, 0.78, 0);
  chest.add(leftBand);

  const rightBand = leftBand.clone();
  rightBand.position.x = 0.78;
  chest.add(rightBand);

  const latch = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.12), goldMaterial);
  latch.position.set(0, 0.76, 0.82);
  chest.add(latch);

  const glow = new THREE.PointLight(0xffc95c, 2.6, 7, 2.2);
  glow.position.set(0, 1.1, 0.3);
  chest.add(glow);

  addSolidObstacle({
    name: "Treasure Chest",
    x: chest.position.x,
    z: chest.position.z,
    radius: 1.55,
    minY: 0,
    maxY: 1.8
  });
}

function addHouse() {
  const houseGroup = new THREE.Group();
  houseGroup.name = "WoodenHouse";
  houseGroup.position.set(8, 0, 7);
  houseGroup.rotation.y = -0.28;
  scene.add(houseGroup);

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9b987,
    roughness: 0.82
  });
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0x8f2e22,
    roughness: 0.76
  });
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0x5c341f,
    roughness: 0.8
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0xaee8ff,
    emissive: 0x326d8a,
    emissiveIntensity: 0.22,
    roughness: 0.18
  });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.28, 5.1), trimMaterial);
  floor.position.y = 0.14;
  floor.receiveShadow = true;
  addHousePart(houseGroup, floor);

  const walls = new THREE.Mesh(new THREE.BoxGeometry(6, 3.2, 4.5), wallMaterial);
  walls.position.y = 1.88;
  walls.castShadow = true;
  walls.receiveShadow = true;
  addHousePart(houseGroup, walls);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(4.4, 2.15, 4), roofMaterial);
  roof.position.y = 4.55;
  roof.rotation.y = Math.PI / 4;
  roof.scale.z = 0.82;
  roof.castShadow = true;
  addHousePart(houseGroup, roof);

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.18, 2.05, 0.12), trimMaterial);
  door.position.set(0, 1.28, 2.31);
  addHousePart(houseGroup, door);

  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshStandardMaterial({ color: 0xf2c94c, metalness: 0.4, roughness: 0.35 }));
  handle.position.set(0.36, 1.35, 2.4);
  addHousePart(houseGroup, handle);

  for (const x of [-1.82, 1.82]) {
    const window = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.82, 0.1), glassMaterial);
    window.position.set(x, 2.1, 2.32);
    addHousePart(houseGroup, window);
  }

  for (const [x, z] of [
    [-3.08, -1.7],
    [-3.08, 1.7],
    [3.08, -1.7],
    [3.08, 1.7]
  ]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 3.35, 10), trimMaterial);
    post.position.set(x, 1.78, z);
    post.castShadow = true;
    addHousePart(houseGroup, post);
  }

  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.55, 0.62), trimMaterial);
  chimney.position.set(1.65, 5.25, -0.95);
  chimney.castShadow = true;
  addHousePart(houseGroup, chimney);

  addSolidObstacle({
    name: "Wooden House",
    x: houseGroup.position.x,
    z: houseGroup.position.z,
    radius: 4.05,
    minY: 0,
    maxY: 5.8,
    isActive: () => houseGroup.parent !== null
  });

  return houseGroup;
}

function addHousePart(houseGroup, part) {
  part.userData.houseRoot = houseGroup;
  houseGroup.add(part);
  houseParts.push(part);
}

function addDragon() {
  const dragonGroup = new THREE.Group();
  dragonGroup.name = "RoundDragon";
  dragonGroup.position.set(11, 9, -25);
  dragonGroup.userData.orbitOffset = Math.PI / 2;
  scene.add(dragonGroup);

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x292044,
    emissive: 0x180c2b,
    emissiveIntensity: 0.25,
    roughness: 0.58
  });
  const wingMaterial = new THREE.MeshStandardMaterial({
    color: 0x3b2a67,
    emissive: 0x140929,
    emissiveIntensity: 0.18,
    roughness: 0.65,
    side: THREE.DoubleSide
  });
  const hornMaterial = new THREE.MeshStandardMaterial({
    color: 0xd6efff,
    emissive: 0x395c76,
    emissiveIntensity: 0.15,
    roughness: 0.28
  });
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x8efff0,
    emissive: 0x4ffff0,
    emissiveIntensity: 1.2,
    roughness: 0.2
  });
  const fireMaterial = new THREE.MeshBasicMaterial({
    color: 0xff8a24,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide
  });

  const body = new THREE.Mesh(new THREE.SphereGeometry(1.2, 28, 18), bodyMaterial);
  body.scale.set(2.45, 0.82, 0.92);
  body.castShadow = true;
  addDragonPart(dragonGroup, body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.78, 24, 16), bodyMaterial);
  head.position.set(2.75, 0.32, 0);
  head.scale.set(1.18, 0.82, 0.82);
  head.castShadow = true;
  addDragonPart(dragonGroup, head);

  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.46, 0.96, 14), bodyMaterial);
  snout.position.set(3.65, 0.23, 0);
  snout.rotation.z = -Math.PI / 2;
  snout.castShadow = true;
  addDragonPart(dragonGroup, snout);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.42, 3.2, 14), bodyMaterial);
  tail.position.set(-3.05, -0.05, 0);
  tail.rotation.z = Math.PI / 2;
  tail.castShadow = true;
  addDragonPart(dragonGroup, tail);

  const leftWing = makeDragonWing(wingMaterial);
  leftWing.position.set(-0.2, 0.15, -0.74);
  leftWing.rotation.y = 0.18;
  leftWing.castShadow = true;
  addDragonPart(dragonGroup, leftWing);
  dragonGroup.userData.leftWing = leftWing;

  const rightWing = makeDragonWing(wingMaterial);
  rightWing.position.set(-0.2, 0.15, 0.74);
  rightWing.rotation.y = Math.PI - 0.18;
  rightWing.castShadow = true;
  addDragonPart(dragonGroup, rightWing);
  dragonGroup.userData.rightWing = rightWing;

  for (const side of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.62, 10), hornMaterial);
    horn.position.set(2.82, 0.92, side * 0.34);
    horn.rotation.z = -0.38;
    horn.castShadow = true;
    dragonGroup.add(horn);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), eyeMaterial);
    eye.position.set(3.32, 0.45, side * 0.37);
    dragonGroup.add(eye);
  }

  const breath = new THREE.Mesh(new THREE.ConeGeometry(0.72, 4.6, 22, 1, true), fireMaterial);
  breath.name = "DragonBreath";
  breath.position.set(5.25, 0.05, 0);
  breath.rotation.z = -Math.PI / 2;
  breath.visible = false;
  dragonGroup.add(breath);
  dragonGroup.userData.breath = breath;

  const dragonLight = new THREE.PointLight(0x8efff0, 2.1, 11, 2.3);
  dragonLight.position.set(2.4, 0.5, 0);
  dragonGroup.add(dragonLight);

  return dragonGroup;
}

function makeDragonWing(material) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([
      -0.7, 0, 0,
      -3.6, 0.18, -3.1,
      0.95, 0.1, -1.35
    ], 3)
  );
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

function addDragonPart(dragonGroup, part) {
  part.userData.dragonRoot = dragonGroup;
  dragonGroup.add(part);
  dragonParts.push(part);
}

function makeDragonFireball(position, direction) {
  const fireball = new THREE.Group();
  fireball.name = "DragonFireball";
  fireball.position.copy(position);
  fireball.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction);

  const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xfff19a });
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff5a15,
    transparent: true,
    opacity: 0.5
  });
  const smokeMaterial = new THREE.MeshBasicMaterial({
    color: 0x7d2415,
    transparent: true,
    opacity: 0.32
  });

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.52, 16, 12), coreMaterial);
  fireball.add(core);

  const glow = new THREE.Mesh(new THREE.SphereGeometry(1.05, 18, 12), glowMaterial);
  fireball.add(glow);

  const trailPositions = [
    [-0.74, 0, 0, 0.48],
    [-1.15, 0.06, 0.08, 0.34],
    [-1.52, -0.04, -0.06, 0.22]
  ];

  for (const [x, y, z, scale] of trailPositions) {
    const trail = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), smokeMaterial);
    trail.position.set(x, y, z);
    trail.scale.set(scale * 1.45, scale * 0.8, scale * 0.8);
    fireball.add(trail);
  }

  const light = new THREE.PointLight(0xff6a1a, 4.4, 10, 2.1);
  fireball.add(light);
  scene.add(fireball);

  return {
    mesh: fireball,
    direction: direction.clone(),
    ageSeconds: 0
  };
}

function addCrystals() {
  const positions = [
    new THREE.Vector3(-6.5, 0, -17.5),
    new THREE.Vector3(5.8, 0, -15.2),
    new THREE.Vector3(1.4, 0, -9.2),
    new THREE.Vector3(10.4, 0, -23.5)
  ];

  for (let index = 0; index < positions.length; index += 1) {
    const crystal = makeCrystal(index, positions[index]);
    crystals.push(crystal);
    scene.add(crystal);
  }
}

function makeCrystal(index, position) {
  const crystal = new THREE.Group();
  crystal.name = `LavaCrystal${index + 1}`;
  crystal.position.copy(position);
  crystal.userData.isLavaCrystal = true;

  const mainMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6229,
    emissive: 0xff2f08,
    emissiveIntensity: 0.85,
    roughness: 0.24,
    metalness: 0.05,
    transparent: true,
    opacity: 0.9
  });
  const brightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd36c,
    emissive: 0xff681c,
    emissiveIntensity: 1.15,
    roughness: 0.18,
    transparent: true,
    opacity: 0.78
  });

  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.74, 0), mainMaterial);
  core.scale.set(0.75, 2.05, 0.75);
  core.position.y = 1.25;
  core.castShadow = true;
  core.userData.crystalRoot = crystal;
  crystal.add(core);
  crystalParts.push(core);

  const shardOffsets = [
    [-0.78, 0.8, 0.14, 0.42, 1.3, 0.42, -0.22],
    [0.7, 0.68, -0.2, 0.38, 1.1, 0.38, 0.28],
    [0.15, 0.48, 0.72, 0.34, 0.95, 0.34, 0.1]
  ];

  for (const [x, y, z, sx, sy, sz, turn] of shardOffsets) {
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.64, 0), brightMaterial);
    shard.scale.set(sx, sy, sz);
    shard.position.set(x, y, z);
    shard.rotation.z = turn;
    shard.castShadow = true;
    shard.userData.crystalRoot = crystal;
    crystal.add(shard);
    crystalParts.push(shard);
  }

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.04, 1.16, 0.34, 9),
    new THREE.MeshStandardMaterial({ color: 0x3f2725, roughness: 0.9 })
  );
  base.position.y = 0.16;
  base.castShadow = true;
  base.receiveShadow = true;
  base.userData.crystalRoot = crystal;
  crystal.add(base);
  crystalParts.push(base);

  addSolidObstacle({
    name: crystal.name,
    x: position.x,
    z: position.z,
    radius: 1.08,
    minY: 0,
    maxY: 2.9,
    isActive: () => crystal.parent !== null
  });

  return crystal;
}

function addSolidObstacle(obstacle) {
  solidObstacles.push(obstacle);
}

function isInsidePath(x, z) {
  const pathX = (x - pathCenter.x) / pathRadiusX;
  const pathZ = (z - pathCenter.y) / pathRadiusZ;
  return pathX * pathX + pathZ * pathZ <= 1;
}

function handleKeyDown(event) {
  if (isGameKey(event.code)) {
    event.preventDefault();
  }

  if (event.code === "KeyI") {
    if (gameStarted && !event.repeat) {
      toggleBackpack();
    }
    return;
  }

  if (event.code === "Escape" && inventoryOpen) {
    closeBackpack();
    return;
  }

  if (inventoryOpen) {
    return;
  }

  switch (event.code) {
    case "KeyW":
    case "ArrowUp":
      move.forward = true;
      break;
    case "KeyS":
    case "ArrowDown":
      move.backward = true;
      break;
    case "KeyA":
    case "ArrowLeft":
      move.left = true;
      break;
    case "KeyD":
    case "ArrowRight":
      move.right = true;
      break;
    case "Space":
      if (canFly) {
        move.up = true;
      } else if (canJump) {
        velocity.y = jumpSpeed;
        canJump = false;
      }
      break;
    case "ShiftLeft":
    case "ShiftRight":
      if (canFly) {
        move.down = true;
      }
      break;
    case "KeyE":
      eatMeat();
      break;
    case "KeyQ":
      toggleTool();
      break;
    case "Digit1":
    case "Digit2":
    case "Digit3":
    case "Digit4":
    case "Digit5":
    case "Digit6":
    case "Digit7":
    case "Digit8":
      useHotbarSlot(Number(event.code.slice(5)) - 1);
      break;
    default:
      break;
  }
}

function handleKeyUp(event) {
  if (isGameKey(event.code)) {
    event.preventDefault();
  }

  switch (event.code) {
    case "KeyW":
    case "ArrowUp":
      move.forward = false;
      break;
    case "KeyS":
    case "ArrowDown":
      move.backward = false;
      break;
    case "KeyA":
    case "ArrowLeft":
      move.left = false;
      break;
    case "KeyD":
    case "ArrowRight":
      move.right = false;
      break;
    case "Space":
      move.up = false;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      move.down = false;
      break;
    default:
      break;
  }
}

function isGameKey(code) {
  switch (code) {
    case "KeyW":
    case "ArrowUp":
    case "KeyS":
    case "ArrowDown":
    case "KeyA":
    case "ArrowLeft":
    case "KeyD":
    case "ArrowRight":
    case "Space":
    case "ShiftLeft":
    case "ShiftRight":
    case "KeyE":
    case "KeyQ":
    case "KeyI":
    case "Escape":
    case "Digit1":
    case "Digit2":
    case "Digit3":
    case "Digit4":
    case "Digit5":
    case "Digit6":
    case "Digit7":
    case "Digit8":
      return true;
    default:
      return false;
  }
}

function toggleTool() {
  setActiveTool(activeTool === toolPickaxe ? toolBow : toolPickaxe);
}

function setActiveTool(tool) {
  activeTool = tool;
  activeCrystal = null;
  activeHouse = null;
  activeVolcanoRock = false;
  miningProgress = 0;
  updateMiningBar();
  updateToolVisibility();
  updatePlayerHud();
  updateInventoryHud();
  showMessage(`${activeTool} ready.`);
}

function updateToolVisibility() {
  pickaxe.visible = activeTool === toolPickaxe;
  bow.visible = activeTool === toolBow;
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;

  updateLook(delta);
  updatePlayer(delta);
  sheepSystem.update(delta);
  sheepSystem.updateRespawn(delta);
  sheepSystem.updateMelee(time);
  updateMining(delta, time);
  updateLava(time, delta);
  updateDragon(time, delta);
  updatePlayerArrows(delta);
  updateDragonFight(time, delta);
  audio.updateLava(time, gameStarted);
  updatePickaxe(time, delta);
  updateBow(delta);
  updateMessage(delta);

  renderer.render(scene, camera);
}

function updateLook(delta) {
  const lookMix = Math.min(delta * lookSharpness, 1);
  yaw += (targetYaw - yaw) * lookMix;
  pitch += (targetPitch - pitch) * lookMix;
  player.rotation.set(pitch, yaw, 0);
}

function updatePlayer(delta) {
  if (!gameStarted) {
    return;
  }

  const swimming = isSwimming();

  if (canFly) {
    velocity.y = (Number(move.up) - Number(move.down)) * flyingVerticalSpeed;
  } else if (swimming) {
    const swimY = waterSurfaceY + swimEyeHeight;
    velocity.y = 0;
    player.position.y += (swimY - player.position.y) * Math.min(delta * swimFloatSharpness, 1);
  } else {
    velocity.y -= gravity * delta;
  }

  const forwardInput = Number(move.forward) - Number(move.backward);
  const rightInput = Number(move.right) - Number(move.left);
  desiredMove.set(0, 0, 0);

  if (forwardInput !== 0 || rightInput !== 0) {
    player.getWorldDirection(forwardVector);
    forwardVector.y = 0;
    forwardVector.normalize();
    rightVector.crossVectors(forwardVector, player.up).normalize();
    desiredMove.addScaledVector(forwardVector, forwardInput);
    desiredMove.addScaledVector(rightVector, rightInput);
    desiredMove.normalize().multiplyScalar(swimming ? swimSpeed : canFly ? flyingSpeed : walkSpeed);
  }

  const movementMix = Math.min(delta * movementSharpness, 1);
  velocity.x += (desiredMove.x - velocity.x) * movementMix;
  velocity.z += (desiredMove.z - velocity.z) * movementMix;

  player.position.x += velocity.x * delta;
  player.position.z += velocity.z * delta;
  player.position.y += velocity.y * delta;

  player.position.x = THREE.MathUtils.clamp(player.position.x, -worldHalfSize, worldHalfSize);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -worldHalfSize, worldHalfSize);
  applySolidObstacleResistance();

  if (canFly) {
    const safeFlyingHeight = groundHeightAt(player.position.x, player.position.z) + playerHeight;
    player.position.y = THREE.MathUtils.clamp(player.position.y, safeFlyingHeight, 34);
    canJump = false;
    return;
  }

  if (isSwimming()) {
    velocity.y = 0;
    player.position.y = waterSurfaceY + swimEyeHeight;
    canJump = false;
    return;
  }

  const standingHeight = groundHeightAt(player.position.x, player.position.z) + playerHeight;

  if (player.position.y < standingHeight) {
    velocity.y = 0;
    player.position.y = standingHeight;
    canJump = true;
  }
}

function applySolidObstacleResistance() {
  const playerFootY = player.position.y - playerHeight;
  const playerHeadY = player.position.y + 0.15;

  for (const obstacle of solidObstacles) {
    if (obstacle.isActive && !obstacle.isActive()) {
      continue;
    }
    if (playerHeadY < obstacle.minY || playerFootY > obstacle.maxY) {
      continue;
    }

    pushPlayerOutOfCircle(obstacle.x, obstacle.z, obstacle.radius + playerRadius);
  }

  if (dragonAlive && Math.abs(player.position.y - dragon.position.y) < 2.8) {
    pushPlayerOutOfCircle(dragon.position.x, dragon.position.z, 3.2);
  }
}

function pushPlayerOutOfCircle(centerX, centerZ, minimumDistance) {
  const offsetX = player.position.x - centerX;
  const offsetZ = player.position.z - centerZ;
  const distance = Math.hypot(offsetX, offsetZ);

  if (distance >= minimumDistance) {
    return;
  }

  const normalX = distance > 0 ? offsetX / distance : 1;
  const normalZ = distance > 0 ? offsetZ / distance : 0;
  const pushDistance = minimumDistance - distance;
  player.position.x += normalX * pushDistance;
  player.position.z += normalZ * pushDistance;

  const velocityIntoObstacle = velocity.x * normalX + velocity.z * normalZ;
  if (velocityIntoObstacle < 0) {
    velocity.x -= velocityIntoObstacle * normalX;
    velocity.z -= velocityIntoObstacle * normalZ;
  }
}

function groundHeightAt(x, z) {
  if (isInsideOpenVolcanoTunnel(x, z)) {
    return 0;
  }

  const localX = x - volcanoCenter.x;
  const localZ = z - volcanoCenter.z;
  const distanceFromCenter = Math.hypot(localX, localZ);

  if (distanceFromCenter > volcanoBaseRadius) {
    return 0;
  }

  if (distanceFromCenter <= volcanoTopRadius) {
    return volcanoHeight;
  }

  const slope = (volcanoBaseRadius - distanceFromCenter) / (volcanoBaseRadius - volcanoTopRadius);
  return slope * volcanoHeight;
}

function isInsideOpenVolcanoTunnel(x, z) {
  if (!volcanoTunnelOpen) {
    return false;
  }

  const localX = x - volcanoCenter.x;
  const localZ = z - volcanoCenter.z;
  return Math.abs(localX) <= volcanoTunnelHalfWidth && Math.abs(localZ) <= volcanoBaseRadius;
}

function isSwimming() {
  return !canFly && isInsideWater(player.position.x, player.position.z);
}

function isInsideWater(x, z) {
  const lakeDistance = Math.hypot((x - lakeCenter.x) / 1.22, (z - lakeCenter.y) / 0.82);

  if (lakeDistance <= lakeRadius + playerRadius) {
    return true;
  }

  return distanceToRiver(x, z) <= riverHalfWidth + playerRadius;
}

function distanceToRiver(x, z) {
  let nearestDistance = Infinity;

  for (let index = 0; index < riverPath.length - 1; index += 1) {
    const start = riverPath[index];
    const end = riverPath[index + 1];
    const segmentX = end.x - start.x;
    const segmentZ = end.y - start.y;
    const segmentLengthSq = segmentX * segmentX + segmentZ * segmentZ;
    const t = THREE.MathUtils.clamp(((x - start.x) * segmentX + (z - start.y) * segmentZ) / segmentLengthSq, 0, 1);
    const closestX = start.x + segmentX * t;
    const closestZ = start.y + segmentZ * t;
    nearestDistance = Math.min(nearestDistance, Math.hypot(x - closestX, z - closestZ));
  }

  return nearestDistance;
}

function segmentHitsSolidObstacle(start, end, projectileRadius, ignoreSheep) {
  const segmentX = end.x - start.x;
  const segmentZ = end.z - start.z;
  const segmentLengthSq = segmentX * segmentX + segmentZ * segmentZ;

  for (const obstacle of solidObstacles) {
    if (ignoreSheep && obstacle.name.startsWith("Sheep")) {
      continue;
    }

    if (obstacle.isActive && !obstacle.isActive()) {
      continue;
    }

    const t = segmentLengthSq === 0
      ? 0
      : THREE.MathUtils.clamp(((obstacle.x - start.x) * segmentX + (obstacle.z - start.z) * segmentZ) / segmentLengthSq, 0, 1);
    const closestX = start.x + segmentX * t;
    const closestZ = start.z + segmentZ * t;
    const closestY = start.y + (end.y - start.y) * t;

    if (closestY < obstacle.minY - projectileRadius || closestY > obstacle.maxY + projectileRadius) {
      continue;
    }

    if (Math.hypot(closestX - obstacle.x, closestZ - obstacle.z) <= obstacle.radius + projectileRadius) {
      return true;
    }
  }

  return false;
}

function updateMining(delta, time) {
  if (activeTool !== toolPickaxe) {
    activeCrystal = null;
    activeHouse = null;
    activeVolcanoRock = false;
    miningProgress = 0;
    updateMiningBar();
    return;
  }

  visibleCrystal = findCrystalInView();
  visibleHouse = findHouseInView();
  visibleVolcanoRock = !volcanoTunnelOpen && findVolcanoRockInView();

  if (!mouseDown || (visibleCrystal === null && visibleHouse === null && !visibleVolcanoRock)) {
    activeCrystal = null;
    activeHouse = null;
    activeVolcanoRock = false;
    miningProgress = 0;
    updateMiningBar();
    return;
  }

  if (visibleCrystal !== null) {
    mineLabel.textContent = "Lava Crystal";
    if (activeCrystal !== visibleCrystal) {
      activeCrystal = visibleCrystal;
      activeHouse = null;
      activeVolcanoRock = false;
      miningProgress = 0;
    }
  } else if (visibleHouse !== null) {
    mineLabel.textContent = "Wooden House";
    if (activeHouse !== visibleHouse) {
      activeCrystal = null;
      activeHouse = visibleHouse;
      activeVolcanoRock = false;
      miningProgress = 0;
    }
  } else if (!activeVolcanoRock) {
    mineLabel.textContent = "Volcano Tunnel";
    activeCrystal = null;
    activeHouse = null;
    activeVolcanoRock = true;
    miningProgress = 0;
  }

  miningProgress += delta;
  updateMiningBar();
  playMiningSound(time);

  if (activeCrystal !== null && miningProgress >= crystalMiningSeconds) {
    collectCrystal(activeCrystal);
    activeCrystal = null;
    visibleCrystal = null;
    miningProgress = 0;
    updateMiningBar();
    return;
  }

  if (activeHouse !== null && miningProgress >= houseDestroySeconds) {
    destroyHouse(activeHouse);
    activeHouse = null;
    visibleHouse = null;
    miningProgress = 0;
    updateMiningBar();
    return;
  }

  if (activeVolcanoRock && miningProgress >= volcanoDigSeconds) {
    openVolcanoTunnel();
    activeVolcanoRock = false;
    visibleVolcanoRock = false;
    miningProgress = 0;
    updateMiningBar();
  }
}

function playMiningSound(time) {
  if (time < nextPickaxeHitTime) {
    return;
  }

  audio.playPickaxeHit();
  nextPickaxeHitTime = time + pickaxeHitSeconds;
}

function findCrystalInView() {
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const hits = raycaster.intersectObjects(crystalParts, false);

  for (const hit of hits) {
    const crystal = hit.object.userData.crystalRoot;
    if (crystal && hit.distance <= crystalReach && crystal.parent !== null) {
      return crystal;
    }
  }

  player.getWorldDirection(aimDirection);
  let bestCrystal = null;
  let bestAim = crystalAimDot;

  for (const crystal of crystals) {
    if (crystal.parent === null) {
      continue;
    }

    aimTarget.copy(crystal.position);
    aimTarget.y += 1.2;
    aimTarget.sub(player.position);
    const distance = aimTarget.length();

    if (distance > crystalReach) {
      continue;
    }

    const aim = aimDirection.dot(aimTarget.normalize());
    if (aim > bestAim) {
      bestAim = aim;
      bestCrystal = crystal;
    }
  }

  if (bestCrystal !== null) {
    return bestCrystal;
  }

  return null;
}

function findVolcanoRockInView() {
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const hits = raycaster.intersectObjects(volcanoRockParts, false);

  for (const hit of hits) {
    if (hit.distance <= volcanoDigReach) {
      return true;
    }
  }

  const localX = player.position.x - volcanoCenter.x;
  const localZ = player.position.z - volcanoCenter.z;
  const distanceFromVolcano = Math.hypot(localX, localZ);

  if (distanceFromVolcano > volcanoBaseRadius + 4 || distanceFromVolcano < volcanoTopRadius - 0.8) {
    return false;
  }

  player.getWorldDirection(aimDirection);
  aimTarget.set(volcanoCenter.x, Math.max(2.4, player.position.y - 0.4), volcanoCenter.z);
  aimTarget.sub(player.position);
  return aimDirection.dot(aimTarget.normalize()) > volcanoAimDot;
}

function findHouseInView() {
  if (house.parent === null) {
    return null;
  }

  house.updateMatrixWorld(true);
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const hits = raycaster.intersectObjects(houseParts, false);

  for (const hit of hits) {
    const houseRoot = hit.object.userData.houseRoot;
    if (houseRoot && houseRoot.parent !== null && hit.distance <= houseReach) {
      return houseRoot;
    }
  }

  return null;
}

function updateMiningBar() {
  const active = mouseDown && (activeCrystal !== null || activeHouse !== null || activeVolcanoRock);
  minePanel.classList.toggle("visible", active);
  const neededSeconds = activeHouse !== null ? houseDestroySeconds : activeVolcanoRock ? volcanoDigSeconds : crystalMiningSeconds;
  const percent = Math.min(miningProgress / neededSeconds, 1) * 100;
  mineFill.style.width = `${percent}%`;
}

function collectCrystal(crystal) {
  if (crystal === null) {
    throw new Error("Cannot collect a missing crystal.");
  }

  scene.remove(crystal);
  removeCrystalParts(crystal);
  addInventoryItem("lavaCrystal", 1);
  updateInventoryHud();
  showMessage("Lava crystal collected!");
}

function removeCrystalParts(crystal) {
  for (let index = crystalParts.length - 1; index >= 0; index -= 1) {
    if (crystalParts[index].userData.crystalRoot === crystal) {
      crystalParts.splice(index, 1);
    }
  }
}

function destroyHouse(houseGroup) {
  if (houseGroup === null) {
    throw new Error("Cannot destroy a missing house.");
  }

  scene.remove(houseGroup);
  removeHouseParts(houseGroup);
  addInventoryItem("wood", houseWoodRewardCount);
  updateInventoryHud();
  showMessage(`House destroyed! Wood +${houseWoodRewardCount}.`);
}

function removeHouseParts(houseGroup) {
  for (let index = houseParts.length - 1; index >= 0; index -= 1) {
    if (houseParts[index].userData.houseRoot === houseGroup) {
      houseParts.splice(index, 1);
    }
  }
}

function openVolcanoTunnel() {
  volcanoTunnelOpen = true;
  if (volcanoTunnelGroup === null) {
    throw new Error("Volcano tunnel was not created.");
  }

  volcanoTunnelGroup.visible = true;
  showMessage("Volcano tunnel opened!");
}

function updateDragon(time, delta) {
  if (!dragonAlive) {
    if (dragonFalling) {
      dragon.position.y = Math.max(dragonDeadGroundY, dragon.position.y - delta * 3.6);

      if (dragon.position.y <= dragonDeadGroundY) {
        dragon.position.y = dragonDeadGroundY;
        dragonFalling = false;
      }
    }
    dragon.updateMatrixWorld(true);
    return;
  }

  const orbitAngle = time * 0.34 + dragon.userData.orbitOffset;
  const x = Math.cos(orbitAngle) * 18;
  const z = -22 + Math.sin(orbitAngle) * 12;
  const flightY = Math.max(10.8 + Math.sin(time * 1.35) * 1.2, groundHeightAt(x, z) + dragonFlightGroundClearance);
  dragon.position.set(x, flightY, z);
  dragonFacingDirection.set(player.position.x - dragon.position.x, 0, player.position.z - dragon.position.z);
  if (dragonFacingDirection.lengthSq() > 0.0001) {
    dragonFacingDirection.normalize();
    dragon.rotation.y = Math.atan2(-dragonFacingDirection.z, dragonFacingDirection.x);
  }
  dragon.rotation.z = Math.sin(time * 2.6) * 0.09;

  const wingFlap = Math.sin(time * 7.5) * 0.45;
  dragon.userData.leftWing.rotation.x = wingFlap;
  dragon.userData.rightWing.rotation.x = -wingFlap;

  dragonBreathGlowSeconds = Math.max(0, dragonBreathGlowSeconds - delta);
  dragon.userData.breath.visible = dragonBreathGlowSeconds > 0;
  if (dragon.userData.breath.visible) {
    dragon.userData.breath.scale.setScalar(0.92 + Math.max(0, Math.sin(time * 18)) * 0.24);
  }

  if (dragonHitFlash > 0) {
    dragonHitFlash = Math.max(0, dragonHitFlash - delta);
    dragon.scale.setScalar(1 + dragonHitFlash * 0.7);
  } else {
    dragon.scale.setScalar(1);
  }

  dragon.updateMatrixWorld(true);
}

function updateDragonFight(time, delta) {
  updateDragonFireballs(delta);

  if (!dragonAlive || !gameStarted || time < nextDragonFireTime) {
    return;
  }

  const dragonDistance = player.position.distanceTo(dragon.position);
  if (dragonDistance <= dragonFireRange) {
    breatheDragonFire();
    nextDragonFireTime = time + dragonFireCooldownSeconds;
  }
}

function breatheDragonFire() {
  dragonMouthPosition.set(dragonFireMouthX, 0.05, 0);
  dragon.localToWorld(dragonMouthPosition);

  dragonFireTarget.copy(player.position);
  dragonFireTarget.y -= dragonFireTargetLowering;
  dragonFireDirection.copy(dragonFireTarget).sub(dragonMouthPosition);

  if (dragonFireDirection.lengthSq() <= 0.0001) {
    return;
  }

  dragonFireDirection.normalize();
  dragonFireballs.push(makeDragonFireball(dragonMouthPosition, dragonFireDirection));
  dragonBreathGlowSeconds = dragonBreathFlashSeconds;
  audio.playDragonFire();
}

function updateDragonFireballs(delta) {
  for (let index = dragonFireballs.length - 1; index >= 0; index -= 1) {
    const fireball = dragonFireballs[index];
    fireball.ageSeconds += delta;
    projectilePreviousPosition.copy(fireball.mesh.position);
    fireball.mesh.position.addScaledVector(fireball.direction, dragonFireSpeed * delta);
    fireball.mesh.scale.setScalar(0.9 + Math.sin(fireball.ageSeconds * 22) * 0.1);

    dragonFireTarget.copy(player.position);
    dragonFireTarget.y -= dragonFireTargetLowering;

    if (
      segmentHitsSolidObstacle(projectilePreviousPosition, fireball.mesh.position, dragonFireObstacleRadius, false)
      || fireball.mesh.position.y <= groundHeightAt(fireball.mesh.position.x, fireball.mesh.position.z) + dragonFireObstacleRadius
    ) {
      removeDragonFireball(index);
      continue;
    }

    if (dragonAlive && gameStarted && fireball.mesh.position.distanceTo(dragonFireTarget) <= dragonFireHitRadius) {
      removeDragonFireball(index);
      damagePlayer("Dragon fire hit!", "The dragon fire got you. Back to the start!");
      continue;
    }

    if (fireball.ageSeconds >= dragonFireLifeSeconds) {
      removeDragonFireball(index);
    }
  }
}

function removeDragonFireball(index) {
  const [fireball] = dragonFireballs.splice(index, 1);
  scene.remove(fireball.mesh);
}

function clearDragonFireballs() {
  for (let index = dragonFireballs.length - 1; index >= 0; index -= 1) {
    removeDragonFireball(index);
  }
}

function shootArrow(time) {
  if (activeTool !== toolBow || time < nextArrowShotTime) {
    return;
  }

  player.getWorldDirection(arrowDirection);
  arrowStartPosition.copy(player.position).addScaledVector(arrowDirection, 1.15);
  playerArrows.push(toolKit.makePlayerArrow(arrowStartPosition, arrowDirection));
  nextArrowShotTime = time + arrowShotCooldownSeconds;
  bowKick = 1;
  audio.playBowShot();
}

function updatePlayerArrows(delta) {
  for (let index = playerArrows.length - 1; index >= 0; index -= 1) {
    const arrow = playerArrows[index];
    arrow.ageSeconds += delta;
    arrowPreviousPosition.copy(arrow.mesh.position);

    const travelDistance = arrowSpeed * delta;
    arrow.mesh.position.addScaledVector(arrow.direction, travelDistance);

    if (segmentHitsSolidObstacle(arrowPreviousPosition, arrow.mesh.position, projectileObstacleRadius, true)) {
      removePlayerArrow(index);
      continue;
    }

    const hitSheep = sheepSystem.findHitByArrow(arrowPreviousPosition, arrow.direction, travelDistance);
    if (hitSheep !== null) {
      removePlayerArrow(index);
      audio.playArrowHit();
      sheepSystem.kill(hitSheep, "Sheep meat collected!");
      continue;
    }

    if (findDragonHitByArrow(arrowPreviousPosition, arrow.direction, travelDistance)) {
      removePlayerArrow(index);
      damageDragonByArrow();
      continue;
    }

    const groundHeight = groundHeightAt(arrow.mesh.position.x, arrow.mesh.position.z);
    if (arrow.ageSeconds >= arrowLifeSeconds || arrow.mesh.position.y <= groundHeight + 0.12) {
      removePlayerArrow(index);
    }
  }
}

function findDragonHitByArrow(start, direction, distance) {
  if (!dragonAlive) {
    return false;
  }

  dragon.updateMatrixWorld(true);
  arrowRaycaster.set(start, direction);
  arrowRaycaster.near = 0;
  arrowRaycaster.far = distance + arrowHitPadding;

  const hits = arrowRaycaster.intersectObjects(dragonParts, false);

  for (const hit of hits) {
    const hitDragonRoot = hit.object.userData.dragonRoot;
    if (hitDragonRoot && hitDragonRoot.parent !== null) {
      return true;
    }
  }

  return false;
}

function removePlayerArrow(index) {
  const [arrow] = playerArrows.splice(index, 1);
  scene.remove(arrow.mesh);
}

function damageDragonByArrow() {
  if (!dragonAlive) {
    return;
  }

  dragonHealth = Math.max(0, dragonHealth - 1);
  dragonHitFlash = 0.18;
  audio.playArrowHit();
  updateDragonBar();

  if (dragonHealth > 0) {
    showMessage(`Arrow hit! ${dragonHealth} dragon hearts left.`);
    return;
  }

  defeatDragon();
}

function defeatDragon() {
  if (dragonDefeated) {
    return;
  }

  dragonAlive = false;
  dragonDefeated = true;
  dragonFalling = true;
  dragon.rotation.set(0, dragon.rotation.y, Math.PI / 2);
  dragon.userData.breath.visible = false;
  dragonBreathGlowSeconds = 0;
  clearDragonFireballs();
  dragon.userData.leftWing.rotation.x = -0.35;
  dragon.userData.rightWing.rotation.x = 0.35;
  canFly = true;
  addInventoryItem("diamond", 1);
  addInventoryItem("diamondPickaxe", 2);
  addInventoryItem("dragonMeat", 3);
  updatePlayerHud();
  updateInventoryHud();
  updateDragonBar();
  showMessage("Round Dragon defeated! You got diamond, two diamond pickaxes, dragon meat, and flying!");
}

function damagePlayer(hitMessage, deathMessage) {
  playerHearts = Math.max(0, playerHearts - 1);
  updatePlayerHud();

  if (playerHearts > 0) {
    showMessage(`${hitMessage} ${playerHearts} hearts left.`);
    return;
  }

  playerHearts = maxPlayerHearts;
  player.position.set(0, playerHeight, 22);
  velocity.set(0, 0, 0);
  updatePlayerHud();
  showMessage(deathMessage);
}

function collectSheepMeat(messageText) {
  addInventoryItem("sheepMeat", 1);
  updateInventoryHud();
  showMessage(messageText);
}

function eatMeat() {
  if (countInventoryItem("sheepMeat") <= 0 && countInventoryItem("dragonMeat") <= 0) {
    showMessage("No meat yet.");
    return;
  }

  if (playerHearts >= maxPlayerHearts) {
    showMessage("Hearts are already full.");
    return;
  }

  if (countInventoryItem("sheepMeat") > 0) {
    removeInventoryItem("sheepMeat", 1);
    playerHearts = Math.min(maxPlayerHearts, playerHearts + sheepMeatHealHearts);
    updatePlayerHud();
    updateInventoryHud();
    showMessage("Sheep meat eaten. One heart restored!");
    return;
  }

  removeInventoryItem("dragonMeat", 1);
  playerHearts = Math.min(maxPlayerHearts, playerHearts + dragonMeatHealHearts);
  updatePlayerHud();
  updateInventoryHud();
  showMessage("Dragon meat eaten. Hearts restored!");
}

function updatePlayerHud() {
  heartCountLabel.textContent = `${playerHearts}/${maxPlayerHearts}`;
  flyingStateLabel.textContent = canFly ? "Yes" : "No";
  toolStateLabel.textContent = activeTool;
}

function updateInventoryHud() {
  crystalCountLabel.textContent = String(countInventoryItem("lavaCrystal"));
  diamondCountLabel.textContent = String(countInventoryItem("diamond"));
  diamondPickaxeCountLabel.textContent = String(countInventoryItem("diamondPickaxe"));
  dragonMeatCountLabel.textContent = String(countInventoryItem("dragonMeat"));
  sheepMeatCountLabel.textContent = String(countInventoryItem("sheepMeat"));
  woodCountLabel.textContent = String(countInventoryItem("wood"));
  renderHotbar();

  if (inventoryOpen) {
    renderBackpack();
  }
}

function addInventoryItem(itemId, count) {
  if (!inventoryItems[itemId]) {
    throw new Error(`Unknown inventory item: ${itemId}`);
  }

  const existingStack = findInventoryStack(itemId);
  if (existingStack !== null) {
    existingStack.count += count;
    return;
  }

  const emptyBackpackIndex = backpackSlots.findIndex((slot) => slot === null);
  if (emptyBackpackIndex !== -1) {
    backpackSlots[emptyBackpackIndex] = { itemId, count };
    return;
  }

  const emptyHotbarIndex = hotbarSlots.findIndex((slot) => slot === null);
  if (emptyHotbarIndex !== -1) {
    hotbarSlots[emptyHotbarIndex] = { itemId, count };
    return;
  }

  throw new Error("Backpack is full.");
}

function removeInventoryItem(itemId, count) {
  if (countInventoryItem(itemId) < count) {
    throw new Error(`Not enough ${itemId} in inventory.`);
  }

  let remaining = count;
  for (const slots of [hotbarSlots, backpackSlots]) {
    for (let index = 0; index < slots.length; index += 1) {
      const slot = slots[index];
      if (slot === null || slot.itemId !== itemId || slot.locked) {
        continue;
      }

      const removed = Math.min(slot.count, remaining);
      slot.count -= removed;
      remaining -= removed;

      if (slot.count <= 0) {
        slots[index] = null;
      }

      if (remaining <= 0) {
        return;
      }
    }
  }
}

function countInventoryItem(itemId) {
  let total = 0;
  for (const slot of [...hotbarSlots, ...backpackSlots]) {
    if (slot !== null && slot.itemId === itemId && !slot.locked) {
      total += slot.count;
    }
  }
  return total;
}

function findInventoryStack(itemId) {
  for (const slot of [...backpackSlots, ...hotbarSlots]) {
    if (slot !== null && slot.itemId === itemId && !slot.locked) {
      return slot;
    }
  }
  return null;
}

function toggleBackpack() {
  if (inventoryOpen) {
    closeBackpack();
    return;
  }

  openBackpack();
}

function openBackpack() {
  restorePointerLockAfterBackpack = pointerLocked;
  inventoryOpen = true;
  stopPlayerInput();

  if (document.pointerLockElement === renderer.domElement) {
    document.exitPointerLock();
  }

  backpackOverlay.classList.remove("hidden");
  backpackOverlay.setAttribute("aria-hidden", "false");
  renderBackpack();
}

function closeBackpack() {
  if (!inventoryOpen) {
    return;
  }

  if (heldInventoryStack !== null) {
    addInventoryItem(heldInventoryStack.itemId, heldInventoryStack.count);
    heldInventoryStack = null;
  }

  inventoryOpen = false;
  backpackOverlay.classList.add("hidden");
  backpackOverlay.setAttribute("aria-hidden", "true");
  updateInventoryHud();

  if (restorePointerLockAfterBackpack) {
    restorePointerLockAfterBackpack = false;
    void restorePointerLock();
  }
}

async function restorePointerLock() {
  if (!gameStarted || pointerLocked || pointerLockFallback) {
    return;
  }

  if (!("requestPointerLock" in renderer.domElement)) {
    pointerLockFallback = true;
    showMessage("Mouse lock is missing. Hold right mouse to look.");
    return;
  }

  try {
    await renderer.domElement.requestPointerLock();
  } catch (error) {
    pointerLockFallback = true;
    showMessage("Hold right mouse to look.");
  }
}

function handleBackpackClick(event) {
  const slotButton = event.target.closest(".slotButton");
  if (slotButton === null) {
    return;
  }

  const area = slotButton.dataset.area;
  const index = Number(slotButton.dataset.index);
  const slots = area === "hotbar" ? hotbarSlots : backpackSlots;
  const slot = slots[index];

  if (slot && slot.locked) {
    setActiveTool(inventoryItems[slot.itemId].tool);
    return;
  }

  if (heldInventoryStack === null) {
    if (slot === null) {
      return;
    }

    heldInventoryStack = slot;
    slots[index] = null;
    renderBackpack();
    updateInventoryHud();
    return;
  }

  if (slot === null) {
    slots[index] = heldInventoryStack;
    heldInventoryStack = null;
    renderBackpack();
    updateInventoryHud();
    return;
  }

  if (slot.itemId === heldInventoryStack.itemId) {
    slot.count += heldInventoryStack.count;
    heldInventoryStack = null;
    renderBackpack();
    updateInventoryHud();
    return;
  }

  slots[index] = heldInventoryStack;
  heldInventoryStack = slot;
  renderBackpack();
  updateInventoryHud();
}

function useHotbarSlot(index) {
  const slot = hotbarSlots[index];
  if (slot === null) {
    return;
  }

  const item = inventoryItems[slot.itemId];
  if (item.tool) {
    setActiveTool(item.tool);
    return;
  }

  if (slot.itemId === "sheepMeat" || slot.itemId === "dragonMeat") {
    eatMeat();
  }
}

function renderHotbar() {
  hotbar.replaceChildren();

  for (let index = 0; index < hotbarSlots.length; index += 1) {
    hotbar.appendChild(makeSlotElement(hotbarSlots[index], "hotbar", index, false));
  }
}

function renderBackpack() {
  backpackHotbarSlots.replaceChildren();
  backpackSlotsElement.replaceChildren();

  for (let index = 0; index < hotbarSlots.length; index += 1) {
    backpackHotbarSlots.appendChild(makeSlotElement(hotbarSlots[index], "hotbar", index, true));
  }

  for (let index = 0; index < backpackSlots.length; index += 1) {
    backpackSlotsElement.appendChild(makeSlotElement(backpackSlots[index], "backpack", index, true));
  }

  heldItemLabel.textContent = heldInventoryStack === null
    ? "Hand: empty"
    : `Hand: ${inventoryItems[heldInventoryStack.itemId].name} x${heldInventoryStack.count}`;
}

function makeSlotElement(slot, area, index, interactive) {
  const element = document.createElement(interactive ? "button" : "div");
  element.className = interactive ? "slotButton" : "hotbarSlot";
  element.dataset.area = area;
  element.dataset.index = String(index);

  if (slot === null) {
    element.innerHTML = `<span class="slotName">${index + 1}</span>`;
    return element;
  }

  const item = inventoryItems[slot.itemId];
  element.classList.toggle("locked", Boolean(slot.locked));
  element.classList.toggle("activeTool", item.tool === activeTool);
  element.innerHTML = `
    <span class="slotName">${item.shortName}</span>
    ${slot.count > 1 ? `<span class="slotCount">${slot.count}</span>` : ""}
  `;
  return element;
}

function updateDragonBar() {
  const percent = Math.max(0, dragonHealth / dragonMaxHealth) * 100;
  dragonFill.style.width = `${percent}%`;
  dragonPanel.classList.toggle("hidden", dragonHealth <= 0);
}

function updateLava(time) {
  for (const bubble of lavaBubbles) {
    const phase = (time * 1.9 + bubble.seed * 0.37) % 1;
    const pulse = Math.sin(phase * Math.PI);
    bubble.mesh.position.y = bubble.baseY + pulse * 0.16;
    bubble.mesh.scale.setScalar(bubble.baseScale * (0.58 + pulse * 0.78));
    bubble.mesh.visible = phase < 0.94;
  }

  for (const spark of lavaSparks) {
    const phase = (time * spark.speed + spark.seed * 0.13) % 1;
    const angle = spark.seed * 2.39 + phase * 1.6;
    spark.mesh.position.set(
      spark.origin.x + Math.cos(angle) * spark.side * phase,
      spark.origin.y + phase * spark.height,
      spark.origin.z + Math.sin(angle) * spark.side * phase
    );
    spark.mesh.scale.setScalar(1 - phase * 0.75);
  }

  for (const drop of lavaDrops) {
    const phase = (time * drop.speed + drop.seed * 0.21) % 1;
    const point = lavaFlowPoint(phase);
    point.y += 0.28;
    drop.mesh.position.copy(drop.volcano.localToWorld(point));
  }
}

function updatePickaxe(time, delta) {
  const targetSwing = mouseDown && gameStarted && activeTool === toolPickaxe ? 1 : 0;
  pickaxeSwing += (targetSwing - pickaxeSwing) * Math.min(delta * 10, 1);

  const hit = Math.abs(Math.sin(time * 14)) * pickaxeSwing;
  pickaxe.rotation.x = -0.34 - hit * 0.58;
  pickaxe.rotation.y = -0.5 + hit * 0.18;
  pickaxe.rotation.z = -0.34 - hit * 0.16;
  pickaxe.position.y = -0.62 + hit * 0.1;
  pickaxe.position.z = -1.25 + hit * 0.08;
}

function updateBow(delta) {
  bowKick = Math.max(0, bowKick - delta * 5.5);
  const pull = bowKick * bowKick;
  bow.position.set(0.62 + pull * 0.04, -0.48 - pull * 0.03, -1.12 + pull * 0.12);
  bow.rotation.set(-0.08 - pull * 0.1, -0.38, 0.12 + pull * 0.05);

  if (bow.userData.heldArrow) {
    bow.userData.heldArrow.visible = bowKick < 0.58;
  }
}

function updateMessage(delta) {
  if (messageTimer <= 0) {
    message.classList.remove("visible");
    return;
  }

  messageTimer -= delta;
  if (messageTimer <= 0) {
    message.classList.remove("visible");
  }
}

function showMessage(text) {
  message.textContent = text;
  message.classList.add("visible");
  messageTimer = 1.9;
}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
