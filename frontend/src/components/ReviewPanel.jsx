// frontend/src/components/ReviewPanel.jsx

import { useState } from "react";
import { submitReview } from "../services/api";
import en from "../locales/en.json";
import kn from "../locales/kn.json";

// Fix: Complete bilingual support with lang prop
export default function ReviewPanel({ queue, onRefresh, lang = "en" }) {
  const [notes, setNotes] = useState({});
  const [assignments, setAssignments] = useState({});
  const [message, setMessage] = useState("");
  
  const t = lang === "kn" ? kn : en;

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

      setMessage(t.review_saved || "Review saved successfully.");
      onRefresh?.();
    } catch (error) {
      console.error("Review submission failed", error);
      setMessage(error?.message || t.review_failed || "Review submission failed.");
    }
  };

  // Translate status for display
  const getStatusText = (status) => t.lowercase?.[status] || status;

  return (
    <div style={styles.panel}>
      <h2 style={styles.heading}>{t.officer_review_queue}</h2>
      <p style={styles.subtext}>{t.review_queue_subtext}</p>
      {message && <p style={styles.message}>{message}</p>}

      {!queue?.length ? (
        <p style={styles.empty}>{t.no_actions_pending}</p>
      ) : (
        <div style={styles.list}>
          {queue.map((action) => (
            <div key={action.id} style={styles.card}>
              <div style={styles.row}>
                <strong>{t.case_action_label?.replace("{caseId}", action.case_id).replace("{actionId}", action.id) || `Case #${action.case_id} / Action #${action.id}`}</strong>
                <span style={styles.status}>{getStatusText(action.status)}</span>
              </div>

              <p style={styles.actionText}>{action.action_text}</p>

              {/* Show Kannada translation if available */}
              {action.action_text_kn && (
                <p style={styles.kannadaText}>
                  <span style={styles.kannadaLabel}>{t.kannada_label}</span>
                  {action.action_text_kn}
                </p>
              )}

              <div style={styles.metaGrid}>
                <Meta label={t.owner_department} value={action.owner_department} />
                <Meta label={t.action_type || "Action Type"} value={action.action_type} />
                <Meta label={t.responsible_authority || "Responsible Authority"} value={action.responsible_authority} />
                <Meta label={t.nature_of_action || "Nature of Action"} value={action.nature_of_action} />
                <Meta label={t.risk_level} value={action.risk_level} />
                <Meta label={t.confidence} value={`${Math.round((action.confidence || 0) * 100)}%`} />
                <Meta label={t.assigned_to} value={action.assigned_to} />
                <Meta label={t.appeal_recommendation || "Appeal Recommendation"} value={action.appeal_recommendation} />
                <Meta label={t.limitation_period || "Limitation Period"} value={action.limitation_period} />
                <Meta label={t.source_page} value={action.source_page ? `${t.page} ${action.source_page}` : null} />
              </div>

              <div style={styles.evidence}>
                <strong>{t.evidence}</strong>
                <div>{action.source_evidence || t.no_evidence}</div>
              </div>

              <input
                style={styles.input}
                placeholder={t.assign_to_officer}
                value={assignments[action.id] || ""}
                onChange={(e) =>
                  setAssignments((prev) => ({ ...prev, [action.id]: e.target.value }))
                }
              />

              <textarea
                style={styles.textarea}
                placeholder={t.officer_notes}
                value={notes[action.id] || ""}
                onChange={(e) =>
                  setNotes((prev) => ({ ...prev, [action.id]: e.target.value }))
                }
              />

              <div style={styles.actions}>
                <button style={styles.approve} onClick={() => handleReview(action.id, "approve")}>
                  {t.approve}
                </button>
                <button style={styles.assign} onClick={() => handleReview(action.id, "assign")}>
                  {t.assign}
                </button>
                <button style={styles.edit} onClick={() => handleReview(action.id, "edit")}>
                  {t.mark_edited}
                </button>
                <button style={styles.reject} onClick={() => handleReview(action.id, "reject")}>
                  {t.reject}
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
  message: {
    background: "#ecfdf5",
    border: "1px solid #86efac",
    borderRadius: "8px",
    color: "#166534",
    padding: "10px 12px",
  },
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
  // Kannada text style
  kannadaText: {
    fontSize: "14px",
    color: "#1e40af",
    background: "#eff6ff",
    borderRadius: "8px",
    padding: "8px 12px",
    marginTop: "8px",
    lineHeight: 1.6,
    fontFamily: "'Noto Sans Kannada', sans-serif",
  },
  kannadaLabel: {
    fontWeight: 700,
    marginRight: "4px",
  },
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
