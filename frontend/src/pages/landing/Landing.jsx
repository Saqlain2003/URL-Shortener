import { useState, useEffect } from "react";
import theme from "../../constants/theme";
import "../../styles/landing.css";

// Components
import Navbar from "../../components/landing/Navbar";
import SunBreathingBackground from "../../components/landing/SunBreathingBackground";
import FlameArcs from "../../components/landing/FlameArcs";
import EmberParticles from "../../components/landing/EmberParticles";
import IgniteHeadline from "../../components/landing/IgniteHeadline";
import ShortenForm from "../../components/landing/ShortenForm";
import ResultCard from "../../components/landing/ResultCard";
import LiveStatsStrip from "../../components/landing/LiveStatsStrip";
import AuthModal from "../../components/auth/AuthModal";
import ExampleSection from "../../components/landing/ExampleSection";
import CTASection from "../../components/landing/CTASection";
import Footer from "../../components/landing/Footer";
import { api } from "../../api/client";

/**
 * Landing page — Tanjiro's Hinokami Kagura (Sun Breathing) theme.
 * Composes all visual layers: WebGL shader → flame arcs → embers → overlay → content.
 */
export default function Landing() {
  const [forgedLink, setForgedLink] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authIsLoginMode, setAuthIsLoginMode] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  const [stats, setStats] = useState({ totalLinks: 0, totalClicks: 0, activeUsers: 0, topLinks: [] });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.stats();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch live stats", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenAuth = (isLogin) => {
    setAuthIsLoginMode(isLogin);
    setIsAuthOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bgSolid,
        color: theme.text,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <Navbar 
        isAuthenticated={isAuthenticated} 
        onOpenAuth={handleOpenAuth} 
        onLogout={handleLogout} 
      />

      <main className="hero">
        {/* Layer 0: WebGL Sun Breathing shader */}
        <SunBreathingBackground />

        {/* Layer 1: CSS flame arcs overlay */}
        <FlameArcs />

        {/* Layer 2: Floating ember particles */}
        <EmberParticles />

        {/* Layer 3: Radial gradient overlay for text readability */}
        <div className="hero-overlay" />

        {/* Layer 4: Content */}
        <div className="hero-inner">
          <div className="sun-badge">
            <span className="sun-badge-icon">☀</span>
            <span>Hinokami Kagura</span>
          </div>

          <IgniteHeadline text="Fewer characters to carry." />

          <p className="subhead">
            Paste a link. Watch it burn down to size.
          </p>

          <ShortenForm onShorten={setForgedLink} />
        </div>

        {forgedLink && (
          <div className="hero-bottom-area">
            <ResultCard result={forgedLink} />
          </div>
        )}
      </main>

      <ExampleSection topLinks={stats.topLinks} />
      
      <CTASection 
        isAuthenticated={isAuthenticated} 
        onOpenAuth={() => setIsAuthOpen(true)} 
      />

      <Footer />

      <LiveStatsStrip stats={stats} loading={statsLoading} />

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onLogin={() => setIsAuthenticated(true)}
        initialMode={authIsLoginMode}
      />
    </div>
  );
}
