import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Flame, Plus, Search, X, Copy, Check, BarChart2, Edit3, 
  QrCode, Trash2, ExternalLink, ArrowUpDown, Clock, 
  AlertTriangle, ChevronLeft, ChevronRight, Loader2, Sparkles 
} from "lucide-react";
import { api } from "../../api/client";

// Components & Modals
import CreateLinkModal from "../../components/dashboard/CreateLinkModal";
import EditLinkModal from "../../components/dashboard/EditLinkModal";
import QrCodeModal from "../../components/dashboard/QrCodeModal";
import DeleteConfirmModal from "../../components/dashboard/DeleteConfirmModal";
import FlameLogo from "../../components/landing/FlameLogo";
import { getShortUrl } from "../../utils/url";

import "../../styles/dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  // Data state
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("created_desc"); // created_desc, created_asc, clicks_desc, expiry_asc

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [qrItem, setQrItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  // Check auth & fetch user links
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchUrls();
  }, [navigate]);

  const fetchUrls = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.urls.getMyUrls();
      setUrls(data.urls || []);
    } catch (err) {
      setError(err.message || "Failed to fetch your shortened links.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Copy short link action
  const [copiedCode, setCopiedCode] = useState(null);
  const handleCopy = (code) => {
    const fullUrl = getShortUrl(code);
    navigator.clipboard.writeText(fullUrl);
    setCopiedCode(code);
    showToast(`Copied /${code} to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Quick stats calculation
  const stats = useMemo(() => {
    const totalLinks = urls.length;
    const totalClicks = urls.reduce((sum, item) => sum + (item.click_count || 0), 0);
    
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const expiringSoon = urls.filter(item => {
      if (!item.expires_at) return false;
      const exp = new Date(item.expires_at);
      return exp > now && exp <= sevenDaysFromNow;
    }).length;

    return { totalLinks, totalClicks, expiringSoon };
  }, [urls]);

  // Filtering and Sorting
  const filteredAndSortedUrls = useMemo(() => {
    let result = [...urls];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        item => 
          item.short_code.toLowerCase().includes(q) ||
          item.long_url.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "created_desc") {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (sortBy === "created_asc") {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      if (sortBy === "clicks_desc") {
        return (b.click_count || 0) - (a.click_count || 0);
      }
      if (sortBy === "expiry_asc") {
        // Items with expiry come first (sorted soonest to furthest), items with null expiry last
        if (!a.expires_at && !b.expires_at) return 0;
        if (!a.expires_at) return 1;
        if (!b.expires_at) return -1;
        return new Date(a.expires_at) - new Date(b.expires_at);
      }
      return 0;
    });

    return result;
  }, [urls, searchQuery, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedUrls.length / pageSize));
  const paginatedUrls = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedUrls.slice(start, start + pageSize);
  }, [filteredAndSortedUrls, currentPage, pageSize]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, pageSize]);

  // Helper date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  // Helper expiry status renderer
  const renderExpiryBadge = (expiresAt) => {
    if (!expiresAt) {
      return <span className="expiry-badge never">Never</span>;
    }
    const expDate = new Date(expiresAt);
    const now = new Date();
    if (expDate <= now) {
      return <span className="expiry-badge expired">Expired</span>;
    }

    const diffMs = expDate - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return <span className="expiry-badge soon">{diffDays}d left</span>;
    }
    return <span className="expiry-badge soon">{Math.max(1, diffHours)}h left</span>;
  };

  // CRUD handlers
  const handleLinkCreated = (newUrl) => {
    const normalized = {
      _id: newUrl._id || newUrl.shortCode || newUrl.short_code,
      short_code: newUrl.short_code || newUrl.shortCode,
      long_url: newUrl.long_url || newUrl.longUrl,
      created_at: newUrl.created_at || new Date().toISOString(),
      expires_at: newUrl.expires_at || newUrl.expiresAt || null,
      click_count: newUrl.click_count || 0
    };
    setUrls(prev => [normalized, ...prev.filter(u => u.short_code !== normalized.short_code)]);
    showToast(`Link /${normalized.short_code} forged successfully!`);
    fetchUrls();
  };

  const handleLinkUpdated = (updatedItem) => {
    setUrls(prev => prev.map(item => item.short_code === updatedItem.short_code ? updatedItem : item));
    showToast(`Updated destination for /${updatedItem.short_code}`);
  };

  const handleLinkDeleted = (shortCode) => {
    setUrls(prev => prev.filter(item => item.short_code !== shortCode));
    showToast(`Deactivated /${shortCode}`);
  };

  return (
    <div className="dashboard-page">
      {/* Navigation Bar */}
      <header className="dash-nav">
        <div className="dash-nav-inner">
          <div className="dash-nav-left">
            <Link to="/" style={{ textDecoration: "none" }}>
              <FlameLogo />
            </Link>
            <Link to="/" className="dash-nav-link">
              Home
            </Link>
          </div>
          <div className="dash-nav-right">
            <div className="user-badge">
              <span className="user-avatar">☀</span>
              <span>Swordsman</span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard View */}
      <main className="dash-content">
        {/* Header Strip */}
        <section className="dash-header">
          <div className="dash-title-group">
            <h1>
              <Flame size={32} color="#FF9800" />
              <span>Your <span className="dash-title-flame">Shortened URLs</span></span>
            </h1>
            <p className="dash-subtitle">
              Monitor click analytics, update destinations, and forge lightning-fast short links.
            </p>
          </div>
          <button 
            className="btn-create-new" 
            onClick={() => setIsCreateOpen(true)}
            id="create-new-link-btn"
          >
            <Plus size={18} />
            <span>Create New Link</span>
          </button>
        </section>

        {/* Quick Stats Cards */}
        <section className="stats-grid">
          {/* Total Links */}
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Total Links</span>
              <div className="stat-icon-wrap">
                <Sparkles size={18} />
              </div>
            </div>
            <div className="stat-value">
              {loading ? "..." : stats.totalLinks.toLocaleString()}
            </div>
            <div className="stat-hint">Active URLs tied to your account</div>
          </div>

          {/* Total Clicks */}
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Total Clicks</span>
              <div className="stat-icon-wrap clicks">
                <Flame size={18} />
              </div>
            </div>
            <div className="stat-value">
              {loading ? "..." : stats.totalClicks.toLocaleString()}
            </div>
            <div className="stat-hint">Aggregated redirections across all links</div>
          </div>

          {/* Expiring Soon */}
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Expiring Soon</span>
              <div className="stat-icon-wrap expiry">
                <Clock size={18} />
              </div>
            </div>
            <div className="stat-value">
              {loading ? "..." : stats.expiringSoon.toLocaleString()}
            </div>
            <div className="stat-hint">Links expiring within the next 7 days</div>
          </div>
        </section>

        {/* Table Controls (Search & Sort) */}
        <section className="table-control-bar">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by short code or destination URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="search-links-input"
            />
            {searchQuery && (
              <button 
                className="search-clear-btn" 
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="sort-group">
            <span className="sort-label">Sort by:</span>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              id="sort-links-select"
            >
              <option value="created_desc">Created Date (Newest first)</option>
              <option value="created_asc">Created Date (Oldest first)</option>
              <option value="clicks_desc">Total Clicks (Highest first)</option>
              <option value="expiry_asc">Expiry (Expiring soonest)</option>
            </select>
          </div>
        </section>

        {/* Main Table Container */}
        <section className="table-wrapper">
          {loading ? (
            <div style={{ padding: "5rem 0", textAlign: "center" }}>
              <Loader2 size={36} className="animate-spin" color="#FF9800" style={{ margin: "0 auto 1rem auto" }} />
              <p style={{ color: "#A1887F", fontSize: "0.92rem" }}>Gathering your forged links...</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <div className="empty-icon-wrap" style={{ borderColor: "#EF4444", color: "#EF4444" }}>
                <AlertTriangle size={30} />
              </div>
              <h3 className="empty-title">Failed to load links</h3>
              <p className="empty-desc">{error}</p>
              <button className="btn-create-new" onClick={fetchUrls}>
                Try Again
              </button>
            </div>
          ) : urls.length === 0 ? (
            /* Zero links total */
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <Flame size={32} />
              </div>
              <h3 className="empty-title">No links yet — go create one</h3>
              <p className="empty-desc">
                Harness the flame! Paste a long destination URL and forge your first ultra-fast short link.
              </p>
              <button 
                className="btn-create-new" 
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus size={18} />
                Forge Your First Link
              </button>
            </div>
          ) : filteredAndSortedUrls.length === 0 ? (
            /* Search filter yielded 0 results */
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <Search size={30} />
              </div>
              <h3 className="empty-title">No matching links found</h3>
              <p className="empty-desc">
                No short links matched your search for "<strong>{searchQuery}</strong>".
              </p>
              <button 
                className="modal-btn-cancel" 
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </button>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="links-table">
                  <thead>
                    <tr>
                      <th>Short Code</th>
                      <th>Destination</th>
                      <th>Created</th>
                      <th>Expires In</th>
                      <th>Clicks</th>
                      <th style={{ textAlign: "right", paddingRight: "1.5rem" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUrls.map((item) => {
                      const fullUrl = getShortUrl(item.short_code);
                      return (
                        <tr key={item._id || item.short_code}>
                          {/* Short Code */}
                          <td>
                            <div className="short-code-cell">
                              <a
                                href={fullUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="code-badge"
                                title={`Open /${item.short_code}`}
                              >
                                <Flame size={13} color="#FF9800" />
                                <span>/{item.short_code}</span>
                              </a>
                            </div>
                          </td>

                          {/* Destination */}
                          <td className="destination-cell">
                            <a
                              href={item.long_url}
                              target="_blank"
                              rel="noreferrer"
                              className="destination-link"
                              title={item.long_url}
                            >
                              <span className="destination-text">{item.long_url}</span>
                              <ExternalLink size={13} style={{ flexShrink: 0, opacity: 0.6 }} />
                            </a>
                          </td>

                          {/* Created */}
                          <td className="created-cell">
                            {formatDate(item.created_at)}
                          </td>

                          {/* Expires In */}
                          <td>
                            {renderExpiryBadge(item.expires_at)}
                          </td>

                          {/* Clicks */}
                          <td>
                            <span className="clicks-badge">
                              <Flame size={14} />
                              <span>{item.click_count || 0}</span>
                            </span>
                          </td>

                          {/* Per-row Actions */}
                          <td>
                            <div className="row-actions" style={{ justifyContent: "flex-end", paddingRight: "0.5rem" }}>
                              {/* Copy Link */}
                              <div className="tooltip-wrap" data-tooltip="Copy link">
                                <button
                                  className="action-icon-btn"
                                  onClick={() => handleCopy(item.short_code)}
                                  aria-label="Copy short link"
                                >
                                  {copiedCode === item.short_code ? (
                                    <Check size={16} color="#4ade80" />
                                  ) : (
                                    <Copy size={16} />
                                  )}
                                </button>
                              </div>

                              {/* View Full Analytics */}
                              <div className="tooltip-wrap" data-tooltip="View analytics">
                                <button
                                  className="action-icon-btn"
                                  onClick={() => navigate(`/dashboard/${item.short_code}/analytics`)}
                                  aria-label="View link analytics"
                                >
                                  <BarChart2 size={16} color="#FFB74D" />
                                </button>
                              </div>

                              {/* Edit Destination */}
                              <div className="tooltip-wrap" data-tooltip="Edit destination">
                                <button
                                  className="action-icon-btn"
                                  onClick={() => setEditItem(item)}
                                  aria-label="Edit destination URL"
                                >
                                  <Edit3 size={16} />
                                </button>
                              </div>

                              {/* View / Download QR */}
                              <div className="tooltip-wrap" data-tooltip="QR code">
                                <button
                                  className="action-icon-btn"
                                  onClick={() => setQrItem(item)}
                                  aria-label="View QR code"
                                >
                                  <QrCode size={16} />
                                </button>
                              </div>

                              {/* Delete / Deactivate */}
                              <div className="tooltip-wrap" data-tooltip="Deactivate link">
                                <button
                                  className="action-icon-btn delete"
                                  onClick={() => setDeleteItem(item)}
                                  aria-label="Deactivate link"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Pagination */}
              <div className="table-footer">
                <div className="footer-count">
                  Showing {Math.min((currentPage - 1) * pageSize + 1, filteredAndSortedUrls.length)} to{" "}
                  {Math.min(currentPage * pageSize, filteredAndSortedUrls.length)} of{" "}
                  <strong>{filteredAndSortedUrls.length}</strong> links
                </div>

                <div className="pagination-wrap">
                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      className={`page-btn ${currentPage === p ? "active" : ""}`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="dash-toast">
          <Check size={18} color="#FF9800" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <CreateLinkModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleLinkCreated}
      />

      <EditLinkModal
        isOpen={!!editItem}
        urlItem={editItem}
        onClose={() => setEditItem(null)}
        onUpdated={handleLinkUpdated}
      />

      <QrCodeModal
        isOpen={!!qrItem}
        urlItem={qrItem}
        onClose={() => setQrItem(null)}
      />

      <DeleteConfirmModal
        isOpen={!!deleteItem}
        urlItem={deleteItem}
        onClose={() => setDeleteItem(null)}
        onDeleted={handleLinkDeleted}
      />
    </div>
  );
}
