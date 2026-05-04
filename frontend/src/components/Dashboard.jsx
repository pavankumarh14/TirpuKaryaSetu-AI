// frontend/src/components/Dashboard.jsx
import { useState, useEffect } from "react";
import { getDepartmentWorkload } from "../services/api";
import en from "../locales/en.json";
import kn from "../locales/kn.json";

// Gap 1: Bilingual support — language toggle between English and Kannada
export default function Dashboard({ stats, reviewQueue, onRefresh, lang = "en" }) {
  const [showAll, setShowAll] = useState(false);
  const [workload, setWorkload] = useState([]);
  const [workloadError, setWorkloadError] = useState(null);
  const t = lang === "kn" ? kn : en;

  // Gap 4: Load department workload from API
  useEffect(() => {
    getDepartmentWorkload()
      .then((data) => setWorkload(Array.isArray(data) ? data : data?.workload || []))
      .catch(() => setWorkloadError("Could not load department workload"));
  }, []);

  const cards = [
    { label: "Total Cases", value: stats?.total_cases ?? 0 },
    { label: "Pending Cases", value: stats?.pending_cases ?? 0 },
    { label: "Verified Cases", value: stats?.verified_cases ?? 0 },
    { label: "Total Actions", value: stats?.total_actions ?? 0 },
    { label: "Pending Actions", value: stats?.pending_actions ?? 0 },
    { label: "High Risk Actions", value: stats?.high_risk_actions ?? 0 },
    { label: "Contempt Risk", value: stats?.contempt_risk_count ?? 0 },
    { label: "Review Queue", value: reviewQueue?.length ?? 0 },
  ];

  const visibleQueue = showAll ? reviewQueue : reviewQueue?.slice(0, 5);

  return (
    <div>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.heading}>{t.dashboard || "Operational Dashboard"}</h2>
          <p style={styles.subtext}>
            Verified and review-ready workflow view for court judgment compliance
          </p>
        </div>
        <button style={styles.refreshBtn} onClick={onRefresh}>
          Refresh
        </button>
      </div>

      <div style={styles.grid}>
        {cards.map((card) => (
          <div key={card.label} style={styles.card}>
            <p style={styles.label}>{card.label}</p>
            <h3 style={styles.value}>{card.value}</h3>
          </div>
        ))}
      </div>

      {/* Gap 4: Department Workload Panel */}
      <div style={styles.panel}>
        <div style={styles.panelHeader}>
          <h3 style={styles.panelTitle}>Department Workload</h3>
        </div>
        {workloadError ? (
          <p style={styles.errorText}>{workloadError}</p>
        ) : workload.length === 0 ? (
          <p style={styles.empty}>No workload data available.</p>
        ) : (
          <ul style={styles.list}>
            {workload.map((dept, idx) => (
              <li key={idx} style={styles.workloadItem}>
                <div style={styles.deptName}>{dept.department || dept.owner_department || "Unknown"}</div>
                <div style={styles.deptMeta}>
                  <span style={styles.deptBadge}>{dept.pending_actions ?? dept.count ?? 0} pending</span>
                  {dept.high_risk > 0 && (
                    <span style={{ ...styles.deptBadge, background: "#fee2e2", color: "#b91c1c" }}>
                      {dept.high_risk} high risk
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ ...styles.panel, marginTop: "16px" }}>
        <div style={styles.panelHeader}>
          <h3 style={styles.panelTitle}>{t.review_queue || "Pending Officer Review"}</h3>
          {reviewQueue?.length > 0 && (
            <span style={styles.countBadge}>{reviewQueue.length} actions</span>
          )}
        </div>

        {!reviewQueue?.length ? (
          <p style={styles.empty}>No pending actions in the review queue.</p>
        ) : (
          <>
            <ul style={styles.list}>
              {visibleQueue.map((item) => (
                <li key={item.id} style={styles.listItem}>
                  <div>
                    <strong>Action #{item.id}</strong>
                    <div style={styles.meta}>{item.owner_department || "Department pending"}</div>
                  </div>
                  <span style={styles.badge}>{item.status}</span>
                </li>
              ))}
            </ul>
            {reviewQueue.length > 5 && (
              <button
                style={styles.showAllBtn}
                onClick={() => setShowAll((prev) => !prev)}
              >
                {showAll
                  ? "Show less"
                  : `Show all ${reviewQueue.length} actions`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    gap: "12px",
  },
  heading: { margin: 0, fontSize: "24px" },
  subtext: { margin: "6px 0 0", color: "#475569" },
  refreshBtn: {
    border: "none",
    background: "#2563eb",
    color: "white",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  card: {
    background: "white",
    borderRadius: "12px",
    padding: "18px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  label: { margin: 0, color: "#64748b", fontSize: "13px" },
  value: { margin: "10px 0 0", fontSize: "30px" },
  panel: {
    background: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },
  panelTitle: { margin: 0 },
  countBadge: {
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: "999px",
  },
  empty: { color: "#64748b" },
  errorText: { color: "#b91c1c", fontSize: "13px" },
  list: { listStyle: "none", padding: 0, margin: 0 },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e2e8f0",
    padding: "12px 0",
  },
  workloadItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e2e8f0",
    padding: "10px 0",
  },
  deptName: { fontWeight: 600, fontSize: "14px" },
  deptMeta: { display: "flex", gap: "8px" },
  deptBadge: {
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: "999px",
  },
  meta: { fontSize: "13px", color: "#64748b", marginTop: "4px" },
  badge: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
  },
  showAllBtn: {
    marginTop: "12px",
    border: "1px solid #cbd5e1",
    background: "white",
    color: "#334155",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 500,
  },
};
