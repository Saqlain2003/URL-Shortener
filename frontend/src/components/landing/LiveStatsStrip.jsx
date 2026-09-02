import { Activity, Flame, Zap, Users } from "lucide-react";
import { useCountUp } from "../../hooks/useCountUp";

export default function LiveStatsStrip({ stats, loading }) {
  // Animated counters
  const animatedLinks = useCountUp(stats?.totalLinks || 0);
  const animatedClicks = useCountUp(stats?.totalClicks || 0);
  const animatedUsers = useCountUp(stats?.activeUsers || 0);

  return (
    <div className="live-stats-strip">
      <div className="stats-inner">
        <div className="stat-item">
          <Flame size={16} color="#FF6B35" />
          <span className="stat-value">{loading ? "..." : animatedLinks.toLocaleString()}</span>
          <span className="stat-label">Links Forged</span>
        </div>
        
        <div className="stat-divider" />
        
        <div className="stat-item">
          <Activity size={16} color="#FFD166" />
          <span className="stat-value">{loading ? "..." : animatedClicks.toLocaleString()}</span>
          <span className="stat-label">Clicks Served</span>
        </div>

        <div className="stat-divider" />
        
        <div className="stat-item">
          <Users size={16} color="#4CC9F0" />
          <span className="stat-value">{loading ? "..." : animatedUsers.toLocaleString()}</span>
          <span className="stat-label">Active Users</span>
        </div>
        
        <div className="stat-divider" />
        
        <div className="stat-item">
          <Zap size={16} color="#06D6A0" />
          <span className="stat-label">Avg Redirect Time: <strong style={{color:"#fff", fontFamily:"var(--font-mono)"}}>4.2ms</strong></span>
        </div>
      </div>
    </div>
  );
}
