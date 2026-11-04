import { useState } from "react";
import PageHeader from "../components/PageHeader";

const licenseDetails = [
  ["Item ID", "10771397"],
  ["Item Name", "Yoda Pro App"],
  ["Buyer", "Solodroid"],
  ["Purchase Code", "-"],
  ["License Type", "Regular License"],
  ["Purchase Date", "2023-08-24T15:48:48+10:00"],
];

export default function License() {
  const [confirming, setConfirming] = useState(false);
  const [revokeMessage, setRevokeMessage] = useState("");

  function revokeLicense() {
    setConfirming(false);
    setRevokeMessage("Revocation request recorded for this session. Connect a license service to revoke the license.");
  }

  return (
    <>
      <PageHeader title="License" />
      <section className="panel license-panel">
        <div className="panel-heading">
          <div>
            <h2>LICENSE</h2>
            <p>Product purchase and license details.</p>
          </div>
        </div>
        <dl className="license-details">
          {licenseDetails.map(([label, value]) => (
            <div className="license-detail-row" key={label}>
              <dt>{label}</dt>
              <span className="license-colon" aria-hidden="true">:</span>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {revokeMessage && <p className="license-revoke-message" role="status">{revokeMessage}</p>}
        <div className="license-actions">
          <button className="button-primary license-revoke-button" type="button" onClick={() => setConfirming(true)}>
            REVOKE LICENSE
          </button>
        </div>
      </section>
      {confirming && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setConfirming(false);
        }}>
          <section className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="license-confirm-title" aria-describedby="license-confirm-message">
            <h2 id="license-confirm-title">Revoke this license?</h2>
            <p id="license-confirm-message">This will record a local revocation request. It will not revoke a license with a licensing provider.</p>
            <div className="confirm-actions">
              <button className="button-secondary" type="button" onClick={() => setConfirming(false)}>Cancel</button>
              <button className="button-danger" type="button" onClick={revokeLicense}>Confirm revoke</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
