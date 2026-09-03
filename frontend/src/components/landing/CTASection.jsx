import { useNavigate } from "react-router-dom";
import { Zap, ArrowUpRight } from "lucide-react";

export default function CTASection({ isAuthenticated, onOpenAuth }) {
  const navigate = useNavigate();

  const handleDashboard = () => {
    navigate("/dashboard");
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
