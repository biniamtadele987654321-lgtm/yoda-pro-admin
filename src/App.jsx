import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import AddCategory from "./pages/categories/AddCategory";
import CategoryList from "./pages/categories/CategoryList";
import CommentList from "./pages/comments/CommentList";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ManageAds from "./pages/ads/ManageAds";
import AddAdmin from "./pages/admins/AddAdmin";
import AdminList from "./pages/admins/AdminList";
import EditAdmin from "./pages/admins/EditAdmin";
import AddNews from "./pages/news/AddNews";
import NewsList from "./pages/news/NewsList";
import AddNotification from "./pages/notifications/AddNotification";
import NotificationList from "./pages/notifications/NotificationList";
import ReportList from "./pages/reports/ReportList";
import AppList from "./pages/apps/AppList";
import AddApp from "./pages/apps/AddApp";
import GlobalSettings from "./pages/settings/GlobalSettings";
import License from "./pages/License";
import AccountDeletionList from "./pages/users/AccountDeletionList";
import UserList from "./pages/users/UserList";
import UtilityPage from "./pages/UtilityPage";

function AuthenticatedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const handleProfileMenuChange = useCallback((isOpen) => {
    setActiveDropdown(isOpen ? "sidebar" : null);
  }, []);
  const handleTopbarMenuChange = useCallback((isOpen) => {
    setActiveDropdown(isOpen ? "topbar" : null);
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") setActiveDropdown(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        onNavigate={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        profileOpen={activeDropdown === "sidebar"}
        onProfileMenuChange={handleProfileMenuChange}
      />
      <div className="main-shell">
        <Topbar
          onMenuClick={() => setSidebarOpen((open) => !open)}
          onLogout={handleLogout}
          menuOpen={activeDropdown === "topbar"}
          onMenuOpenChange={handleTopbarMenuChange}
        />
        <main className="main-content" key={location.pathname}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/categories" element={<CategoryList />} />
            <Route path="/categories/new" element={<AddCategory />} />
            <Route path="/categories/:id/edit" element={<AddCategory />} />
            <Route path="/news" element={<NewsList />} />
            <Route path="/news/new" element={<AddNews />} />
            <Route path="/news/:id/edit" element={<AddNews />} />
            <Route path="/ads" element={<ManageAds />} />
            <Route path="/comments" element={<CommentList />} />
            <Route path="/reports" element={<ReportList />} />
            <Route path="/users" element={<UserList />} />
            <Route path="/deletion-requests" element={<AccountDeletionList />} />
            <Route path="/notifications" element={<NotificationList />} />
            <Route path="/notifications/new" element={<AddNotification />} />
            <Route path="/notifications/:id/edit" element={<AddNotification />} />
            <Route path="/administrators" element={<AdminList />} />
            <Route path="/administrators/new" element={<AddAdmin />} />
            <Route path="/administrators/:id/edit" element={<AddAdmin />} />
            <Route path="/admin/profile" element={<EditAdmin />} />
            <Route path="/admin/edit" element={<EditAdmin />} />
            <Route path="/settings" element={<GlobalSettings />} />
            <Route path="/apps" element={<AppList />} />
            <Route path="/apps/add" element={<AddApp />} />
            <Route path="/apps/:id/edit" element={<AddApp />} />
            <Route path="/license" element={<License />} />
            <Route path="/logout" element={<LogoutRedirect onLogout={handleLogout} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function LogoutRedirect({ onLogout }) {
  useEffect(() => onLogout(), [onLogout]);
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/*" element={<ProtectedRoute><AuthenticatedLayout /></ProtectedRoute>} />
    </Routes>
  );
}

function LoginRoute() {
  const { user } = useAuth();
  return user?.username ? <Navigate to="/" replace /> : <Login />;
}
