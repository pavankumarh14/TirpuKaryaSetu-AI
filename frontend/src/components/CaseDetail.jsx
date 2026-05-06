// frontend/src/components/CaseDetail.jsx
import { useState, useEffect } from "react";
import { triggerExtraction, getCase, getCaseAuditLog } from "../services/api";
import ActionCard from "./ActionCard";
import ProofUpload from "./ProofUpload";
import en from "../locales/en.json";
import kn from "../locales/kn.json";

// Fix: Complete bilingual support with lang prop
export default function CaseDetail({ caseItem, onSelectCase, onRefresh, lang = "en" }) {
  const [busy, setBusy] = useState(false);
  const [extractStep, setExtractStep] = useState(0);
  const [extractError, setExtractError] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [showAudit, setShowAudit] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  
  const t = lang === "kn" ? kn : en;
  const extractionSteps = [
    t.extract_step_reading || "Reading judgment text and OCR output",
    t.extract_step_retrieving || "Finding relevant directions and deadlines",
    t.extract_step_ai || "Generating structured action plan with AI",
    t.extract_step_rules || "Applying deadline, appeal, and risk rules",
    t.extract_step_saving || "Saving actions for officer review",
  ];

  const handleExtract = async () => {
    if (!caseItem?.id) return;
    setBusy(true);
    setExtractStep(0);
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

  useEffect(() => {
    if (!busy) return undefined;

    const timer = window.setInterval(() => {
      setExtractStep((current) => Math.min(current + 1, extractionSteps.length - 1));
    }, 1800);

    return () => window.clearInterval(timer);
  }, [busy, extractionSteps.length]);

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
        <h2 style={styles.heading}>{t.case_detail}</h2>
        <p style={styles.empty}>{t.select_case_hint}</p>
      </div>
    );
  }

  const hasActions = caseItem.actions?.length > 0;
  const hasCompleted = caseItem.actions?.some((a) => a.status === "completed");
  const orderedActions = [...(caseItem.actions || [])].sort((a, b) => a.id - b.id);
  const completedActions = orderedActions
    .map((action, index) => ({ ...action, caseActionNumber: index + 1 }))
    .filter((a) => a.status === "completed");

  // Appeal window for contempt-risk actions
  const contemptActions = caseItem.actions?.filter(
    (a) => a.contempt_risk && a.status !== "completed"
  ) || [];

  return (
    <div style={styles.panel}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={styles.header}>
        <div>
          <h2 style={styles.heading}>{t.case_detail}</h2>
          <p style={styles.subtext}>{t.case_detail_subtext}</p>
        </div>
        <div style={styles.headerBtns}>
          <button
            style={styles.auditBtn}
            onClick={handleToggleAudit}
          >
            {showAudit ? t.hide_audit_trail : t.view_audit_trail}
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
            {busy ? (
              <span style={styles.buttonContent}>
                <span style={styles.spinnerSmall} />
                {t.extracting}
              </span>
            ) : (
              t.run_extraction
            )}
          </button>
        </div>
      </div>

      {busy && (
        <div style={styles.extractProgress}>
          <div style={styles.progressHeader}>
            <span style={styles.spinner} />
            <div>
              <strong>{t.extraction_in_progress || "Extraction in progress"}</strong>
              <p style={styles.progressText}>{extractionSteps[extractStep]}</p>
            </div>
          </div>
          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${((extractStep + 1) / extractionSteps.length) * 100}%`,
              }}
            />
          </div>
          <p style={styles.progressHint}>
            {t.extraction_wait_hint || "This can take a little while for long or scanned judgments."}
          </p>
        </div>
      )}

      {extractError && (
        <div style={styles.errorBanner}>
          <strong>{t.extraction_error}</strong> {extractError}
          <button style={styles.retryBtn} onClick={handleExtract} disabled={busy}>
            {t.retry}
          </button>
        </div>
      )}

      {/* Appeal Window Alert for contempt-risk actions */}
      {contemptActions.length > 0 && (
        <div style={styles.appealBanner}>
          <strong>{t.appeal_window_active}</strong> {t.appeal_window_text.replace("{count}", contemptActions.length)}
          <ul style={styles.appealList}>
            {contemptActions.map((a) => (
              <li key={a.id}>
                {t.action_text.replace("{id}", a.id).replace("{text}", a.action_text?.slice(0, 60) || t.no_source_evidence)}
                {a.deadline && (
                  <span style={styles.deadlineTag}> {t.deadline}: {a.deadline}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fix: Translated info labels */}
      <div style={styles.metaGrid}>
        <Info label={t.case_number} value={caseItem.case_number} />
        <Info label={t.court_name} value={caseItem.court_name} />
        <Info label={t.court_type} value={caseItem.court_type} />
        <Info label={t.judgment_type} value={caseItem.judgment_type} />
        <Info label={t.bench_judge || "Bench / Judge"} value={caseItem.bench_judge} />
        <Info label={t.petitioner} value={caseItem.petitioner} />
        <Info label={t.respondent_name || "Respondent"} value={caseItem.respondent_name} />
        <Info label={t.department} value={caseItem.respondent_department} />
        <Info label={t.language} value={caseItem.language} />
        <Info label={t.status} value={t.lowercase?.[caseItem.status] || caseItem.status} />
      </div>

      {/* Audit Trail Panel */}
      {showAudit && (
        <section style={styles.section}>
          <h3>{t.audit_trail}</h3>
          {auditLoading ? (
            <p style={styles.empty}>{t.loading_audit}</p>
          ) : auditLog.length === 0 ? (
            <p style={styles.empty}>{t.no_audit_entries}</p>
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
        <h3>{t.extracted_actions}</h3>
        {!hasActions ? (
          <p style={styles.empty}>{t.no_extracted_actions}</p>
        ) : (
          <div style={styles.actions}>
            {orderedActions.map((action, index) => (
              <ActionCard
                key={action.id}
                action={action}
                actionNumber={index + 1}
                lang={lang}
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
          <h3>{t.proof_upload}</h3>
          <ProofUpload
            caseId={caseItem.id}
            actions={completedActions}
            lang={lang}
            onUploaded={async () => {
              const updated = await getCase(caseItem.id);
              onSelectCase?.(updated);
              onRefresh?.();
            }}
          />
        </section>
      )}

      {hasActions && !hasCompleted && (
        <section style={styles.section}>
          <p style={styles.empty}>
            {t.proof_upload_hint}
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
  buttonContent: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
  spinnerSmall: {
    width: "14px",
    height: "14px",
    border: "2px solid rgba(255,255,255,0.45)",
    borderTopColor: "white",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.8s linear infinite",
  },
  extractProgress: {
    background: "#f0f9ff",
    border: "1px solid #7dd3fc",
    borderRadius: "10px",
    padding: "14px 16px",
    marginBottom: "16px",
  },
  progressHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#075985",
  },
  spinner: {
    width: "24px",
    height: "24px",
    border: "3px solid #bae6fd",
    borderTopColor: "#0284c7",
    borderRadius: "50%",
    flex: "0 0 auto",
    animation: "spin 0.8s linear infinite",
  },
  progressText: { margin: "4px 0 0", color: "#0369a1", fontSize: "14px" },
  progressTrack: {
    height: "8px",
    background: "#e0f2fe",
    borderRadius: "999px",
    overflow: "hidden",
    marginTop: "12px",
  },
  progressFill: {
    height: "100%",
    background: "#0284c7",
    borderRadius: "999px",
    transition: "width 0.35s ease",
  },
  progressHint: { margin: "10px 0 0", color: "#64748b", fontSize: "13px" },
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
