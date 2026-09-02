import React, { useState } from "react";
import { X, Loader2, Mail, Lock } from "lucide-react";
import { api } from "../../api/client";
import "../../styles/landing.css";

export default function AuthModal({ isOpen, onClose, onLogin, initialMode = true }) {
  const [isLogin, setIsLogin] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync isLogin with initialMode when opened
  React.useEffect(() => {
    if (isOpen) setIsLogin(initialMode);
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let data;
      if (isLogin) {
        data = await api.auth.login({ email, password });
      } else {
        data = await api.auth.signup({ email, password });
      }
      
      // Save JWT token
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      onLogin(); // callback to update App state
      onClose(); // close modal
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal-content">
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
        
        <h2>{isLogin ? "Welcome Back" : "Forging a New Account"}</h2>
        <p className="auth-subhead">
          {isLogin 
            ? "Log in to manage your blazing fast links." 
            : "Sign up to track and customize your shortened URLs."}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <Mail size={16} className="input-icon" />
            <input 
              type="email" 
              required 
              placeholder="Email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="auth-field">
            <Lock size={16} className="input-icon" />
            <input 
              type="password" 
              required 
              placeholder="Password" 
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : (isLogin ? "Log In" : "Sign Up")}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => { setIsLogin(!isLogin); setError(""); }}>
            {isLogin ? "Sign up here" : "Log in here"}
          </button>
        </div>
      </div>
    </div>
  );
}
