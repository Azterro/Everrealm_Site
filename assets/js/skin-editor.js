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


    let currentTool = 'brush';
    const toolButtons = document.querySelectorAll('.toolBtn');

    // Switch active tool visually and logically
    toolButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        toolButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool;
      });
    });


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

    canvas.addEventListener('mousedown', e => {
    painting = true;
    handleToolAction(e);
    });
    canvas.addEventListener('mouseup', () => painting = false);
    canvas.addEventListener('mouseleave', () => painting = false);
    canvas.addEventListener('mousemove', e => {
      if (painting && currentTool === 'brush') handleToolAction(e);
    });

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

    function handleToolAction(e) {
      const { x, y } = getMousePos(e);

      switch (currentTool) {
        case 'brush':
          ctx.fillStyle = colorPicker.value;
          ctx.fillRect(x, y, 1, 1);
          updateTexture();
          break;

        case 'picker': // Eyedropper
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
          colorPicker.value = hex;
          currentTool = 'brush';
          document.querySelector('[data-tool="brush"]').classList.add('active');
          document.querySelector('[data-tool="picker"]').classList.remove('active');
          break;

        case 'bucket':
          bucketFill(x, y, hexToRgb(colorPicker.value));
          updateTexture();
          break;
      }
    }

    function bucketFill(x, y, fillColor) {
    const targetColor = ctx.getImageData(x, y, 1, 1).data;
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const matchColor = (i) =>
      data[i] === targetColor[0] &&
      data[i + 1] === targetColor[1] &&
      data[i + 2] === targetColor[2] &&
      data[i + 3] === targetColor[3];

    const setColor = (i) => {
      data[i] = fillColor.r;
      data[i + 1] = fillColor.g;
      data[i + 2] = fillColor.b;
      data[i + 3] = 255;
    };

    const stack = [{ x, y }];
    while (stack.length) {
      const n = stack.pop();
      const idx = (n.y * width + n.x) * 4;
      if (!matchColor(idx)) continue;

      let west = n.x;
      let east = n.x;
      while (west >= 0 && matchColor((n.y * width + west) * 4)) west--;
      while (east < width && matchColor((n.y * width + east) * 4)) east++;

      for (let i = west + 1; i < east; i++) {
        setColor((n.y * width + i) * 4);
        if (n.y > 0 && matchColor(((n.y - 1) * width + i) * 4))
          stack.push({ x: i, y: n.y - 1 });
        if (n.y < height - 1 && matchColor(((n.y + 1) * width + i) * 4))
          stack.push({ x: i, y: n.y + 1 });
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}


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

	// Helper to apply box textures
  function applyBoxUVs(geom, uvMap) {
  const uvs = [];
  const faces = ['right', 'left', 'top', 'bottom', 'front', 'back'];

  for (let face of faces) {
    const { u0, v0, u1, v1 } = uvMap[face];

    // Three.js BoxGeometry vertex winding (two triangles per face)
    // Each face has 4 UV pairs in a specific order:
    uvs.push(
      u1, v1,  // top-right
      u0, v1,  // top-left
      u0, v0,  // bottom-left
      u1, v0   // bottom-right
    );
  }

  // Replace attribute safely
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
}

function createHeadGeometry(uvMap) {
  const w = 8, h = 8, d = 10;
  const hw = w / 2, hh = h / 2, hd = d / 2;

  const vertices = [
    // Front face (z+)
    -hw, -hh,  hd,   hw, -hh,  hd,   hw,  hh,  hd,   -hw,  hh,  hd,
    // Back face (z-)
     hw, -hh, -hd,  -hw, -hh, -hd,  -hw,  hh, -hd,    hw,  hh, -hd,
    // Top face (y+)
    -hw,  hh,  hd,    hw,  hh,  hd,   hw,  hh, -hd,   -hw,  hh, -hd,
    // Bottom face (y-)
    -hw, -hh, -hd,    hw, -hh, -hd,   hw, -hh,  hd,   -hw, -hh,  hd,
    // Right face (x+)
     hw, -hh,  hd,    hw, -hh, -hd,   hw,  hh, -hd,    hw,  hh,  hd,
    // Left face (x-)
    -hw, -hh, -hd,   -hw, -hh,  hd,   -hw,  hh,  hd,   -hw,  hh, -hd
  ];

  // Two triangles per face (front, back, top, bottom, right, left)
  const indices = [];
  for (let i = 0; i < 6; i++) {
    const offset = i * 4;
    indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
  }

  // Define UVs per face using your texture atlas coordinates
  const uvs = [];

  const faces = ['front', 'back', 'top', 'bottom', 'right', 'left'];
  for (let face of faces) {
    const { u0, v0, u1, v1 } = uvMap[face];
    // Each face: bottom-left, bottom-right, top-right, top-left
    uvs.push(
      u0, v1,
      u1, v1,
      u1, v0,
      u0, v0
    );
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}


// ============================================ UV CONSTANTS ========================================================
const headUVs = {
  right:  { u0: 36/64, v0: 1 - (0/64), u1: 43/64, v1: 1 - (9/64) },
  left:   { u0: 20/64, v0: 1 - (0/64), u1: 27/64, v1: 1 - (9/64) },
  top:    { u0: 12/64, v0: 1 - (0/64), u1: 19/64, v1: 1 - (7/64) },
  bottom: { u0: 44/64, v0: 1 - (0/64), u1: 51/64, v1: 1 - (7/64) },
  front:  { u0: 28/64, v0: 1 - (9/64), u1: 35/64, v1: 1 - (0/64) },//9/64) },
  back:   { u0: 28/64, v0: 1 - (10/64), u1: 35/64, v1: 1 - (19/64) }
};

  
  // Helper to make cube parts
	function makePart(l, w, h, x, y, z) {
	  const geom = new THREE.BoxGeometry(l, h, w);
    const headGeom = createHeadGeometry(headUVs);
    const head = new THREE.Mesh(headGeom, skinMat);
    head.position.set(0, 14, 0);
    scene.add(head);
    
    applyBoxUVs(geom, headUVs);
    //applyBoxUVs(geom, bodyUVs);

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