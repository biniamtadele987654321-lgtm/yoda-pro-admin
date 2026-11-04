import { ArrowLeft, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ImageDropzone from "../../components/ImageDropzone";
import PageHeader from "../../components/PageHeader";
import { useData } from "../../context/DataContext";
import { compressImageToBase64 } from "../../utils/image";

export default function AddNotification() {
  const { id } = useParams();
  const { notifications, saveNotification, dispatchNotification } = useData();
  const existing = notifications.find((item) => item.id === id);
  const [form, setForm] = useState(() => existing || { title: "", message: "", image: "", link: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (id && !existing) navigate("/notifications", { replace: true });
  }, [existing, id, navigate]);

  function update(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  function validLink(link) {
    if (!link.trim()) return true;
    try { return ["http:", "https:"].includes(new URL(link).protocol); } catch { return false; }
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.message.trim()) { setError("Title and message are required."); return; }
    if (!validLink(form.link || "")) { setError("Enter a valid http or https link."); return; }
    setSaving(true);
    setError("");
    try {
      const image = imageFile
        ? await compressImageToBase64(imageFile)
        : form.image?.startsWith("data:image/")
          ? await compressImageToBase64(form.image)
          : form.image || "";
      const notification = await saveNotification({ ...form, image, id, title: form.title.trim(), message: form.message.trim(), link: (form.link || "").trim() });
      try {
        const dispatchResult = await dispatchNotification(notification);
        const notice = dispatchResult.status === "SAVED"
          ? "Notification saved. Configure OneSignal credentials in global settings to send it."
          : "Notification dispatched successfully.";
        navigate("/notifications", { state: { notice, savedOnly: dispatchResult.status === "SAVED" } });
      } catch (dispatchError) {
        navigate("/notifications", { state: { notice: dispatchError.message, failed: true } });
      }
    } catch (saveError) {
      setError(saveError.message || "Notification could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title={id ? "Edit Notification" : "Add New Notification"} action={<Link className="button-secondary" to="/notifications"><ArrowLeft size={16} /> BACK TO LIST</Link>} />
      <form className="panel form-panel notification-form" onSubmit={submit}>
        <div className="panel-heading"><div><h2>Notification details</h2><p>Compose a message to send to your app audience.</p></div></div>
        <div className="form-field"><label htmlFor="notification-title">Title <span className="required">*</span></label><input id="notification-title" className="text-input" value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Write a short, clear title" required maxLength={120} /></div>
        <div className="form-field"><label htmlFor="notification-message">Message <span className="required">*</span></label><textarea id="notification-message" className="text-input text-area" value={form.message} onChange={(event) => update("message", event.target.value)} placeholder="Write the notification message..." required maxLength={500} /></div>
        <div className="form-field"><label>Image <span className="field-hint">(Optional · JPG, JPEG, PNG or GIF)</span></label><ImageDropzone value={form.image || ""} onChange={(value) => update("image", value)} onFileChange={setImageFile} /></div>
        <div className="form-field"><label htmlFor="notification-link">Link <span className="field-hint">(Optional)</span></label><input id="notification-link" className="text-input" type="url" value={form.link || ""} onChange={(event) => update("link", event.target.value)} placeholder="https://example.com/story" /></div>
        <div className="dispatch-disclaimer"><Info size={15} /><span>Submitting saves this notification and sends it through OneSignal when the App ID and REST API key are configured in global settings.</span></div>
        {error && <p className="form-error notification-error" role="alert">{error}</p>}
        <div className="form-actions"><Link className="button-secondary" to="/notifications">Cancel</Link><button className="button-primary" type="submit" disabled={saving}>{saving ? "SAVING..." : "SUBMIT"}</button></div>
      </form>
    </>
  );
}
