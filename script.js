// ===== SCENE =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// ===== CAMERA =====
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 10000);
camera.position.set(0, 5, 12);

// ===== RENDERER =====
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// ===== LIGHT =====
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(10, 20, 10);
scene.add(sun);

// ===== GROUND =====
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(5000, 5000),
  new THREE.MeshStandardMaterial({ color: 0x228b22 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// ===== RUNWAY =====
const runway = new THREE.Mesh(
  new THREE.BoxGeometry(300, 1, 20),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
runway.position.y = 0.5;
scene.add(runway);

// ===== PLANE (PROCEDURAL) =====
const plane = new THREE.Group();

// body
plane.add(new THREE.Mesh(
  new THREE.BoxGeometry(2, 0.5, 6),
  new THREE.MeshStandardMaterial({ color: 0xff3333 })
));

// wings
const wing = new THREE.Mesh(
  new THREE.BoxGeometry(8, 0.1, 1.5),
  new THREE.MeshStandardMaterial({ color: 0x555555 })
);
plane.add(wing);

// tail
const tail = new THREE.Mesh(
  new THREE.BoxGeometry(0.5, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x666666 })
);
tail.position.set(0, 0.8, -2.5);
plane.add(tail);

plane.position.set(0, 1, 0);
scene.add(plane);

// ===== STATE =====
let speed = 0;
let throttle = 0.02;
let pitch = 0;
let roll = 0;
let alive = true;

// ===== JOYSTICK =====
let joyX = 0, joyY = 0;
window.addEventListener("touchmove", e => {
  joyX = (e.touches[0].clientX / innerWidth - 0.5) * 2;
  joyY = (e.touches[0].clientY / innerHeight - 0.5) * 2;
});

// ===== CLOUDS =====
for (let i = 0; i < 30; i++) {
  const cloud = new THREE.Mesh(
    new THREE.SphereGeometry(10, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  cloud.position.set(
    (Math.random() - 0.5) * 2000,
    100 + Math.random() * 300,
    (Math.random() - 0.5) * 2000
  );
  scene.add(cloud);
}

// ===== HUD =====
const hud = document.getElementById("hud");

// ===== LOOP =====
function animate() {
  requestAnimationFrame(animate);
  if (!alive) return;

  // controls
  pitch -= joyY * 0.002;
  roll  -= joyX * 0.002;

  pitch = THREE.MathUtils.clamp(pitch, -0.5, 0.5);
  roll  = THREE.MathUtils.clamp(roll, -0.8, 0.8);

  plane.rotation.set(pitch, roll, 0);

  // throttle + gravity
  speed += throttle;
  speed -= 0.01; // drag
  if (speed < 0) speed = 0;

  // movement
  plane.translateZ(-speed);

  // gravity
  plane.position.y -= 0.03 - pitch * 0.1;

  // camera follow
  camera.position.lerp(
    plane.position.clone().add(new THREE.Vector3(0, 5, 12)),
    0.08
  );
  camera.lookAt(plane.position);

  // landing / crash
  if (plane.position.y < 1) {
    if (speed < 1.2) {
      hud.innerHTML = "🛬 LANDED";
    } else {
      hud.innerHTML = "💥 CRASH";
    }
    alive = false;
  } else {
    hud.innerHTML = `SPD ${speed.toFixed(1)}<br>ALT ${plane.position.y.toFixed(0)}`;
  }

  renderer.render(scene, camera);
}

animate();

// resize
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
