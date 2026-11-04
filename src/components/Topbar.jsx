import { Bell, LogOut, Menu, MessageSquare, MoreVertical, Search, Settings } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

export default function Topbar({ onMenuClick, onLogout, menuOpen, onMenuOpenChange }) {
  const { user } = useAuth();
  const { news, categories, users } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    onMenuOpenChange(false);
  }, [location.pathname, onMenuOpenChange]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) onMenuOpenChange(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen, onMenuOpenChange]);

  const results = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return [
      ...news.filter((item) => item.title.toLowerCase().includes(term)).slice(0, 4)
        .map((item) => ({ id: `news-${item.id}`, label: item.title, type: "News", to: `/news/${item.id}/edit` })),
      ...categories.filter((item) => item.name.toLowerCase().includes(term)).slice(0, 3)
        .map((item) => ({ id: `category-${item.id}`, label: item.name, type: "Category", to: "/categories" })),
      ...users.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(term)).slice(0, 3)
        .map((item) => ({ id: `user-${item.id}`, label: item.name, type: "User", to: "/users" })),
    ].slice(0, 8);
  }, [categories, news, searchTerm, users]);

  async function logout() {
    setLogoutError("");
    onMenuOpenChange(false);
    try {
      await onLogout();
    } catch (error) {
      setLogoutError(error.message || "Unable to log out.");
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-button topbar-menu" aria-label="Toggle menu" onClick={onMenuClick}><Menu size={21} /></button>
        <span className="brand-wordmark">YODA PRO APP</span>
      </div>
      <div className="topbar-actions">
        <button className="icon-button topbar-notice" aria-label="Messages" title="Comments" onClick={() => { onMenuOpenChange(false); navigate("/comments"); }}><MessageSquare size={20} /></button>
        <button className="icon-button topbar-notice" aria-label="Notifications" title="Notification center" onClick={() => { onMenuOpenChange(false); navigate("/notifications"); }}><Bell size={20} /></button>
        <div className="topbar-menu-wrap" ref={menuRef}>
          <button className="icon-button topbar-menu-trigger" aria-label="More options" aria-expanded={menuOpen} aria-haspopup="menu" onClick={() => onMenuOpenChange(!menuOpen)}><MoreVertical size={21} /></button>
          {menuOpen && <div className="topbar-popover profile-popover solodroid-menu" role="menu">
            <div className="profile-popover-heading"><strong>{user?.username || "admin"}</strong><small>{user?.email || "admin@yodapro.com"}</small></div>
            <div className="solodroid-quick-search">
              <label htmlFor="quick-search"><Search size={15} /><span>Quick search</span></label>
              <input id="quick-search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="News, categories, users..." />
              {searchTerm.trim() && <div className="solodroid-search-results">
                {results.length ? results.map((result) => <Link key={result.id} to={result.to} className="quick-search-result" onClick={() => { onMenuOpenChange(false); setSearchTerm(""); }}><span>{result.label}</span><small>{result.type}</small></Link>) : <div className="search-no-results">No matching results.</div>}
              </div>}
            </div>
            <Link to="/settings" role="menuitem" onClick={() => onMenuOpenChange(false)}><Settings size={16} /> Admin Settings</Link>
            <button type="button" role="menuitem" onClick={logout}><LogOut size={16} /> Logout</button>
          </div>}
        </div>
        {logoutError && <div className="topbar-logout-error" role="alert">{logoutError}</div>}
      </div>
    </header>
  );
}
