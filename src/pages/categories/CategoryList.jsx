import { Edit3, FolderOpen, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { useData } from "../../context/DataContext";

const palette = ["#6e75e8", "#f0a24b", "#e66f8d", "#26a89f", "#55a0df"];

export default function CategoryList() {
  const { categories, deleteCategory } = useData();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const filtered = useMemo(() => categories.filter((category) => (category?.name || category?.categoryName || "").toLowerCase().includes(query.toLowerCase())), [categories, query]);
  async function remove(category) {
    const name = category?.name || category?.categoryName || "Unnamed category";
    if (!window.confirm(`Delete "${name}"?`)) return;
    setError("");
    try {
      await deleteCategory(category.id);
    } catch (deleteError) {
      setError(deleteError.message || "Category could not be deleted.");
    }
  }
  return (
    <>
      <PageHeader title="Manage Category" action={<Link className="button-primary" to="/categories/new"><Plus size={17} /> ADD NEW CATEGORY</Link>} />
      {location.state?.success && <p className="form-success" role="status">{location.state.success}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <section className="panel">
        <div className="panel-heading"><div><h2>All categories</h2><p>Organize your stories by topic.</p></div><span className="count-chip">{categories.length} total</span></div>
        <form className="table-filters" onSubmit={(event) => event.preventDefault()}>
          <div className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search category..." aria-label="Search categories" /></div>
          <button className="button-secondary" type="button" onClick={() => setQuery("")}>RESET</button><button className="button-primary button-search" type="submit"><Search size={16} /> Search</button>
        </form>
        <div className="table-wrap">
          <table><thead><tr><th>Category name</th><th>Image</th><th className="align-right">Action</th></tr></thead>
            <tbody>{filtered.map((category, index) => {
              const name = category?.name || category?.categoryName || "Unnamed category";
              const color = category?.color || palette[index % palette.length];
              return (
                <tr key={category.id}><td><div className="category-name"><span className="category-dot" style={{ backgroundColor: color }} /><strong>{name}</strong></div></td>
                  <td>{category.image ? <img className="category-thumb" src={category.image} alt="" /> : <span className="category-placeholder" style={{ color, background: `${color}18` }}><FolderOpen size={19} /></span>}</td>
                  <td><div className="row-actions"><Link className="action-button action-edit" to={`/categories/${category.id}/edit`} aria-label={`Edit ${name}`}><Edit3 size={16} /></Link><button className="action-button action-delete" aria-label={`Delete ${name}`} onClick={() => remove(category)}><Trash2 size={16} /></button></div></td>
                </tr>
              );
            })}{filtered.length === 0 && <tr><td className="empty-table" colSpan="3">No categories match your search.</td></tr>}</tbody>
          </table>
        </div>
        <div className="table-foot"><span>Showing <strong>{filtered.length}</strong> of <strong>{categories.length}</strong> categories</span></div>
      </section>
    </>
  );
}
