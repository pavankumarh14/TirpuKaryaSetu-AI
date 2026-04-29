// frontend/src/components/ActionCard.jsx

import { completeAction } from "../services/api";

export default function ActionCard({ action, onRefresh }) {
  const handleComplete = async () => {
    try {
      await completeAction(action.id);
      onRefresh?.();
    } catch (error) {
      console.error("Failed to complete action", error);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.row}>
        <strong>Action #{action.id}</strong>
        <span style={styles.status}>{action.status}</span>
      </div>

      <p style={styles.text}>{action.action_text}</p>

      <div style={styles.grid}>
        <Info label="Department" value={action.owner_department} />
        <Info label="Deadline" value={action.deadline} />
        <Info label="Risk Level" value={action.risk_level} />
        <Info label="Assigned To" value={action.assigned_to} />
        <Info label="Confidence" value={action.confidence} />
        <Info label="Contempt Risk" value={String(action.contempt_risk)} />
      </div>

      <div style={styles.evidence}>
        <strong>Source Evidence</strong>
        <div>{action.source_evidence || "No source evidence available"}</div>
      </div>

      <button style={styles.completeBtn} onClick={handleComplete}>
        Mark Completed
      </button>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={styles.info}>
      <div style={styles.label}>{label}</div>
      <div>{value || "—"}</div>
    </div>
  );
}

const styles = {
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "16px",
    background: "#fff",
  },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  status: {
    fontSize: "12px",
    padding: "4px 8px",
    borderRadius: "999px",
    background: "#e2e8f0",
  },
  text: { fontWeight: 600, marginTop: "12px" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "10px",
    marginTop: "12px",
  },
  info: {
    background: "#f8fafc",
    borderRadius: "8px",
    padding: "10px",
  },
  label: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "4px",
  },
  evidence: {
    marginTop: "12px",
    background: "#f8fafc",
    borderRadius: "8px",
    padding: "12px",
  },
  completeBtn: {
    marginTop: "14px",
    border: "none",
    background: "#16a34a",
    color: "white",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
  },
};
