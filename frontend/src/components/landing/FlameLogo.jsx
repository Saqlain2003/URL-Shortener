import { useState, useEffect } from "react";

/**
 * Animated logo — the letters fill from bottom to top
 * like fire pouring into them, then pulse with a golden glow.
 */
export default function FlameLogo() {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFilled(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="logo-wrap">
      <span className="logo-base">FEWER</span>
      <span
        className={`logo-fill ${filled ? "filled" : ""}`}
        style={{ clipPath: filled ? "inset(0% 0 0 0)" : "inset(100% 0 0 0)" }}
      >
        FEWER
      </span>
    </div>
  );
}
