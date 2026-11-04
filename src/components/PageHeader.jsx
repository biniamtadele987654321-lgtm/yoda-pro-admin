import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function PageHeader({ title, action }) {
  return (
    <div className="page-heading-row">
      <div>
        <h1>{title}</h1>
        <div className="breadcrumbs"><Link to="/"><Home size={13} /> Dashboard</Link><ChevronRight size={13} /><span>{title}</span></div>
      </div>
      {action}
    </div>
  );
}
