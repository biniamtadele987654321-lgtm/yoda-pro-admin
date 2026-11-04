import { Check, KeyRound, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import RichTextEditor from "../../components/RichTextEditor";
import { useData } from "../../context/DataContext";

function createApiKey() {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("Secure random key generation is not available in this browser.");
  }
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
  return `yoda_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

function SettingSection({ title, description, children }) {
  return (
    <section className="panel settings-section">
      <div className="panel-heading"><div><h2>{title}</h2><p>{description}</p></div></div>
      <div className="settings-section-content">{children}</div>
    </section>
  );
}

function SelectField({ id, label, value, onChange, options }) {
  return (
    <div className="form-field settings-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} className="text-input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}

export default function GlobalSettings() {
  const { settings, settingsSyncError, updateSettings, isLoading } = useData();
  const [form, setForm] = useState(settings);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingKey, setChangingKey] = useState(false);

  useEffect(() => setForm(settings), [settings]);
  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(""), 3500);
    return () => window.clearTimeout(timer);
  }, [message]);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage("");
    setError("");
  }

  async function changeApiKey() {
    setError("");
    setMessage("");
    setChangingKey(true);
    try {
      const apiUrl = import.meta.env.VITE_ADMIN_API_URL;
      if (apiUrl) {
        const response = await fetch(`${apiUrl.replace(/\/$/, "")}/settings/api-key`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error(`API key generation failed (HTTP ${response.status}).`);
        const result = await response.json();
        if (typeof result.apiKey !== "string" || !result.apiKey) throw new Error("The admin API returned no API key.");
        update("restApiKey", result.apiKey);
      } else {
        update("restApiKey", createApiKey());
      }
    } catch (keyError) {
      setError(keyError.message);
    } finally {
      setChangingKey(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await updateSettings(form);
      setMessage("Settings saved to Firebase.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Settings" action={<button className="button-primary" type="submit" form="global-settings-form" disabled={saving || isLoading}><Save size={16} /> {saving || isLoading ? "SAVING..." : "UPDATE"}</button>} />
      <form id="global-settings-form" className="settings-form" onSubmit={submit}>
        {settingsSyncError && <p className="settings-sync-warning" role="alert">{settingsSyncError}</p>}
        <SettingSection title="Keys & IDs" description="Manage API access for your connected mobile application.">
          <div className="settings-field form-field">
            <label htmlFor="rest-api-key">Rest API Key</label>
            <div className="key-input-row"><div className="key-input-wrap"><KeyRound size={16} /><input id="rest-api-key" type="password" autoComplete="new-password" className="text-input" value={form.restApiKey || ""} onChange={(event) => update("restApiKey", event.target.value)} placeholder="Generate a secure API token" /></div><button className="button-secondary" type="button" disabled={changingKey} onClick={changeApiKey}><RefreshCw size={15} /> {changingKey ? "GENERATING..." : "CHANGE API KEY"}</button></div>
            <small className="settings-helper"><ShieldCheck size={14} /> Keep API keys private. In demo mode keys stay in memory and are not written to browser storage.</small>
          </div>
        </SettingSection>

        <SettingSection title="App Configuration" description="Choose the features and links available in your mobile app.">
          <div className="settings-grid">
            <SelectField id="login-register" label="Login & Register In App" value={form.loginRegister || "YES"} onChange={(value) => update("loginRegister", value)} options={["YES", "NO"]} />
            <SelectField id="comment-approval" label="Comment Approval" value={form.commentApproval || "NO"} onChange={(value) => update("commentApproval", value)} options={["YES", "NO"]} />
            <SelectField id="video-menu" label="Show Video Menu" value={form.showVideoMenu || "YES"} onChange={(value) => update("showVideoMenu", value)} options={["YES", "NO"]} />
            <div className="form-field settings-field"><label htmlFor="more-apps-url">More Apps Url</label><input id="more-apps-url" type="url" className="text-input" value={form.moreAppsUrl || ""} onChange={(event) => update("moreAppsUrl", event.target.value)} placeholder="https://example.com/apps" /></div>
          </div>
        </SettingSection>

        <SettingSection title="Push Notification Configuration" description="Select the push provider used to deliver app notifications.">
          <div className="settings-grid">
            <SelectField id="push-provider" label="Push Notification Provider" value={form.pushProvider} onChange={(value) => update("pushProvider", value)} options={["OneSignal", "Firebase FCM"]} />
            {form.pushProvider === "Firebase FCM" ? (
              <div className="form-field settings-field"><label htmlFor="fcm-topic">FCM Notification Topic</label><input id="fcm-topic" className="text-input" value={form.fcmTopic || ""} onChange={(event) => update("fcmTopic", event.target.value)} placeholder="e.g. all" /></div>
            ) : (
              <>
                <div className="form-field settings-field"><label htmlFor="onesignal-app-id">OneSignal App ID</label><input id="onesignal-app-id" className="text-input" value={form.oneSignalAppId || ""} onChange={(event) => update("oneSignalAppId", event.target.value)} placeholder="OneSignal application ID" /></div>
                <div className="form-field settings-field"><label htmlFor="onesignal-rest-key">OneSignal Rest API Key</label><input id="onesignal-rest-key" type="password" autoComplete="new-password" className="text-input" value={form.oneSignalRestApiKey || ""} onChange={(event) => update("oneSignalRestApiKey", event.target.value)} placeholder="Secret key managed by your backend" /></div>
              </>
            )}
          </div>
          <p className="settings-security-note"><ShieldCheck size={15} /> Provider secrets are session-only in demo mode. Store them in your authenticated backend, never in mobile or browser code.</p>
        </SettingSection>

        <SettingSection title="Privacy Policy" description="Provide the privacy policy displayed in your app.">
          <RichTextEditor label="Privacy policy" placeholder="Write your privacy policy..." value={form.privacyPolicy || ""} onChange={(value) => update("privacyPolicy", value)} />
        </SettingSection>

        <SettingSection title="Publisher Info" description="Add publisher contact details shown to your readers.">
          <RichTextEditor label="Publisher information" placeholder="Add publisher contact, phone, email, and address..." value={form.publisherInfo || ""} onChange={(value) => update("publisherInfo", value)} />
        </SettingSection>

        <SettingSection title="Account Deletion Message" description="Explain the steps users need to follow to request account deletion.">
          <RichTextEditor label="Account deletion guidelines" placeholder="Describe the account deletion steps and support contact..." value={form.accountDeletionMessage || ""} onChange={(value) => update("accountDeletionMessage", value)} />
        </SettingSection>

        <div className="settings-submit-row">
          {message && <span className="settings-success settings-success-toast" role="status"><Check size={16} /> {message}</span>}
          {error && <span className="settings-error" role="alert">{error}</span>}
          <button type="submit" className="button-primary" disabled={saving || isLoading}><Save size={16} /> {saving || isLoading ? "SAVING..." : "UPDATE"}</button>
        </div>
      </form>
    </>
  );
}
