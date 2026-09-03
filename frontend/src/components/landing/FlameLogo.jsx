/**
 * FEWER Brand Logo Component:
 * Features the large, crisp golden Sun & Chain Link emblem alongside
 * the stylish chiseled Cinzel Decorative typography.
 * Uniform and gorgeous across Landing, Dashboard, and Error pages.
 */
export default function FlameLogo({ size = 56, showText = true }) {
  return (
    <div className="brand-logo-container">
      <div
        className="brand-logo-emblem"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          aspectRatio: "1 / 1",
        }}
      >
        <img
          src="/assets/logo.png"
          alt="FEWER Sun Emblem"
          width={size}
          height={size}
          className="brand-logo-img"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            aspectRatio: "1 / 1",
            objectFit: "contain",
          }}
        />
      </div>

      {showText && (
        <span className="brand-title">FEWER</span>
      )}
    </div>
  );
}
