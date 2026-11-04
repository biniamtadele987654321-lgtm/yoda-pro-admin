import {
  AppWindow, BellRing, ChevronRight, FileText, Gauge, Home, LayoutGrid,
  LogOut, MessageCircle, Newspaper, Settings, ShieldCheck, Users, WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";

const cards = [
  { title: "MANAGE CATEGORY", detail: (data) => `Total ${data.categories.length} Categories`, icon: LayoutGrid, to: "/categories" },
  { title: "MANAGE NEWS", detail: (data) => `Total ${data.news.length} News`, icon: Newspaper, to: "/news" },
  { title: "MANAGE ADS", detail: () => "App Monetization", icon: WalletCards, to: "/ads" },
  { title: "COMMENTS", detail: (data) => `Total ${data.comments.length} Comments`, icon: MessageCircle, to: "/comments" },
  { title: "REPORT & FEEDBACK", detail: (data) => `Total ${data.reports.length} Reports`, icon: Gauge, to: "/reports" },
  { title: "REGISTERED USERS", detail: (data) => `Total ${data.users.length} Users`, icon: Users, to: "/users" },
  { title: "NOTIFICATION", detail: (data) => `Total ${data.notifications.length} Notifications`, icon: BellRing, to: "/notifications" },
  { title: "ADMINISTRATORS", detail: (data) => `Total ${data.admins.length} Administrators`, icon: ShieldCheck, to: "/administrators" },
  { title: "SETTINGS", detail: () => "App Configuration", icon: Settings, to: "/settings" },
  { title: "APPS", detail: (data) => `Total ${data.apps.length} Apps`, icon: AppWindow, to: "/apps" },
  { title: "LICENSE", detail: () => "Product Information", icon: FileText, to: "/license" },
  { title: "LOGOUT", detail: () => "End your session", icon: LogOut, to: "/logout" },
];

export default function Dashboard() {
  const data = useData();
  return (
    <>
      <div className="dashboard-breadcrumb" aria-label="Breadcrumb">
        <Link to="/dashboard"><Home size={13} /> Dashboard</Link>
        <ChevronRight size={13} />
        <span>Home</span>
      </div>
      <section className="dashboard-grid" aria-label="Dashboard modules">
        {cards.map(({ title, detail, icon: Icon, to }) => (
          <Link className="dashboard-card" to={to} key={title}>
            <span className="dashboard-card-title">{title}</span>
            <Icon className="dashboard-card-icon" aria-hidden="true" />
            <span className="dashboard-card-detail">{detail(data)}</span>
          </Link>
        ))}
      </section>
    </>
  );
}
