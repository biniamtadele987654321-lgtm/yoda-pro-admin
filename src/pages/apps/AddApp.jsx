import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { useData } from "../../context/DataContext";

export default function AddApp() {
  const { id } = useParams();
  const { apps, saveApp } = useData();
  const existing = apps.find((app) => app.id === id);
  const [form, setForm] = useState(() => ({
    applicationId: existing?.applicationId || "",
    status: existing?.status || "Active",
    redirectUrl: existing?.redirectUrl || "",
  }));
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (id && !existing) navigate("/apps", { replace: true });
  }, [existing, id, navigate]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function submit(event) {
    event.preventDefault();
    const applicationId = form.applicationId.trim();
    if (!/^[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+$/.test(applicationId)) {
      setError("Enter a valid Android package name, such as com.company.app.");
      return;
    }
    if (apps.some((app) => app.id !== id && app.applicationId.toLowerCase() === applicationId.toLowerCase())) {
      setError("An app with this package name already exists.");
      return;
    }
    if (form.redirectUrl.trim()) {
      try {
        const url = new URL(form.redirectUrl.trim());
        if (!["http:", "https:"].includes(url.protocol)) throw new Error("invalid protocol");
      } catch {
        setError("Enter a valid redirect URL beginning with http:// or https://.");
        return;
      }
    }
    saveApp({ ...form, id, applicationId, redirectUrl: form.redirectUrl.trim() });
    navigate("/apps");
  }

  return (
    <>
      <PageHeader title={id ? "Edit App" : "Add New App"} action={<Link className="button-secondary" to="/apps"><ArrowLeft size={16} /> BACK TO LIST</Link>} />
      <form className="panel form-panel app-form" onSubmit={submit}>
        <div className="panel-heading"><div><h2>Application details</h2><p>Configure the package identity and availability for your app.</p></div></div>
        <div className="form-field"><label htmlFor="application-id">Application ID (Package Name) <span className="required">*</span></label><input id="application-id" className="text-input" value={form.applicationId} onChange={(event) => update("applicationId", event.target.value)} placeholder="com.company.ashu" autoComplete="off" required /></div>
        <div className="form-field"><label htmlFor="app-status">Status</label><select id="app-status" className="text-input" value={form.status} onChange={(event) => update("status", event.target.value)}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
        <div className="form-field"><label htmlFor="redirect-url">Redirect Url <span className="field-hint">(Optional)</span></label><input id="redirect-url" className="text-input" type="url" value={form.redirectUrl} onChange={(event) => update("redirectUrl", event.target.value)} placeholder="https://example.com/app-update" /></div>
        <div className="app-form-note"><ShieldCheck size={16} /> Server Key and REST API Key are issued by the production sync service. This demo does not generate or store real credentials in the browser.</div>
        {error && <p className="form-error app-form-error" role="alert">{error}</p>}
        <div className="form-actions"><Link className="button-secondary" to="/apps">Cancel</Link><button className="button-primary" type="submit">SUBMIT</button></div>
      </form>
    </>
  );
}
