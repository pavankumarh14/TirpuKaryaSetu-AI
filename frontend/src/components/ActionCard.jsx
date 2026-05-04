// frontend/src/components/ActionCard.jsx

import { completeAction } from "../services/api";

// Gap 5: Format confidence score from 0-1 float to human-readable label
function formatConfidence(conf) {
  if (conf == null) return "N/A";
  const pct = Math.round(conf * 100);
  let label = "Low";
  if (pct >= 85) label = "High";
  else if (pct >= 60) label = "Medium";
  return `${label} (${pct}%)`;
}

// Gap 3: Compute days remaining until a deadline date
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const target = new Date(dateStr);
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function ActionCard({ action, onRefresh }) {
  const handleComplete = async () => {
    try {
      await completeAction(action.id);
      onRefresh?.();
    } catch (error) {
      console.error("Failed to complete action", error);
    }
  };

  // Gap 3: Deadline countdown
  const deadlineDays = daysUntil(action.deadline);
  const deadlineLabel = action.deadline_expression || (action.deadline ? new Date(action.deadline).toLocaleDateString("en-IN") : null);
  const isOverdue = deadlineDays !== null && deadlineDays < 0;
  const isUrgent = deadlineDays !== null && deadlineDays >= 0 && deadlineDays <= 7;

  // Gap 6: Appeal window
  const appealLabel = action.appeal_window_expression || (action.appeal_window_days ? `${action.appeal_window_days} days` : null);

  return (
    <div style={styles.card}>
      <div style={styles.row}>
        <strong>Action #{action.id}</strong>
        <span style={{ ...styles.status, background: statusColor(action.status) }}>{action.status}</span>
      </div>

      {/* Gap 1: English action text */}
      <p style={styles.text}>{action.action_text}</p>

      {/* Gap 1: Kannada bilingual translation */}
      {action.action_text_kn && (
        <p style={styles.kannadaText}>
          <span style={styles.kannadaLabel}>ಕನ್ನಡ: </span>
          {action.action_text_kn}
        </p>
      )}

      <div style={styles.grid}>
        <Info label="Department" value={action.owner_department} />

        {/* Gap 3: Deadline with countdown timer */}
        <div style={styles.infoCell}>
          <span style={styles.infoLabel}>Deadline</span>
          <span style={{ ...styles.infoValue, color: isOverdue ? "#dc2626" : isUrgent ? "#d97706" : "inherit" }}>
            {deadlineLabel || "—"}
            {deadlineDays !== null && (
              <span style={{ fontSize: "11px", display: "block", fontWeight: 600, color: isOverdue ? "#dc2626" : isUrgent ? "#d97706" : "#16a34a" }}>
                {isOverdue ? `Overdue by ${Math.abs(deadlineDays)} day(s)` : deadlineDays === 0 ? "Due today!" : `${deadlineDays} day(s) remaining`}
              </span>
            )}
          </span>
        </div>

        <Info label="Risk Level" value={action.risk_level} />
        <Info label="Assigned To" value={action.assigned_to} />

        {/* Gap 5: Confidence with human-readable label */}
        <div style={styles.infoCell}>
          <span style={styles.infoLabel}>Confidence</span>
          <span style={styles.infoValue}>{formatConfidence(action.confidence)}</span>
        </div>

        <Info label="Contempt Risk" value={String(action.contempt_risk)} />

        {/* Gap 6: Appeal window countdown */}
        {appealLabel && (
          <div style={styles.infoCell}>
            <span style={styles.infoLabel}>Appeal Window</span>
            <span style={{ ...styles.infoValue, color: "#7c3aed" }}>{appealLabel}</span>
          </div>
        )}

        {/* Gap 5: Source page reference */}
        {action.source_page && (
          <Info label="Source Page" value={`Page ${action.source_page}`} />
        )}
      </div>

      {/* Source Evidence */}
      <div style={styles.evidence}>
        <strong>Source Evidence</strong>
        <div style={{ marginTop: "6px", fontSize: "13px", color: "#374151", lineHeight: 1.5 }}>
          {action.source_evidence || "No source evidence available"}
        </div>
        {action.source_page && (
          <div style={{ marginTop: "4px", fontSize: "11px", color: "#6b7280" }}>📄 Page {action.source_page}</div>
        )}
      </div>

      {action.status !== "completed" && (
        <button style={styles.completeBtn} onClick={handleComplete}>
          Mark Completed
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
  // Gap 1: Kannada text style
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
