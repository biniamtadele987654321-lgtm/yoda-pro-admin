import { ChevronRight, Home, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DateTimePickerModal from "../../components/DateTimePickerModal";
import ImageDropzone from "../../components/ImageDropzone";
import RichTextEditor from "../../components/RichTextEditor";
import { useData } from "../../context/DataContext";

export default function AddNews() {
  const { id } = useParams();
  const { categories, news, addNews, updateNews, isLoading, dataReady } = useData();
  const existing = news.find((post) => post.id === id);
  const [form, setForm] = useState(() => existing || {
    title: "",
    date: "",
    category: categories[0]?.name || "",
    type: "NEWS",
    image: "",
    secondaryImage: "",
    content: "",
  });
  const [error, setError] = useState("");
  const [showSecondaryImage, setShowSecondaryImage] = useState(Boolean(existing?.secondaryImage));
  const [isUploading, setIsUploading] = useState(false);
  const [primaryImageFile, setPrimaryImageFile] = useState(null);
  const [optionalImageFile, setOptionalImageFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (existing) {
      setForm(existing);
      setShowSecondaryImage(Boolean(existing.secondaryImage));
    }
    if (id && dataReady && !existing) navigate("/news", { replace: true });
  }, [dataReady, existing, id, navigate]);

  useEffect(() => {
    if (!form.category && categories[0]) setForm((current) => ({ ...current, category: categories[0].name }));
  }, [categories, form.category]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function updateDescription(value) {
    setForm((current) => ({ ...current, content: value, description: value }));
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim()) { setError("A title is required."); return; }
    if (!categories.length) { setError("Create a category before publishing a story."); return; }
    setError("");
    const newsData = { ...form, id, title: form.title.trim() };
    setIsUploading(true);
    try {
      if (id) await updateNews(id, newsData, primaryImageFile, optionalImageFile);
      else await addNews(newsData, primaryImageFile, optionalImageFile);
      navigate("/news", { state: { success: `News ${id ? "updated" : "published"} successfully.` } });
    } catch (saveError) {
      setError(saveError?.message || "News could not be saved.");
    } finally {
      setIsUploading(false);
    }
  }

  const pageTitle = id ? "Edit News" : "Add News";

  return (
    <form id="news-editor-form" className="add-news-page" onSubmit={submit}>
      <div className="news-form-page-heading">
        <div>
          <h1>{pageTitle}</h1>
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link to="/dashboard"><Home size={13} /> Dashboard</Link>
            <ChevronRight size={13} />
            <Link to="/news">Manage News</Link>
            <ChevronRight size={13} />
            <span>{pageTitle}</span>
          </nav>
        </div>
        <button className="button-primary news-publish-top" type="submit" disabled={isLoading || isUploading}>{isLoading || isUploading ? <><span className="sending-spinner" aria-hidden="true" />UPLOADING...</> : id ? "UPDATE" : "PUBLISH"}</button>
      </div>

      <div className="news-form-layout">
        <section className="panel form-panel news-input-panel">
          <div className="form-field"><label htmlFor="news-title">News Title <span className="required">*</span></label><input className="text-input" id="news-title" value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Enter an engaging headline" required /></div>
          <div className="form-field"><DateTimePickerModal id="news-date" label="News Date" value={form.date || ""} onChange={(value) => update("date", value)} /></div>
          <div className="form-field"><label htmlFor="news-category">Category</label><select className="text-input" id="news-category" value={form.category} onChange={(event) => update("category", event.target.value)}>{categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}</select></div>
          <div className="form-field"><label htmlFor="news-type">Content Type</label><select className="text-input" id="news-type" value={form.type === "VIDEO" ? "VIDEO" : "NEWS"} onChange={(event) => update("type", event.target.value)}><option value="NEWS">Standard Post</option><option value="VIDEO">Video Post</option></select></div>
          <div className="form-field news-image-field"><label>Primary Image</label><ImageDropzone value={form.image || ""} onChange={(value) => update("image", value)} onFileChange={setPrimaryImageFile} promptText="Drag and drop an image here or click" /></div>
          <div className="form-field news-image-field"><div className="optional-image-heading"><label>Image Optional</label>{!showSecondaryImage && <button className="button-secondary add-more-button" type="button" onClick={() => setShowSecondaryImage(true)}><Plus size={14} /> ADD MORE</button>}</div>{showSecondaryImage && <ImageDropzone compact value={form.secondaryImage || ""} onChange={(value) => update("secondaryImage", value)} onFileChange={setOptionalImageFile} promptText="Click to add an optional image" />}</div>
        </section>

        <section className="panel description-panel news-description-panel">
          <div className="description-label"><label>Description <span className="required">*</span></label></div>
          <RichTextEditor label="News description" placeholder="Write your story here..." value={form.description || form.content || ""} onChange={updateDescription} />
        </section>
      </div>
      {error && <p className="form-error news-form-error" role="alert">{error}</p>}
    </form>
  );
}
