import { Edit3, Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import PageHeader from "../../components/PageHeader";
import SearchBar from "../../components/SearchBar";
import TableContainer from "../../components/TableContainer";
import { useData } from "../../context/DataContext";

function SecretValue({ value, label }) {
  const [visible, setVisible] = useState(false);
  const shown = value || "Managed by sync service";
  return (
    <div className="app-secret-cell">
      <span title={visible ? shown : undefined}>{visible ? shown : value ? `${value.slice(0, 5)}••••••••${value.slice(-4)}` : shown}</span>
      {value && <button className="secret-action" type="button" title={visible ? `Hide ${label}` : `Reveal ${label}`} aria-label={visible ? `Hide ${label}` : `Reveal ${label}`} onClick={() => setVisible((current) => !current)}>{visible ? <EyeOff size={14} /> : <Eye size={14} />}</button>}
    </div>
  );
}

export default function AppList() {
  const { apps, deleteApp } = useData();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(null);
  const filtered = useMemo(() => apps.filter((app) => `${app.applicationId} ${app.status} ${app.redirectUrl || ""}`.toLowerCase().includes(query.toLowerCase())), [apps, query]);
  return (
    <>
      <PageHeader title="Manage Apps" action={<Link className="button-primary" to="/apps/add"><Plus size={17} /> ADD NEW APP</Link>} />
      <TableContainer title="Connected applications" description="Manage package IDs, access keys, and app redirect settings." count={`${filtered.length} apps`}>
        <SearchBar value={query} onChange={setQuery} onReset={() => setQuery("")} placeholder="Search package name or redirect URL..." />
        <div className="table-wrap">
          <table className="apps-table"><thead><tr><th>Package name</th><th>Server key</th><th>Rest API key</th><th>Status</th><th>Redirect URL</th><th className="align-right">Action</th></tr></thead>
            <tbody>{filtered.map((app) => <tr key={app.id}>
              <td><span className="package-name">{app.applicationId}</span></td>
              <td><SecretValue value={app.serverKey} label="server key" /></td>
              <td><SecretValue value={app.restApiKey} label="REST API key" /></td>
              <td><span className={`app-status ${app.status === "Active" ? "app-status-active" : "app-status-inactive"}`}>{app.status === "Active" ? "ACTIVE" : "INACTIVE"}</span></td>
              <td className="app-redirect">{app.redirectUrl ? <a href={app.redirectUrl} target="_blank" rel="noreferrer">{app.redirectUrl}</a> : <span>—</span>}</td>
              <td><div className="row-actions"><Link className="action-button action-edit" to={`/apps/${app.id}/edit`} aria-label={`Edit ${app.applicationId}`}><Edit3 size={16} /></Link><button className="action-button action-delete" aria-label={`Delete ${app.applicationId}`} onClick={() => setPending(app)}><Trash2 size={16} /></button></div></td>
            </tr>)}
            {!filtered.length && <tr><td className="empty-table" colSpan="6">No apps match your search. Add your first app to get started.</td></tr>}</tbody>
          </table>
        </div>
        <div className="table-foot"><span>Showing <strong>{filtered.length}</strong> of <strong>{apps.length}</strong> apps</span></div>
      </TableContainer>
      <ConfirmDeleteModal open={Boolean(pending)} title="Delete app configuration?" message={`The configuration for ${pending?.applicationId || "this app"} will be removed from this dashboard.`} onCancel={() => setPending(null)} onConfirm={() => { deleteApp(pending.id); setPending(null); }} />
      <p className="apps-security-note"><EyeOff size={14} /> Keys are masked by default. Demo keys are placeholders only; production credentials must be issued and managed by your backend.</p>
    </>
  );
}
