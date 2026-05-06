// frontend/src/components/CaseList.jsx

import { deleteCase } from "../services/api";
import en from "../locales/en.json";
import kn from "../locales/kn.json";

// Fix: Complete bilingual support with lang prop
export default function CaseList({ cases, selectedCase, onSelectCase, onRefresh, lang = "en" }) {
  const t = lang === "kn" ? kn : en;
  const orderedCases = [...(cases || [])].sort((a, b) => a.id - b.id);

  const handleDelete = async (e, caseId, displayNumber) => {
    e.stopPropagation(); // Prevent selecting the case when clicking delete
    
    const confirmMessage = lang === "kn" 
      ? `ಪ್ರಕರಣ #${displayNumber} ಅನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿರುವಿರಾ? ಈ ಕ್ರಿಯೆಯನ್ನು ವಾಪಸ್ ತೆಗೆದುಕೊಳ್ಳಲಾಗುವುದಿಲ್ಲ.`
      : `Are you sure you want to delete Case #${displayNumber}? This action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await deleteCase(caseId);
      // If deleted case was selected, clear selection
      if (selectedCase?.id === caseId) {
        onSelectCase(null);
      }
      onRefresh?.();
    } catch (error) {
      console.error("Failed to delete case:", error);
      alert(lang === "kn" ? "ಪ್ರಕರಣವನ್ನು ಅಳಿಸುವಲ್ಲಿ ವಿಫಲವಾಗಿದೆ" : "Failed to delete case");
    }
  };

  return (
    <div style={styles.panel}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.heading}>{t.cases}</h2>
          <p style={styles.subtext}>{t.cases_subtext || "Uploaded judgments and extraction status"}</p>
        </div>
        <button style={styles.btn} onClick={onRefresh}>{t.refresh}</button>
      </div>

      {!orderedCases.length ? (
        <p style={styles.empty}>{t.no_cases || "No cases available yet."}</p>
      ) : (
        <div style={styles.list}>
          {orderedCases.map((item, index) => (
            <div key={item.id} style={styles.caseWrapper}>
              <button
                onClick={() => onSelectCase(item)}
                style={selectedCase?.id === item.id ? styles.activeItem : styles.item}
              >
                <div style={styles.itemTop}>
                  <div>
                    <strong>#{index + 1}</strong>
                    <div style={styles.recordId}>{t.record_id || "Record ID"}: {item.id}</div>
                  </div>
                  {/* Fix: Translate status */}
                  <span style={styles.status}>{t.lowercase?.[item.status] || item.status}</span>
                </div>
                <div style={styles.caseNo}>{item.case_number || t.pending_extraction}</div>
                <div style={styles.meta}>{item.court_name || t.pending_extraction}</div>
                <div style={styles.meta}>{item.respondent_department || t.department}</div>
              </button>
              {/* Delete button */}
              <button
                style={styles.deleteBtn}
                onClick={(e) => handleDelete(e, item.id, index + 1)}
                title={lang === "kn" ? "ಪ್ರಕರಣ ಅಳಿಸಿ" : "Delete case"}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  panel: {
    background: "white",
    borderRadius: "12px",
    padding: "18px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  heading: { margin: 0 },
  subtext: { margin: "6px 0 0", color: "#64748b", fontSize: "14px" },
  btn: {
    border: "none",
    background: "#2563eb",
    color: "white",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  empty: { color: "#64748b" },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  caseWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
  },
  item: {
    flex: 1,
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "14px",
    background: "#fff",
    textAlign: "left",
    cursor: "pointer",
  },
  activeItem: {
    flex: 1,
    border: "1px solid #22c55e",
    borderRadius: "10px",
    padding: "14px",
    background: "#f0fdf4",
    textAlign: "left",
    cursor: "pointer",
  },
  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  status: {
    fontSize: "12px",
    color: "#0f172a",
    background: "#e2e8f0",
    padding: "4px 8px",
    borderRadius: "999px",
  },
  caseNo: { fontWeight: 600, marginBottom: "6px" },
  recordId: { fontSize: "11px", color: "#64748b", marginTop: "2px" },
  meta: { fontSize: "13px", color: "#64748b", marginTop: "3px" },
  deleteBtn: {
    background: "#fee2e2",
    border: "1px solid #fca5a5",
    borderRadius: "8px",
    padding: "8px 10px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 700,
    color: "#dc2626",
    transition: "background 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "40px",
    minHeight: "40px",
  },
};
