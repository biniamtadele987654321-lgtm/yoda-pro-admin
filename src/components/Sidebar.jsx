import {
  AppWindow, BellRing, ChevronDown, ChevronRight, CircleHelp, FileText, Gauge,
  LayoutGrid, LogOut, MessageCircle, Newspaper, Settings, ShieldCheck, Trash2,
  UserRound, Users, WalletCards,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navigation = [
  { label: "Dashboard", to: "/dashboard", icon: Gauge },
  { label: "Manage Category", to: "/categories", icon: LayoutGrid },
  { label: "Manage News", to: "/news", icon: Newspaper },
  { label: "Manage Ads", to: "/ads", icon: WalletCards },
  { label: "Comments", to: "/comments", icon: MessageCircle },
  { label: "Report & Feedback", to: "/reports", icon: CircleHelp },
  { label: "Registered Users", to: "/users", icon: Users },
  { label: "Account Deletion Request", to: "/deletion-requests", icon: Trash2 },
  { label: "Notification", to: "/notifications", icon: BellRing },
  { label: "Administrators", to: "/administrators", icon: ShieldCheck },
  { label: "Settings", to: "/settings", icon: Settings },
  { label: "Apps", to: "/apps", icon: AppWindow },
  { label: "License", to: "/license", icon: FileText },
];

export default function Sidebar({ open, onNavigate, onLogout, profileOpen, onProfileMenuChange }) {
  const { user } = useAuth();
  const identityRef = useRef(null);

  useEffect(() => {
    if (!profileOpen) return undefined;

    function handlePointerDown(event) {
      if (!identityRef.current?.contains(event.target)) onProfileMenuChange(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onProfileMenuChange, profileOpen]);

  return (
    <>
      {open && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onNavigate} />}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-identity" ref={identityRef}>
          <div className="identity-avatar"><Newspaper size={21} /></div>
          <div className="identity-copy"><strong>{user?.username || "admin"}</strong><span>{user?.email || "admin@yodapro.com"}</span></div>
          <button type="button" className="identity-chevron-button" aria-label="Toggle admin menu" aria-expanded={profileOpen} onClick={() => onProfileMenuChange(!profileOpen)}><ChevronDown size={16} className="identity-chevron" /></button>
          {profileOpen && <div className="sidebar-profile-menu" role="menu">
            <Link to="/admin/profile" role="menuitem" onClick={() => { onProfileMenuChange(false); onNavigate?.(); }}><UserRound size={16} /> Profile</Link>
            <button type="button" role="menuitem" onClick={() => { onProfileMenuChange(false); onLogout().catch((error) => window.alert(error.message)); }}><LogOut size={16} /> Logout</button>
          </div>}
        </div>
        <div className="nav-caption">MENU</div>
        <nav className="side-nav">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/dashboard"} onClick={onNavigate} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
              <Icon size={18} strokeWidth={1.9} /><span>{label}</span>{label === "Manage News" && <ChevronRight className="nav-chevron" size={14} />}
            </NavLink>
          ))}
          <button className="nav-link" onClick={() => { onLogout().catch((error) => window.alert(error.message)); }}>
            <LogOut size={18} strokeWidth={1.9} /><span>Logout</span>
          </button>
        </nav>
        <footer className="sidebar-footer">
          <span>Copyright © 2026 Yoda Pro Developer</span>
          <small>Version: 1.0.1</small>
        </footer>
      </aside>
    </>
  );
}
