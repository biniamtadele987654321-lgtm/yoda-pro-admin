import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ImageDropzone from "../../components/ImageDropzone";
import PageHeader from "../../components/PageHeader";
import { useData } from "../../context/DataContext";

export default function AddCategory() {
  const { id } = useParams();
  const { categories, addCategory, updateCategory, isLoading, dataReady } = useData();
  const existing = categories.find((category) => category.id === id);
  const [name, setName] = useState(existing?.name || "");
  const [image, setImage] = useState(existing?.image || "");
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (existing) {
      setName(existing.name || "");
      setImage(existing.image || "");
    }
    if (id && dataReady && !existing) navigate("/categories", { replace: true });
  }, [dataReady, existing, id, navigate]);

  async function submit(event) {
    event.preventDefault();
    if (!name.trim()) { setError("Category name is required."); return; }
    setError("");
    setIsUploading(true);
    try {
      const categoryData = { id, name: name.trim(), image, color: existing?.color || "#527fe7" };
      if (id) await updateCategory(id, categoryData, imageFile);
      else await addCategory(categoryData, imageFile);
      navigate("/categories", { state: { success: `Category ${id ? "updated" : "added"} successfully.` } });
    } catch (saveError) {
      setError(saveError?.message || "Category could not be saved.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <PageHeader title={id ? "Edit Category" : "Add New Category"} action={<Link className="button-secondary" to="/categories"><ArrowLeft size={16} /> BACK TO LIST</Link>} />
      <form className="panel form-panel category-form" onSubmit={submit}>
        <div className="panel-heading"><div><h2>Category information</h2><p>Give this category a name and a recognizable image.</p></div></div>
        <div className="form-field"><label htmlFor="category-name">Category Name <span className="required">*</span></label><input id="category-name" className="text-input" value={name} onChange={(event) => { setName(event.target.value); setError(""); }} placeholder="e.g. Technology" required /></div>
        <div className="form-field"><label>Image <span className="field-hint">(JPG, JPEG, PNG or GIF)</span></label><ImageDropzone value={image} onChange={setImage} onFileChange={setImageFile} /></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions"><Link className="button-secondary" to="/categories">Cancel</Link><button className="button-primary" type="submit" disabled={isLoading || isUploading}>{isLoading || isUploading ? <><span className="sending-spinner" aria-hidden="true" />UPLOADING...</> : "SUBMIT"}</button></div>
      </form>
    </>
  );
}
