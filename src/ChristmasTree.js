import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ChristmasTree = () => {
  const containerRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const treeRef = useRef();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    sceneRef.current = scene;

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 8;
    cameraRef.current = camera;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffd700, 0.5);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    // 创建圣诞树组
    const treeGroup = new THREE.Group();
    scene.add(treeGroup);
    treeRef.current = treeGroup;

    // 树干 - 圆柱体
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1, 16);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = -1.5;
    treeGroup.add(trunk);

    // 树冠 - 三层圆锥体
    const cone1Geometry = new THREE.ConeGeometry(2, 3, 16);
    const cone1Material = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const cone1 = new THREE.Mesh(cone1Geometry, cone1Material);
    treeGroup.add(cone1);

    const cone2Geometry = new THREE.ConeGeometry(1.5, 2.5, 16);
    const cone2Material = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const cone2 = new THREE.Mesh(cone2Geometry, cone2Material);
    cone2.position.y = 1.5;
    treeGroup.add(cone2);

    const cone3Geometry = new THREE.ConeGeometry(1, 2, 16);
    const cone3Material = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const cone3 = new THREE.Mesh(cone3Geometry, cone3Material);
    cone3.position.y = 3;
    treeGroup.add(cone3);

    // 树顶星星 - 使用二十面体近似
    const starGeometry = new THREE.IcosahedronGeometry(0.5, 0);
    const starMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    star.position.y = 4.2;
    treeGroup.add(star);

    // 装饰球
    const ornamentColors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF];
    for (let i = 0; i < 20; i++) {
      const ornamentGeometry = new THREE.SphereGeometry(0.15, 16, 16);
      const ornamentMaterial = new THREE.MeshStandardMaterial({ 
        color: ornamentColors[Math.floor(Math.random() * ornamentColors.length)] 
      });
      const ornament = new THREE.Mesh(ornamentGeometry, ornamentMaterial);
      
      const angle = (i / 20) * Math.PI * 2;
      const radius = 1 + Math.random() * 1;
      const height = -0.5 + Math.random() * 3;
      
      ornament.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      
      treeGroup.add(ornament);
    }

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);
      treeGroup.rotation.y += 0.01;
      renderer.render(scene, camera);
    };
    animate();

    // 响应窗口大小变化
    const handleResize = () => {
      if (container) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        
        renderer.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div 
      ref={containerRef} 
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '10px',
        overflow: 'hidden'
      }}
    />
  );
};

export default ChristmasTree;