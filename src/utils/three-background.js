const THREE = window.THREE;

let scene, camera, renderer, group;

export function initThreeBackground(containerId) {
  const container = document.getElementById(containerId);
  const WIDTH = window.innerWidth;
  const HEIGHT = window.innerHeight;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 1000);
  camera.position.z = 40;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setClearColor(0x000000, 1);
  container.appendChild(renderer.domElement);

  group = new THREE.Group();
  scene.add(group);

  const nodeCount = 70;
  const sphereGeometry = new THREE.SphereGeometry(0.6, 16, 16);
  const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffcc });

  const nodePositions = [];

  for (let i = 0; i < nodeCount; i++) {
    const x = (Math.random() - 0.5) * 30;
    const y = (Math.random() - 0.5) * 30;
    const z = (Math.random() - 0.5) * 30;

    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(x, y, z);
    group.add(sphere);
    nodePositions.push(new THREE.Vector3(x, y, z));
  }

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x66ffcc,
    transparent: true,
    opacity: 0.2,
  });

  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      const dist = nodePositions[i].distanceTo(nodePositions[j]);
      if (dist < 12) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          nodePositions[i],
          nodePositions[j],
        ]);
        const line = new THREE.Line(geometry, lineMaterial);
        group.add(line);
      }
    }
  }

  // 🔥 Primero escalar el grupo
  group.scale.set(5, 5, 5); // Aumenta aquí según lo que necesites

  // ✅ Luego centrar el grupo escalado
  const box = new THREE.Box3().setFromObject(group);
  const center = new THREE.Vector3();
  box.getCenter(center);
  group.position.sub(center);

  animate();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function animate() {
  requestAnimationFrame(animate);
  group.rotation.y += 0.0004;
  group.rotation.x += 0.0008;
  renderer.render(scene, camera);
}
