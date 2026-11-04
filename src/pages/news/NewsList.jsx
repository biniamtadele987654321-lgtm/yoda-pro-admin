import { Bell, Eye, ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import { useData } from "../../context/DataContext";
import { formatDateTime } from "../../utils/date";

export default function NewsList() {
  const { news, deleteNews, isLoading } = useData();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const perPage = 6;
  const filtered = useMemo(() => news.filter((item) => (item.title || "").toLowerCase().includes(query.toLowerCase()) || (item.category || "").toLowerCase().includes(query.toLowerCase())), [news, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page - 1) * perPage, page * perPage);
  const allVisibleSelected = visible.length > 0 && visible.every((item) => selected.includes(item.id));

  function toggle(id) { setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  function toggleVisible() {
    if (allVisibleSelected) {
      setSelected((current) => current.filter((id) => !visible.some((post) => post.id === id)));
    } else {
      setSelected((current) => [...new Set([...current, ...visible.map((post) => post.id)])]);
    }
  }

  async function remove(ids) {
    if (ids.length && window.confirm(`Delete ${ids.length} selected ${ids.length === 1 ? "story" : "stories"}?`)) {
      setError("");
      try {
        await deleteNews(ids);
      } catch (deleteError) {
        setError(deleteError.message || "News could not be deleted.");
        return;
      }
      setSelected((current) => current.filter((id) => !ids.includes(id)));
    }
  }

  return (
    <>
      <PageHeader title="MANAGE NEWS" action={<Link className="button-primary news-add-button" to="/news/new"><Plus size={17} /> ADD NEW NEWS</Link>} />
      {location.state?.success && <p className="form-success" role="status">{location.state.success}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <section className="panel">
        <div className="panel-heading"><div><h2>MANAGE NEWS</h2><p>Review and manage your published stories.</p></div><span className="count-chip">{filtered.length} stories</span></div>
        <form className="table-filters news-filters" onSubmit={(event) => event.preventDefault()}>
          <div className="search-field"><Search size={17} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search by title or category..." aria-label="Search news" /></div>
          <button className="button-secondary news-reset" type="button" onClick={() => { setQuery(""); setPage(1); }}>RESET</button><button className="button-primary button-search news-search-button" type="submit" aria-label="Search"><Search size={17} /></button>
        </form>
        <div className="bulk-toolbar news-action-bar">
          <button className="button-delete-selected" onClick={() => remove(selected)} disabled={!selected.length || isLoading}><Trash2 size={15} /> Delete selected items(s) {selected.length ? `(${selected.length})` : ""}</button>
          <div className="news-jump-control"><label htmlFor="news-page">Jump to Page</label><select id="news-page" value={page} onChange={(event) => setPage(Number(event.target.value))} aria-label="Jump to Page">{Array.from({ length: pages }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></div>
        </div>
        <div className="table-wrap">
          <table className="news-table"><thead><tr><th><input type="checkbox" aria-label="Select all visible news" checked={allVisibleSelected} onChange={toggleVisible} /></th><th>Title</th><th>Image</th><th>Date</th><th>Category</th><th>Comments</th><th>Views</th><th>Type</th><th>Actions</th></tr></thead>
            <tbody>{visible.map((post) => (
              <tr key={post.id}><td><input type="checkbox" aria-label={`Select ${post.title}`} checked={selected.includes(post.id)} onChange={() => toggle(post.id)} /></td>
                <td className="news-title-cell"><strong>{post.title}</strong></td><td>{post.image ? <img className="news-thumb" src={post.image} alt="" /> : <span className="news-thumb news-thumb-placeholder"><ExternalLink size={15} /></span>}</td>
                <td className="muted-cell">{formatDateTime(post.date)}</td><td>{post.category}</td><td><span className="news-comment-count">{post.comments}</span></td><td>{Number(post.views || 0).toLocaleString()}</td><td><StatusBadge type={post.type} /></td>
                <td><div className="row-actions news-actions"><Link title="View story" aria-label="View story" className="action-button action-view" to={`/news/${post.id}/edit`}><Eye size={15} /></Link><Link title="Notify users" aria-label="Notify users" className="action-button action-notify" to="/notifications/new"><Bell size={15} /></Link><button title="Share story" aria-label="Share story" className="action-button action-share" onClick={async () => { try { await navigator.clipboard.writeText(`${window.location.origin}/news/${post.id}`); } catch { window.alert("Clipboard access is unavailable in this browser."); } }}><ExternalLink size={15} /></button><Link title="Edit story" aria-label="Edit story" className="action-button action-edit" to={`/news/${post.id}/edit`}><Pencil size={15} /></Link><button title="Delete story" aria-label="Delete story" className="action-button action-delete" onClick={() => remove([post.id])}><Trash2 size={15} /></button></div></td>
              </tr>
            ))}{!visible.length && <tr><td colSpan="9" className="empty-table">No stories found. Add your first news post to get started.</td></tr>}</tbody>
          </table>
        </div>
        <div className="table-foot"><span>Showing {visible.length ? (page - 1) * perPage + 1 : 0}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</span><div className="pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>{page} / {pages}</span><button disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button></div></div>
      </section>
    </>
  );
}
