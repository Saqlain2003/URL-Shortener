import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Flame, Clock, AlertTriangle, ArrowRight, LayoutDashboard, Home, HelpCircle } from "lucide-react";
import FlameLogo from "../../components/landing/FlameLogo";
import "../../styles/dashboard.css";

/**
 * Animated Cooling Ember & Ash Particles Canvas
 * Embers drift downward like cooling ash from a dying flame.
 */
function CoolingEmberCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particleCount = 45;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2.2 + 0.8,
      speedY: Math.random() * 0.7 + 0.3, // gently drifting downwards like ash
      speedX: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.7 + 0.2,
      fadeRate: Math.random() * 0.003 + 0.001,
      // Colors: blazing amber cooling down to dark crimson ash
      color: Math.random() > 0.4 ? "#FF9800" : Math.random() > 0.5 ? "#D84315" : "#795548",
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.opacity -= p.fadeRate;

        if (p.y > canvas.height || p.opacity <= 0) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
          p.opacity = Math.random() * 0.7 + 0.3;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

export default function NotFoundPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const typeParam = searchParams.get("type");
  const code = searchParams.get("code") || "";
  const expiresAt = searchParams.get("expiresAt");

  const isExpired = typeParam === "expired" || Boolean(expiresAt);
  const isAuth = Boolean(localStorage.getItem("token"));

  const formattedDate = expiresAt
    ? new Date(expiresAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "recently";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 30%, #150D0A 0%, #080608 70%, #040304 100%)",
        color: "#FFF8E1",
        position: "relative",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Background Cooling Embers */}
      <CoolingEmberCanvas />

      {/* Top Header — Logo only, no clutter */}
      <header
        style={{
          padding: "1.75rem 2rem",
          position: "relative",
          zIndex: 2,
        }}
      >
        <Link to="/" style={{ textDecoration: "none", display: "inline-block" }}>
          <FlameLogo />
        </Link>
      </header>

      {/* Main Center Message Box */}
      <main
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "2rem 1.5rem",
          maxWidth: "640px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Burned Out Center Icon with Cooling Smoke Halo */}
        <div
          style={{
            position: "relative",
            width: "104px",
            height: "104px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(216, 67, 21, 0.22) 0%, rgba(20, 12, 10, 0.6) 70%)",
            border: "1px solid rgba(255, 152, 0, 0.28)",
            boxShadow: "0 0 45px rgba(216, 67, 21, 0.25), inset 0 0 20px rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.75rem",
          }}
        >
          <Flame
            size={52}
            color={isExpired ? "#FF9800" : "#E65100"}
            style={{
              filter: "drop-shadow(0 0 16px rgba(255, 152, 0, 0.6))",
              animation: "pulse 3s infinite ease-in-out",
            }}
          />
        </div>

        {/* Status Pill Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.3rem 0.85rem",
            borderRadius: "9999px",
            fontSize: "0.78rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "1.25rem",
            background: isExpired ? "rgba(255, 152, 0, 0.12)" : "rgba(244, 67, 54, 0.12)",
            color: isExpired ? "#FFB74D" : "#EF9A9A",
            border: `1px solid ${isExpired ? "rgba(255, 152, 0, 0.3)" : "rgba(244, 67, 54, 0.3)"}`,
            boxShadow: `0 0 14px ${isExpired ? "rgba(255, 152, 0, 0.15)" : "rgba(244, 67, 54, 0.15)"}`,
          }}
        >
          {isExpired ? <Clock size={13} /> : <AlertTriangle size={13} />}
          <span>{isExpired ? "Error 410 • Link Expired" : "Error 404 • Link Not Found"}</span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: "clamp(1.9rem, 5vw, 2.75rem)",
            fontWeight: 800,
            lineHeight: 1.15,
            margin: "0 0 1rem 0",
            background: "linear-gradient(135deg, #FFF8E1 20%, #FFA726 65%, #D84315 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
          }}
        >
          This link has burned out
        </h1>

        {/* Subtext */}
        <p
          style={{
            fontSize: "1.05rem",
            lineHeight: 1.6,
            color: "#BCAAA4",
            maxWidth: "500px",
            margin: "0 0 2.25rem 0",
          }}
        >
          {isExpired ? (
            <>
              This link reached the end of its life on{" "}
              <strong style={{ color: "#FFF8E1" }}>{formattedDate}</strong>. The embers have gone cold, but you can forge a new link anytime.
            </>
          ) : (
            <>
              {code ? (
                <>We couldn&apos;t find any link for <code style={{ color: "#FFD54F", background: "rgba(255, 152, 0, 0.12)", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>/{code}</code>. Check the code or forge a new short link to share.</>
              ) : (
                <>The shortened URL you&apos;re looking for either doesn&apos;t exist or was mistyped. Check the address or create a new link.</>
              )}
            </>
          )}
        </p>

        {/* Action Buttons Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
            width: "100%",
            maxWidth: "420px",
          }}
        >
          {/* Primary CTA (large, orange flame gradient) */}
          <button
            type="button"
            className="btn-create-new"
            onClick={() => navigate("/?focus=shorten")}
            style={{
              width: "100%",
              padding: "0.95rem 1.5rem",
              fontSize: "1rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.6rem",
              boxShadow: "0 8px 30px rgba(255, 152, 0, 0.45)",
            }}
          >
            <span>Create a new short link</span>
            <ArrowRight size={18} />
          </button>

          {/* Secondary CTA (outlined) */}
          <button
            type="button"
            onClick={() => navigate(isAuth ? "/dashboard" : "/dashboard")}
            style={{
              width: "100%",
              padding: "0.85rem 1.5rem",
              background: "rgba(20, 14, 10, 0.8)",
              border: "1px solid rgba(255, 152, 0, 0.35)",
              borderRadius: "10px",
              color: "#FFF8E1",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.55rem",
              backdropFilter: "blur(12px)",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#FF9800";
              e.currentTarget.style.background = "rgba(35, 20, 14, 0.95)";
              e.currentTarget.style.boxShadow = "0 0 18px rgba(255, 152, 0, 0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 152, 0, 0.35)";
              e.currentTarget.style.background = "rgba(20, 14, 10, 0.8)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <LayoutDashboard size={17} color="#FF9800" />
            <span>Go to dashboard</span>
          </button>

          {/* Tertiary CTA (ghost back to home) */}
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{
              background: "transparent",
              border: "none",
              color: "#A1887F",
              fontSize: "0.9rem",
              fontWeight: 500,
              cursor: "pointer",
              padding: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.45rem",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FFD54F")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#A1887F")}
          >
            <Home size={15} />
            <span>Back to home</span>
          </button>
        </div>
      </main>

      {/* Footer reference */}
      <footer
        style={{
          position: "relative",
          zIndex: 2,
          padding: "1.75rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.4rem",
          fontSize: "0.8rem",
          color: "#795548",
          borderTop: "1px solid rgba(255, 152, 0, 0.08)",
          background: "rgba(10, 7, 6, 0.4)",
        }}
      >
        <div>
          {isExpired
            ? `Error 410 — Link expired on ${formattedDate}`
            : code
            ? `Error 404 — Link "/${code}" not found`
            : "Error 404 — Link not found"}
        </div>
        <div>
          Questions?{" "}
          <a
            href="mailto:support@fewer.link"
            style={{ color: "#FF9800", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
          >
            <HelpCircle size={13} />
            <span>Visit our help center</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
