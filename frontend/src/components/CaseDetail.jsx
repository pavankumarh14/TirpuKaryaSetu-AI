// frontend/src/components/CaseDetail.jsx
import { useState, useEffect } from "react";
import { triggerExtraction, getCase, getCaseAuditLog } from "../services/api";
import ActionCard from "./ActionCard";
import ProofUpload from "./ProofUpload";

export default function CaseDetail({ caseItem, onSelectCase, onRefresh }) {
  const [busy, setBusy] = useState(false);
  const [extractError, setExtractError] = useState(null);
  // Gap 2: Audit trail state
  const [auditLog, setAuditLog] = useState([]);
  const [showAudit, setShowAudit] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);

  const handleExtract = async () => {
    if (!caseItem?.id) return;
    setBusy(true);
    setExtractError(null);
    try {
      await triggerExtraction(caseItem.id);
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

  // Gap 2: Load audit log when toggled on
  const handleToggleAudit = async () => {
    if (!showAudit && auditLog.length === 0 && caseItem?.id) {
      setAuditLoading(true);
      try {
        const data = await getCaseAuditLog(caseItem.id);
        setAuditLog(Array.isArray(data) ? data : data?.logs || []);
      } catch {
        setAuditLog([]);
      } finally {
        setAuditLoading(false);
      }
    }
    setShowAudit((prev) => !prev);
  };

  // Reset audit when case changes
  useEffect(() => {
    setAuditLog([]);
    setShowAudit(false);
  }, [caseItem?.id]);

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

  // Gap 6: Determine appeal window for contempt-risk actions
  const contemptActions = caseItem.actions?.filter(
    (a) => a.contempt_risk && a.status !== "completed"
  ) || [];

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.heading}>Case Detail</h2>
          <p style={styles.subtext}>Officer-facing judgment workflow detail</p>
        </div>
        <div style={styles.headerBtns}>
          <button
            style={styles.auditBtn}
            onClick={handleToggleAudit}
          >
            {showAudit ? "Hide Audit Trail" : "View Audit Trail"}
          </button>
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
      </div>

      {extractError && (
        <div style={styles.errorBanner}>
          <strong>Extraction Error:</strong> {extractError}
          <button style={styles.retryBtn} onClick={handleExtract} disabled={busy}>
            Retry
          </button>
        </div>
      )}

      {/* Gap 6: Appeal Window Alert for contempt-risk actions */}
      {contemptActions.length > 0 && (
        <div style={styles.appealBanner}>
          <strong>Appeal Window Active:</strong> {contemptActions.length} action(s) flagged for contempt risk.
          Immediate compliance required to avoid court proceedings.
          <ul style={styles.appealList}>
            {contemptActions.map((a) => (
              <li key={a.id}>
                Action #{a.id} — {a.action_text?.slice(0, 60) || "No description"}
                {a.deadline && (
                  <span style={styles.deadlineTag}> Deadline: {a.deadline}</span>
                )}
              </li>
            ))}
          </ul>
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

      {/* Gap 2: Audit Trail Panel */}
      {showAudit && (
        <section style={styles.section}>
          <h3>Audit Trail</h3>
          {auditLoading ? (
            <p style={styles.empty}>Loading audit log...</p>
          ) : auditLog.length === 0 ? (
            <p style={styles.empty}>No audit entries found for this case.</p>
          ) : (
            <ul style={styles.auditList}>
              {auditLog.map((entry, idx) => (
                <li key={idx} style={styles.auditEntry}>
                  <div style={styles.auditTime}>
                    {entry.timestamp
                      ? new Date(entry.timestamp).toLocaleString()
                      : entry.created_at
                      ? new Date(entry.created_at).toLocaleString()
                      : "Unknown time"}
                  </div>
                  <div style={styles.auditAction}>
                    <strong>{entry.action || entry.event || "Event"}</strong>
                    {entry.actor && <span style={styles.auditActor}> by {entry.actor}</span>}
                  </div>
                  {entry.details && (
                    <div style={styles.auditDetails}>{entry.details}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section style={styles.section}>
        <h3>Extracted Actions</h3>
        {!hasActions ? (
          <p style={styles.empty}>No extracted actions yet. Run AI extraction first.</p>
        ) : (
          <div style={styles.actions}>
            {caseItem.actions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                onRefresh={async () => {
                  const updated = await getCase(caseItem.id);
                  onSelectCase?.(updated);
                  onRefresh?.();
                }}
              />
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
  headerBtns: { display: "flex", gap: "8px" },
  heading: { margin: 0 },
  subtext: { margin: "6px 0 0", color: "#64748b" },
  extractBtn: {
    border: "none",
    background: "#16a34a",
    color: "white",
    padding: "10px 14px",
    borderRadius: "8px",
  },
  auditBtn: {
    border: "1px solid #94a3b8",
    background: "white",
    color: "#334155",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 500,
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
  appealBanner: {
    background: "#fff7ed",
    border: "2px solid #f97316",
    borderRadius: "8px",
    padding: "12px 16px",
    color: "#9a3412",
    marginBottom: "16px",
  },
  appealList: { margin: "8px 0 0 16px", padding: 0 },
  deadlineTag: {
    background: "#fee2e2",
    color: "#b91c1c",
    fontSize: "11px",
    padding: "2px 6px",
    borderRadius: "4px",
    marginLeft: "8px",
    fontWeight: 600,
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
  auditList: { listStyle: "none", padding: 0, margin: 0 },
  auditEntry: {
    borderLeft: "3px solid #3b82f6",
    paddingLeft: "12px",
    marginBottom: "12px",
  },
  auditTime: { fontSize: "11px", color: "#94a3b8", marginBottom: "2px" },
  auditAction: { fontSize: "14px", color: "#1e293b" },
  auditActor: { color: "#64748b", fontStyle: "italic" },
  auditDetails: { fontSize: "12px", color: "#475569", marginTop: "2px" },
};
