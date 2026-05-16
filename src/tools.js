export function createToolKit({ THREE, camera, scene }) {
  function addPickaxe() {
    const pickaxeGroup = new THREE.Group();
    pickaxeGroup.position.set(0.68, -0.62, -1.25);
    pickaxeGroup.rotation.set(-0.34, -0.5, -0.34);
    pickaxeGroup.scale.setScalar(0.72);

    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0x7b4a25,
      roughness: 0.68
    });
    const gripMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a1710,
      roughness: 0.82
    });
    const headMaterial = new THREE.MeshStandardMaterial({
      color: 0xc8d4dd,
      roughness: 0.24,
      metalness: 0.55
    });
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xe7f7ff,
      roughness: 0.18,
      metalness: 0.65
    });

    const handleGroup = new THREE.Group();
    handleGroup.rotation.z = -0.34;
    handleGroup.position.y = -0.14;
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.058, 1.22, 12), handleMaterial);
    handleGroup.add(handle);

    for (const y of [-0.44, -0.16, 0.14]) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.061, 0.061, 0.055, 12), gripMaterial);
      band.position.y = y;
      handleGroup.add(band);
    }
    pickaxeGroup.add(handleGroup);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.43, 0);

    const socket = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), headMaterial);
    socket.castShadow = true;
    headGroup.add(socket);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.13, 0.16), headMaterial);
    head.castShadow = true;
    headGroup.add(head);

    const leftPoint = new THREE.Mesh(new THREE.ConeGeometry(0.105, 0.32, 14), edgeMaterial);
    leftPoint.rotation.z = Math.PI / 2;
    leftPoint.position.x = -0.53;
    leftPoint.castShadow = true;
    headGroup.add(leftPoint);

    const rightBlade = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.13), edgeMaterial);
    rightBlade.position.x = 0.49;
    rightBlade.rotation.z = -0.4;
    rightBlade.castShadow = true;
    headGroup.add(rightBlade);

    const topShine = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.025, 0.175), edgeMaterial);
    topShine.position.set(0.02, 0.074, 0.012);
    headGroup.add(topShine);

    pickaxeGroup.add(headGroup);
    camera.add(pickaxeGroup);
    return pickaxeGroup;
  }

  function addBow() {
    const bowGroup = new THREE.Group();
    bowGroup.position.set(0.64, -0.5, -1.18);
    bowGroup.rotation.set(-0.08, -0.38, 0.12);
    bowGroup.scale.setScalar(0.7);

    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x8a4f25,
      roughness: 0.72
    });
    const stringMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4ead2,
      roughness: 0.5
    });
    const arrowWoodMaterial = new THREE.MeshStandardMaterial({
      color: 0xc49a5d,
      roughness: 0.6
    });
    const arrowTipMaterial = new THREE.MeshStandardMaterial({
      color: 0xd6e1e8,
      roughness: 0.25,
      metalness: 0.5
    });
    const featherMaterial = new THREE.MeshStandardMaterial({
      color: 0xfff3b0,
      roughness: 0.46
    });

    const bowCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.84, 0),
      new THREE.Vector3(-0.28, -0.25, 0),
      new THREE.Vector3(-0.26, 0.25, 0),
      new THREE.Vector3(0, 0.84, 0)
    ]);
    const bowBody = new THREE.Mesh(new THREE.TubeGeometry(bowCurve, 24, 0.035, 8), woodMaterial);
    bowGroup.add(bowBody);

    const string = makeBowString(stringMaterial, 0.14);
    bowGroup.add(string);
    bowGroup.userData.string = string;

    const heldArrow = new THREE.Group();
    const heldShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 1.24, 8), arrowWoodMaterial);
    heldShaft.rotation.x = Math.PI / 2;
    heldShaft.position.z = -0.22;
    heldArrow.add(heldShaft);

    const heldTip = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.22, 10), arrowTipMaterial);
    heldTip.rotation.x = -Math.PI / 2;
    heldTip.position.z = -0.94;
    heldArrow.add(heldTip);

    for (const side of [-1, 1]) {
      const feather = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.035, 0.26), featherMaterial);
      feather.position.set(side * 0.065, 0, 0.4);
      feather.rotation.z = side * 0.45;
      heldArrow.add(feather);
    }

    heldArrow.position.set(0.18, 0, -0.16);
    bowGroup.add(heldArrow);
    bowGroup.userData.heldArrow = heldArrow;

    camera.add(bowGroup);
    return bowGroup;
  }

  function makeBowString(material, centerPull) {
    const string = new THREE.Group();
    const top = new THREE.Vector3(0, 0.84, 0.02);
    const middle = new THREE.Vector3(centerPull, 0, 0.02);
    const bottom = new THREE.Vector3(0, -0.84, 0.02);
    string.add(makeBowStringSegment(top, middle, material));
    string.add(makeBowStringSegment(middle, bottom, material));
    return string;
  }

  function makeBowStringSegment(start, end, material) {
    const length = start.distanceTo(end);
    const segment = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, length, 8), material);
    const direction = new THREE.Vector3().subVectors(end, start).normalize();
    segment.position.copy(start).add(end).multiplyScalar(0.5);
    segment.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    return segment;
  }

  function makePlayerArrow(position, direction) {
    const arrow = new THREE.Group();
    arrow.name = "PlayerArrow";
    arrow.position.copy(position);
    arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);

    const shaftMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd15a,
      emissive: 0x6b3d00,
      emissiveIntensity: 0.35,
      roughness: 0.45
    });
    const tipMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4fbff,
      roughness: 0.24,
      metalness: 0.55
    });
    const featherMaterial = new THREE.MeshStandardMaterial({
      color: 0xff5f4a,
      emissive: 0x521000,
      emissiveIntensity: 0.2,
      roughness: 0.48
    });

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.7, 10), shaftMaterial);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.z = -0.14;
    arrow.add(shaft);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 12), tipMaterial);
    tip.rotation.x = -Math.PI / 2;
    tip.position.z = -1.16;
    arrow.add(tip);

    for (const side of [-1, 1]) {
      const feather = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.045, 0.42), featherMaterial);
      feather.position.set(side * 0.12, 0, 0.62);
      feather.rotation.z = side * 0.42;
      arrow.add(feather);
    }

    const glow = new THREE.PointLight(0xffd15a, 1.4, 4.5, 2);
    glow.position.z = -0.5;
    arrow.add(glow);

    scene.add(arrow);

    return {
      mesh: arrow,
      direction: direction.clone(),
      ageSeconds: 0
    };
  }

  return {
    addBow,
    addPickaxe,
    makePlayerArrow
  };
}
