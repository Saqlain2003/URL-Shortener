import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Sun Breathing WebGL Shader (Hinokami Kagura)
 *
 * Creates a blazing solar disc with corona, radial rays,
 * circular flame arcs (sword slash trails), swirling tendrils,
 * and ambient fire glow — all running per-pixel on the GPU.
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
    // Sun centered exactly in the middle to halve the gap with nav
    vec2 center = vec2(0.5, 0.5);
    vec2 p = (uv - center) * vec2(aspect, 1.0);

    float dist = length(p);
    float angle = atan(p.y, p.x);

    // ── 1. Solar disc core + corona ──
    float pulse = 0.97 + 0.03 * sin(uTime * 2.8);
    float corePulse = 0.98 + 0.02 * sin(uTime * 4.5);

    float coreRadius = 0.05 * corePulse;
    float core = smoothstep(coreRadius + 0.02, coreRadius - 0.01, dist);
    core *= 0.85 + 0.08 * sin(uTime * 7.0);

    float innerGlow = smoothstep(0.16, 0.02, dist) * 0.7;

    float coronaNoise = fbm(vec2(angle * 3.0 + uTime * 0.3, dist * 8.0 - uTime * 1.5));
    float coronaRadius = 0.12 * pulse + 0.04 * coronaNoise;
    float corona = smoothstep(coronaRadius + 0.06, coronaRadius - 0.01, dist);
    corona *= (0.7 + 0.3 * coronaNoise);

    // ── 2. Radial light rays ──
    float rayCount = 12.0;
    float rayAngle = angle + uTime * 0.15;
    float rays = pow(abs(sin(rayAngle * rayCount * 0.5)), 8.0);
    rays *= smoothstep(0.45, 0.08, dist) * smoothstep(0.0, 0.08, dist);
    float rayFlicker = 0.75 + 0.25 * sin(uTime * 3.2 + angle * 4.0);
    rays *= rayFlicker * 0.35;

    float rays2 = pow(abs(sin((rayAngle + 0.26) * (rayCount + 5.0) * 0.5)), 12.0);
    rays2 *= smoothstep(0.35, 0.06, dist) * smoothstep(0.0, 0.05, dist);
    rays2 *= 0.15;

    // ── 3. Circular flame arcs (sword slash trails) ──
    float arc1 = 0.0;
    {
      float a2 = angle - uTime * 0.8;
      float ad = abs(dist - 0.2);
      float aw = 0.025 + 0.015 * sin(a2 * 3.0);
      float am = smoothstep(aw, 0.0, ad);
      float as2 = smoothstep(0.0, 0.5, sin(a2 * 0.5 + 0.4));
      as2 *= smoothstep(3.14, 2.5, abs(a2 - 1.5));
      float an = fbm(vec2(a2 * 4.0 + uTime, dist * 12.0));
      arc1 = am * as2 * (0.6 + 0.4 * an);
    }

    float arc2 = 0.0;
    {
      float a2 = angle + uTime * 0.55 + 2.0;
      float ad = abs(dist - 0.28);
      float aw = 0.018 + 0.012 * sin(a2 * 4.0);
      float am = smoothstep(aw, 0.0, ad);
      float as2 = smoothstep(0.0, 0.6, sin(a2 * 0.5 - 0.3));
      as2 *= smoothstep(3.14, 2.0, abs(a2 - 0.8));
      float an = fbm(vec2(a2 * 5.0 - uTime * 0.5, dist * 10.0));
      arc2 = am * as2 * (0.5 + 0.5 * an);
    }

    float arc3 = 0.0;
    {
      float a2 = angle - uTime * 0.35 - 1.2;
      float ad = abs(dist - 0.35);
      float aw = 0.02 + 0.02 * sin(a2 * 2.5);
      float am = smoothstep(aw, 0.0, ad);
      float as2 = smoothstep(0.0, 0.4, sin(a2 * 0.5 + 1.0));
      float an = fbm(vec2(a2 * 3.0 + uTime * 0.7, dist * 8.0));
      arc3 = am * as2 * (0.4 + 0.4 * an) * 0.6;
    }

    float arcs = arc1 + arc2 + arc3;

    // ── 4. Swirling flame tendrils ──
    vec2 spiralUV = vec2(
      angle / 6.2832 + uTime * 0.12,
      dist * 3.0 - uTime * 0.4
    );
    float spiral = fbm(spiralUV * 4.0 + fbm(spiralUV * 2.5) * 0.8);
    spiral *= smoothstep(0.55, 0.1, dist) * smoothstep(0.0, 0.08, dist);
    spiral *= 0.3;

    // ── 5. Outer ambient fire ──
    vec2 ambientUV = vec2(uv.x * 2.5, uv.y * 2.0 - uTime * 0.3);
    float ambient = fbm(ambientUV + fbm(ambientUV * 1.4) * 0.6);
    ambient *= smoothstep(0.7, 0.15, dist) * 0.2;

    // ── 6. Compose & color ramp ──
    float totalIntensity = core + innerGlow + corona + rays + rays2 + arcs + spiral + ambient;
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
