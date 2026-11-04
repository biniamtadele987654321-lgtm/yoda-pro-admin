import { Check, Copy, ExternalLink, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useData } from "../../context/DataContext";

const defaultAdMobSettings = {
  adsEnabled: false,
  bannerAdUnitId: "",
  interstitialAdUnitId: "",
  interstitialFrequency: 3,
};
const testAdMobIds = {
  bannerAdUnitId: "ca-app-pub-3940256099942544/6300978111",
  interstitialAdUnitId: "ca-app-pub-3940256099942544/1033173712",
};

const networks = [
  "AdMob",
  "Google Ad Manager",
  "Start.io",
  "Unity Ads",
  "AppLovin Discovery",
  "AppLovin Max",
  "IronSource",
  "Meta Audience Network",
];
const placements = [
  "Banner Ad on Home Page",
  "Banner Ad on Post Details",
  "Banner Ad on Category Details",
  "Banner Ad on Search Page",
  "Banner Ad on Comment Page",
  "Interstitial Ad on Post List",
  "Interstitial Ad on Post Details",
  "Native Ad on Post List",
  "Native Ad on Post Details",
  "Native Ad on Exit Dialog",
  "App Open Ad on Start",
  "App Open Ad on Resume",
];
const styleFields = [
  ["nativeAdStylePostList", "Native Ad Style Post List"],
  ["nativeAdStyleVideoList", "Native Ad Style Video List"],
  ["nativeAdStylePostDetails", "Native Ad Style Post Details"],
  ["nativeAdStyleExitDialog", "Native Ad Style Exit Dialog"],
];
const adUnitFields = [
  ["bannerId", "Banner Ad Unit ID"],
  ["interstitialId", "Interstitial Ad Unit ID"],
  ["nativeId", "Native Ad Unit ID"],
  ["appOpenId", "App Open Ad Unit ID"],
];
const defaults = {
  adStatus: "OFF",
  primaryNetwork: "AdMob",
  primaryNetworkIds: {},
  backupNetwork: "None",
  backupNetworkIds: {},
  interstitialAdInterval: "3",
  nativeAdIndex: "4",
  nativeAdStylePostList: "Medium",
  nativeAdStyleVideoList: "Medium",
  nativeAdStylePostDetails: "Medium",
  nativeAdStyleExitDialog: "Medium",
  placements: {},
};
const information = [
  <>Meta Audience Network bidding has been deprecated in supported third-party mediation setups. Check Meta's current product documentation before enabling it.</>,
  <>Mediation availability depends on the ad network and the mediation partners supported by your app's SDK version.</>,
  <>Banner, interstitial, native, and app open formats are not supported by every network or mediation partner.</>,
  <>Use the placement or ad unit identifiers created in the corresponding ad network dashboard.</>,
  <>For AdMob setup, see <a href="https://developers.google.com/admob/android/quick-start" target="_blank" rel="noreferrer">Google Mobile Ads Android quick start</a>.</>,
  <>For Meta Audience Network setup and placement formats, see <a href="https://developers.facebook.com/docs/audience-network/" target="_blank" rel="noreferrer">Meta Audience Network documentation</a>.</>,
  <>Always verify format compatibility and current mediation requirements in your provider's official documentation before publishing changes.</>,
];

function getInitialSettings(storedSettings) {
  const stored = storedSettings || {};
  return {
    ...defaults,
    ...stored,
    adStatus: stored.adStatus || (stored.enabled ? "ON" : "OFF"),
    primaryNetwork: stored.primaryNetwork || stored.network || defaults.primaryNetwork,
    backupNetwork: stored.backupNetwork || (stored.backupEnabled ? "AdMob" : "None"),
    primaryNetworkIds: {
      appId: stored.appId || "",
      bannerId: stored.bannerId || "",
      interstitialId: stored.interstitialId || "",
      nativeId: stored.nativeId || "",
      appOpenId: stored.appOpenId || "",
      ...(stored.primaryNetworkIds || {}),
    },
    backupNetworkIds: { ...(stored.backupNetworkIds || {}) },
    interstitialAdInterval: stored.interstitialAdInterval ?? stored.interval ?? defaults.interstitialAdInterval,
    nativeAdIndex: stored.nativeAdIndex ?? defaults.nativeAdIndex,
    nativeAdStylePostList: stored.nativeAdStylePostList || stored.nativeStyle || defaults.nativeAdStylePostList,
  };
}

function NetworkFields({ network, values, onChange, prefix }) {
  if (!network || network === "None") return null;

  const fields = network === "AdMob"
    ? [["appId", "AdMob App ID"], ...adUnitFields]
    : [
      ["appId", `${network} App ID`],
      ["bannerId", "Banner Ad Unit ID"],
      ["interstitialId", "Interstitial Ad Unit ID"],
      ["nativeId", "Native Ad Unit ID"],
      ["appOpenId", "App Open Ad Unit ID"],
    ];

  return (
    <div className="ads-fields-grid">
      {fields.map(([key, label]) => (
        <div className="ads-field" key={key}>
          <label htmlFor={`${prefix}-${key}`}>
            {label}
            {network === "AdMob" && key === "appId" && (
              <a
                href="https://developers.google.com/admob/android/quick-start#update_your_androidmanifestxml"
                target="_blank"
                rel="noreferrer"
                aria-label="AdMob App ID AndroidManifest.xml note"
                title="Add this App ID to AndroidManifest.xml"
              >
                <ExternalLink size={13} />
              </a>
            )}
          </label>
          <input
            id={`${prefix}-${key}`}
            className="text-input"
            value={values[key] || ""}
            onChange={(event) => onChange(key, event.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

function AdMobSettingsPanel() {
  const {
    adMobSettings: storedAdMobSettings,
    adMobSettingsSyncError,
    updateAdMobSettings,
  } = useData();
  const [form, setForm] = useState(() => ({ ...defaultAdMobSettings, ...storedAdMobSettings }));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({ ...defaultAdMobSettings, ...storedAdMobSettings });
  }, [storedAdMobSettings]);

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

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    const bannerAdUnitId = form.bannerAdUnitId.trim();
    const interstitialAdUnitId = form.interstitialAdUnitId.trim();
    if (!bannerAdUnitId.startsWith("ca-app-pub-") || !interstitialAdUnitId.startsWith("ca-app-pub-")) {
      setError("Both Ad Unit IDs must start with ca-app-pub-.");
      return;
    }

    const interstitialFrequency = Number(form.interstitialFrequency);
    if (!Number.isInteger(interstitialFrequency) || interstitialFrequency < 1) {
      setError("Ad frequency must be a whole number greater than zero.");
      return;
    }

    setSaving(true);
    try {
      await updateAdMobSettings({
        adsEnabled: Boolean(form.adsEnabled),
        bannerAdUnitId,
        interstitialAdUnitId,
        interstitialFrequency,
      });
      setMessage("AdMob settings synced to Firestore.");
    } catch (saveError) {
      setError(saveError.message || "AdMob settings could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  const publisherIds = [...new Set(
    [form.bannerAdUnitId, form.interstitialAdUnitId]
      .map((adUnitId) => adUnitId.trim().match(/^ca-app-pub-(\d+)\//)?.[1])
      .filter(Boolean),
  )];
  const publisherId = publisherIds.length === 1 ? publisherIds[0] : "";
  const appAdsEntry = `google.com, ${publisherId ? `pub-${publisherId}` : "pub-<YOUR_PUBLISHER_ID>"}, DIRECT, f08c47fec0942fa0`;

  async function copyAppAdsEntry() {
    setError("");
    try {
      await navigator.clipboard.writeText(appAdsEntry);
      setMessage("app-ads.txt entry copied.");
    } catch {
      setError("Could not copy the app-ads.txt entry. Check clipboard permissions and copy it manually.");
    }
  }

  return (
    <section className="panel settings-section">
      <div className="panel-heading">
        <div><h2>AdMob Settings</h2><p>Manage remote ad settings synced to Firestore.</p></div>
      </div>
      <form className="settings-section-content" onSubmit={submit}>
        {adMobSettingsSyncError && <p className="settings-sync-warning" role="alert">{adMobSettingsSyncError}</p>}
        <div className="settings-field form-field">
          <label htmlFor="admob-ads-enabled">Global Ads Toggle</label>
          <label className="ads-admob-toggle">
            <input
              id="admob-ads-enabled"
              type="checkbox"
              checked={Boolean(form.adsEnabled)}
              onChange={(event) => update("adsEnabled", event.target.checked)}
            />
            <span>{form.adsEnabled ? "Ads enabled" : "Ads disabled"}</span>
          </label>
        </div>
        <div className="settings-grid">
          <div className="form-field settings-field">
            <label htmlFor="admob-banner-id">Banner Ad Unit ID</label>
            <input id="admob-banner-id" className="text-input" value={form.bannerAdUnitId} onChange={(event) => update("bannerAdUnitId", event.target.value)} placeholder="ca-app-pub-.../..." />
          </div>
          <div className="form-field settings-field">
            <label htmlFor="admob-interstitial-id">Interstitial Ad Unit ID</label>
            <input id="admob-interstitial-id" className="text-input" value={form.interstitialAdUnitId} onChange={(event) => update("interstitialAdUnitId", event.target.value)} placeholder="ca-app-pub-.../..." />
          </div>
          <div className="form-field settings-field">
            <label htmlFor="admob-frequency">Show interstitial every X articles clicked</label>
            <input id="admob-frequency" className="text-input" type="number" min="1" step="1" value={form.interstitialFrequency} onChange={(event) => update("interstitialFrequency", event.target.value)} />
          </div>
        </div>
        <button className="button-secondary" type="button" onClick={() => {
          setForm((current) => ({ ...current, ...testAdMobIds }));
          setMessage("");
          setError("");
        }}>Load Test IDs</button>
        <section className="ads-app-ads-section">
          <h3>app-ads.txt entry</h3>
          <p>Publish this line in the app-ads.txt file on your app developer website.</p>
          <code>{appAdsEntry}</code>
          {!publisherId && <small>Publisher ID is derived from a valid AdMob ad unit ID; replace the placeholder before publishing.</small>}
          {publisherIds.length > 1 && <small role="alert">The entered ad unit IDs use different publisher IDs.</small>}
          <button className="button-secondary" type="button" onClick={copyAppAdsEntry}><Copy size={15} /> Copy entry</button>
        </section>
        {error && <p className="settings-error" role="alert">{error}</p>}
        {message && <p className="settings-success settings-success-toast" role="status"><Check size={16} /> {message}</p>}
        <button className="button-primary" type="submit" disabled={saving}>{saving ? "SAVING..." : "SAVE ADMOB SETTINGS"}</button>
      </form>
    </section>
  );
}

export default function ManageAds() {
  const { settings: storedSettings, updateSettings, isLoading } = useData();
  const [settings, setSettings] = useState(() => getInitialSettings(storedSettings));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSettings(getInitialSettings(storedSettings));
  }, [storedSettings]);

  function update(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setError("");
  }

  function updateNetworkId(field, value, key) {
    setSettings((current) => ({
      ...current,
      [key]: { ...current[key], [field]: value },
    }));
    setSaved(false);
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    const data = {
      ...settings,
      enabled: settings.adStatus === "ON",
      network: settings.primaryNetwork,
      backupEnabled: settings.backupNetwork !== "None",
      interval: settings.interstitialAdInterval,
      nativeStyle: settings.nativeAdStylePostList,
      ...settings.primaryNetworkIds,
    };

    try {
      await updateSettings(data);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (saveError) {
      setError(saveError.message || "Ad settings could not be saved.");
    }
  }

  return (
    <div className="ads-page">
      <form className="ads-layout" onSubmit={submit}>
        <section className="ads-main-card">
          <header className="ads-card-header">
            <h1>MANAGE ADS</h1>
            <button className="ads-update-button" type="submit" disabled={isLoading}>
              {isLoading ? "UPDATING..." : "UPDATE"}
            </button>
          </header>

          <div className="ads-card-content">
            <section className="ads-section">
              <label className="ads-field-label" htmlFor="ad-status">Ad Status</label>
              <select id="ad-status" className="text-input" value={settings.adStatus} onChange={(event) => update("adStatus", event.target.value)}>
                <option value="ON">ON</option>
                <option value="OFF">OFF</option>
              </select>
            </section>

            <section className="ads-section">
              <h2>PRIMARY ADS</h2>
              <div className="ads-field">
                <label htmlFor="primary-network">Primary Ad Network</label>
                <select id="primary-network" className="text-input" value={settings.primaryNetwork} onChange={(event) => update("primaryNetwork", event.target.value)}>
                  {networks.map((network) => <option key={network}>{network}</option>)}
                </select>
              </div>
              <NetworkFields
                network={settings.primaryNetwork}
                values={settings.primaryNetworkIds}
                prefix="primary"
                onChange={(field, value) => updateNetworkId(field, value, "primaryNetworkIds")}
              />
            </section>

            <section className="ads-section">
              <h2>BACKUP ADS</h2>
              <div className="ads-field">
                <label htmlFor="backup-network">Backup Ads Network</label>
                <select id="backup-network" className="text-input" value={settings.backupNetwork} onChange={(event) => update("backupNetwork", event.target.value)}>
                  <option>None</option>
                  {networks.map((network) => <option key={network}>{network}</option>)}
                </select>
              </div>
              <p className="ads-helper">The backup ads you want to show if your main ad fails to show due to limits, banned, etc.</p>
              {settings.backupNetwork === "Meta Audience Network" ? (
                <div className="ads-fields-grid">
                  {[
                    ["bannerPlacementId", "Audience Network Banner Placement ID"],
                    ["interstitialPlacementId", "Audience Network Interstitial Placement ID"],
                    ["nativePlacementName", "Audience Network Native Placement Name"],
                  ].map(([key, label]) => (
                    <div className="ads-field" key={key}>
                      <label htmlFor={`backup-${key}`}>{label}</label>
                      <input id={`backup-${key}`} className="text-input" value={settings.backupNetworkIds[key] || ""} onChange={(event) => updateNetworkId(key, event.target.value, "backupNetworkIds")} />
                    </div>
                  ))}
                </div>
              ) : (
                <NetworkFields
                  network={settings.backupNetwork}
                  values={settings.backupNetworkIds}
                  prefix="backup"
                  onChange={(field, value) => updateNetworkId(field, value, "backupNetworkIds")}
                />
              )}
            </section>

            <section className="ads-section">
              <h2>GLOBAL CONFIGURATION</h2>
              <div className="ads-fields-grid">
                <div className="ads-field">
                  <label htmlFor="interstitial-interval">Interstitial Ad Interval</label>
                  <input id="interstitial-interval" className="text-input" type="number" min="1" value={settings.interstitialAdInterval} onChange={(event) => update("interstitialAdInterval", event.target.value)} />
                </div>
                <div className="ads-field">
                  <label htmlFor="native-ad-index">Native Ad Index</label>
                  <input id="native-ad-index" className="text-input" type="number" min="1" value={settings.nativeAdIndex} onChange={(event) => update("nativeAdIndex", event.target.value)} />
                </div>
                {styleFields.map(([key, label]) => (
                  <div className="ads-field" key={key}>
                    <label htmlFor={key}>{label}</label>
                    <select id={key} className="text-input" value={settings[key]} onChange={(event) => update(key, event.target.value)}>
                      <option>Medium</option>
                      <option>Large</option>
                    </select>
                  </div>
                ))}
              </div>
            </section>

            <section className="ads-information">
              <h2><Info size={15} /> INFORMATION</h2>
              <ol>{information.map((item, index) => <li key={index}>{item}</li>)}</ol>
            </section>
          </div>
          {error && <p className="form-error ads-error" role="alert">{error}</p>}
          {saved && <p className="ads-save-confirmation" role="status"><Check size={15} /> Settings updated successfully.</p>}
        </section>

        <aside className="ads-placement-card">
          <header>
            <h2>ADS PLACEMENT</h2>
            <p>Enable or Disable Certain Ads Format Separately</p>
          </header>
          <div className="ads-placement-list">
            {placements.map((placement) => (
              <label className="ads-placement-item" key={placement}>
                <span>{placement}</span>
                <input
                  type="checkbox"
                  checked={Boolean(settings.placements?.[placement])}
                  onChange={(event) => update("placements", { ...settings.placements, [placement]: event.target.checked })}
                />
                <i aria-hidden="true" />
              </label>
            ))}
          </div>
        </aside>
      </form>
      <AdMobSettingsPanel />
    </div>
  );
}
