import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import PageHeader from "../../components/PageHeader";
import SearchBar from "../../components/SearchBar";
import TableContainer from "../../components/TableContainer";
import { useData } from "../../context/DataContext";
import { formatDateTime } from "../../utils/date";

const initials = (name = "") => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

export default function AccountDeletionList() {
  const { users, deleteUserData } = useData();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const requests = useMemo(() => users.filter((user) => user.reason || user.deletionDate).filter((user) => `${user.name} ${user.email} ${user.reason || ""}`.toLowerCase().includes(query.toLowerCase())), [query, users]);
  return (
    <>
      <PageHeader title="Account Deletion Requests" />
      <TableContainer title="Deletion requests" description="Process requests to permanently erase user account data." count={`${requests.length} requests`}>
        <SearchBar value={query} onChange={setQuery} onReset={() => setQuery("")} placeholder="Search deletion requests..." />
        <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Profile</th><th>Reason</th><th>Date &amp; time</th><th className="align-right">Action</th></tr></thead>
          <tbody>{requests.map((user, index) => <tr key={user.id}><td><strong className="table-primary-text">{user.name}</strong></td><td>{user.email}</td><td><span className={`profile-avatar profile-tone-${index % 5}`}>{user.avatar ? <img src={user.avatar} alt="" /> : initials(user.name)}</span></td><td className="message-cell">{user.reason || "Account deletion requested"}</td><td className="muted-cell">{formatDateTime(user.deletionDate)}</td><td><div className="row-actions"><button className="action-button action-delete" aria-label={`Permanently delete ${user.name}`} onClick={() => setPending(user)}><Trash2 size={16} /></button></div></td></tr>)}
            {!requests.length && <tr><td className="empty-table" colSpan="6">There are no account deletion requests.</td></tr>}</tbody>
        </table></div>
        <div className="deletion-compliance-note"><span>Account deletion</span> Permanently removing a request also deletes the user’s profile and associated comment and report data from this demo store.</div>
      </TableContainer>
      {error && <p className="form-error" role="alert">{error}</p>}
      <ConfirmDeleteModal open={Boolean(pending)} busy={deleting} title="Permanently delete user data?" message={`This will permanently remove ${pending?.name || "this user"} and associated profile, comments, and reports. This action cannot be undone.`} confirmLabel="Delete user data" onCancel={() => { setPending(null); setError(""); }} onConfirm={async () => {
        setDeleting(true);
        setError("");
        try {
          await deleteUserData(pending.id);
          setPending(null);
        } catch (deleteError) {
          setError(deleteError.message || "User data could not be deleted.");
        } finally {
          setDeleting(false);
        }
      }} />
    </>
  );
}
