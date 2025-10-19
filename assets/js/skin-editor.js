import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
  // ===== 2D PAINTING SYSTEM =====
	//const controls = new OrbitControls (camera, renderer.domElement);
    const canvas = document.getElementById('skinCanvas');
    const ctx = canvas.getContext('2d');
    const colorPicker = document.getElementById('colorPicker');
    const clearBtn = document.getElementById('clearBtn');
    const saveBtn = document.getElementById('saveBtn');
    const loadBtn = document.getElementById('loadBtn');
    const loadInput = document.getElementById('loadInput');

    let painting = false;

    // Initial fill
    ctx.fillStyle = "#aaaaaa";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    function getMousePos(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: Math.floor((e.clientX - rect.left) * scaleX),
        y: Math.floor((e.clientY - rect.top) * scaleY)
      };
    }

    function paint(e) {
      if (!painting) return;
      const {x, y} = getMousePos(e);
      ctx.fillStyle = colorPicker.value;
      ctx.fillRect(x, y, 1, 1);
      updateTexture();
    }

    canvas.addEventListener('mousedown', e => { painting = true; paint(e); });
    canvas.addEventListener('mouseup', () => painting = false);
    canvas.addEventListener('mouseleave', () => painting = false);
    canvas.addEventListener('mousemove', paint);

    clearBtn.onclick = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = "#aaaaaa";
      ctx.fillRect(0,0,canvas.width,canvas.height);
      updateTexture();
    };

    saveBtn.onclick = () => {
      const link = document.createElement('a');
      link.download = 'skin.png';
      link.href = canvas.toDataURL();
      link.click();
    };

    loadBtn.onclick = () => loadInput.click();
    loadInput.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        updateTexture();
      };
      img.src = URL.createObjectURL(file);
    };

    // ===== 3D PREVIEW =====
    const preview = document.getElementById('preview');
    const renderer = new THREE.WebGLRenderer({ canvas: preview, antialias: true, alpha: true });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
    camera.position.z = 100;

    const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    scene.add(light);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;

    const material = new THREE.MeshBasicMaterial({ map: texture });

    // === Minecraft Character Model ===
	const body = new THREE.Group();

	// Shared material using the same texture
	const skinMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
	skinMat.map.magFilter = THREE.NearestFilter;
	skinMat.map.minFilter = THREE.NearestFilter;

	// Helper to make cube parts
	function makePart(l, w, h, x, y, z) {
	  const geom = new THREE.BoxGeometry(l, h, w);
	  const mesh = new THREE.Mesh(geom, skinMat);
	  mesh.position.set(x, y, z);
	  return mesh;
	}

	// Create main parts (sizes roughly Minecraft-proportional)


  // makePart (length, height, width, x, y, z)
  // x is to left/right
  // y is up/down
  // z is forward/back
  
  // Head
	const head = makePart(8, 8, 10, 0, 14, 0);

  // Torso
	const torso = makePart(12, 4, 18, 0, 0, 0);

  // Right Arm
	const urArm = makePart(6, 4, 8, 9, 5, 0);
	const lrArm = makePart(4, 4, 10, 9, -4, 0);

  // Left Arm
  const ulArm = makePart(6, 4, 8, -9, 5, 0);
  const llArm = makePart(4, 4, 10, -9, -4, 0);

  // Left Leg
	const ulLeg = makePart(6, 4, 8, -3, -13, 0);
	const llLeg = makePart(4, 4, 12, -3, -23, 0);

  // Right Leg
  const urLeg = makePart(6, 4, 8, 3, -13, 0);
  const lrLeg = makePart(4, 4, 12, 3, -23, 0);

	//body.add(head, torso, leftArm, rightArm, leftLeg, rightLeg);
  body.add(head, torso, urArm, lrArm, ulArm, llArm, ulLeg, llLeg, urLeg, lrLeg);
	scene.add(body);


    // Resize handler
    function resize() {
      const size = document.getElementById('rightPanel').clientHeight;
      renderer.setSize(size, size);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    // Update texture from canvas
    function updateTexture() {
      texture.needsUpdate = true;
    }

		// ===== CAMERA CONTROLS =====
      const controls = new OrbitControls( camera, renderer.domElement );
      controls.enableDamping = true;       // smooth motion
      controls.dampingFactor = 0.1;
      controls.enablePan = false;          // disable dragging the scene around
      controls.target.set(0, 0.5, 0);      // look at character
      controls.minDistance = 2;            // zoom limits
      controls.maxDistance = 1000;

      // Animation loop
      function animate() {
        requestAnimationFrame(animate);
        controls.update();                 // update camera interaction
        renderer.render(scene, camera);
      }
      animate();