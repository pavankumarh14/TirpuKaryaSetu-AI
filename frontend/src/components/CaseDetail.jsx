// frontend/src/components/CaseDetail.jsx

import { useState } from "react";
import { triggerExtraction } from "../services/api";
import ActionCard from "./ActionCard";
import ProofUpload from "./ProofUpload";

export default function CaseDetail({ caseItem, onRefresh }) {
  const [busy, setBusy] = useState(false);

  const handleExtract = async () => {
    if (!caseItem?.id) return;
    setBusy(true);
    try {
      await triggerExtraction(caseItem.id);
      onRefresh?.();
    } catch (error) {
      console.error("Extraction failed", error);
    } finally {
      setBusy(false);
    }
  };

  if (!caseItem) {
    return (
      <div style={styles.panel}>
        <h2 style={styles.heading}>Case Detail</h2>
        <p style={styles.empty}>Select a case from the left to view details.</p>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.heading}>Case Detail</h2>
          <p style={styles.subtext}>Officer-facing judgment workflow detail</p>
        </div>
        <button style={styles.extractBtn} onClick={handleExtract} disabled={busy}>
          {busy ? "Extracting..." : "Run AI Extraction"}
        </button>
      </div>

      <div style={styles.metaGrid}>
        <Info label="Case Number" value={caseItem.case_number} />
        <Info label="Court Name" value={caseItem.court_name} />
        <Info label="Court Type" value={caseItem.court_type} />
        <Info label="Judgment Type" value={caseItem.judgment_type} />
        <Info label="Petitioner" value={caseItem.petitioner} />
        <Info label="Department" value={caseItem.respondent_department} />
        <Info label="Language" value={caseItem.language} />
        <Info label="Status" value={caseItem.status} />
      </div>

      <section style={styles.section}>
        <h3>Extracted Actions</h3>
        {!caseItem.actions?.length ? (
          <p style={styles.empty}>No extracted actions yet. Run AI extraction first.</p>
        ) : (
          <div style={styles.actions}>
            {caseItem.actions.map((action) => (
              <ActionCard key={action.id} action={action} onRefresh={onRefresh} />
            ))}
          </div>
        )}
      </section>

      <section style={styles.section}>
        <h3>Proof Upload</h3>
        <ProofUpload caseId={caseItem.id} onUploaded={onRefresh} />
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={styles.infoCard}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value || "—"}</div>
    </div>
  );
}

const styles = {
  panel: {
    background: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },
  heading: { margin: 0 },
  subtext: { margin: "6px 0 0", color: "#64748b" },
  extractBtn: {
    border: "none",
    background: "#16a34a",
    color: "white",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
  },
  infoCard: {
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "12px",
    background: "#f8fafc",
  },
  infoLabel: { fontSize: "12px", color: "#64748b", marginBottom: "4px" },
  infoValue: { fontWeight: 600 },
  section: { marginTop: "24px" },
  actions: { display: "flex", flexDirection: "column", gap: "14px" },
  empty: { color: "#64748b" },
};
