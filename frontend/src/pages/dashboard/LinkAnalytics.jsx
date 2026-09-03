import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Flame, Globe, ExternalLink, Calendar, 
  BarChart2, Clock, MapPin, Compass, Loader2, AlertCircle,
  Search, ChevronLeft, ChevronRight, Smartphone, Monitor, Tablet, Bot, Link2, X
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from "recharts";
import { api } from "../../api/client";
import { getShortUrl } from "../../utils/url";
import { 
  getCountryFlag, getCountryName, getReferrerDetails, getDeviceDetails 
} from "../../utils/analyticsFormatters";
import GlobeHero from "../../components/dashboard/GlobeHero";
import "../../styles/dashboard.css";

export default function LinkAnalytics() {
  const { shortCode } = useParams();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [timeSeries, setTimeSeries] = useState([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Recent Click Log State (Pagination & Search)
  const [logSearch, setLogSearch] = useState("");
  const [logPage, setLogPage] = useState(1);
  const [logPageSize, setLogPageSize] = useState(10);

  useEffect(() => {
    setLogPage(1);
  }, [logSearch, logPageSize]);

  useEffect(() => {
    fetchData();
  }, [shortCode, days]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [analyticsData, timeSeriesData] = await Promise.all([
        api.urls.getAnalytics(shortCode),
        api.urls.getTimeSeries(shortCode, days)
      ]);
      setAnalytics(analyticsData);
      setTimeSeries(timeSeriesData.timeSeries || []);
    } catch (err) {
      setError(err.message || "Failed to load link analytics.");
    } finally {
      setLoading(false);
    }
  };

  const fullShortUrl = getShortUrl(shortCode);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: "#180E0A",
          border: "1px solid #FF9800",
          borderRadius: "8px",
          padding: "0.5rem 0.8rem",
          boxShadow: "0 4px 15px rgba(0,0,0,0.5)"
        }}>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "#A1887F" }}>{label}</p>
          <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#FFD54F" }}>
            {payload[0].value} {payload[0].value === 1 ? "click" : "clicks"}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-page">
      <header className="dash-nav">
        <div className="dash-nav-inner">
          <div className="dash-nav-left">
            <button className="back-link-btn" onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </button>
          </div>
          <div className="dash-nav-right">
            <span className="user-badge">
              <span className="user-avatar">☀</span>
              <span>/{shortCode}</span>
            </span>
          </div>
        </div>
      </header>

      <main className="dash-content">
        {loading ? (
          <div style={{ padding: "6rem 0", textAlign: "center" }}>
            <Loader2 size={40} className="animate-spin" color="#FF9800" style={{ margin: "0 auto 1rem auto" }} />
            <p style={{ color: "#A1887F" }}>Analyzing link traffic...</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-icon-wrap" style={{ borderColor: "#EF4444", color: "#EF4444" }}>
              <AlertCircle size={32} />
            </div>
            <h2 className="empty-title">Analytics Not Found</h2>
            <p className="empty-desc">{error}</p>
            <button className="btn-create-new" onClick={() => navigate("/dashboard")}>
              Return to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* Header info */}
            <div className="analytics-page-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <span className="code-badge" style={{ fontSize: "1.2rem", padding: "0.4rem 0.9rem" }}>
                  <Flame size={18} color="#FF9800" />
                  /{shortCode}
                </span>
                <a
                  href={fullShortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="dash-nav-link"
                  style={{ color: "#FFD54F" }}
                >
                  Visit Link <ExternalLink size={14} />
                </a>
              </div>
              <p style={{ color: "#A1887F", fontSize: "0.92rem", margin: 0 }}>
                Aggregated performance metrics and traffic origins for this shortened URL.
              </p>
            </div>

            {/* Top Quick Stats */}
            <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Total Clicks</span>
                  <div className="stat-icon-wrap clicks">
                    <Flame size={18} />
                  </div>
                </div>
                <div className="stat-value">
                  {analytics?.totalClicks?.toLocaleString() || 0}
                </div>
                <div className="stat-hint">Total lifetime visitors redirected</div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Top Referrer</span>
                  <div className="stat-icon-wrap">
                    <Compass size={18} />
                  </div>
                </div>
                <div className="stat-value" style={{ fontSize: "1.5rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {analytics?.clicksByReferrer?.[0]?._id || "Direct / Unknown"}
                </div>
                <div className="stat-hint">
                  {analytics?.clicksByReferrer?.[0]?.count ? `${analytics.clicksByReferrer[0].count} clicks` : "No referrers yet"}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">Top Country</span>
                  <div className="stat-icon-wrap expiry">
                    <MapPin size={18} />
                  </div>
                </div>
                <div className="stat-value" style={{ fontSize: "1.5rem" }}>
                  {analytics?.clicksByCountry?.[0]?._id || "Unknown"}
                </div>
                <div className="stat-hint">
                  {analytics?.clicksByCountry?.[0]?.count ? `${analytics.clicksByCountry[0].count} clicks` : "No geo data yet"}
                </div>
              </div>
            </div>

            {/* 3D Rotating Earth Globe (Hero) */}
            <GlobeHero
              clicksByCountry={analytics?.clicksByCountry || []}
              clicksByCity={analytics?.clicksByCity || []}
            />

            {/* Time Series Area Chart */}
            <div className="analytics-card">
              <div className="analytics-card-title">
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <BarChart2 size={18} color="#FF9800" />
                  <span>Click Activity Over Time</span>
                </div>
                <div className="chart-range-picker">
                  {[7, 14, 30, 90].map((d) => (
                    <button
                      key={d}
                      className={`range-pill ${days === d ? "active" : ""}`}
                      onClick={() => setDays(d)}
                    >
                      {d} Days
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ width: "100%", height: 300, marginTop: "1rem" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="flameGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF9800" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#BF360C" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 152, 0, 0.08)" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#795548" 
                      fontSize={11}
                      tickFormatter={(str) => str ? str.slice(5) : ""}
                    />
                    <YAxis stroke="#795548" fontSize={11} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#FF9800" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#flameGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Two-Column Breakdown (Left: Geographic Distribution, Right: Top Referrers) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
              {/* Left — Geographic Distribution */}
              <div className="analytics-card">
                <div className="analytics-card-title">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <MapPin size={18} color="#FF9800" />
                    <span>Geographic Distribution</span>
                  </div>
                  <span style={{ fontSize: "0.78rem", color: "#A1887F" }}>
                    {analytics?.clicksByCountry?.length || 0} {analytics?.clicksByCountry?.length === 1 ? "region" : "regions"}
                  </span>
                </div>

                {analytics?.clicksByCountry?.length > 0 ? (
                  <div className="breakdown-scroll-list">
                    {analytics.clicksByCountry.map((geo, idx) => {
                      const flag = getCountryFlag(geo._id);
                      const countryName = getCountryName(geo._id);
                      const totalGeoClicks = analytics?.clicksByCountry?.reduce((sum, c) => sum + c.count, 0) || 1;
                      const pct = ((geo.count / totalGeoClicks) * 100).toFixed(1);

                      return (
                        <div key={idx} className="breakdown-row">
                          <div className="breakdown-meta">
                            <span className="breakdown-label" title={`${countryName} (${geo._id})`}>
                              <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>{flag}</span>
                              <span>{countryName}</span>
                            </span>
                            <span className="breakdown-count">
                              {geo.count} <span className="breakdown-count-hint">({pct}%)</span>
                            </span>
                          </div>
                          <div className="breakdown-bar-track">
                            <div 
                              className="breakdown-bar-fill flame" 
                              style={{ width: `${pct}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: "#795548", fontSize: "0.85rem", margin: "1rem 0" }}>
                    No geographic data recorded yet.
                  </p>
                )}
              </div>

              {/* Right — Top Referrers */}
              <div className="analytics-card">
                <div className="analytics-card-title">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Compass size={18} color="#FF9800" />
                    <span>Top Referrers</span>
                  </div>
                  <span style={{ fontSize: "0.78rem", color: "#A1887F" }}>
                    {analytics?.clicksByReferrer?.length || 0} {analytics?.clicksByReferrer?.length === 1 ? "source" : "sources"}
                  </span>
                </div>

                {analytics?.clicksByReferrer?.length > 0 ? (
                  <div className="breakdown-scroll-list">
                    {analytics.clicksByReferrer.map((ref, idx) => {
                      const refInfo = getReferrerDetails(ref._id);
                      const totalRefClicks = analytics?.clicksByReferrer?.reduce((sum, r) => sum + r.count, 0) || 1;
                      const pct = ((ref.count / totalRefClicks) * 100).toFixed(1);

                      return (
                        <div key={idx} className="breakdown-row">
                          <div className="breakdown-meta">
                            <span className="breakdown-label" title={refInfo.displayName}>
                              {refInfo.isDirect ? (
                                <Link2 size={15} color="#FF9800" />
                              ) : (
                                <Compass size={15} color="#FF7043" />
                              )}
                              <span>{refInfo.displayName}</span>
                            </span>
                            <span className="breakdown-count">
                              {ref.count} <span className="breakdown-count-hint">({pct}%)</span>
                            </span>
                          </div>
                          <div className="breakdown-bar-track">
                            <div 
                              className="breakdown-bar-fill amber" 
                              style={{ width: `${pct}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: "#795548", fontSize: "0.85rem", margin: "1rem 0" }}>
                    No referrer information recorded yet.
                  </p>
                )}
              </div>
            </div>

            {/* Recent Click Log Table */}
            {(() => {
              const allClicks = analytics?.recentClicks || [];
              const filteredClicks = allClicks.filter((click) => {
                if (!logSearch.trim()) return true;
                const q = logSearch.toLowerCase().trim();
                const country = getCountryName(click.country).toLowerCase();
                const code = (click.country || "").toLowerCase();
                const city = (click.city || "").toLowerCase();
                const refInfo = getReferrerDetails(click.referrer);
                const refText = (refInfo.displayName + " " + (click.referrer || "")).toLowerCase();
                return country.includes(q) || code.includes(q) || city.includes(q) || refText.includes(q);
              });
              const totalLogPages = Math.ceil(filteredClicks.length / logPageSize) || 1;
              const paginatedClicks = filteredClicks.slice((logPage - 1) * logPageSize, logPage * logPageSize);

              return (
                <div className="analytics-card" style={{ marginTop: "1.5rem" }}>
                  <div className="analytics-card-title" style={{ flexWrap: "wrap", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Clock size={18} color="#FF9800" />
                      <span>Recent Click Log</span>
                      <span className="badge-flame" style={{ marginLeft: "0.4rem", fontSize: "0.75rem", padding: "0.15rem 0.5rem" }}>
                        {filteredClicks.length} {filteredClicks.length === 1 ? "entry" : "entries"}
                      </span>
                    </div>

                    {/* Search & Page Size Controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                      <div className="search-box compact">
                        <Search size={14} className="search-icon" />
                        <input
                          type="text"
                          className="search-input"
                          placeholder="Filter country, city, or referrer..."
                          value={logSearch}
                          onChange={(e) => setLogSearch(e.target.value)}
                          id="click-log-search-input"
                        />
                        {logSearch ? (
                          <button 
                            type="button" 
                            className="search-clear-btn"
                            onClick={() => setLogSearch("")} 
                            title="Clear search"
                            aria-label="Clear search"
                          >
                            <X size={12} />
                          </button>
                        ) : (
                          <span className="search-kbd-hint">/</span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", color: "#A1887F" }}>
                        <span>Rows:</span>
                        {[10, 20].map((size) => (
                          <button
                            key={size}
                            type="button"
                            className={`range-pill ${logPageSize === size ? "active" : ""}`}
                            style={{ padding: "0.2rem 0.55rem", fontSize: "0.76rem" }}
                            onClick={() => setLogPageSize(size)}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Table or Empty State */}
                  {paginatedClicks.length > 0 ? (
                    <div style={{ overflowX: "auto", marginTop: "1rem" }}>
                      <table className="click-log-table">
                        <thead>
                          <tr>
                            <th>Timestamp</th>
                            <th>Country</th>
                            <th>City</th>
                            <th>Referrer</th>
                            <th>Device (from User-Agent)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedClicks.map((click, idx) => {
                            const dev = getDeviceDetails(click.user_agent);
                            const refInfo = getReferrerDetails(click.referrer);
                            const flag = getCountryFlag(click.country);
                            const countryName = getCountryName(click.country);
                            const formattedDate = new Date(click.timestamp).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            });

                            return (
                              <tr key={idx}>
                                <td style={{ whiteSpace: "nowrap", color: "#D7CCC8", fontSize: "0.82rem" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                    <Calendar size={13} color="#FF9800" />
                                    <span>{formattedDate}</span>
                                  </div>
                                </td>
                                <td style={{ whiteSpace: "nowrap" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                                    <span style={{ fontSize: "1.1rem" }}>{flag}</span>
                                    <span style={{ fontWeight: 500 }}>{countryName}</span>
                                  </div>
                                </td>
                                <td style={{ whiteSpace: "nowrap", color: "#BCAAA4" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                    <MapPin size={13} color="#A1887F" />
                                    <span>{click.city && click.city !== "unknown" ? click.city : "Regional / Direct"}</span>
                                  </div>
                                </td>
                                <td style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  <span 
                                    title={click.referrer}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.35rem",
                                      color: refInfo.isDirect ? "#FFB74D" : "#90CAF9",
                                      background: "rgba(255, 152, 0, 0.06)",
                                      padding: "0.2rem 0.5rem",
                                      borderRadius: "6px",
                                      border: "1px solid rgba(255, 152, 0, 0.12)",
                                    }}
                                  >
                                    {refInfo.isDirect ? <Link2 size={12} /> : <Compass size={12} />}
                                    <span>{refInfo.displayName}</span>
                                  </span>
                                </td>
                                <td style={{ whiteSpace: "nowrap" }}>
                                  <span className={`device-badge ${dev.deviceCategory}`}>
                                    {dev.deviceCategory === "mobile" ? (
                                      <Smartphone size={12} />
                                    ) : dev.deviceCategory === "tablet" ? (
                                      <Tablet size={12} />
                                    ) : dev.deviceCategory === "bot" ? (
                                      <Bot size={12} />
                                    ) : (
                                      <Monitor size={12} />
                                    )}
                                    <span>{dev.label}</span>
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#A1887F" }}>
                      {logSearch ? (
                        <>
                          <p style={{ margin: "0 0 0.5rem 0", color: "#FFF3E0" }}>No clicks matched &quot;{logSearch}&quot;</p>
                          <button 
                            type="button" 
                            className="range-pill" 
                            onClick={() => setLogSearch("")}
                          >
                            Clear Filter
                          </button>
                        </>
                      ) : (
                        <p style={{ margin: 0 }}>No individual click events logged yet.</p>
                      )}
                    </div>
                  )}

                  {/* Table Pagination */}
                  {filteredClicks.length > logPageSize && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: "1.25rem",
                      paddingTop: "1rem",
                      borderTop: "1px solid rgba(255, 152, 0, 0.08)",
                      fontSize: "0.82rem",
                      color: "#A1887F",
                    }}>
                      <span>
                        Showing {((logPage - 1) * logPageSize) + 1} to {Math.min(logPage * logPageSize, filteredClicks.length)} of {filteredClicks.length} clicks
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <button
                          type="button"
                          className="page-btn"
                          disabled={logPage <= 1}
                          onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span style={{ padding: "0 0.5rem", color: "#FFF8E1", fontWeight: 600 }}>
                          Page {logPage} of {totalLogPages}
                        </span>
                        <button
                          type="button"
                          className="page-btn"
                          disabled={logPage >= totalLogPages}
                          onClick={() => setLogPage((p) => Math.min(totalLogPages, p + 1))}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </>
        )}
      </main>
    </div>
  );
}
