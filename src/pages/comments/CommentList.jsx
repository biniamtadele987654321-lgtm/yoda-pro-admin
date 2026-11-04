import { ExternalLink, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import PageHeader from "../../components/PageHeader";
import SearchBar from "../../components/SearchBar";
import TableContainer from "../../components/TableContainer";
import { useData } from "../../context/DataContext";
import { formatDateTime } from "../../utils/date";

export default function CommentList() {
  const { comments, news, users, deleteComment } = useData();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const filtered = useMemo(() => comments.filter((comment) => {
    const user = users.find((item) => item.id === comment.userId);
    const post = news.find((item) => item.id === comment.newsId);
    return [comment.message, user?.name, user?.email, post?.title].some((value) => value?.toLowerCase().includes(query.toLowerCase()));
  }), [comments, news, query, users]);

  return (
    <>
      <PageHeader title="Manage Comments" />
      {error && <p className="form-error" role="alert">{error}</p>}
      <TableContainer title="All comments" description="Review comments submitted on your news stories." count={`${filtered.length} comments`}>
        <SearchBar value={query} onChange={setQuery} onReset={() => setQuery("")} placeholder="Search comments..." />
        <div className="table-wrap">
          <table><thead><tr><th>Message</th><th>User</th><th>On news</th><th>Date &amp; time</th><th className="align-right">Action</th></tr></thead>
            <tbody>{filtered.map((comment) => {
              const user = users.find((item) => item.id === comment.userId);
              const post = news.find((item) => item.id === comment.newsId);
              return <tr key={comment.id}>
                <td className="message-cell">{comment.message}</td>
                <td><Link className="table-link" to="/users">{user?.name || "Deleted user"}</Link></td>
                <td className="linked-story"><Link className="table-link" to={post ? `/news/${post.id}/edit` : "/news"}>{post?.title || "Deleted story"}</Link></td>
                <td className="muted-cell">{formatDateTime(comment.date)}</td>
                <td><div className="row-actions"><a className="action-button action-view" href={post ? `/news/${post.id}/edit` : "/news"} target="_blank" rel="noreferrer" aria-label="Open related news"><ExternalLink size={16} /></a><button className="action-button action-delete" aria-label="Delete comment" onClick={() => setPending(comment)}><Trash2 size={16} /></button></div></td>
              </tr>;
            })}{!filtered.length && <tr><td className="empty-table" colSpan="5">No comments match your search.</td></tr>}</tbody>
          </table>
        </div>
        <div className="table-foot"><span>Showing <strong>{filtered.length}</strong> of <strong>{comments.length}</strong> comments</span></div>
      </TableContainer>
      <ConfirmDeleteModal open={Boolean(pending)} busy={deleting} title="Delete this comment?" message="This comment will be removed. The related news comment count will also be reduced." onCancel={() => { setPending(null); setError(""); }} onConfirm={async () => {
        setDeleting(true);
        setError("");
        try {
          await deleteComment(pending.id, pending.newsId);
          setPending(null);
        } catch (deleteError) {
          setError(deleteError.message || "Comment could not be deleted.");
        } finally {
          setDeleting(false);
        }
      }} />
    </>
  );
}
