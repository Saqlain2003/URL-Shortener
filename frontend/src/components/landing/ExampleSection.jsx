import { ArrowRight, BarChart2 } from "lucide-react";

export default function ExampleSection({ topLinks = [] }) {
  const backendBase = import.meta.env.VITE_API_BASE || '';
  
  if (!topLinks || topLinks.length === 0) {
    return null; // hide if no popular links yet
  }

  return (
    <section className="landing-section example-section">
      <div className="section-container">
        <h2 className="section-title">See It In Action</h2>
        <p className="section-subtitle">Real examples of how we turn messy URLs into clean, trackable links.</p>
        
        <div className="examples-grid">
          {topLinks.map((link) => (
            <div key={link.short_code} className="example-card">
              <div className="example-urls">
                <span className="long-url" title={link.long_url}>
                  {link.long_url.length > 40 ? link.long_url.substring(0, 40) + "..." : link.long_url}
                </span>
                <ArrowRight size={16} className="arrow-icon" />
                <span className="short-url">
                  {backendBase.replace(/^https?:\/\//, '')}/{link.short_code}
                </span>
              </div>
              <div className="example-stats">
                <BarChart2 size={14} color="#FFD166" />
                <span>{link.click_count.toLocaleString()} clicks</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
