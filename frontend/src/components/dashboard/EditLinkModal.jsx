import { useState, useEffect } from "react";
import { X, Edit3, Loader2, Link2 } from "lucide-react";
import { api } from "../../api/client";

export default function EditLinkModal({ isOpen, onClose, urlItem, onUpdated }) {
  const [longUrl, setLongUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (urlItem) {
      setLongUrl(urlItem.long_url || "");
      setError("");
    }
  }, [urlItem]);

  if (!isOpen || !urlItem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    let urlToSubmit = longUrl.trim();
    if (!urlToSubmit) {
      setError("Destination URL cannot be empty.");
      return;
    }

    if (!/^https?:\/\//i.test(urlToSubmit)) {
      urlToSubmit = `https://${urlToSubmit}`;
    }

    setLoading(true);
    try {
      const data = await api.urls.update(urlItem.short_code, { longUrl: urlToSubmit });
      onUpdated({ ...urlItem, long_url: data.longUrl });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update destination URL.");
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
            <Edit3 size={22} color="#FF9800" />
            Edit Destination URL
          </h2>
          <p className="dash-modal-subtitle">
            Update where visitors are redirected when clicking <strong>/{urlItem.short_code}</strong>.
          </p>
        </div>

        {error && (
          <div className="modal-error-box">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-form-group">
            <label className="modal-label">Short Code</label>
            <div className="qr-url-text" style={{ textAlign: "left", marginBottom: "0.5rem" }}>
              /{urlItem.short_code}
            </div>
          </div>

          <div className="modal-form-group">
            <label className="modal-label">New Destination URL *</label>
            <input
              type="text"
              className="modal-input"
              placeholder="https://example.com/new-destination"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              autoFocus
              disabled={loading}
              required
            />
            <p className="modal-help-text">Existing redirects and QR codes will instantly route to this new URL.</p>
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
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
