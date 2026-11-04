import { Bell, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import PageHeader from "../../components/PageHeader";
import SearchBar from "../../components/SearchBar";
import TableContainer from "../../components/TableContainer";
import { useData } from "../../context/DataContext";

function statusKey(status) {
  if (status === "sent" || status === "SENT") return "sent";
  if (status === "failed" || status === "FAILED") return "failed";
  return "saved";
}

const statusLabels = { sent: "SENT", saved: "SAVED", failed: "FAILED" };

export default function NotificationList() {
  const { notifications, dispatchNotification, deleteNotification } = useData();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(null);
  const [sendingId, setSendingId] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [feedback, setFeedback] = useState(location.state?.notice || "");
  const [feedbackType, setFeedbackType] = useState(location.state?.failed ? "error" : location.state?.savedOnly ? "info" : "success");
  const filtered = useMemo(() => notifications.filter((notification) => `${notification.title} ${notification.message} ${notification.link || ""}`.toLowerCase().includes(query.toLowerCase())), [notifications, query]);

  async function send(notification) {
    setSendingId(notification.id);
    setFeedback("");
    setFeedbackType("success");
    try {
      const result = await dispatchNotification(notification);
      if (result.status === "SAVED") {
        setFeedback(`“${notification.title}” was saved, but not sent. Configure OneSignal in global settings to enable delivery.`);
        setFeedbackType("info");
      } else {
        setFeedback(`“${notification.title}” was sent successfully.`);
      }
    } catch (error) {
      setFeedback(error.message);
      setFeedbackType("error");
    } finally {
      setSendingId("");
    }
  }

  return (
    <>
      <PageHeader title="Notifications" action={<Link className="button-primary" to="/notifications/new"><Plus size={17} /> ADD NEW NOTIFICATION</Link>} />
      {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
      <TableContainer title="Notification history" description="Create messages and review their dispatch status." count={`${filtered.length} notifications`}>
        <SearchBar value={query} onChange={setQuery} onReset={() => setQuery("")} placeholder="Search notifications..." />
        {feedback && <div className={`inline-feedback ${feedbackType === "error" ? "inline-feedback-error" : feedbackType === "info" ? "notification-feedback-info" : "inline-feedback-success"}`} role="status">{feedback}</div>}
        <div className="table-wrap"><table className="notification-table"><thead><tr><th>Title</th><th>Image</th><th>Message</th><th>URL / Link</th><th>Status</th><th className="align-right">Action</th></tr></thead>
          <tbody>{filtered.map((notification) => {
            const key = statusKey(notification.status);
            return <tr key={notification.id}><td><strong className="table-primary-text">{notification.title}</strong></td><td>{notification.image ? <img className="notification-thumb" src={notification.image} alt="" /> : <span className="notification-thumb notification-thumb-empty"><Bell size={15} /></span>}</td><td className="message-cell">{notification.message}</td><td className="notification-url">{notification.link ? <a className="table-link" href={notification.link} target="_blank" rel="noreferrer">{notification.link}</a> : <span>—</span>}</td><td><span className={`dispatch-status dispatch-${key}`}>{statusLabels[key]}</span></td><td><div className="row-actions"><button className="action-button action-notify" title="Send notification" aria-label="Send notification" disabled={sendingId === notification.id || key === "sent"} onClick={() => send(notification)}>{sendingId === notification.id ? <span className="sending-spinner" /> : <Send size={15} />}</button><Link className="action-button action-edit" to={`/notifications/${notification.id}/edit`} aria-label="Edit notification"><Pencil size={15} /></Link><button className="action-button action-delete" aria-label="Delete notification" onClick={() => setPending(notification)}><Trash2 size={15} /></button></div></td></tr>;
          })}
            {!filtered.length && <tr><td className="empty-table" colSpan="6">No notifications found. Create your first notification to get started.</td></tr>}</tbody>
        </table></div>
        <div className="table-foot"><span>Showing <strong>{filtered.length}</strong> of <strong>{notifications.length}</strong> notifications</span></div>
      </TableContainer>
      <ConfirmDeleteModal open={Boolean(pending)} busy={deleting} title="Delete notification?" message={`“${pending?.title || "This notification"}” will be removed from notification history.`} onCancel={() => { setPending(null); setDeleteError(""); }} onConfirm={async () => {
        setDeleting(true);
        setDeleteError("");
        try {
          await deleteNotification(pending.id);
          setPending(null);
        } catch (error) {
          setDeleteError(error.message || "Notification could not be deleted.");
        } finally {
          setDeleting(false);
        }
      }} />
    </>
  );
}
