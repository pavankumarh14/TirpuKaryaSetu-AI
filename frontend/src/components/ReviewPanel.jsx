// frontend/src/components/ReviewPanel.jsx

import { useState } from "react";
import { submitReview } from "../services/api";

export default function ReviewPanel({ queue, onRefresh }) {
  const [notes, setNotes] = useState({});
  const [assignments, setAssignments] = useState({});

  const handleReview = async (actionId, reviewAction) => {
    try {
      const editedFields =
        reviewAction === "assign" && assignments[actionId]
          ? JSON.stringify({ assigned_to: assignments[actionId] })
          : null;

      await submitReview(actionId, {
        reviewer_name: "Officer",
        reviewer_role: "Department Reviewer",
        review_action: reviewAction,
        edited_fields: editedFields,
        notes: notes[actionId] || "",
      });

      onRefresh?.();
    } catch (error) {
      console.error("Review submission failed", error);
    }
  };

  return (
    <div style={styles.panel}>
      <h2 style={styles.heading}>Officer Review Queue</h2>
      <p style={styles.subtext}>
        Review AI-extracted actions before they appear as verified government tasks
      </p>

      {!queue?.length ? (
        <p style={styles.empty}>No actions pending review.</p>
      ) : (
        <div style={styles.list}>
          {queue.map((action) => (
            <div key={action.id} style={styles.card}>
              <div style={styles.row}>
                <strong>Action #{action.id}</strong>
                <span style={styles.status}>{action.status}</span>
              </div>

              <p style={styles.actionText}>{action.action_text}</p>

              <div style={styles.metaGrid}>
                <Meta label="Department" value={action.owner_department} />
                <Meta label="Risk" value={action.risk_level} />
                <Meta label="Confidence" value={action.confidence} />
                <Meta label="Assigned To" value={action.assigned_to} />
              </div>

              <div style={styles.evidence}>
                <strong>Evidence:</strong>
                <div>{action.source_evidence || "No evidence captured"}</div>
              </div>

              <input
                style={styles.input}
                placeholder="Assign to officer"
                value={assignments[action.id] || ""}
                onChange={(e) =>
                  setAssignments((prev) => ({ ...prev, [action.id]: e.target.value }))
                }
              />

              <textarea
                style={styles.textarea}
                placeholder="Officer notes"
                value={notes[action.id] || ""}
                onChange={(e) =>
                  setNotes((prev) => ({ ...prev, [action.id]: e.target.value }))
                }
              />

              <div style={styles.actions}>
                <button style={styles.approve} onClick={() => handleReview(action.id, "approve")}>
                  Approve
                </button>
                <button style={styles.assign} onClick={() => handleReview(action.id, "assign")}>
                  Assign
                </button>
                <button style={styles.edit} onClick={() => handleReview(action.id, "edit")}>
                  Mark Edited
                </button>
                <button style={styles.reject} onClick={() => handleReview(action.id, "reject")}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div style={styles.metaItem}>
      <div style={styles.metaLabel}>{label}</div>
      <div>{value || "—"}</div>
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
  heading: { marginTop: 0 },
  subtext: { color: "#64748b", marginBottom: "20px" },
  empty: { color: "#64748b" },
  list: { display: "flex", flexDirection: "column", gap: "16px" },
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "16px",
    background: "#fff",
  },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  status: {
    fontSize: "12px",
    padding: "4px 10px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
  },
  actionText: { marginTop: "12px", fontWeight: 600 },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "10px",
    marginTop: "12px",
  },
  metaItem: {
    background: "#f8fafc",
    borderRadius: "8px",
    padding: "10px",
  },
  metaLabel: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "4px",
  },
  evidence: {
    marginTop: "14px",
    background: "#fefce8",
    border: "1px solid #fde68a",
    borderRadius: "8px",
    padding: "12px",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    marginTop: "12px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
  },
  textarea: {
    width: "100%",
    marginTop: "12px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    minHeight: "80px",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "14px",
  },
  approve: button("#16a34a"),
  assign: button("#2563eb"),
  edit: button("#f59e0b"),
  reject: button("#dc2626"),
};

function button(color) {
  return {
    border: "none",
    background: color,
    color: "white",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
  };
}
