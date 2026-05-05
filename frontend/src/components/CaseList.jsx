// frontend/src/components/CaseList.jsx

import en from "../locales/en.json";
import kn from "../locales/kn.json";

// Fix: Complete bilingual support with lang prop
export default function CaseList({ cases, selectedCase, onSelectCase, onRefresh, lang = "en" }) {
  const t = lang === "kn" ? kn : en;

  return (
    <div style={styles.panel}>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.heading}>{t.cases}</h2>
          <p style={styles.subtext}>{t.cases_subtext || "Uploaded judgments and extraction status"}</p>
        </div>
        <button style={styles.btn} onClick={onRefresh}>{t.refresh}</button>
      </div>

      {!cases?.length ? (
        <p style={styles.empty}>{t.no_cases || "No cases available yet."}</p>
      ) : (
        <div style={styles.list}>
          {cases.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectCase(item)}
              style={selectedCase?.id === item.id ? styles.activeItem : styles.item}
            >
              <div style={styles.itemTop}>
                <strong>#{item.id}</strong>
                {/* Fix: Translate status */}
                <span style={styles.status}>{t.lowercase?.[item.status] || item.status}</span>
              </div>
              <div style={styles.caseNo}>{item.case_number || t.pending_extraction}</div>
              <div style={styles.meta}>{item.court_name || t.pending_extraction}</div>
              <div style={styles.meta}>{item.respondent_department || t.department}</div>
            </button>
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
  item: {
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "14px",
    background: "#fff",
    textAlign: "left",
    cursor: "pointer",
  },
  activeItem: {
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
  meta: { fontSize: "13px", color: "#64748b", marginTop: "3px" },
};
