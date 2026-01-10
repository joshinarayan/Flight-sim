Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3MGIyZDMxZC0xM2ViLTQ3MTAtYmFkZi0xMGYzYzRiNDhlZmYiLCJpZCI6Mzc3MDY1LCJpYXQiOjE3NjgwNTM4NjR9.JVS-lq2ULJZS2ob7xHmtyc0BFaxp9V1WxEgkxql2Rf4";

const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(),
  timeline: false,
  animation: false,
  shouldAnimate: true
});

viewer.scene.globe.enableLighting = true;
viewer.scene.fog.enabled = true;
viewer.scene.skyAtmosphere.show = true;

// ===== STATE =====
let heading = 0;
let pitch = 0;
let roll = 0;
let speed = 130;
let alive = true;
let camMode = 0;

// ===== POSITION =====
let position = Cesium.Cartesian3.fromDegrees(77.209, 28.6139, 2500);

// ===== ORIENTATION =====
function getOrientation() {
  return Cesium.Transforms.headingPitchRollQuaternion(
    position,
    new Cesium.HeadingPitchRoll(heading, pitch, roll)
  );
}

// ===== PROCEDURAL PLANE =====
const plane = viewer.entities.add({
  position: new Cesium.CallbackProperty(() => position, false),
  orientation: new Cesium.CallbackProperty(getOrientation, false),

  box: {
    dimensions: new Cesium.Cartesian3(6, 1, 1),
    material: Cesium.Color.GRAY
  }
});

// ===== WINGS =====
viewer.entities.add({
  position: plane.position,
  orientation: plane.orientation,
  box: {
    dimensions: new Cesium.Cartesian3(1, 10, 0.2),
    material: Cesium.Color.DARKGRAY
  }
});

// ===== TAIL =====
viewer.entities.add({
  position: plane.position,
  orientation: plane.orientation,
  box: {
    dimensions: new Cesium.Cartesian3(0.5, 1, 2),
    material: Cesium.Color.DIMGRAY
  }
});

viewer.trackedEntity = plane;

// ===== JOYSTICK =====
const joy = document.createElement("div");
joy.style.cssText = `
  position: fixed;
  bottom: 20px; left: 20px;
  width: 120px; height: 120px;
  border-radius: 50%;
  background: rgba(255,255,255,.15);
`;
document.body.appendChild(joy);

let joyX = 0, joyY = 0;
joy.addEventListener("touchmove", e => {
  const r = joy.getBoundingClientRect();
  const t = e.touches[0];
  joyX = ((t.clientX - r.left) / r.width - 0.5) * 2;
  joyY = ((t.clientY - r.top) / r.height - 0.5) * 2;
});

// ===== CAMERA MODES =====
document.addEventListener("dblclick", () => {
  camMode = (camMode + 1) % 4;
});

// ===== SOUND =====
const ctx = new AudioContext();
const engine = ctx.createOscillator();
engine.type = "sawtooth";
engine.frequency.value = 120;
engine.connect(ctx.destination);
engine.start();
document.body.addEventListener("touchstart", () => ctx.resume(), { once: true });

// ===== HUD =====
const hud = document.createElement("div");
hud.style.cssText = `
  position: fixed;
  top: 10px; left: 10px;
  color: #0f0;
  background: rgba(0,0,0,.6);
  padding: 8px;
  font-family: monospace;
`;
document.body.appendChild(hud);

// ===== DAY / NIGHT =====
let night = false;
setInterval(() => {
  night = !night;
  viewer.scene.light = night
    ? new Cesium.DirectionalLight({
        direction: new Cesium.Cartesian3(0.5, 0.5, -1)
      })
    : new Cesium.SunLight();
}, 30000);

// ===== MAIN LOOP =====
viewer.clock.onTick.addEventListener(() => {
  if (!alive) return;

  heading -= joyX * 0.04;
  pitch   -= joyY * 0.04;
  pitch = Cesium.Math.clamp(pitch, -1.2, 0.6);

  const forward = new Cesium.Cartesian3(
    Math.sin(heading),
    Math.cos(heading),
    Math.sin(pitch)
  );
  Cesium.Cartesian3.normalize(forward, forward);

  position = Cesium.Cartesian3.add(
    position,
    Cesium.Cartesian3.multiplyByScalar(forward, speed, new Cesium.Cartesian3()),
    new Cesium.Cartesian3()
  );

  const carto = Cesium.Cartographic.fromCartesian(position);
  const ground = viewer.scene.globe.getHeight(carto) || 0;
  const alt = carto.height;

  engine.frequency.value = 100 + speed;

  // ===== CAMERA =====
  if (camMode === 0) viewer.trackedEntity = plane;
  if (camMode === 1) viewer.camera.zoomOut(600);
  if (camMode === 2) viewer.camera.rotateRight(0.003);
  if (camMode === 3) viewer.camera.lookUp(0.002);

  // ===== LAND / CRASH =====
  if (alt < ground + 30) {
    if (speed < 150 && Math.abs(pitch) < 0.2) {
      hud.innerHTML = "🛬 LANDED";
      alive = false;
    } else {
      hud.innerHTML = "💥 CRASH";
      alive = false;
    }
  } else {
    hud.innerHTML = `SPD ${speed}<br>ALT ${Math.round(alt)}`;
  }
});
