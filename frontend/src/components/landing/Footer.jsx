// Raw SVGs used for brand icons since lucide-react doesn't include them

export default function Footer() {
  return (
    <footer className="landing-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h3>fewer<span>.link</span></h3>
          <p>The breathing technique of URL shortening.</p>
        </div>
        <div className="footer-links">
          <a href="https://github.com/Saqlain2003/" target="_blank" rel="noreferrer" className="social-link">
            <svg xmlns="http://www.2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 19 4.77 5.07 5.07 0 0 0 19 4s-1.13-.36-3.7 1.36a12.8 12.8 0 0 0-6.6 0C6.13 3.64 5 4 5 4a5.07 5.07 0 0 0-.1 3.77A5.44 5.44 0 0 0 3 11.98c0 5.46 3.3 6.65 6.44 7.02A4.8 4.8 0 0 0 8.5 22v-4"/><path d="M8.5 20.5c-3 1-4-2-4-2"/></svg>
          </a>
          <a href="https://www.linkedin.com/in/md-saqlain-ansari-4b563b344/" target="_blank" rel="noreferrer" className="social-link">
            <svg xmlns="http://www.2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Md Saqlain Ansari. All rights reserved.</p>
      </div>
    </footer>
  );
}
