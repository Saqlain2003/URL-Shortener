import { useState } from "react";
import { ArrowRight, ChevronDown, Link2, Calendar, Loader2 } from "lucide-react";
import { api } from "../../api/client";

/**
 * URL shortener form with expandable advanced options.
 */
export default function ShortenForm({ onShorten }) {
  const [advanced, setAdvanced] = useState(false);
  const [longUrl, setLongUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!longUrl) return;
    setLoading(true);
    setError("");

    try {
      const payload = { longUrl };
      if (customAlias) payload.customAlias = customAlias;
      if (expiresAt) payload.expiresAt = new Date(expiresAt).toISOString();

      const data = await api.shorten(payload);
      if (onShorten) onShorten(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="shorten-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <Link2 size={16} className="input-icon" />
        <input
          type="url"
          required
          placeholder="Paste a long URL"
          className="url-input"
          id="url-input"
          value={longUrl}
          onChange={(e) => setLongUrl(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="submit-btn" id="submit-btn" disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <>Shorten <ArrowRight size={16} strokeWidth={2.5} /></>}
        </button>
      </div>

      {error && <div style={{ color: "#ff5252", fontSize: "13px", marginTop: "8px", textAlign: "left", paddingLeft: "12px" }}>{error}</div>}

      <button
        type="button"
        className="advanced-toggle"
        id="advanced-toggle"
        onClick={() => setAdvanced((v) => !v)}
      >
        <ChevronDown
          size={14}
          className={`chevron ${advanced ? "open" : ""}`}
        />
        Custom alias &amp; expiry
      </button>

      <div className={`advanced-panel ${advanced ? "open" : ""}`}>
        <div className="advanced-grid">
          <div className="field">
            <label className="field-label">Custom alias</label>
            <input
              type="text"
              placeholder="my-brand-name"
              className="field-input"
              id="alias-input"
              value={customAlias}
              onChange={(e) => setCustomAlias(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="field">
            <label className="field-label">
              <Calendar size={12} /> Expires at
            </label>
            <input
              type="datetime-local"
              className="field-input"
              id="expiry-input"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
