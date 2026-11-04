import { FileText, Settings } from "lucide-react";
import PageHeader from "../components/PageHeader";

const pages = {
  "/settings": { title: "Settings", subtitle: "Configure your app and publication preferences.", icon: Settings, empty: "Your publication settings are up to date." },
  "/apps": { title: "Apps", subtitle: "Manage your Yoda Pro app integrations.", icon: FileText, empty: "Connect a mobile app to manage its settings here." },
  "/license": { title: "License", subtitle: "Yoda Pro product and license information.", icon: FileText, empty: "Yoda Pro News Administration" },
};

export default function UtilityPage({ path }) {
  const item = pages[path] || pages["/settings"];
  const Icon = item.icon;
  return <><PageHeader title={item.title} /><section className="panel utility-panel"><div className="utility-icon"><Icon size={23} /></div><span className="eyebrow">WORKSPACE</span><h2>{item.title}</h2><p>{item.subtitle}</p><div className="utility-empty">{item.empty}</div></section></>;
}
