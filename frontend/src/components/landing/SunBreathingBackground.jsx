import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Sun Breathing WebGL Shader (Hinokami Kagura)
 *
 * Creates a blazing solar disc with corona, radial rays,
 * circular flame arcs (sword slash trails), swirling tendrils,
 * and ambient fire glow — with 100% seamless 360-degree continuity.
 * Eliminates polar angle branch cuts and seam artifacts.
 */

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;

  // 2D Rotation Helper (Continuous everywhere, zero polar seam)
  vec2 rotate2D(vec2 v, float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c) * v;
  }

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 6; i++) {
      value += amp * noise(p);
      p *= 2.03;
      amp *= 0.48;
    }
    return value;
  }

  void main() {
    float aspect = uResolution.x / uResolution.y;
    vec2 uv = vUv;
    vec2 center = vec2(0.5, 0.5);
    vec2 p = (uv - center) * vec2(aspect, 1.0);

    float dist = length(p);
    vec2 dir = (dist > 0.0001) ? (p / dist) : vec2(0.0, 1.0);

    // ── 1. Solar disc core + inner glow ──
    float pulse = 0.97 + 0.03 * sin(uTime * 2.8);
    float corePulse = 0.98 + 0.02 * sin(uTime * 4.5);

    float coreRadius = 0.055 * corePulse;
    float core = smoothstep(coreRadius + 0.02, coreRadius - 0.01, dist);
    core *= 0.85 + 0.08 * sin(uTime * 7.0);

    float innerGlow = smoothstep(0.18, 0.02, dist) * 0.75;

    // ── 2. Corona (Roiling surface noise in 2D Cartesian space) ──
    vec2 pCorona = rotate2D(p, uTime * 0.22);
    float coronaNoise = fbm(pCorona * 6.5 + vec2(uTime * 0.35, -uTime * 0.2));
    float coronaRadius = 0.125 * pulse + 0.035 * coronaNoise;
    float corona = smoothstep(coronaRadius + 0.065, coronaRadius - 0.015, dist);
    corona *= (0.7 + 0.3 * coronaNoise);

    // ── 3. Radial light rays (Strictly even harmonics = 100% periodic & seamless) ──
    vec2 pRays = rotate2D(p, uTime * 0.12);
    float rayAngle = atan(pRays.y, pRays.x);
    // 6 cycles = 12 peaks, perfectly symmetric across negative x
    float rays1 = pow(abs(sin(rayAngle * 6.0)), 6.0);
    rays1 *= smoothstep(0.48, 0.08, dist) * smoothstep(0.0, 0.07, dist);
    float rayFlicker = 0.75 + 0.25 * sin(uTime * 3.2 + rayAngle * 4.0);
    rays1 *= rayFlicker * 0.32;

    vec2 pRays2 = rotate2D(p, -uTime * 0.09 + 0.4);
    float rayAngle2 = atan(pRays2.y, pRays2.x);
    float rays2 = pow(abs(sin(rayAngle2 * 8.0)), 8.0);
    rays2 *= smoothstep(0.38, 0.06, dist) * smoothstep(0.0, 0.05, dist) * 0.18;

    float rays = rays1 + rays2;

    // ── 4. Circular flame arcs (Tanjiro sword slash trails - Seamless Cartesian) ──
    // Arc 1: radius 0.22, spinning clockwise
    vec2 pa1 = rotate2D(p, uTime * 0.75);
    float d1 = abs(length(pa1) - 0.22);
    vec2 dir1 = normalize(pa1);
    float taper1 = smoothstep(-0.5, 0.7, dir1.x * 0.8 + dir1.y * 0.6);
    float n1 = fbm(rotate2D(pa1, -uTime * 0.4) * 11.0);
    float arc1 = smoothstep(0.022 + 0.012 * n1, 0.0, d1) * taper1 * (0.6 + 0.4 * n1);

    // Arc 2: radius 0.29, spinning counter-clockwise
    vec2 pa2 = rotate2D(p, -uTime * 0.52 + 1.8);
    float d2 = abs(length(pa2) - 0.29);
    vec2 dir2 = normalize(pa2);
    float taper2 = smoothstep(-0.6, 0.65, dir2.y * 0.8 - dir2.x * 0.6);
    float n2 = fbm(rotate2D(pa2, uTime * 0.3) * 9.0);
    float arc2 = smoothstep(0.019 + 0.011 * n2, 0.0, d2) * taper2 * (0.55 + 0.45 * n2);

    // Arc 3: radius 0.36, slower ambient ring
    vec2 pa3 = rotate2D(p, uTime * 0.38 - 1.2);
    float d3 = abs(length(pa3) - 0.36);
    vec2 dir3 = normalize(pa3);
    float taper3 = smoothstep(-0.7, 0.6, -dir3.x * 0.7 + dir3.y * 0.7);
    float n3 = fbm(pa3 * 8.0);
    float arc3 = smoothstep(0.024 + 0.014 * n3, 0.0, d3) * taper3 * 0.4;

    float arcs = arc1 + arc2 + arc3;

    // ── 5. Swirling logarithmic flame tendrils (Cartesian twist) ──
    float twist = dist * 7.5 - uTime * 0.55;
    vec2 pSpiral = rotate2D(p, twist) * 4.5;
    float spiral = fbm(pSpiral + fbm(pSpiral * 1.5) * 0.4);
    spiral *= smoothstep(0.55, 0.12, dist) * smoothstep(0.01, 0.08, dist) * 0.32;

    // ── 6. Outer ambient fire ──
    vec2 pAmbient = rotate2D(p, -uTime * 0.18) * 2.2;
    float ambient = fbm(pAmbient + vec2(0.0, -uTime * 0.25));
    ambient *= smoothstep(0.72, 0.18, dist) * 0.22;

    // ── 7. Compose colors ──
    float totalIntensity = core + innerGlow + corona + rays + arcs + spiral + ambient;
    totalIntensity = clamp(totalIntensity, 0.0, 1.5);

    vec3 colorCrimson = vec3(0.749, 0.212, 0.047);
    vec3 colorOrange  = vec3(1.0, 0.596, 0.0);
    vec3 colorGold    = vec3(1.0, 0.835, 0.31);
    vec3 colorWhite   = vec3(1.0, 0.973, 0.882);

    vec3 color = colorCrimson;
    color = mix(color, colorOrange, smoothstep(0.08, 0.28, totalIntensity));
    color = mix(color, colorGold, smoothstep(0.28, 0.55, totalIntensity));
    color = mix(color, colorWhite, smoothstep(0.6, 0.95, totalIntensity));

    float midBoost = smoothstep(0.15, 0.35, totalIntensity) * smoothstep(0.65, 0.4, totalIntensity);
    color = mix(color, color * vec3(1.1, 0.9, 0.7), midBoost * 0.3);

    float alpha = smoothstep(0.02, 0.15, totalIntensity);
    gl_FragColor = vec4(color, alpha);
  }
`;

function SunBreathingMesh() {
  const materialRef = useRef();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    }),
    []
  );

  useEffect(() => {
    const handleResize = () => {
      if (materialRef.current) {
        materialRef.current.uniforms.uResolution.value.set(
          window.innerWidth,
          window.innerHeight
        );
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export default function SunBreathingBackground() {
  return (
    <Canvas
      className="sun-breathing-canvas"
      gl={{ alpha: true, antialias: false }}
      dpr={[1, 1.5]}
    >
      <SunBreathingMesh />
    </Canvas>
  );
}
