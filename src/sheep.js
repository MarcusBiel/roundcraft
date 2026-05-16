import { randomIntInclusive } from "./math.js";

export function createSheepSystem({
  THREE,
  addSolidObstacle,
  arrowRaycaster,
  clock,
  collectSheepMeat,
  getActiveTool,
  getGameStarted,
  getMouseDown,
  groundHeightAt,
  isInsidePath,
  isInsideWater,
  pathCenter,
  playPickaxeHit,
  player,
  raycaster,
  scene,
  sheepArrowHitPadding,
  sheepMeatMessage,
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
  initialSheepMaxCount,
  initialSheepMinCount,
  toolPickaxe,
  volcanoBaseRadius,
  volcanoCenter,
  worldHalfSize
}) {
  const sheepFlock = [];
  const sheepParts = [];
  const sheepMoveDirection = new THREE.Vector3();
  const sheepTarget = new THREE.Vector3();
  let sheepRespawnTimer = 0;
  let nextSheepId = 1;
  let nextSheepPickaxeHitTime = 0;

  function addInitialSheep() {
    const sheepCount = randomIntInclusive(initialSheepMinCount, initialSheepMaxCount);

    for (let index = 0; index < sheepCount; index += 1) {
      const startPosition = randomGreenSheepPositionNear(sheepStartMeadowCenter, sheepStartMeadowRadius);
      addSheep(startPosition ?? randomGreenSheepPosition());
    }
  }

  function spawnSheepAtRandomGreenSpot() {
    const position = randomGreenSheepPosition();
    addSheep(position);
  }

  function addSheep(position) {
    const sheep = new THREE.Group();
    sheep.name = `Sheep${nextSheepId}`;
    nextSheepId += 1;
    sheep.position.set(position.x, 0, position.z);
    sheep.rotation.y = Math.random() * Math.PI * 2;
    sheep.userData.walkOffset = Math.random() * Math.PI * 2;
    sheep.userData.target = randomGreenSheepTarget(sheep.position);

    const woolMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4f0df,
      roughness: 0.84
    });
    const faceMaterial = new THREE.MeshStandardMaterial({
      color: 0x39332e,
      roughness: 0.78
    });
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0x2b2522,
      roughness: 0.82
    });

    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), woolMaterial);
    body.position.y = 0.76;
    body.scale.set(1.08, 0.58, 0.74);
    body.castShadow = true;
    addSheepPart(sheep, body);

    for (const [x, y, z, scale] of [
      [-0.62, 0.92, -0.35, 0.34],
      [-0.1, 1.04, -0.5, 0.31],
      [0.38, 0.92, -0.38, 0.29],
      [-0.38, 1.05, 0.3, 0.28],
      [0.36, 1.0, 0.34, 0.26]
    ]) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(scale, 12, 8), woolMaterial);
      puff.position.set(x, y, z);
      puff.castShadow = true;
      addSheepPart(sheep, puff);
    }

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), faceMaterial);
    head.position.set(0.94, 0.8, 0);
    head.scale.set(0.9, 0.82, 0.75);
    head.castShadow = true;
    addSheepPart(sheep, head);

    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), faceMaterial);
      ear.position.set(0.86, 0.9, side * 0.28);
      ear.scale.set(0.72, 0.45, 1);
      addSheepPart(sheep, ear);

      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.4 })
      );
      eye.position.set(1.2, 0.86, side * 0.13);
      addSheepPart(sheep, eye);
    }

    for (const [x, z] of [
      [-0.45, -0.32],
      [0.42, -0.32],
      [-0.45, 0.32],
      [0.42, 0.32]
    ]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.48, 8), legMaterial);
      leg.position.set(x, 0.25, z);
      leg.castShadow = true;
      addSheepPart(sheep, leg);
    }

    const obstacle = {
      name: sheep.name,
      x: sheep.position.x,
      z: sheep.position.z,
      radius: sheepObstacleRadius,
      minY: 0,
      maxY: sheepObstacleHeight,
      isActive: () => sheep.parent !== null
    };
    sheep.userData.obstacle = obstacle;
    addSolidObstacle(obstacle);

    sheepFlock.push(sheep);
    scene.add(sheep);
    return sheep;
  }

  function addSheepPart(sheep, part) {
    part.userData.sheepRoot = sheep;
    sheep.add(part);
    sheepParts.push(part);
  }

  function randomGreenSheepPosition() {
    for (let attempt = 0; attempt < 160; attempt += 1) {
      const x = THREE.MathUtils.randFloat(-worldHalfSize + sheepSpawnWorldPadding, worldHalfSize - sheepSpawnWorldPadding);
      const z = THREE.MathUtils.randFloat(-worldHalfSize + sheepSpawnWorldPadding, worldHalfSize - sheepSpawnWorldPadding);

      if (isGoodSheepSpawn(x, z)) {
        return new THREE.Vector3(x, 0, z);
      }
    }

    throw new Error("Could not find a green sheep spawn position.");
  }

  function randomGreenSheepPositionNear(center, radius) {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.sqrt(Math.random()) * radius;
      const x = center.x + Math.cos(angle) * distance;
      const z = center.y + Math.sin(angle) * distance;

      if (isGoodSheepSpawn(x, z)) {
        return new THREE.Vector3(x, 0, z);
      }
    }

    return null;
  }

  function randomGreenSheepTarget(origin) {
    for (let attempt = 0; attempt < 48; attempt += 1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = THREE.MathUtils.randFloat(sheepTargetMinDistance, sheepTargetMaxDistance);
      const x = origin.x + Math.cos(angle) * distance;
      const z = origin.z + Math.sin(angle) * distance;

      if (isGreenGround(x, z)) {
        return new THREE.Vector3(x, 0, z);
      }
    }

    return randomGreenSheepPosition();
  }

  function isGoodSheepSpawn(x, z) {
    return isGreenGround(x, z) && !isTooCloseToSolidObstacle(x, z) && !isTooCloseToSheep(x, z) && !isTooCloseToPlayer(x, z);
  }

  function isGreenGround(x, z) {
    if (Math.abs(x) > worldHalfSize - sheepSpawnWorldPadding || Math.abs(z) > worldHalfSize - sheepSpawnWorldPadding) {
      return false;
    }

    if (groundHeightAt(x, z) !== 0) {
      return false;
    }

    const volcanoDistance = Math.hypot(x - volcanoCenter.x, z - volcanoCenter.z);
    if (volcanoDistance <= volcanoBaseRadius + 2.5) {
      return false;
    }

    return !isInsideWater(x, z) && !isInsidePath(x, z);
  }

  function isTooCloseToSolidObstacle(x, z) {
    for (const obstacle of solidObstacles) {
      if (obstacle.isActive && !obstacle.isActive()) {
        continue;
      }

      if (Math.hypot(x - obstacle.x, z - obstacle.z) < obstacle.radius + sheepObstacleRadius + 0.75) {
        return true;
      }
    }

    return false;
  }

  function isTooCloseToSheep(x, z) {
    for (const sheep of sheepFlock) {
      if (sheep.parent === null) {
        continue;
      }

      if (Math.hypot(x - sheep.position.x, z - sheep.position.z) < sheepObstacleRadius * 2.4) {
        return true;
      }
    }

    return false;
  }

  function isTooCloseToPlayer(x, z) {
    return Math.hypot(x - player.position.x, z - player.position.z) < 5;
  }

  function update(delta) {
    for (const sheep of sheepFlock) {
      if (sheep.parent === null) {
        continue;
      }

      sheepTarget.copy(sheep.userData.target);
      sheepMoveDirection.subVectors(sheepTarget, sheep.position);
      sheepMoveDirection.y = 0;
      const distance = sheepMoveDirection.length();

      if (distance <= sheepTargetReach) {
        sheep.userData.target = randomGreenSheepTarget(sheep.position);
        continue;
      }

      sheepMoveDirection.normalize();
      const nextX = sheep.position.x + sheepMoveDirection.x * sheepMoveSpeed * delta;
      const nextZ = sheep.position.z + sheepMoveDirection.z * sheepMoveSpeed * delta;

      if (!isGreenGround(nextX, nextZ)) {
        sheep.userData.target = randomGreenSheepTarget(sheep.position);
        continue;
      }

      sheep.position.x = nextX;
      sheep.position.z = nextZ;
      sheep.position.y = Math.sin(clock.elapsedTime * 7 + sheep.userData.walkOffset) * 0.025;
      sheep.rotation.y = Math.atan2(-sheepMoveDirection.z, sheepMoveDirection.x);

      const obstacle = sheep.userData.obstacle;
      obstacle.x = sheep.position.x;
      obstacle.z = sheep.position.z;
    }
  }

  function updateRespawn(delta) {
    if (!getGameStarted()) {
      return;
    }

    if (sheepFlock.length >= sheepSafeMinCount) {
      sheepRespawnTimer = 0;
      return;
    }

    sheepRespawnTimer += delta;

    if (sheepRespawnTimer < sheepRespawnSeconds) {
      return;
    }

    sheepRespawnTimer = 0;
    const sheepToAdd = randomIntInclusive(sheepRespawnBatchMinCount, sheepRespawnBatchMaxCount);

    for (let index = 0; index < sheepToAdd; index += 1) {
      spawnSheepAtRandomGreenSpot();
    }

    sheepMeatMessage(sheepToAdd === 1 ? "A new sheep appeared." : "New sheep appeared.");
  }

  function updateMelee(time) {
    if (!getGameStarted() || getActiveTool() !== toolPickaxe || !getMouseDown() || time < nextSheepPickaxeHitTime) {
      return;
    }

    const sheep = findInView();
    if (sheep === null) {
      return;
    }

    nextSheepPickaxeHitTime = time + sheepPickaxeHitSeconds;
    playPickaxeHit();
    kill(sheep, "Sheep meat collected!");
  }

  function findInView() {
    for (const sheep of sheepFlock) {
      sheep.updateMatrixWorld(true);
    }

    raycaster.setFromCamera({ x: 0, y: 0 }, player);
    const hits = raycaster.intersectObjects(sheepParts, false);

    for (const hit of hits) {
      const sheep = hit.object.userData.sheepRoot;
      if (sheep && sheep.parent !== null && hit.distance <= sheepPickaxeReach) {
        return sheep;
      }
    }

    return null;
  }

  function findHitByArrow(start, direction, distance) {
    for (const sheep of sheepFlock) {
      sheep.updateMatrixWorld(true);
    }

    arrowRaycaster.set(start, direction);
    arrowRaycaster.near = 0;
    arrowRaycaster.far = distance + sheepArrowHitPadding;

    const hits = arrowRaycaster.intersectObjects(sheepParts, false);

    for (const hit of hits) {
      const sheep = hit.object.userData.sheepRoot;
      if (sheep && sheep.parent !== null) {
        return sheep;
      }
    }

    return null;
  }

  function kill(sheep, messageText) {
    const sheepIndex = sheepFlock.indexOf(sheep);
    if (sheepIndex === -1) {
      return;
    }

    scene.remove(sheep);
    sheepFlock.splice(sheepIndex, 1);
    removeSheepParts(sheep);
    collectSheepMeat(messageText);
  }

  function removeSheepParts(sheep) {
    for (let index = sheepParts.length - 1; index >= 0; index -= 1) {
      if (sheepParts[index].userData.sheepRoot === sheep) {
        sheepParts.splice(index, 1);
      }
    }
  }

  return {
    addInitialSheep,
    findHitByArrow,
    kill,
    update,
    updateMelee,
    updateRespawn
  };
}
