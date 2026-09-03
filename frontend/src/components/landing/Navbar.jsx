import { Link } from "react-router-dom";
import FlameLogo from "./FlameLogo";

/**
 * Top navigation bar with flame-filled logo and auth buttons.
 */
export default function Navbar({ isAuthenticated, onOpenAuth, onLogout }) {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" style={{ textDecoration: "none" }}>
          <FlameLogo />
        </Link>
        <div className="nav-links">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <button className="nav-ghost" onClick={onLogout}>Log out</button>
            </>
          ) : (
            <>
              <button className="nav-ghost" onClick={() => onOpenAuth(true)}>Log in</button>
              <button className="nav-primary" onClick={() => onOpenAuth(false)}>Sign up</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
