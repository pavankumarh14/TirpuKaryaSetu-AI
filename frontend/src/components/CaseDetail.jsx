// frontend/src/components/CaseDetail.jsx
import { useState } from "react";
import { triggerExtraction, getCase } from "../services/api";
import ActionCard from "./ActionCard";
import ProofUpload from "./ProofUpload";

export default function CaseDetail({ caseItem, onSelectCase, onRefresh }) {
  const [busy, setBusy] = useState(false);
  const [extractError, setExtractError] = useState(null);

  const handleExtract = async () => {
    if (!caseItem?.id) return;
    setBusy(true);
    setExtractError(null);
    try {
      await triggerExtraction(caseItem.id);
      // Re-fetch the updated case (with actions) and update selected case
      const updated = await getCase(caseItem.id);
      onSelectCase?.(updated);
      onRefresh?.();
    } catch (error) {
      console.error("Extraction failed", error);
      setExtractError(error?.message || "Extraction failed. Please check backend logs and retry.");
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

  const hasActions = caseItem.actions?.length > 0;
  const hasCompleted = caseItem.actions?.some((a) => a.status === "completed");

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.heading}>Case Detail</h2>
          <p style={styles.subtext}>Officer-facing judgment workflow detail</p>
        </div>
        <button
          style={{
            ...styles.extractBtn,
            opacity: busy ? 0.7 : 1,
            cursor: busy ? "not-allowed" : "pointer",
          }}
          onClick={handleExtract}
          disabled={busy}
        >
          {busy ? "Extracting..." : "Run AI Extraction"}
        </button>
      </div>

      {extractError && (
        <div style={styles.errorBanner}>
          <strong>Extraction Error:</strong> {extractError}
          <button style={styles.retryBtn} onClick={handleExtract} disabled={busy}>
            Retry
          </button>
        </div>
      )}

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
        {!hasActions ? (
          <p style={styles.empty}>No extracted actions yet. Run AI extraction first.</p>
        ) : (
          <div style={styles.actions}>
            {caseItem.actions.map((action) => (
              <ActionCard key={action.id} action={action} onRefresh={async () => {
                const updated = await getCase(caseItem.id);
                onSelectCase?.(updated);
                onRefresh?.();
              }} />
            ))}
          </div>
        )}
      </section>

      {hasCompleted && (
        <section style={styles.section}>
          <h3>Proof Upload</h3>
          <ProofUpload caseId={caseItem.id} onUploaded={onRefresh} />
        </section>
      )}

      {hasActions && !hasCompleted && (
        <section style={styles.section}>
          <p style={styles.empty}>
            Proof upload will be available once at least one action is marked completed.
          </p>
        </section>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={styles.infoCard}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value || "Pending extraction"}</div>
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
  },
  errorBanner: {
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: "8px",
    padding: "12px 16px",
    color: "#b91c1c",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  retryBtn: {
    border: "1px solid #b91c1c",
    background: "white",
    color: "#b91c1c",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
    whiteSpace: "nowrap",
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
