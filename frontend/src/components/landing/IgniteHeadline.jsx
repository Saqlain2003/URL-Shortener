import { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import theme from "../../constants/theme";

/**
 * Headline that ignites letter-by-letter on mount, then responds
 * to hover by burning 2-3 neighboring letters at once with a
 * fiery glow effect — like Tanjiro's blade scorching the air.
 */
export default function IgniteHeadline({ text }) {
  const containerRef = useRef(null);
  const [burnIndex, setBurnIndex] = useState(-1);

  // Number of neighbors on each side that also burn
  const BURN_RADIUS = 1;

  useEffect(() => {
    const letters = containerRef.current.querySelectorAll(".ig-char");
    gsap.fromTo(
      letters,
      {
        opacity: 0,
        y: 30,
        filter: "blur(8px)",
        color: theme.flameCrimson,
      },
      {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        color: theme.text,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.03,
        onComplete: () => {
          gsap.to(letters, {
            textShadow: `0 0 20px ${theme.coreGold}, 0 0 40px ${theme.flameOrange}`,
            duration: 0.6,
            stagger: 0.02,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut",
          });
        },
      }
    );
  }, [text]);

  const handleCharEnter = useCallback((i) => {
    setBurnIndex(i);
  }, []);

  const handleCharLeave = useCallback(() => {
    setBurnIndex(-1);
  }, []);

  // Determine the burn intensity for a character at position `idx`
  // relative to the hovered index. Returns a className suffix.
  const getBurnClass = (idx) => {
    if (burnIndex < 0) return "";
    const distance = Math.abs(idx - burnIndex);
    if (distance === 0) return "burn-core";
    if (distance <= BURN_RADIUS) return "burn-near";
    if (distance <= BURN_RADIUS + 1) return "burn-far";
    return "";
  };

  return (
    <h1 className="ignite-headline" ref={containerRef}>
      {text.split("").map((ch, i) => (
        <span
          key={i}
          className={`ig-char ${getBurnClass(i)}`}
          style={{ display: ch === " " ? "inline" : "inline-block" }}
          onMouseEnter={() => handleCharEnter(i)}
          onMouseLeave={handleCharLeave}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </h1>
  );
}
