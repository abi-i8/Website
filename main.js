import * as THREE from 'three';

// 1. Scene Setup
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  antialias: true,
  alpha: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

// Camera Position (Top View)
camera.position.set(0, 120, 0); // High up on Y axis
camera.lookAt(0, 0, 0); // Look down at Sun

// 2. Lighting (High Intensity for visibility)8
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const sunlight = new THREE.PointLight(0xffaa00, 3, 1000); // Warm sun light
scene.add(sunlight);


// 3. Procedural Texture Generator (The Fix for Black Textures)
function createProceduralTexture(colorHex, detail = 'planet') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256; // 2:1 aspect ratio for spherical map
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Background
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, width, height);

  // Add Noise/Details
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * (detail === 'gas' ? 60 : 5);

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.2})`;
    ctx.fill();

    // Darker patches
    if (i % 2 === 0) {
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, radius * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.1})`;
      ctx.fill();
    }
  }

  // Gas Giant Stripes
  if (detail === 'gas') {
    ctx.globalCompositeOperation = 'overlay';
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = `rgba(255,255,255, 0.1)`;
      const h = Math.random() * 20 + 10;
      const y = Math.random() * height;
      ctx.fillRect(0, y, width, h);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Helper to create Textured Planets AND Orbit Rings
function createPlanet(size, baseColor, type, orbitRadius, speed) {
  const geo = new THREE.SphereGeometry(size, 32, 32);
  const mat = new THREE.MeshStandardMaterial({
    map: createProceduralTexture(baseColor, type),
    roughness: 0.8,
    metalness: 0.1
  });
  const planet = new THREE.Mesh(geo, mat);

  const orbit = new THREE.Object3D();
  orbit.add(planet);
  planet.position.x = orbitRadius;

  // Create Orbit Ring
  const ringGeo = new THREE.RingGeometry(orbitRadius - 0.1, orbitRadius + 0.1, 128);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.1
  });
  const orbitRing = new THREE.Mesh(ringGeo, ringMat);
  orbitRing.rotation.x = -Math.PI / 2; // Lie flat
  scene.add(orbitRing);

  scene.add(orbit);
  return { mesh: planet, orbit: orbit, speed: speed };
}


// 4. Create Solar System

// SUN (Procedural Glowing Star)
const sunGeo = new THREE.SphereGeometry(8, 64, 64);
const sunCanvas = document.createElement('canvas');
sunCanvas.width = 512; sunCanvas.height = 256;
const sunCtx = sunCanvas.getContext('2d');
sunCtx.fillStyle = '#ffaa00';
sunCtx.fillRect(0, 0, 512, 256);
// Sunspots
for (let i = 0; i < 20; i++) {
  sunCtx.beginPath();
  sunCtx.arc(Math.random() * 512, Math.random() * 256, Math.random() * 10, 0, Math.PI * 2);
  sunCtx.fillStyle = 'rgba(200, 50, 0, 0.5)';
  sunCtx.fill();
}
const sunTex = new THREE.CanvasTexture(sunCanvas);
const sunMat = new THREE.MeshBasicMaterial({ map: sunTex }); // self-illuminated
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

// Sun Glow Sprite
function createGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255, 120, 20, 1)');
  gradient.addColorStop(0.4, 'rgba(255, 60, 0, 0.4)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}
const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
  map: createGlowTexture(),
  color: 0xff4400,
  transparent: true,
  blending: THREE.AdditiveBlending
}));
glowSprite.scale.set(40, 40, 1); // Big glow
scene.add(glowSprite);


// PLANETS
// Much slower, realistic relative speeds
const mercury = createPlanet(1.2, '#A5A5A5', 'rock', 14, 0.008);
const venus = createPlanet(1.8, '#E3BB76', 'rock', 20, 0.006);
const earth = createPlanet(2.0, '#2233FF', 'rock', 28, 0.005); // Base reference
const mars = createPlanet(1.5, '#FF4500', 'rock', 36, 0.004);
const jupiter = createPlanet(5.5, '#D8CA9D', 'gas', 60, 0.002);
const saturnOrbRadius = 80;

// Saturn Custom (with Rings)
const saturnGeo = new THREE.SphereGeometry(4.5, 32, 32);
const saturnMat = new THREE.MeshStandardMaterial({
  map: createProceduralTexture('#C5A165', 'gas')
});
const saturnMesh = new THREE.Mesh(saturnGeo, saturnMat);
const saturnOrbit = new THREE.Object3D();
saturnOrbit.add(saturnMesh);
saturnMesh.position.x = saturnOrbRadius;
scene.add(saturnOrbit);

// Saturn Rings (Planet Rings)
const satRingGeo = new THREE.TorusGeometry(6.5, 1, 2, 64);
const satRingMat = new THREE.MeshStandardMaterial({ color: 0xaa8866, side: THREE.DoubleSide });
const satRing = new THREE.Mesh(satRingGeo, satRingMat);
satRing.rotation.x = Math.PI / 1.8;
saturnMesh.add(satRing);

// Saturn Orbit Track (Visual Line)
const satTrackGeo = new THREE.RingGeometry(saturnOrbRadius - 0.1, saturnOrbRadius + 0.1, 128);
const satTrackMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.1 });
const satTrack = new THREE.Mesh(satTrackGeo, satTrackMat);
satTrack.rotation.x = -Math.PI / 2;
scene.add(satTrack);

const saturn = { mesh: saturnMesh, orbit: saturnOrbit, speed: 0.0015 };

const uranus = createPlanet(3.0, '#99CCFF', 'gas', 95, 0.001);
const neptune = createPlanet(2.9, '#3333FF', 'gas', 110, 0.0008);

// MOON
const moonGeo = new THREE.SphereGeometry(0.5, 32, 32);
const moonMat = new THREE.MeshStandardMaterial({
  map: createProceduralTexture('#DDDDDD', 'rock')
});
const moon = new THREE.Mesh(moonGeo, moonMat);
const moonOrbit = new THREE.Object3D();
moonOrbit.add(moon);
moon.position.x = 3.5;
earth.mesh.add(moonOrbit);


// 5. Enhanced Starfield (Particles)
// 5. Enhanced Starfield (Particles with Sparkle Shader)
function createStarfield() {
  const starsGeometry = new THREE.BufferGeometry();
  const starsCount = 5000;

  const posArray = new Float32Array(starsCount * 3);
  const sizeArray = new Float32Array(starsCount);
  const shiftArray = new Float32Array(starsCount);

  for (let i = 0; i < starsCount; i++) {
    posArray[i * 3] = (Math.random() - 0.5) * 1000;
    posArray[i * 3 + 1] = (Math.random() - 0.5) * 1000;
    posArray[i * 3 + 2] = (Math.random() - 0.5) * 1000;

    sizeArray[i] = Math.random() * 2.0;
    shiftArray[i] = Math.random() * Math.PI * 2;
  }

  starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));
  starsGeometry.setAttribute('shift', new THREE.BufferAttribute(shiftArray, 1));

  const starsMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color(0xffffff) }
    },
    vertexShader: `
      attribute float size;
      attribute float shift;
      varying float vShift;
      void main() {
        vShift = shift;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z); 
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color;
      varying float vShift;
      void main() {
        if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.475) discard;
        float opacity = 0.5 + 0.5 * sin(time * 2.0 + vShift);
        gl_FragColor = vec4(color, opacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const starMesh = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(starMesh);
  return starMesh;
}
const starfield = createStarfield();

// 6. Asteroid Belt (InstancedMesh for Performance)
function createAsteroidBelt() {
  const asteroidCount = 1500;
  const geometry = new THREE.DodecahedronGeometry(0.2, 0); // Low poly rock shape
  const material = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.9,
    metalness: 0.1
  });

  const asteroidBelt = new THREE.InstancedMesh(geometry, material, asteroidCount);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < asteroidCount; i++) {
    // Position between Mars (36) and Jupiter (60)
    // New Range: 42 to 48
    const angle = Math.random() * Math.PI * 2;
    const radius = 42 + Math.random() * 6;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = (Math.random() - 0.5) * 2; // Slight vertical spread

    dummy.position.set(x, y, z);

    // Random rotation
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

    // Random scale
    const scale = Math.random() * 0.5 + 0.5;
    dummy.scale.set(scale, scale, scale);

    dummy.updateMatrix();
    asteroidBelt.setMatrixAt(i, dummy.matrix);
  }

  scene.add(asteroidBelt);
  return asteroidBelt;
}
const asteroids = createAsteroidBelt();

// 7. Animation State
let cameraIntroDone = false;

function animate() {
  requestAnimationFrame(animate);

  // Intro Fly-In (Descend from space)
  let startHeight = 400; // Starting Y height

  if (!cameraIntroDone) {
    if (camera.position.y > 120) {
      camera.position.y -= 2.0; // Fly-down speed
      // Keep looking at center while moving
      camera.lookAt(0, 0, 0);
    } else {
      cameraIntroDone = true;
      camera.position.y = 120;
    }
  } else {
    // Ensure lookAt remains valid after manual moves
    camera.lookAt(0, 0, 0);
  }

  // Rotate Sun
  sun.rotation.y += 0.002;

  // Rotate Starfield slowly & Twinkle
  if (starfield.material.uniforms) {
    starfield.material.uniforms.time.value += 0.01;
  }
  starfield.rotation.y -= 0.0002;

  // Orbit Rotations (Global Time Scale)
  mercury.orbit.rotation.y += mercury.speed;
  venus.orbit.rotation.y += venus.speed;
  earth.orbit.rotation.y += earth.speed;
  mars.orbit.rotation.y += mars.speed;
  asteroids.rotation.y += 0.0005; // Rotate asteroid belt
  jupiter.orbit.rotation.y += jupiter.speed;
  saturn.orbit.rotation.y += saturn.speed;
  uranus.orbit.rotation.y += uranus.speed;
  neptune.orbit.rotation.y += neptune.speed;

  // Self Rotations
  mercury.mesh.rotation.y += 0.01;
  venus.mesh.rotation.y += 0.01;
  earth.mesh.rotation.y += 0.02;
  moon.rotation.y += 0.01;
  mars.mesh.rotation.y += 0.02;
  jupiter.mesh.rotation.y += 0.04;
  saturn.mesh.rotation.y += 0.04;
  uranus.mesh.rotation.y += 0.03;
  neptune.mesh.rotation.y += 0.03;

  // Moon Orbit
  moonOrbit.rotation.y += 0.02;

  // Gesture Control (Overwrites automated rotation if active)
  if (gestureData.isActive && gestureData.isHandDetected) {
    cameraIntroDone = true; // Cancel intro if user interferes

    // Rotation (X movements rotate scene Y - standard spin)
    // Smooth interpolation
    scene.rotation.y += (gestureData.x - scene.rotation.y) * 0.05;

    // Zoom (Z gesture mapped to Camera Height Y for top view)
    // Base Height is 120. Zoom range: 80 (Close) to 200 (Far)
    const targetHeight = 120 - (gestureData.zoom * 50);
    camera.position.y += (targetHeight - camera.position.y) * 0.05;

    // Maintain top-down focus
    camera.lookAt(0, 0, 0);

  } else {
    // Reset Camera if not controlled (Height return to 120)
    if (cameraIntroDone && Math.abs(camera.position.y - 120) > 0.1) {
      camera.position.y += (120 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);
    }
  }

  renderer.render(scene, camera);
}

// Import Gestures
import { toggleGestures, gestureData } from './gestures.js';

// Mouse Tilt
let mouseX = 0;
let mouseY = 0;
document.addEventListener('mousemove', (e) => {
  // Only use mouse if gestures are NOT active
  if (!gestureData.isActive) {
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;
    scene.rotation.y = mouseX * 0.1;
  }
});


// Toggle Button Logic
const toggleBtn = document.getElementById('toggle-btn');
let isCameraActive = false;

if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    isCameraActive = !isCameraActive;

    // UI Update
    if (isCameraActive) {
      toggleBtn.classList.add('active');
      toggleBtn.querySelector('.btn-text').innerText = "TRACKING UP...";
      setTimeout(() => {
        toggleBtn.querySelector('.btn-text').innerText = "CAMERA ON";
      }, 1500);
    } else {
      toggleBtn.classList.remove('active');
      toggleBtn.querySelector('.btn-text').innerText = "Camera";
    }

    // Logic Update
    toggleGestures(isCameraActive);
  });
}


animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
