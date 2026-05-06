// frontend/src/components/CaseList.jsx

import { deleteCase } from "../services/api";
import en from "../locales/en.json";
import kn from "../locales/kn.json";

// Fix: Complete bilingual support with lang prop
export default function CaseList({ cases, loadError, selectedCase, onSelectCase, onRefresh, lang = "en" }) {
  const t = lang === "kn" ? kn : en;
  const orderedCases = [...(cases || [])].sort((a, b) => a.id - b.id);
  const formatAddedAt = (value) => {
    if (!value) return lang === "kn" ? "ದಿನಾಂಕ ಲಭ್ಯವಿಲ್ಲ" : "Date unavailable";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString(lang === "kn" ? "kn-IN" : "en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

      {loadError ? (
        <p style={styles.error}>{loadError}</p>
      ) : !orderedCases.length ? (
        <p style={styles.empty}>{t.no_cases || "No cases available yet."}</p>
      ) : (
        <div style={styles.list}>
          {orderedCases.map((item, index) => (
            <div
              key={item.id}
              onClick={() => onSelectCase(item)}
              style={selectedCase?.id === item.id ? styles.activeItem : styles.item}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectCase(item);
                }
              }}
            >
              <div style={styles.itemTop}>
                <div>
                  <strong style={styles.displayNo}>#{index + 1}</strong>
                  <div style={styles.recordId}>
                    {(t.added_on || "Added on")}: {formatAddedAt(item.created_at)}
                  </div>
                </div>
                <div style={styles.rightTools}>
                  {/* Fix: Translate status */}
                  <span style={styles.status}>{t.lowercase?.[item.status] || item.status}</span>
                  <button
                    style={styles.deleteBtn}
                    onClick={(e) => handleDelete(e, item.id, index + 1)}
                    title={lang === "kn" ? "ಪ್ರಕರಣ ಅಳಿಸಿ" : "Delete case"}
                    aria-label={lang === "kn" ? "ಪ್ರಕರಣ ಅಳಿಸಿ" : "Delete case"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </button>
                </div>
              </div>
              <div style={styles.caseNo}>{item.case_number || t.pending_extraction}</div>
              <div style={styles.meta}>{item.court_name || t.pending_extraction}</div>
              <div style={styles.meta}>{item.respondent_department || t.department}</div>
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
  error: { color: "#b91c1c", fontSize: "13px" },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  item: {
    position: "relative",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "14px",
    background: "#fff",
    textAlign: "left",
    cursor: "pointer",
    minHeight: "152px",
  },
  activeItem: {
    position: "relative",
    border: "1px solid #22c55e",
    borderRadius: "10px",
    padding: "14px",
    background: "#f0fdf4",
    textAlign: "left",
    cursor: "pointer",
    minHeight: "152px",
  },
  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
    alignItems: "flex-start",
    gap: "10px",
  },
  displayNo: { fontSize: "28px", lineHeight: 1, letterSpacing: 0 },
  status: {
    fontSize: "12px",
    color: "#0f172a",
    background: "#e2e8f0",
    padding: "4px 8px",
    borderRadius: "999px",
    maxWidth: "130px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  rightTools: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    minWidth: 0,
  },
  caseNo: {
    fontWeight: 700,
    marginBottom: "8px",
    fontSize: "17px",
    lineHeight: 1.35,
  },
  recordId: { fontSize: "11px", color: "#64748b", marginTop: "2px" },
  meta: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "4px",
    lineHeight: 1.35,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  deleteBtn: {
    background: "#fff1f2",
    border: "1px solid #fca5a5",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#dc2626",
    transition: "background 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "30px",
    minHeight: "30px",
    width: "30px",
    height: "30px",
    padding: 0,
  },
};
