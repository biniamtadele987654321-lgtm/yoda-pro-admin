import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { useData } from "../../context/DataContext";

export default function AddAdmin() {
  const { id } = useParams();
  const { admins, saveAdmin } = useData();
  const existing = admins.find((admin) => admin.id === id);
  const [form, setForm] = useState(() => ({ username: existing?.username || "", fullName: existing?.fullName || "", email: existing?.email || "", password: "", rePassword: "" }));
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (id && !existing) navigate("/administrators", { replace: true });
  }, [existing, id, navigate]);

  function update(key, value) { setForm((current) => ({ ...current, [key]: value })); }
  function submit(event) {
    event.preventDefault();
    if (!form.username.trim() || !form.fullName.trim() || !form.email.trim()) { setError("Username, full name, and email are required."); return; }
    if (!/^[a-zA-Z0-9._-]{3,32}$/.test(form.username.trim())) { setError("Username must be 3–32 characters using letters, numbers, dots, underscores, or hyphens."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { setError("Enter a valid email address."); return; }
    const duplicate = admins.some((admin) => admin.id !== id && admin.username.toLowerCase() === form.username.trim().toLowerCase());
    if (duplicate) { setError("That username is already in use."); return; }
    if (!id && form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if ((form.password || form.rePassword) && form.password !== form.rePassword) { setError("Passwords do not match."); return; }
    if (id && !form.password && !form.rePassword) {
      saveAdmin({ id, username: form.username.trim(), fullName: form.fullName.trim(), email: form.email.trim() });
      navigate("/administrators");
      return;
    }
    saveAdmin({ id, username: form.username.trim(), fullName: form.fullName.trim(), email: form.email.trim() });
    navigate("/administrators");
  }

  return (
    <>
      <PageHeader title={id ? "Edit Administrator" : "Add New Admin"} action={<Link className="button-secondary" to="/administrators"><ArrowLeft size={16} /> BACK TO LIST</Link>} />
      <form className="panel form-panel admin-form" onSubmit={submit}>
        <div className="panel-heading"><div><h2>Administrator profile</h2><p>Administrator passwords must be securely managed by your authentication backend.</p></div></div>
        <div className="form-field"><label htmlFor="admin-username">Username <span className="required">*</span></label><input id="admin-username" className="text-input" value={form.username} onChange={(event) => update("username", event.target.value)} placeholder="e.g. editor_jane" autoComplete="username" required /></div>
        <div className="form-field"><label htmlFor="admin-fullname">Full Name <span className="required">*</span></label><input id="admin-fullname" className="text-input" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="Enter the administrator's name" required /></div>
        <div className="form-field"><label htmlFor="admin-email">Email <span className="required">*</span></label><input id="admin-email" className="text-input" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="name@example.com" autoComplete="email" required /></div>
        <div className="form-grid-two admin-password-grid">
          <div className="form-field"><label htmlFor="admin-password">Password {!id && <span className="required">*</span>}</label><div className="password-input"><input id="admin-password" className="text-input" type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => update("password", event.target.value)} autoComplete={id ? "new-password" : "new-password"} placeholder={id ? "Leave blank to keep current" : "At least 8 characters"} required={!id} minLength={8} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>
          <div className="form-field"><label htmlFor="admin-repassword">Re Password {!id && <span className="required">*</span>}</label><input id="admin-repassword" className="text-input" type={showPassword ? "text" : "password"} value={form.rePassword} onChange={(event) => update("rePassword", event.target.value)} autoComplete="new-password" placeholder="Re-enter password" required={!id || Boolean(form.password)} /></div>
        </div>
        <div className="admin-security-note"><ShieldCheck size={16} /> Passwords are never stored in browser storage. Connect an authentication API to create or change credentials securely.</div>
        {error && <p className="form-error admin-error" role="alert">{error}</p>}
        <div className="form-actions"><Link className="button-secondary" to="/administrators">Cancel</Link><button className="button-primary" type="submit">SUBMIT</button></div>
      </form>
    </>
  );
}
