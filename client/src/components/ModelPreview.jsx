// components/ModelPreview.jsx
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function ModelPreview({ file, optimizedFile, onError }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let renderer, scene, camera, controls;
    let animationFrameId;

    const init = () => {
      // Initialize scene
      scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = new THREE.Color(0xf0f0f0);

      // Initialize camera
      camera = new THREE.PerspectiveCamera(
        45,
        containerRef.current.clientWidth / containerRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(5, 5, 5);
      camera.lookAt(0, 0, 0);

      // Initialize renderer with physically correct lighting
      renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        physicallyCorrectLights: true
      });
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(renderer.domElement);

      // Initialize controls with better defaults
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = false;
      controls.minDistance = 2;
      controls.maxDistance = 20;
      controls.maxPolarAngle = Math.PI / 2;

      // Add lighting setup
      setupLights(scene);

      // Add grid and axes
      setupGridAndAxes(scene);
    };

    const setupLights = (scene) => {
      // Ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      // Main directional light (sun)
      const mainLight = new THREE.DirectionalLight(0xffffff, 1.35);
      mainLight.position.set(5, 5, 5);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.width = 2048;
      mainLight.shadow.mapSize.height = 2048;
      mainLight.shadow.camera.near = 0.1;
      mainLight.shadow.camera.far = 20;
      mainLight.shadow.camera.left = -10;
      mainLight.shadow.camera.right = 10;
      mainLight.shadow.camera.top = 10;
      mainLight.shadow.camera.bottom = -10;
      scene.add(mainLight);

      // Fill light
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.85);
      fillLight.position.set(-5, 0, -5);
      scene.add(fillLight);

      // Back light
      const backLight = new THREE.DirectionalLight(0xffffff, 0.65);
      backLight.position.set(0, 5, -5);
      scene.add(backLight);
    };

    const setupGridAndAxes = (scene) => {
      // Grid helper
      const size = 10;
      const divisions = 10;
      const gridHelper = new THREE.GridHelper(size, divisions, 0x808080, 0x808080);
      gridHelper.material.opacity = 0.25;
      gridHelper.material.transparent = true;
      scene.add(gridHelper);

      // Axes helper
      const axesHelper = new THREE.AxesHelper(5);
      scene.add(axesHelper);

      // Ground plane for shadows
      const groundGeometry = new THREE.PlaneGeometry(20, 20);
      const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
      const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
      groundPlane.rotation.x = -Math.PI / 2;
      groundPlane.position.y = -0.01; // Slightly below grid
      groundPlane.receiveShadow = true;
      scene.add(groundPlane);
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (controls) controls.update();
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };

    const loadModel = (url) => {
      const loader = new GLTFLoader();
      
      loader.load(
        url,
        (gltf) => {
          // Clear existing model and lights
          while (scene.children.length > 0) {
            const obj = scene.children[0];
            scene.remove(obj);
            if (obj.material) obj.material.dispose();
            if (obj.geometry) obj.geometry.dispose();
          }

          // Re-setup lights and grid
          setupLights(scene);
          setupGridAndAxes(scene);

          // Add new model
          const model = gltf.scene;
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              
              // Enhance materials
              if (child.material) {
                child.material.envMapIntensity = 1;
                child.material.needsUpdate = true;
              }
            }
          });

          scene.add(model);

          // Center and scale model
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / maxDim;
          model.scale.setScalar(scale);

          model.position.sub(center.multiplyScalar(scale));
          model.position.y = 0; // Place on grid

          // Reset camera to a good viewing angle
          camera.position.set(5, 3, 5);
          camera.lookAt(model.position);
          controls.target.copy(model.position);
          controls.update();
        },
        // Progress callback
        (xhr) => {
          const progress = xhr.loaded / xhr.total;
          console.log(`Loading: ${Math.round(progress * 100)}%`);
        },
        // Error callback
        (error) => {
          console.error('Error loading model:', error);
          if (onError) onError(error);
        }
      );
    };

    init();
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Load model if URL is provided
    if (file instanceof File) {
      const url = URL.createObjectURL(file);
      loadModel(url);
      URL.revokeObjectURL(url);
    } else if (optimizedFile) {
      loadModel(optimizedFile);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
      }
      if (controls) controls.dispose();
    };
  }, [file, optimizedFile, onError]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] bg-gray-100 rounded-lg" />
  );
}

export default ModelPreview;