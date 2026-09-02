import { useMemo } from "react";

/**
 * Floating ember particles that rise upward with organic sway.
 * Pure CSS animation — no JS animation loop needed.
 */
export default function EmberParticles() {
  const embers = useMemo(() => {
    const particles = [];
    for (let i = 0; i < 35; i++) {
      particles.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 5 + Math.random() * 7,
        size: 2 + Math.random() * 4,
        opacity: 0.3 + Math.random() * 0.6,
        swayAmount: 15 + Math.random() * 40,
        startY: 70 + Math.random() * 35,
      });
    }
    return particles;
  }, []);

  return (
    <div className="ember-container">
      {embers.map((e) => (
        <div
          key={e.id}
          className="ember"
          style={{
            left: `${e.left}%`,
            bottom: `-5%`,
            width: `${e.size}px`,
            height: `${e.size}px`,
            opacity: e.opacity,
            animationDelay: `${e.delay}s`,
            animationDuration: `${e.duration}s`,
            "--sway": `${e.swayAmount}px`,
            "--startY": `${e.startY}vh`,
          }}
        />
      ))}
    </div>
  );
}
