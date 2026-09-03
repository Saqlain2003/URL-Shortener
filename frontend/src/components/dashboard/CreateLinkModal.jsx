import { useState } from "react";
import { X, Flame, Link2, Sparkles, Calendar, Loader2 } from "lucide-react";
import { api } from "../../api/client";

export default function CreateLinkModal({ isOpen, onClose, onCreated }) {
  const [longUrl, setLongUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    let urlToSubmit = longUrl.trim();
    if (!urlToSubmit) {
      setError("Please provide a destination URL.");
      return;
    }

    if (!/^https?:\/\//i.test(urlToSubmit)) {
      urlToSubmit = `https://${urlToSubmit}`;
    }

    const payload = { longUrl: urlToSubmit };
    if (customAlias.trim()) {
      payload.customAlias = customAlias.trim();
    }
    if (expiresAt) {
      payload.expiresAt = new Date(expiresAt).toISOString();
    }

    setLoading(true);
    try {
      const data = await api.urls.create(payload);
      onCreated(data);
      onClose();
      // Reset form
      setLongUrl("");
      setCustomAlias("");
      setExpiresAt("");
    } catch (err) {
      setError(err.message || "Failed to forge short URL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <div className="dash-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="dash-modal-close" onClick={onClose} aria-label="Close dialog">
          <X size={18} />
        </button>

        <div className="dash-modal-header">
          <h2 className="dash-modal-title">
            <Flame size={22} color="#FF9800" />
            Forge New Short Link
          </h2>
          <p className="dash-modal-subtitle">
            Create an ultra-fast shortened link with optional custom alias and expiration date.
          </p>
        </div>

        {error && (
          <div className="modal-error-box">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-form-group">
            <label className="modal-label">Destination URL *</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                className="modal-input"
                placeholder="https://example.com/very-long-destination-url"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                autoFocus
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Custom Alias (Optional)</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                className="modal-input"
                placeholder="e.g. spring-sale or my-portfolio"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                disabled={loading}
              />
            </div>
            <p className="modal-help-text">3-20 characters: letters, numbers, hyphens, and underscores.</p>
          </div>

          <div className="modal-form-group">
            <label className="modal-label">Expiration Date & Time (Optional)</label>
            <input
              type="datetime-local"
              className="modal-input"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={loading}
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="modal-help-text">Leave blank for a link that never expires.</p>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Forging...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Forge Link
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
