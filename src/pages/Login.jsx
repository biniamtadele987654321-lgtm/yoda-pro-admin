import { AlertCircle, ArrowRight, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (loginError) {
      if (loginError.message === "Invalid username or password") {
        setPassword("");
        setError("Invalid username or password");
      } else {
        setError(loginError.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-orbit orbit-one" /><div className="login-orbit orbit-two" />
      <section className="login-card">
        <div className="login-brand"><div className="login-mark"><span>Y</span></div><strong>YODA <span>PRO</span></strong><small>NEWS ADMINISTRATION</small></div>
        <div className="login-intro"><h1>Welcome back</h1><p>Sign in to manage your news platform.</p></div>
        <form onSubmit={handleSubmit}>
          <label className="login-label" htmlFor="username">Username</label>
          <div className="login-input"><UserRound size={18} /><input id="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="off" placeholder="Enter your username" /></div>
          <label className="login-label" htmlFor="password">Password</label>
          <div className="login-input"><LockKeyhole size={18} /><input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" placeholder="Enter your password" /></div>
          {(error || authError) && <div className="login-error-banner" role="alert"><AlertCircle size={17} /><span>{error || authError}</span></div>}
          <button className="login-submit" type="submit" disabled={submitting}>{submitting ? "SIGNING IN..." : "LOGIN"} {!submitting && <ArrowRight size={17} />}</button>
        </form>
        <p className="login-secure"><ShieldCheck size={15} /> Secure administrator access</p>
        <div className="login-footer"><Mail size={13} /> Need help? Contact your system administrator</div>
      </section>
    </main>
  );
}
