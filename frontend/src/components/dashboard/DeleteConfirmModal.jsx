import { useState } from "react";
import { X, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { api } from "../../api/client";

export default function DeleteConfirmModal({ isOpen, onClose, urlItem, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !urlItem) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      await api.urls.delete(urlItem.short_code);
      onDeleted(urlItem.short_code);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to deactivate URL.");
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
          <h2 className="dash-modal-title" style={{ color: "#F87171" }}>
            <AlertTriangle size={22} color="#EF4444" />
            Deactivate Short Link?
          </h2>
          <p className="dash-modal-subtitle">
            Are you sure you want to deactivate <strong>/{urlItem.short_code}</strong>?
          </p>
        </div>

        {error && (
          <div className="modal-error-box">
            <span>{error}</span>
          </div>
        )}

        <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", padding: "0.9rem", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.82rem", color: "#FCA5A5", marginBottom: "0.4rem" }}>
            Destination URL:
          </div>
          <div style={{ fontSize: "0.86rem", color: "#FFF3E0", wordBreak: "break-all" }}>
            {urlItem.long_url}
          </div>
        </div>

        <p style={{ fontSize: "0.84rem", color: "#A1887F", lineHeight: 1.5 }}>
          Once deactivated, anyone who clicks this link or scans its QR code will receive a 404 Not Found error.
        </p>

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
            type="button"
            className="modal-btn-danger"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Deactivating...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Deactivate Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
