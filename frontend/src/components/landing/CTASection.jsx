import { Zap, ArrowUpRight } from "lucide-react";

export default function CTASection({ isAuthenticated, onOpenAuth }) {
  const handleDashboard = () => {
    // For now, scroll to the top hero section to shorten a link
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="landing-section cta-section">
      <div className="section-container">
        <h2 className="cta-title">Ready to forge your first link?</h2>
        <p className="cta-subtitle">
          Join fewer.link today and experience the Hinokami Kagura of URL shorteners.
        </p>
        
        {isAuthenticated ? (
          <button className="cta-button" onClick={handleDashboard}>
            Go to Dashboard <ArrowUpRight size={18} />
          </button>
        ) : (
          <button className="cta-button" onClick={onOpenAuth}>
            <Zap size={18} /> Create Account
          </button>
        )}
      </div>
    </section>
  );
}
