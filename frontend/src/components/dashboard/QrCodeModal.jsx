import { useState, useEffect } from "react";
import { X, QrCode, Download, Copy, Check, Loader2 } from "lucide-react";
import { api } from "../../api/client";
import { getShortUrl } from "../../utils/url";

export default function QrCodeModal({ isOpen, onClose, urlItem }) {
  const [qrCodeData, setQrCodeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && urlItem) {
      fetchQr();
    } else {
      setQrCodeData(null);
      setError("");
    }
  }, [isOpen, urlItem]);

  const fetchQr = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.urls.getQr(urlItem.short_code);
      setQrCodeData(data.qrCode);
    } catch (err) {
      setError(err.message || "Failed to load QR code.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !urlItem) return null;

  const fullShortUrl = getShortUrl(urlItem.short_code);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullShortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrCodeData) return;
    const link = document.createElement("a");
    link.href = qrCodeData;
    link.download = `${urlItem.short_code}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <div className="dash-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="dash-modal-close" onClick={onClose} aria-label="Close dialog">
          <X size={18} />
        </button>

        <div className="dash-modal-header">
          <h2 className="dash-modal-title">
            <QrCode size={22} color="#FF9800" />
            QR Code Preview
          </h2>
          <p className="dash-modal-subtitle">
            Scan with any smartphone camera to visit the destination URL.
          </p>
        </div>

        {error && (
          <div className="modal-error-box">
            <span>{error}</span>
          </div>
        )}

        <div className="qr-preview-area">
          {loading ? (
            <div style={{ padding: "3rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
              <Loader2 size={32} className="animate-spin" color="#FF9800" />
              <span style={{ fontSize: "0.88rem", color: "#A1887F" }}>Forging QR Code...</span>
            </div>
          ) : qrCodeData ? (
            <>
              <div className="qr-image-frame">
                <img src={qrCodeData} alt={`QR Code for /${urlItem.short_code}`} />
              </div>
              <div className="qr-url-text">
                {fullShortUrl}
              </div>
            </>
          ) : null}
        </div>

        <div className="modal-actions" style={{ justifyContent: "center", gap: "0.75rem" }}>
          <button
            type="button"
            className="modal-btn-cancel"
            onClick={handleCopyLink}
          >
            {copied ? (
              <>
                <Check size={16} color="#4ade80" />
                Copied Link!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy Link
              </>
            )}
          </button>
          <button
            type="button"
            className="modal-btn-submit"
            onClick={handleDownload}
            disabled={loading || !qrCodeData}
          >
            <Download size={16} />
            Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}
