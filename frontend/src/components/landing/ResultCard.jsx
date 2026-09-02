import { Copy, QrCode, ExternalLink, Share2, Check } from "lucide-react";
import { useState } from "react";
import theme from "../../constants/theme";

export default function ResultCard({ result }) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // The backend base URL is on port 5000 in dev
  const backendBase = import.meta.env.VITE_API_BASE || '';
  const shortCode = result?.shortCode || "h1n0km1";
  const originalUrl = result?.longUrl || "https://example.com/very/long/url";
  const shortUrl = `${backendBase}/${shortCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="result-card">
      <div className="result-header">
        <div className="result-success-badge">
          <span className="success-icon">🔥</span>
          <span>Link Forged</span>
        </div>
      </div>
      
      <div className="result-url-container">
        <a href={shortUrl} target="_blank" rel="noreferrer" className="short-url">
          {shortUrl.replace(/^https?:\/\//, '')}
        </a>
        <div className="result-actions">
          <button className={`icon-btn copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy} title="Copy">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <button className={`icon-btn qr-btn ${showQr ? 'active' : ''}`} onClick={() => setShowQr(!showQr)} title="QR Code">
            <QrCode size={16} />
          </button>
          <button className="icon-btn share-btn" title="Share" onClick={() => navigator.share && navigator.share({ url: shortUrl })}>
            <Share2 size={16} />
          </button>
          <a href={shortUrl} target="_blank" rel="noreferrer" className="icon-btn visit-btn" title="Visit">
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      <div className="original-url-preview">
        <span className="label">Original:</span>
        <span className="url-text" title={originalUrl}>{originalUrl}</span>
      </div>

      <div className={`qr-panel ${showQr ? 'open' : ''}`}>
        <div className="qr-container" style={{ padding: "16px" }}>
          <div className="qr-placeholder">
            <img src={`/api/qr/${shortCode}/download`} alt="QR Code" style={{ width: 140, height: 140, borderRadius: 8, background: 'white' }} />
            <p>Scan with device</p>
          </div>
        </div>
      </div>
    </div>
  );
}
