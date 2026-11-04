import { useState } from "react";
import { Check, ChevronRight, Eye, EyeOff, Home, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function EditAdmin() {
  const { user, updateAdminProfile } = useAuth();
  const [form, setForm] = useState({
    username: user?.username || "admin",
    fullName: user?.fullName || "Administrator",
    email: user?.email || "admin@yodapro.com",
    password: "",
    rePassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
    setSuccess("");
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.username.trim() || !form.fullName.trim() || !form.email.trim()) {
      setError("Username, full name, and email are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if ((form.password || form.rePassword) && form.password !== form.rePassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password && form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await updateAdminProfile({
        username: form.username,
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });
      setForm((current) => ({ ...current, password: "", rePassword: "" }));
      setSuccess("Administrator profile updated successfully.");
    } catch (saveError) {
      setError(saveError.message || "Profile update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-heading-row">
        <div>
          <h1>Edit Admin</h1>
          <nav className="breadcrumbs" aria-label="Breadcrumb"><Link to="/dashboard"><Home size={13} /> Dashboard</Link><ChevronRight size={13} /><Link to="/administrators">Manage Admin</Link><ChevronRight size={13} /><span>Edit Admin</span></nav>
        </div>
      </div>
      <form className="panel form-panel edit-admin-form" onSubmit={submit}>
        <div className="panel-heading"><div><h2>EDIT ADMIN</h2><p>Update administrator profile and sign-in credentials.</p></div></div>
        <div className="form-field"><label htmlFor="edit-admin-username">Username</label><input id="edit-admin-username" className="text-input" value={form.username} onChange={(event) => update("username", event.target.value)} autoComplete="username" required /></div>
        <div className="form-field"><label htmlFor="edit-admin-full-name">Full Name</label><input id="edit-admin-full-name" className="text-input" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} required /></div>
        <div className="form-field"><label htmlFor="edit-admin-email">Email</label><input id="edit-admin-email" type="email" className="text-input" value={form.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" required /></div>
        <div className="form-grid-two admin-password-grid">
          <div className="form-field"><label htmlFor="edit-admin-password">Password <span className="field-hint">(Leave blank to keep current)</span></label><div className="password-input"><input id="edit-admin-password" type={showPassword ? "text" : "password"} className="text-input" value={form.password} onChange={(event) => update("password", event.target.value)} autoComplete="new-password" minLength={8} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>
          <div className="form-field"><label htmlFor="edit-admin-re-password">Re Password</label><input id="edit-admin-re-password" type={showPassword ? "text" : "password"} className="text-input" value={form.rePassword} onChange={(event) => update("rePassword", event.target.value)} autoComplete="new-password" /></div>
        </div>
        <div className="admin-security-note"><ShieldCheck size={16} /> Passwords are hashed in demo mode and sent only to the configured authenticated backend in production.</div>
        {error && <p className="form-error admin-error" role="alert">{error}</p>}
        <div className="form-actions edit-admin-actions">
          {success && <span className="edit-admin-success" role="status"><Check size={15} /> {success}</span>}
          <button className="button-primary" type="submit" disabled={saving}>{saving ? "UPDATING..." : "UPDATE"}</button>
        </div>
      </form>
    </>
  );
}
