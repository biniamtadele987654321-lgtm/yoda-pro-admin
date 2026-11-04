import { Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import SearchBar from "../../components/SearchBar";
import TableContainer from "../../components/TableContainer";
import { useData } from "../../context/DataContext";

const PAGE_SIZE = 6;
const avatarColors = ["#e8f0ff", "#fcebdc", "#e7f6ef", "#f8e9ee", "#eeeafd"];
const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

export default function UserList() {
  const { users, saveUser } = useData();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", status: "ENABLED" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const filtered = useMemo(() => users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase())), [query, users]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function openEditor(user) {
    setEditing(user);
    setForm({ name: user.name, email: user.email, status: user.status || "ENABLED" });
    setError("");
  }
  async function save(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setError("Name and email are required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Enter a valid email address."); return; }
    setSaving(true);
    setError("");
    try {
      await saveUser({ ...editing, ...form, name: form.name.trim(), email: form.email.trim() });
      setEditing(null);
    } catch (saveError) {
      setError(saveError.message || "User could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Registered Users" />
      <TableContainer title="Registered users" description="View and manage members of your community." count={`${filtered.length} users`}>
        <SearchBar value={query} onChange={(value) => { setQuery(value); setPage(1); }} onReset={() => { setQuery(""); setPage(1); }} placeholder="Search users by name or email..." />
        <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Profile</th><th>Status</th><th className="align-right">Action</th></tr></thead>
          <tbody>{visible.map((user, index) => <tr key={user.id}><td><strong className="table-primary-text">{user.name}</strong></td><td>{user.email}</td><td><span className="profile-avatar" style={{ backgroundColor: avatarColors[index % avatarColors.length] }}>{user.avatar ? <img src={user.avatar} alt="" /> : initials(user.name)}</span></td><td><span className={`user-status ${user.status === "ENABLED" ? "user-status-enabled" : "user-status-disabled"}`}>{user.status || "ENABLED"}</span></td><td><div className="row-actions"><button className="action-button action-edit" aria-label={`Edit ${user.name}`} onClick={() => openEditor(user)}><Pencil size={16} /></button></div></td></tr>)}
            {!visible.length && <tr><td className="empty-table" colSpan="5">No users match your search.</td></tr>}</tbody>
        </table></div>
        <Pagination page={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </TableContainer>

      {editing && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditing(null); }}><form className="edit-user-modal" role="dialog" aria-modal="true" aria-labelledby="edit-user-title" onSubmit={save}>
        <div className="modal-header"><div><h2 id="edit-user-title">Edit user profile</h2><p>Update account details and access status.</p></div><button className="modal-close" type="button" aria-label="Close dialog" onClick={() => setEditing(null)}>×</button></div>
        <label className="modal-field">Name<input className="text-input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
        <label className="modal-field">Email<input className="text-input" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label>
        <label className="modal-field">Account status<select className="text-input" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}><option value="ENABLED">ENABLED</option><option value="DISABLED">DISABLED</option></select></label>
        {error && <p className="field-error modal-error" role="alert">{error}</p>}
        <div className="confirm-actions"><button className="button-secondary" type="button" disabled={saving} onClick={() => setEditing(null)}>Cancel</button><button className="button-primary" type="submit" disabled={saving}>{saving ? "SAVING..." : "SAVE CHANGES"}</button></div>
      </form></div>}
    </>
  );
}
