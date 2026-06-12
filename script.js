// =======================
// DREAM FLIGHT DEMO V2
// =======================

// ---------- SCENE ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 500, 8000);

// ---------- CAMERA ----------
const camera = new THREE.PerspectiveCamera(
    75,
    innerWidth / innerHeight,
    0.1,
    50000
);

// ---------- RENDERER ----------
const renderer = new THREE.WebGLRenderer({
    antialias:true
});

renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);

// ---------- LIGHTS ----------
const hemi = new THREE.HemisphereLight(
    0xffffff,
    0x444444,
    1.2
);

scene.add(hemi);

const sun = new THREE.DirectionalLight(
    0xffffff,
    2
);

sun.position.set(500,1000,500);

scene.add(sun);

// ---------- HUD ----------
const hud = document.getElementById("hud");

// ---------- CLOCK ----------
const clock = new THREE.Clock();

// =======================
// TERRAIN
// =======================

const terrainGeo = new THREE.PlaneGeometry(
    20000,
    20000,
    256,
    256
);

const pos = terrainGeo.attributes.position;

for(let i=0;i<pos.count;i++){

    const x = pos.getX(i);
    const y = pos.getY(i);

    const h =
        Math.sin(x*0.002)*80 +
        Math.cos(y*0.003)*60 +
        Math.sin((x+y)*0.001)*120;

    pos.setZ(i,h);
}

terrainGeo.computeVertexNormals();

const terrain = new THREE.Mesh(
    terrainGeo,
    new THREE.MeshStandardMaterial({
        color:0x3f8f3f
    })
);

terrain.rotation.x = -Math.PI/2;

scene.add(terrain);

// =======================
// OCEAN
// =======================

const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(40000,40000),
    new THREE.MeshStandardMaterial({
        color:0x2f6fff,
        transparent:true,
        opacity:.7
    })
);

ocean.rotation.x = -Math.PI/2;
ocean.position.y = -20;

scene.add(ocean);

// =======================
// RUNWAY
// =======================

const runway = new THREE.Mesh(
    new THREE.BoxGeometry(400,1,30),
    new THREE.MeshStandardMaterial({
        color:0x222222
    })
);

runway.position.y = 0.5;

scene.add(runway);

// =======================
// AIRCRAFT
// =======================

const plane = new THREE.Group();

// fuselage

const body = new THREE.Mesh(
    new THREE.CylinderGeometry(
        0.5,
        0.7,
        8,
        16
    ),
    new THREE.MeshStandardMaterial({
        color:0xcccccc
    })
);

body.rotation.z = Math.PI/2;

plane.add(body);

// nose

const nose = new THREE.Mesh(
    new THREE.ConeGeometry(
        0.5,
        1.5,
        16
    ),
    new THREE.MeshStandardMaterial({
        color:0xff3333
    })
);

nose.rotation.z = -Math.PI/2;
nose.position.x = 4.5;

plane.add(nose);

// wings

const wings = new THREE.Mesh(
    new THREE.BoxGeometry(
        2,
        0.15,
        10
    ),
    new THREE.MeshStandardMaterial({
        color:0x666666
    })
);

plane.add(wings);

// tail wing

const tailWing = new THREE.Mesh(
    new THREE.BoxGeometry(
        1,
        0.1,
        3
    ),
    new THREE.MeshStandardMaterial({
        color:0x777777
    })
);

tailWing.position.x = -3;

plane.add(tailWing);

// vertical stabilizer

const fin = new THREE.Mesh(
    new THREE.BoxGeometry(
        1,
        1.5,
        0.15
    ),
    new THREE.MeshStandardMaterial({
        color:0x555555
    })
);

fin.position.set(
    -3,
    0.8,
    0
);

plane.add(fin);

plane.position.set(
    0,
    30,
    0
);

scene.add(plane);

// =======================
// CLOUDS
// =======================

function createCloud(){

    const group = new THREE.Group();

    for(let i=0;i<6;i++){

        const p = new THREE.Mesh(
            new THREE.SphereGeometry(
                8 + Math.random()*5,
                8,
                8
            ),
            new THREE.MeshStandardMaterial({
                color:0xffffff
            })
        );

        p.position.set(
            Math.random()*20,
            Math.random()*8,
            Math.random()*20
        );

        group.add(p);
    }

    return group;
}

for(let i=0;i<40;i++){

    const c = createCloud();

    c.position.set(
        (Math.random()-0.5)*10000,
        300+Math.random()*500,
        (Math.random()-0.5)*10000
    );

    scene.add(c);
}

// =======================
// INPUT
// =======================

const keys = {};

window.addEventListener("keydown",e=>{
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener("keyup",e=>{
    keys[e.key.toLowerCase()] = false;
});

// =======================
// FLIGHT VARIABLES
// =======================

let speed = 1;
let throttle = 0.4;

const velocity = new THREE.Vector3();

let fps = 0;
let frameCounter = 0;
let fpsTimer = 0;

let alive = true;

// =======================
// ANIMATE
// =======================

function animate(){

    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if(alive){

        // THROTTLE

        if(keys["q"])
            throttle -= 0.01;

        if(keys["e"])
            throttle += 0.01;

        throttle = THREE.MathUtils.clamp(
            throttle,
            0,
            1
        );

        // CONTROLS

        if(keys["w"])
            plane.rotateZ(0.02);

        if(keys["s"])
            plane.rotateZ(-0.02);

        if(keys["a"])
            plane.rotateX(0.02);

        if(keys["d"])
            plane.rotateX(-0.02);

        // AUTO LEVEL

        plane.rotation.z *= 0.995;
        plane.rotation.x *= 0.995;

        // SPEED

        speed += throttle * 0.03;
        speed -= speed * 0.004;

        speed = Math.max(speed,0);

        // LIFT

        const lift =
            speed *
            speed *
            0.00035;

        plane.position.y += lift;

        // GRAVITY

        plane.position.y -= 0.08;

        // STALL

        if(speed < 3){

            plane.position.y -=
                (3-speed)*0.05;
        }

        // FORWARD VECTOR

        const forward =
            new THREE.Vector3(
                1,
                0,
                0
            );

        forward.applyQuaternion(
            plane.quaternion
        );

        velocity.copy(
            forward.multiplyScalar(
                speed
            )
        );

        plane.position.add(
            velocity
        );

        // BANK TURN

        plane.rotation.y -=
            plane.rotation.x *
            speed *
            0.0015;

        // TURBULENCE

        plane.position.y +=
            Math.sin(
                performance.now()*0.001
            ) * 0.01;

        // CAMERA

        const camOffset =
            new THREE.Vector3(
                -18,
                6,
                0
            );

        camOffset.applyQuaternion(
            plane.quaternion
        );

        const camTarget =
            plane.position.clone()
            .add(camOffset);

        camera.position.lerp(
            camTarget,
            0.08
        );

        camera.lookAt(
            plane.position
        );

        // TERRAIN RECENTER

        terrain.position.x =
            Math.round(
                plane.position.x/20000
            ) * 20000;

        terrain.position.z =
            Math.round(
                plane.position.z/20000
            ) * 20000;

        // CRASH

        if(plane.position.y < 2){

            if(speed < 8){

                hud.innerHTML =
                    "🛬 SAFE LANDING";

            }else{

                hud.innerHTML =
                    "💥 CRASH";

            }

            alive = false;
        }

    }

    // DAY NIGHT

    const t =
        performance.now()*0.00003;

    sun.position.x =
        Math.sin(t)*2000;

    sun.position.y =
        Math.cos(t)*2000;

    // FPS

    frameCounter++;

    fpsTimer += delta;

    if(fpsTimer >= 1){

        fps = frameCounter;

        frameCounter = 0;

        fpsTimer = 0;
    }

    // HUD

    if(alive){

        let heading =
            THREE.MathUtils.radToDeg(
                plane.rotation.y
            );

        heading =
            ((heading%360)+360)%360;

        hud.innerHTML =
        `
SPD ${speed.toFixed(1)}<br>
ALT ${plane.position.y.toFixed(0)}<br>
HDG ${heading.toFixed(0)}°<br>
THR ${(throttle*100).toFixed(0)}%<br>
FPS ${fps}
        `;
    }

    renderer.render(
        scene,
        camera
    );
}

animate();

// =======================
// RESIZE
// =======================

window.addEventListener(
    "resize",
    ()=>{

        camera.aspect =
            innerWidth/
            innerHeight;

        camera.updateProjectionMatrix();

        renderer.setSize(
            innerWidth,
            innerHeight
        );

    }
);
