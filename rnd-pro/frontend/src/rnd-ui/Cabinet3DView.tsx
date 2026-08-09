import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { Scene3D } from '../rnd-core/data-model';

// Lightweight orbit controls (no extra dep). Replace with @react-three/drei OrbitControls
// once you adopt react-three-fiber.

export function Cabinet3DView({ scene3d, onClose }: { scene3d: Scene3D; onClose?: () => void }) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const host = hostRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a');
    const camera = new THREE.PerspectiveCamera(45, host.clientWidth / host.clientHeight, 1, 100000);
    const bbox = scene3d.bbox || [0, 0, 0, 1200, 2000, 500];
    const cx = (bbox[0] + bbox[3]) / 2, cy = (bbox[1] + bbox[4]) / 2, cz = (bbox[2] + bbox[5]) / 2;
    const maxDim = Math.max(bbox[3] - bbox[0], bbox[4] - bbox[1], bbox[5] - bbox[2]);
    camera.position.set(cx + maxDim, cy + maxDim, cz + maxDim * 1.6);
    camera.lookAt(cx, cy, cz);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(1, 1, 1).normalize();
    scene.add(dir);

    scene3d.nodes.forEach(node => {
      let mesh: THREE.Mesh | null = null;
      const color = new THREE.Color(node.color || '#64748b');
      if (node.primitive === 'box' || !node.primitive) {
        const g = new THREE.BoxGeometry(1, 1, 1);
        mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.7 }));
      } else if (node.primitive === 'cylinder') {
        const g = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
        mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.7 }));
      } else if (node.primitive === 'sphere') {
        const g = new THREE.SphereGeometry(0.5, 24, 24);
        mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.7 }));
      }
      if (mesh) {
        const t = node.transform;
        mesh.position.set(t.x, t.y, t.z);
        if (t.rx) mesh.rotation.x = t.rx;
        if (t.ry) mesh.rotation.y = t.ry;
        if (t.rz) mesh.rotation.z = t.rz;
        mesh.scale.set(t.sx || 1, t.sy || 1, t.sz || 1);
        scene.add(mesh);
      }
      // TODO: when node.assetId is set, fetch glTF from /api/rnd/assets/gltf/{assetId}
      // and replace the primitive mesh with the loaded model.
    });

    // simple drag-orbit
    let dragging = false, lastX = 0, lastY = 0;
    renderer.domElement.addEventListener('mousedown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
    window.addEventListener('mouseup', () => { dragging = false; });
    window.addEventListener('mousemove', e => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      const offset = new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(cx, cy, cz));
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.theta -= dx * 0.005;
      spherical.phi   = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi - dy * 0.005));
      offset.setFromSpherical(spherical);
      camera.position.copy(new THREE.Vector3(cx, cy, cz).add(offset));
      camera.lookAt(cx, cy, cz);
    });
    renderer.domElement.addEventListener('wheel', e => {
      const offset = new THREE.Vector3().subVectors(camera.position, new THREE.Vector3(cx, cy, cz));
      offset.multiplyScalar(e.deltaY > 0 ? 1.1 : 0.9);
      camera.position.copy(new THREE.Vector3(cx, cy, cz).add(offset));
    }, { passive: true });

    let live = true;
    function loop() {
      if (!live) return;
      renderer.render(scene, camera);
      requestAnimationFrame(loop);
    }
    loop();

    return () => {
      live = false;
      renderer.dispose();
      host.innerHTML = '';
    };
  }, [scene3d]);

  return <div style={{ position: 'relative' }}>
    {onClose && <button onClick={onClose} style={{ position: 'absolute', zIndex: 2, right: 8, top: 8 }}>Close 3D</button>}
    <div ref={hostRef} style={{ width: '100%', height: '60vh', background: '#0a0f17', borderRadius: 8 }} />
  </div>;
}
