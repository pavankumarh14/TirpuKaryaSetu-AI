// frontend/src/components/ActionCard.jsx

import { completeAction } from "../services/api";
import en from "../locales/en.json";
import kn from "../locales/kn.json";

// Format confidence score from 0-1 float to human-readable label
function formatConfidence(conf, t) {
  if (conf == null) return t.na;
  const pct = Math.round(conf * 100);
  let label = t.low;
  if (pct >= 85) label = t.high;
  else if (pct >= 60) label = t.medium;
  return `${label} (${pct}%)`;
}

// Compute days remaining until a deadline date
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const target = new Date(dateStr);
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff;
}

// Fix: Complete bilingual support with lang prop
export default function ActionCard({ action, actionNumber, onRefresh, lang = "en" }) {
  const t = lang === "kn" ? kn : en;

  const handleComplete = async () => {
    try {
      await completeAction(action.id);
      onRefresh?.();
    } catch (error) {
      console.error("Failed to complete action", error);
    }
  };

  // Deadline countdown
  const deadlineDays = daysUntil(action.deadline);
  const deadlineLabel = action.deadline_expression || (action.deadline ? new Date(action.deadline).toLocaleDateString(lang === "kn" ? "en-IN" : "en-US") : null);
  const isOverdue = deadlineDays !== null && deadlineDays < 0;
  const isUrgent = deadlineDays !== null && deadlineDays >= 0 && deadlineDays <= 7;

  // Appeal window
  const appealLabel = action.appeal_window_expression || (action.appeal_window_days ? `${action.appeal_window_days} days` : null);

  // Translate status
  const statusText = t.lowercase?.[action.status] || action.status;

  return (
    <div style={styles.card}>
      <div style={styles.row}>
        <strong>{t.action_id.replace("{id}", actionNumber || action.id)}</strong>
        <span style={{ ...styles.status, background: statusColor(action.status) }}>{statusText}</span>
      </div>
      {actionNumber && (
        <div style={styles.dbRef}>{t.record_id || "Record ID"}: {action.id}</div>
      )}

      {/* English action text */}
      <p style={styles.text}>{action.action_text}</p>

      {/* Kannada bilingual translation - displays if available */}
      {action.action_text_kn && (
        <p style={styles.kannadaText}>
          <span style={styles.kannadaLabel}>{t.kannada_label}</span>
          {action.action_text_kn}
        </p>
      )}

      <div style={styles.grid}>
        <Info label={t.owner_department} value={action.owner_department} />
        <Info label={t.action_type || "Action Type"} value={action.action_type} />
        <Info label={t.responsible_authority || "Responsible Authority"} value={action.responsible_authority} />
        <Info label={t.nature_of_action || "Nature of Action"} value={action.nature_of_action} />

        {/* Deadline with countdown timer */}
        <div style={styles.infoCell}>
          <span style={styles.infoLabel}>{t.deadline}</span>
          <span style={{ ...styles.infoValue, color: isOverdue ? "#dc2626" : isUrgent ? "#d97706" : "inherit" }}>
            {deadlineLabel || "—"}
            {deadlineDays !== null && (
              <span style={{ fontSize: "11px", display: "block", fontWeight: 600, color: isOverdue ? "#dc2626" : isUrgent ? "#d97706" : "#16a34a" }}>
                {isOverdue ? t.overdue_by.replace("{days}", Math.abs(deadlineDays)) : deadlineDays === 0 ? t.due_today : t.days_remaining.replace("{days}", deadlineDays)}
              </span>
            )}
          </span>
        </div>

        <Info label={t.risk_level} value={action.risk_level} />
        <Info label={t.assigned_to} value={action.assigned_to} />
        <Info label={t.appeal_recommendation || "Appeal Recommendation"} value={action.appeal_recommendation} />
        <Info label={t.limitation_period || "Limitation Period"} value={action.limitation_period} />
        <Info
          label={t.proof_status || "Proof Status"}
          value={action.proof_attached ? (t.proof_attached || "Attached") : (t.proof_not_attached || "Not attached")}
        />

        {/* Confidence with human-readable label */}
        <div style={styles.infoCell}>
          <span style={styles.infoLabel}>{t.confidence}</span>
          <span style={styles.infoValue}>{formatConfidence(action.confidence, t)}</span>
        </div>

        <Info label={t.contempt_risk_flag} value={String(action.contempt_risk)} />

        {/* Appeal window countdown */}
        {appealLabel && (
          <div style={styles.infoCell}>
            <span style={styles.infoLabel}>{t.appeal_window}</span>
            <span style={{ ...styles.infoValue, color: "#7c3aed" }}>{appealLabel}</span>
          </div>
        )}

        {/* Source page reference */}
        {action.source_page && (
          <Info label={t.source_page} value={`${t.page} ${action.source_page}`} />
        )}
      </div>

      {/* Source Evidence */}
      <div style={styles.evidence}>
        <strong>{t.source_evidence}</strong>
        <div style={{ marginTop: "6px", fontSize: "13px", color: "#374151", lineHeight: 1.5 }}>
          {action.source_evidence || t.no_source_evidence}
        </div>
        {action.source_page && (
          <div style={{ marginTop: "4px", fontSize: "11px", color: "#6b7280" }}>{t.page} {action.source_page}</div>
        )}
      </div>

      {action.status !== "completed" && (
        <button style={styles.completeBtn} onClick={handleComplete}>
          {t.mark_completed}
        </button>
      )}
    </div>
  );
}

function statusColor(status) {
  const map = {
    pending: "#fbbf24",
    approved: "#22c55e",
    edited: "#3b82f6",
    rejected: "#ef4444",
    assigned: "#8b5cf6",
    completed: "#6b7280",
  };
  return map[status] || "#9ca3af";
}

function Info({ label, value }) {
  return (
    <div style={styles.infoCell}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValue}>{value ?? "—"}</span>
    </div>
  );
}

const styles = {
  card: {
    background: "white",
    borderRadius: "12px",
    padding: "18px",
    marginBottom: "16px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  status: {
    color: "white",
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
  },
  text: {
    fontSize: "15px",
    fontWeight: 500,
    color: "#111827",
    marginBottom: "8px",
    lineHeight: 1.5,
  },
  dbRef: {
    color: "#64748b",
    fontSize: "11px",
    marginTop: "-4px",
    marginBottom: "8px",
  },
  // Kannada text style
  kannadaText: {
    fontSize: "14px",
    color: "#1e40af",
    background: "#eff6ff",
    borderRadius: "8px",
    padding: "8px 12px",
    marginBottom: "12px",
    lineHeight: 1.6,
    fontFamily: "'Noto Sans Kannada', sans-serif",
  },
  kannadaLabel: {
    fontWeight: 700,
    marginRight: "4px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "10px",
    marginBottom: "14px",
  },
  infoCell: {
    background: "#f9fafb",
    borderRadius: "8px",
    padding: "8px 10px",
  },
  infoLabel: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#6b7280",
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  infoValue: {
    fontSize: "13px",
    color: "#111827",
    fontWeight: 500,
    marginTop: "2px",
    display: "block",
  },
  evidence: {
    marginTop: "12px",
    background: "#f8fafc",
    borderRadius: "8px",
    padding: "12px",
    borderLeft: "3px solid #3b82f6",
  },
  completeBtn: {
    marginTop: "14px",
    border: "none",
    background: "#16a34a",
    color: "white",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
  },
};
