import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import SearchBar from "../../components/SearchBar";
import TableContainer from "../../components/TableContainer";
import { useData } from "../../context/DataContext";
import { formatDateTime } from "../../utils/date";

const PAGE_SIZE = 6;

export default function ReportList() {
  const { reports, users, news, deleteReport } = useData();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const filtered = useMemo(() => reports.filter((report) => {
    const reporter = users.find((user) => user.id === report.userId);
    const reported = users.find((user) => user.id === report.reportedUserId);
    const post = news.find((item) => item.id === report.newsId);
    return [report.type, report.message, reporter?.name, reported?.name, post?.title].some((value) => value?.toLowerCase().includes(query.toLowerCase()));
  }), [news, query, reports, users]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <PageHeader title="Report & Feedback" />
      {error && <p className="form-error" role="alert">{error}</p>}
      <TableContainer title="Reports & feedback" description="Review feedback and content reports from your community." count={`${filtered.length} items`}>
        <SearchBar value={query} onChange={(value) => { setQuery(value); setPage(1); }} onReset={() => { setQuery(""); setPage(1); }} placeholder="Search reports and feedback..." />
        <div className="table-wrap"><table className="reports-table"><thead><tr><th>Type</th><th>User</th><th>Reported user</th><th>Source</th><th>Response / reason</th><th>Date &amp; time</th><th className="align-right">Action</th></tr></thead>
          <tbody>{visible.map((report) => {
            const reporter = users.find((user) => user.id === report.userId);
            const reported = users.find((user) => user.id === report.reportedUserId);
            const post = news.find((item) => item.id === report.newsId);
            return <tr key={report.id}><td><span className={`type-badge ${report.type === "Report" ? "type-badge-report" : "type-badge-feedback"}`}>{report.type}</span></td><td><Link className="table-link" to="/users">{reporter?.name || "Deleted user"}</Link></td><td>{reported?.name || "—"}</td><td className="linked-story">{post ? <Link className="table-link" to={`/news/${post.id}/edit`}>{post.title}</Link> : "—"}</td><td className="message-cell">{report.message}</td><td className="muted-cell">{formatDateTime(report.date)}</td><td><div className="row-actions"><button className="action-button action-delete" aria-label={`Delete ${report.type.toLowerCase()}`} onClick={() => setPending(report)}><Trash2 size={16} /></button></div></td></tr>;
          })}{!visible.length && <tr><td className="empty-table" colSpan="7">No reports or feedback match your search.</td></tr>}</tbody>
        </table></div>
        <Pagination page={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </TableContainer>
      <ConfirmDeleteModal open={Boolean(pending)} busy={deleting} title={`Delete ${pending?.type || "item"}?`} message="This item will be permanently removed from the reports and feedback list." onCancel={() => { setPending(null); setError(""); }} onConfirm={async () => {
        setDeleting(true);
        setError("");
        try {
          await deleteReport(pending.id);
          setPending(null);
        } catch (deleteError) {
          setError(deleteError.message || "Report could not be deleted.");
        } finally {
          setDeleting(false);
        }
      }} />
    </>
  );
}
