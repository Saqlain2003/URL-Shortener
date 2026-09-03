import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Globe, Flame, X, MapPin, Compass, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

// Convert Lat/Lon to 3D Cartesian coordinates on sphere
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Color thresholds according to user specification
function getIntensityDetails(count) {
  if (!count || count <= 0) {
    return {
      color: 0x555555,
      hex: "#555555",
      auraHex: "rgba(100, 100, 100, 0.2)",
      size: 0.038,
      beamHeight: 0.1,
      glowRadius: 0.07,
    };
  }
  if (count <= 10) {
    return {
      color: 0xD84315,
      hex: "#D84315",
      auraHex: "rgba(216, 67, 21, 0.5)",
      size: 0.055,
      beamHeight: 0.35,
      glowRadius: 0.12,
    };
  }
  if (count <= 50) {
    return {
      color: 0xFF9800,
      hex: "#FF9800",
      auraHex: "rgba(255, 152, 0, 0.75)",
      size: 0.07,
      beamHeight: 0.6,
      glowRadius: 0.17,
    };
  }
  // 50+ clicks: blazing gold/yellow
  return {
    color: 0xFFD54F,
    hex: "#FFD54F",
    auraHex: "rgba(255, 213, 79, 0.95)",
    size: 0.09,
    beamHeight: 0.95,
    glowRadius: 0.24,
  };
}

// Fallback texture while asset loads or in offline fallback
function createFallbackEarthTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#060810";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return new THREE.CanvasTexture(canvas);
}

export default function GlobeHero({ clicksByCountry = [], clicksByCity = [] }) {
  const mountRef = useRef(null);
  const [hoveredData, setHoveredData] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [selectedCountry, setSelectedCountry] = useState(null);

  // References for Three.js cleanup and animation
  const sceneRef = useRef(null);
  const globeGroupRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const pulsingRingsRef = useRef([]);

  // Auto-rotation state
  const isInteractingRef = useRef(false);
  const idleTimeoutRef = useRef(null);

  // Map clicks by country code (ISO2) or full name
  const countryClickMap = clicksByCountry.reduce((acc, curr) => {
    if (curr._id && curr._id !== "unknown") {
      acc[curr._id.toUpperCase()] = curr.count;
    }
    return acc;
  }, {});

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 800;
    const height = 480;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 4.8;
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    rendererRef.current = renderer;

    mount.replaceChildren(renderer.domElement);

    // 3. Globe Group Container
    const globeGroup = new THREE.Group();
    globeGroup.rotation.x = 0.25; // Earth axial tilt
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // 4. Base Earth Sphere
    const globeRadius = 1.8;
    const earthGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);
    
    // Load high-resolution realistic dark Earth texture
    const textureLoader = new THREE.TextureLoader();
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: createFallbackEarthTexture(),
      roughness: 0.82,
      metalness: 0.1,
      color: 0xDDDDDD,
    });

    textureLoader.load(
      "/assets/earth-dark.jpg",
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        earthMaterial.map = tex;
        earthMaterial.needsUpdate = true;
      },
      undefined,
      (err) => {
        console.warn("Could not load /assets/earth-dark.jpg, using fallback", err);
      }
    );

    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earthMesh);

    // 5. Atmosphere Glow Shell (additive Fresnel aura)
    const atmosphereGeometry = new THREE.SphereGeometry(globeRadius * 1.02, 48, 48);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(1.0, 0.55, 0.1, 0.8) * intensity;
        }
      `,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeGroup.add(atmosphereMesh);

    // 6. Lighting
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.1);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xFFE0B2, 1.7);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xFF9800, 0.9);
    rimLight.position.set(-5, -2, -3);
    scene.add(rimLight);

    // 7. Fire Ember Particles in Background Space
    const starCount = 180;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 20;
      starPositions[i + 1] = (Math.random() - 0.5) * 15;
      starPositions[i + 2] = -3 - Math.random() * 8;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0xFFB74D,
      transparent: true,
      opacity: 0.5,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 8. Markers and Real Country Vector Boundaries
    const markerGroup = new THREE.Group();
    globeGroup.add(markerGroup);

    const interactiveMeshes = [];
    const pulsingRings = [];

    // Fetch and render exact Natural Earth country borders
    fetch("/assets/ne_110m_countries.json")
      .then((res) => res.json())
      .then((geoData) => {
        if (!geoData?.features) return;

        const borderPositions = [];

        geoData.features.forEach((feature) => {
          const geom = feature.geometry;
          const props = feature.properties || {};
          const countryCode = (props.ISO_A2 || props.ISO_A2_EH || props.POSTAL || "").toUpperCase();
          const countryName = props.NAME || props.ADMIN || "Country";
          const labelLat = props.LABEL_Y;
          const labelLon = props.LABEL_X;

          // 8A. Extract Real Vector Boundary Segments
          if (geom) {
            const polygons =
              geom.type === "Polygon"
                ? [geom.coordinates]
                : geom.type === "MultiPolygon"
                ? geom.coordinates
                : [];

            polygons.forEach((poly) => {
              poly.forEach((ring) => {
                for (let i = 0; i < ring.length - 1; i++) {
                  const [lon1, lat1] = ring[i];
                  const [lon2, lat2] = ring[i + 1];

                  // Prevent wrapping lines across the antimeridian
                  if (Math.abs(lon1 - lon2) < 180) {
                    const p1 = latLonToVector3(lat1, lon1, globeRadius * 1.002);
                    const p2 = latLonToVector3(lat2, lon2, globeRadius * 1.002);
                    borderPositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
                  }
                }
              });
            });
          }

          // 8B. Create Exact Country Marker Beacon at Official Centroid
          if (typeof labelLat === "number" && typeof labelLon === "number") {
            const clicks =
              countryClickMap[countryCode] ||
              countryClickMap[countryName.toUpperCase()] ||
              0;

            // Only display markers for active clicks or reference anchor countries
            const isMajor = ["US", "IN", "GB", "DE", "FR", "JP", "BR", "CA", "AU", "SG"].includes(countryCode);
            if (clicks === 0 && !isMajor) return;

            const intensity = getIntensityDetails(clicks);
            const pos = latLonToVector3(labelLat, labelLon, globeRadius);

            // Core Marker Dot
            const dotGeo = new THREE.SphereGeometry(intensity.size, 16, 16);
            const dotMat = new THREE.MeshBasicMaterial({ color: intensity.color });
            const dotMesh = new THREE.Mesh(dotGeo, dotMat);
            dotMesh.position.copy(pos);

            dotMesh.userData = {
              code: countryCode,
              name: countryName,
              clicks,
              intensity,
            };

            markerGroup.add(dotMesh);
            interactiveMeshes.push(dotMesh);

            // Add vertical light beam and pulsing halo for active countries
            if (clicks > 0) {
              const normal = pos.clone().normalize();

              // Vertical Light Beam
              const beamGeo = new THREE.CylinderGeometry(0.008, 0.02, intensity.beamHeight, 8);
              const beamMat = new THREE.MeshBasicMaterial({
                color: intensity.color,
                transparent: true,
                opacity: 0.85,
              });
              const beamMesh = new THREE.Mesh(beamGeo, beamMat);
              const beamCenter = pos.clone().add(normal.clone().multiplyScalar(intensity.beamHeight / 2));
              beamMesh.position.copy(beamCenter);
              beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
              markerGroup.add(beamMesh);

              // Pulsing Ring Halo
              const ringGeo = new THREE.RingGeometry(intensity.size * 1.1, intensity.glowRadius, 24);
              const ringMat = new THREE.MeshBasicMaterial({
                color: intensity.color,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.85,
              });
              const ringMesh = new THREE.Mesh(ringGeo, ringMat);
              ringMesh.position.copy(pos.clone().multiplyScalar(1.003));
              ringMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
              markerGroup.add(ringMesh);

              pulsingRings.push({
                mesh: ringMesh,
                baseRadius: intensity.glowRadius,
                speed: 1.6 + Math.random(),
                offset: Math.random() * Math.PI,
              });
            }
          }
        });

        // 8C. Render Razor-Sharp Country Boundaries as Vector LineSegments
        if (borderPositions.length > 0) {
          const borderGeo = new THREE.BufferGeometry();
          borderGeo.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(borderPositions, 3)
          );
          const borderMat = new THREE.LineBasicMaterial({
            color: 0xFFA726,
            transparent: true,
            opacity: 0.38,
            linewidth: 1,
          });
          const borderLines = new THREE.LineSegments(borderGeo, borderMat);
          globeGroup.add(borderLines);
        }
      })
      .catch((err) => {
        console.warn("Could not load country boundary GeoJSON:", err);
      });

    pulsingRingsRef.current = pulsingRings;

    // 9. Raycaster for Hover & Click Interactions
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Pause auto-rotation on mouse motion
      isInteractingRef.current = true;
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = setTimeout(() => {
        isInteractingRef.current = false;
      }, 2000);

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object.userData;
        setHoveredData(hit);
        setTooltipPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        renderer.domElement.style.cursor = "pointer";
      } else {
        setHoveredData(null);
        renderer.domElement.style.cursor = "grab";
      }
    };

    const handleClick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object.userData;
        setSelectedCountry(hit);
      }
    };

    // 10. Drag to Rotate
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const handlePointerDown = (e) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
      renderer.domElement.style.cursor = "grabbing";
      isInteractingRef.current = true;
    };

    const handleGlobalPointerUp = () => {
      isDragging = false;
      if (renderer.domElement) {
        renderer.domElement.style.cursor = "grab";
      }
    };

    const handleGlobalPointerMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;
      prevMousePos = { x: e.clientX, y: e.clientY };

      globeGroup.rotation.y += deltaX * 0.005;
      globeGroup.rotation.x += deltaY * 0.005;

      // Clamp X tilt
      globeGroup.rotation.x = Math.max(-1.0, Math.min(1.0, globeGroup.rotation.x));
      isInteractingRef.current = true;
    };

    // 11. Scroll to Zoom
    const handleWheel = (e) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.0025;
      camera.position.z = Math.max(3.2, Math.min(7.0, camera.position.z));
    };

    const domElem = renderer.domElement;
    domElem.addEventListener("pointermove", handlePointerMove);
    domElem.addEventListener("pointerdown", handlePointerDown);
    domElem.addEventListener("click", handleClick);
    domElem.addEventListener("wheel", handleWheel, { passive: false });

    window.addEventListener("pointermove", handleGlobalPointerMove);
    window.addEventListener("pointerup", handleGlobalPointerUp);

    // 12. Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Auto-rotation when idle
      if (!isInteractingRef.current) {
        globeGroup.rotation.y += 0.0018;
      }

      // Animate pulsing halo rings
      pulsingRingsRef.current.forEach((item) => {
        const pulse = (Math.sin(elapsedTime * item.speed + item.offset) + 1) / 2;
        const scale = 1.0 + pulse * 1.1;
        item.mesh.scale.set(scale, scale, scale);
        item.mesh.material.opacity = 0.9 - pulse * 0.7;
      });

      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    // 13. Responsive Resize
    const handleResize = () => {
      if (!mount) return;
      const newW = mount.clientWidth || 800;
      camera.aspect = newW / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, height);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", handleGlobalPointerUp);

      domElem.removeEventListener("pointermove", handlePointerMove);
      domElem.removeEventListener("pointerdown", handlePointerDown);
      domElem.removeEventListener("click", handleClick);
      domElem.removeEventListener("wheel", handleWheel);

      renderer.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
    };
  }, [clicksByCountry]);

  // Cities matching currently selected country
  const selectedCities = selectedCountry
    ? clicksByCity.filter(
        (c) =>
          c.country?.toUpperCase() === selectedCountry.code?.toUpperCase() ||
          c.country?.toLowerCase() === selectedCountry.name?.toLowerCase()
      )
    : [];

  const handleZoom = (delta) => {
    if (!cameraRef.current) return;
    cameraRef.current.position.z += delta;
    cameraRef.current.position.z = Math.max(3.2, Math.min(7.0, cameraRef.current.position.z));
  };

  const handleResetRotation = () => {
    if (!globeGroupRef.current || !cameraRef.current) return;
    globeGroupRef.current.rotation.set(0.25, 0, 0);
    cameraRef.current.position.z = 4.8;
  };

  return (
    <div className="analytics-card" style={{ position: "relative", overflow: "hidden", padding: 0 }}>
      {/* Globe Header Strip */}
      <div style={{
        padding: "1.25rem 1.5rem 0.75rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.75rem",
        borderBottom: "1px solid rgba(255, 152, 0, 0.12)",
        background: "rgba(10, 7, 6, 0.6)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div className="stat-icon-wrap" style={{ width: 32, height: 32 }}>
            <Globe size={18} color="#FF9800" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#FFF8E1" }}>
              Global Real-Time Reach
            </h3>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#A1887F" }}>
              Official Natural Earth vector boundaries: drag to rotate, scroll to zoom, click beacons to inspect cities.
            </p>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", fontSize: "0.76rem" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "#A1887F" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D84315", display: "inline-block" }} />
            1–10 (Dim)
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "#A1887F" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#FF9800", display: "inline-block", boxShadow: "0 0 6px #FF9800" }} />
            10–50 (Bright)
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "#FFD54F" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFD54F", display: "inline-block", boxShadow: "0 0 10px #FFD54F" }} />
            50+ (Blazing)
          </span>
        </div>
      </div>

      {/* 3D Canvas Mount */}
      <div
        ref={mountRef}
        style={{
          width: "100%",
          height: "480px",
          background: "radial-gradient(circle at 50% 50%, rgba(20, 14, 10, 0.9) 0%, #060810 100%)",
          position: "relative",
          cursor: "grab",
        }}
      />

      {/* Floating Canvas Controls (Zoom & Reset) */}
      <div style={{
        position: "absolute",
        bottom: "1.25rem",
        right: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.4rem",
        zIndex: 10
      }}>
        <button
          type="button"
          className="action-icon-btn"
          onClick={() => handleZoom(-0.5)}
          title="Zoom In"
          style={{ background: "rgba(18, 12, 9, 0.85)", border: "1px solid rgba(255, 152, 0, 0.2)" }}
        >
          <ZoomIn size={16} color="#FFF8E1" />
        </button>
        <button
          type="button"
          className="action-icon-btn"
          onClick={() => handleZoom(0.5)}
          title="Zoom Out"
          style={{ background: "rgba(18, 12, 9, 0.85)", border: "1px solid rgba(255, 152, 0, 0.2)" }}
        >
          <ZoomOut size={16} color="#FFF8E1" />
        </button>
        <button
          type="button"
          className="action-icon-btn"
          onClick={handleResetRotation}
          title="Reset View"
          style={{ background: "rgba(18, 12, 9, 0.85)", border: "1px solid rgba(255, 152, 0, 0.2)" }}
        >
          <RotateCcw size={16} color="#FF9800" />
        </button>
      </div>

      {/* Hover Tooltip */}
      {hoveredData && (
        <div style={{
          position: "absolute",
          top: tooltipPos.y - 45,
          left: tooltipPos.x + 15,
          transform: "translate(-50%, -100%)",
          background: "#180E0A",
          border: `1px solid ${hoveredData.intensity?.hex || "#FF9800"}`,
          borderRadius: "8px",
          padding: "0.45rem 0.75rem",
          pointerEvents: "none",
          zIndex: 30,
          boxShadow: `0 8px 24px rgba(0,0,0,0.7), 0 0 15px ${hoveredData.intensity?.auraHex || "transparent"}`,
          whiteSpace: "nowrap",
          animation: "fadeIn 0.15s ease-out"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, fontSize: "0.85rem", color: "#FFF8E1" }}>
            <MapPin size={14} color={hoveredData.intensity?.hex} />
            <span>{hoveredData.name}</span>
          </div>
          <div style={{ fontSize: "0.78rem", color: hoveredData.intensity?.hex, marginTop: "0.15rem", fontWeight: 600 }}>
            {hoveredData.clicks} {hoveredData.clicks === 1 ? "click" : "clicks"}
            {hoveredData.clicks > 0 && (
              <span style={{ color: "#A1887F", fontWeight: 400, marginLeft: "0.4rem" }}>(click to view cities)</span>
            )}
          </div>
        </div>
      )}

      {/* Click Drilldown Drawer / Card */}
      {selectedCountry && (
        <div style={{
          position: "absolute",
          top: "1.25rem",
          left: "1.25rem",
          maxWidth: "310px",
          width: "calc(100% - 2.5rem)",
          background: "rgba(20, 14, 10, 0.94)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255, 152, 0, 0.35)",
          borderRadius: "12px",
          padding: "1.25rem",
          zIndex: 25,
          boxShadow: "0 14px 40px rgba(0, 0, 0, 0.75), 0 0 25px rgba(255, 152, 0, 0.15)",
          animation: "scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Flame size={16} color="#FF9800" />
                <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#FFF8E1" }}>
                  {selectedCountry.name}
                </h4>
              </div>
              <span style={{ fontSize: "0.8rem", color: "#A1887F" }}>
                Country Code: {selectedCountry.code}
              </span>
            </div>
            <button
              type="button"
              className="action-icon-btn"
              onClick={() => setSelectedCountry(null)}
              style={{ width: 26, height: 26 }}
              aria-label="Close cities"
            >
              <X size={16} />
            </button>
          </div>

          <div style={{
            background: "rgba(255, 152, 0, 0.08)",
            border: "1px solid rgba(255, 152, 0, 0.18)",
            borderRadius: "8px",
            padding: "0.6rem 0.8rem",
            marginBottom: "0.85rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span style={{ fontSize: "0.82rem", color: "#A1887F" }}>Total Clicks</span>
            <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#FFD54F" }}>
              {selectedCountry.clicks}
            </span>
          </div>

          {/* City Breakdown List */}
          <div style={{ maxHeight: "170px", overflowY: "auto", paddingRight: "0.25rem" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#A1887F", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              City Breakdown
            </div>

            {selectedCities.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {selectedCities.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "0.84rem",
                      padding: "0.35rem 0.5rem",
                      background: "rgba(10, 7, 6, 0.5)",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 152, 0, 0.08)"
                    }}
                  >
                    <span style={{ color: "#FFF3E0", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Compass size={13} color="#FF9800" />
                      {c.city && c.city !== "unknown" ? c.city : "Direct / Regional"}
                    </span>
                    <span style={{ fontWeight: 700, color: "#FFD54F" }}>
                      {c.count} {c.count === 1 ? "click" : "clicks"}
                    </span>
                  </div>
                ))}
              </div>
            ) : selectedCountry.clicks > 0 ? (
              <p style={{ fontSize: "0.8rem", color: "#A1887F", margin: 0 }}>
                Traffic was recorded via secure / private network without granular city headers.
              </p>
            ) : (
              <p style={{ fontSize: "0.8rem", color: "#A1887F", margin: 0 }}>
                No clicks have arrived from {selectedCountry.name} yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
