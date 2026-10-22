import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { latLonToVector3, vector3ToLatLon } from "../../lib/geo/sphere";
import { getSubsolarPoint } from "../../lib/time/solar";
import { buildBoundarySegments } from "../../lib/globe/buildBoundarySegments";
import { findBoundaryAtPoint } from "../../lib/geo/pointInCountry";
import type { BoundaryCollection } from "../../lib/geo/load";
import { earthVertexShader, earthFragmentShader } from "../../lib/globe/shaders";
import { prefersReducedMotion } from "../../lib/globe/webgl";

const GLOBE_RADIUS = 1;
const MARKER_RADIUS = GLOBE_RADIUS * 1.004;
const BOUNDARY_RADIUS = GLOBE_RADIUS * 1.002;
const BASE_LINE_COLOR = new THREE.Color("#3a4a66");
const HIGHLIGHT_LINE_COLOR = new THREE.Color("#e8b35e");

export interface GlobeMarker {
  lat: number;
  lon: number;
  label?: string;
}

interface GlobeCanvasProps {
  boundaries: BoundaryCollection;
  marker: GlobeMarker | null;
  selectedCountryCode: string | null;
  referenceInstant: number;
  autoRotate: boolean;
  flyToSignal: number;
  onSelectCountry: (feature: { code: string | null; name: string } | null) => void;
  onContextLost: () => void;
}

interface FlyTo {
  from: THREE.Vector3;
  to: THREE.Vector3;
  startTime: number;
  duration: number;
}

interface GlobeSceneState {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  earthMaterial: THREE.ShaderMaterial;
  markerMesh: THREE.Mesh;
  boundaryGeometry: THREE.BufferGeometry;
  colorAttribute: THREE.BufferAttribute;
  rangesByCode: Map<string, { start: number; count: number }>;
  highlightedCode: string | null;
  needsRender: boolean;
  flyTo: FlyTo | null;
  hovered: boolean;
  autoRotateEnabled: boolean;
}

export default function GlobeCanvas({
  boundaries,
  marker,
  selectedCountryCode,
  referenceInstant,
  autoRotate,
  flyToSignal,
  onSelectCountry,
  onContextLost,
}: GlobeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef(marker);
  markerRef.current = marker;

  // Mutable three.js state that doesn't need to trigger React re-renders.
  const stateRef = useRef<GlobeSceneState | null>(null);

  // Click handling lives inside a one-time effect (see below) so it can't rebind on every
  // render; this ref lets it always call the *current* callback instead of a stale closure.
  const onSelectCountryRef = useRef(onSelectCountry);
  onSelectCountryRef.current = onSelectCountry;

  // One-time scene setup.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = prefersReducedMotion();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    // Default framing: a 3/4 view roughly centered on the Atlantic, rather than a flat
    // straight-on equatorial view.
    const initialPos = latLonToVector3(15, -30, 3.15);
    camera.position.set(initialPos.x, initialPos.y, initialPos.z);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      onContextLost();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      onContextLost();
    };
    renderer.domElement.addEventListener("webglcontextlost", handleContextLost);

    let textureFailed = false;
    function handleTextureError() {
      // A missing/failed texture would otherwise render as a flat black sphere with no
      // explanation; fall back to the 2D map instead, same as a lost WebGL context.
      if (textureFailed) return;
      textureFailed = true;
      onContextLost();
    }
    const textureLoader = new THREE.TextureLoader();
    const dayMap = textureLoader.load(
      "/textures/earth-day.jpg",
      () => {
        if (stateRef.current) stateRef.current.needsRender = true;
      },
      undefined,
      handleTextureError,
    );
    const nightMap = textureLoader.load(
      "/textures/earth-night.jpg",
      () => {
        if (stateRef.current) stateRef.current.needsRender = true;
      },
      undefined,
      handleTextureError,
    );
    dayMap.colorSpace = THREE.SRGBColorSpace;
    nightMap.colorSpace = THREE.SRGBColorSpace;
    dayMap.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const earthGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const earthMaterial = new THREE.ShaderMaterial({
      uniforms: {
        dayMap: { value: dayMap },
        nightMap: { value: nightMap },
        sunDirection: { value: new THREE.Vector3(1, 0, 0) },
      },
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earthMesh);

    // Subtle atmosphere rim.
    const atmosphereGeometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.015, 48, 48);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#3fb8c0"),
      transparent: true,
      opacity: 0.06,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial));

    // Country boundary lines (one draw call for all countries; highlight is a recolor).
    const { positions, rangesByCode } = buildBoundarySegments(boundaries, BOUNDARY_RADIUS);
    const boundaryGeometry = new THREE.BufferGeometry();
    boundaryGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const colors = new Float32Array(positions.length);
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = BASE_LINE_COLOR.r;
      colors[i + 1] = BASE_LINE_COLOR.g;
      colors[i + 2] = BASE_LINE_COLOR.b;
    }
    const colorAttribute = new THREE.BufferAttribute(colors, 3);
    boundaryGeometry.setAttribute("color", colorAttribute);
    const boundaryMaterial = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.75 });
    const boundaryLines = new THREE.LineSegments(boundaryGeometry, boundaryMaterial);
    scene.add(boundaryLines);

    // Selected-city marker.
    const markerGeometry = new THREE.SphereGeometry(0.012, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color("#e8b35e") });
    const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
    markerMesh.visible = false;
    scene.add(markerMesh);
    const ringGeometry = new THREE.RingGeometry(0.016, 0.02, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#e8b35e"),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const markerRing = new THREE.Mesh(ringGeometry, ringMaterial);
    markerMesh.add(markerRing);

    scene.add(new THREE.AmbientLight(0xffffff, 0.15));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 2.1;
    controls.maxDistance = 4.5;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = autoRotate && !reducedMotion;
    controls.autoRotateSpeed = 0.28;
    controls.rotateSpeed = 0.55;

    const st: GlobeSceneState = {
      renderer,
      scene,
      camera,
      controls,
      earthMaterial,
      markerMesh,
      boundaryGeometry,
      colorAttribute,
      rangesByCode,
      highlightedCode: null,
      needsRender: true,
      flyTo: null,
      hovered: false,
      autoRotateEnabled: autoRotate,
    };
    stateRef.current = st;
    const pauseOnHover = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      st.hovered = true;
      st.controls.autoRotate = false;
      // Stop a fly-to animation too, so hovering gives a stable view.
      st.flyTo = null;
      st.needsRender = true;
      container.dataset.hoverPaused = 'true';
    };
    const resumeAfterHover = () => {
      st.hovered = false;
      st.controls.autoRotate = st.autoRotateEnabled && !prefersReducedMotion();
      st.needsRender = true;
      delete container.dataset.hoverPaused;
    };
    container.addEventListener('pointerenter', pauseOnHover);
    container.addEventListener('pointerleave', resumeAfterHover);


    controls.addEventListener("change", () => {
      if (stateRef.current) stateRef.current.needsRender = true;
    });

    function resize() {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      if (stateRef.current) stateRef.current.needsRender = true;
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    // Click-to-select-country (distinguishing a click from a drag).
    let pointerDownPos: { x: number; y: number } | null = null;
    function handlePointerDown(e: PointerEvent) {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    }
    function handlePointerUp(e: PointerEvent) {
      if (!pointerDownPos) return;
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      pointerDownPos = null;
      if (Math.hypot(dx, dy) > 6) return; // was a drag, not a click

      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObject(earthMesh);
      if (hits.length === 0) return;
      const point = hits[0].point;
      const { lat, lon } = vector3ToLatLon({ x: point.x, y: point.y, z: point.z }, GLOBE_RADIUS);
      const feature = findBoundaryAtPoint(boundaries, lon, lat);
      onSelectCountryRef.current(
        feature ? { code: feature.properties.code, name: feature.properties.name } : null,
      );
    }
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);

    let rafId: number;
    function animate() {
      rafId = requestAnimationFrame(animate);
      if (document.hidden) return;
      const s = stateRef.current;
      if (!s) return;

      let shouldRender = s.needsRender || s.controls.autoRotate;

      if (s.flyTo) {
        const elapsed = performance.now() - s.flyTo.startTime;
        const t = Math.min(1, elapsed / s.flyTo.duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const pos = new THREE.Vector3().lerpVectors(s.flyTo.from, s.flyTo.to, eased);
        pos.normalize().multiplyScalar(s.camera.position.length());
        s.camera.position.copy(pos);
        s.camera.lookAt(0, 0, 0);
        shouldRender = true;
        if (t >= 1) s.flyTo = null;
      }

      s.controls.update();
      if (shouldRender) {
        s.renderer.render(s.scene, s.camera);
        const label = labelRef.current;
        const selectedMarker = markerRef.current;
        if (label && selectedMarker && s.markerMesh.visible) {
          const position = s.markerMesh.position.clone();
          const facing = position.dot(s.camera.position.clone().sub(position)) > 0;
          const projected = position.clone().project(s.camera);
          const visible = facing && projected.z >= -1 && projected.z <= 1 && Math.abs(projected.x) <= 1 && Math.abs(projected.y) <= 1;
          label.style.visibility = visible ? 'visible' : 'hidden';
          if (visible) {
            const width = container!.clientWidth;
            const height = container!.clientHeight;
            const x = Math.max(10, Math.min(width - label.offsetWidth - 10, (projected.x + 1) * width / 2 + 13));
            const y = Math.max(15, Math.min(height - label.offsetHeight - 15, (1 - projected.y) * height / 2 - label.offsetHeight / 2));
            label.style.transform = `translate(${x}px, ${y}px)`;
          }
        } else if (label) label.style.visibility = 'hidden';
        s.needsRender = false;
      }
    }
    animate();

    const handleVisibility = () => {
      if (!document.hidden && stateRef.current) stateRef.current.needsRender = true;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", handleVisibility);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("webglcontextlost", handleContextLost);
      container.removeEventListener('pointerenter', pauseOnHover);
      container.removeEventListener('pointerleave', resumeAfterHover);
      controls.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
      dayMap.dispose();
      nightMap.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      boundaryGeometry.dispose();
      boundaryMaterial.dispose();
      markerGeometry.dispose();
      markerMaterial.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      stateRef.current = null;
    };
    // Intentionally run once: subsequent prop changes are applied imperatively below so we
    // never tear down and rebuild the WebGL context on every selection/time change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boundaries]);

  // Sun direction (day/night terminator), updated whenever the shared reference instant changes.
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    const sun = getSubsolarPoint(referenceInstant);
    const dir = latLonToVector3(sun.lat, sun.lon, 1);
    (s.earthMaterial.uniforms.sunDirection.value as THREE.Vector3).set(dir.x, dir.y, dir.z);
    s.needsRender = true;
  }, [referenceInstant]);

  // Marker position.
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    if (marker) {
      const pos = latLonToVector3(marker.lat, marker.lon, MARKER_RADIUS);
      s.markerMesh.position.set(pos.x, pos.y, pos.z);
      s.markerMesh.lookAt(0, 0, 0);
      s.markerMesh.visible = true;
    } else {
      s.markerMesh.visible = false;
    }
    s.needsRender = true;
  }, [marker?.lat, marker?.lon, marker?.label]);

  // Country highlight.
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    const colors = s.colorAttribute.array as Float32Array;
    const ranges = s.rangesByCode;

    function paintRange(code: string | null, color: THREE.Color) {
      if (!code) return;
      const range = ranges.get(code);
      if (!range) return;
      const startFloat = range.start * 2 * 3;
      const endFloat = (range.start + range.count) * 2 * 3;
      for (let i = startFloat; i < endFloat; i += 3) {
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
      }
    }

    if (s.highlightedCode) paintRange(s.highlightedCode, BASE_LINE_COLOR);
    paintRange(selectedCountryCode, HIGHLIGHT_LINE_COLOR);
    s.highlightedCode = selectedCountryCode;
    s.colorAttribute.needsUpdate = true;
    s.needsRender = true;
  }, [selectedCountryCode]);

  // Auto-rotate toggle.
  useEffect(() => {
    const s = stateRef.current;
    if (!s) return;
    s.autoRotateEnabled = autoRotate;
    s.controls.autoRotate = autoRotate && !s.hovered && !prefersReducedMotion();
    s.needsRender = true;
  }, [autoRotate]);

  // Fly-to-selection animation.
  useEffect(() => {
    const s = stateRef.current;
    if (!s || !marker || flyToSignal === 0) return;
    const targetDir = latLonToVector3(marker.lat, marker.lon, 1);
    const to = new THREE.Vector3(targetDir.x, targetDir.y, targetDir.z);
    if (prefersReducedMotion()) {
      to.multiplyScalar(s.camera.position.length());
      s.camera.position.copy(to);
      s.camera.lookAt(0, 0, 0);
      s.needsRender = true;
      return;
    }
    s.flyTo = { from: s.camera.position.clone().normalize(), to, startTime: performance.now(), duration: 900 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyToSignal]);

  return <div ref={containerRef} className="globe-interaction relative h-full w-full">
    <div ref={labelRef} className="globe-marker-label" style={{ visibility: 'hidden' }}>{marker?.label}</div>
  </div>;
}
