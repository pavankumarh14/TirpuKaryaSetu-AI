// frontend/src/components/Dashboard.jsx
import { useState, useEffect } from "react";
import { getDepartmentWorkload, getTrustedActions } from "../services/api";
import en from "../locales/en.json";
import kn from "../locales/kn.json";

// Fix: Complete Bilingual support — full language toggle between English and Kannada
export default function Dashboard({ stats, reviewQueue, onRefresh, lang = "en" }) {
  const [showAll, setShowAll] = useState(false);
  const [workload, setWorkload] = useState([]);
  const [trustedActions, setTrustedActions] = useState([]);
  const [workloadError, setWorkloadError] = useState(null);
  const t = lang === "kn" ? kn : en;

  // Load department workload from API
  useEffect(() => {
    getDepartmentWorkload()
      .then((data) => setWorkload(Array.isArray(data) ? data : data?.workload || []))
      .catch(() => setWorkloadError("Could not load department workload"));
    getTrustedActions()
      .then((data) => setTrustedActions(Array.isArray(data) ? data : []))
      .catch(() => setTrustedActions([]));
  }, [stats]);

  // Fix: Use translation keys for card labels
  const cards = [
    { label: t.total_cases, value: stats?.total_cases ?? 0 },
    { label: t.pending_cases, value: stats?.pending_cases ?? 0 },
    { label: t.verified_cases, value: stats?.verified_cases ?? 0 },
    { label: t.verified_action_plans || t.total_actions, value: stats?.total_actions ?? 0 },
    { label: t.pending_actions, value: stats?.pending_actions ?? 0 },
    { label: t.high_risk_actions, value: stats?.high_risk_actions ?? 0 },
    { label: t.contempt_risk_count, value: stats?.contempt_risk_count ?? 0 },
    { label: t.review_queue, value: reviewQueue?.length ?? 0 },
  ];

  const visibleQueue = showAll ? reviewQueue : reviewQueue?.slice(0, 5);

  return (
    <div>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.heading}>{t.dashboard}</h2>
          <p style={styles.subtext}>{t.dashboard_subtext}</p>
        </div>
        <button style={styles.refreshBtn} onClick={onRefresh}>
          {t.refresh}
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

      {/* Department Workload Panel */}
      <div style={styles.panel}>
        <div style={styles.panelHeader}>
          <h3 style={styles.panelTitle}>{t.department_workload}</h3>
        </div>
        {workloadError ? (
          <p style={styles.errorText}>{workloadError}</p>
        ) : workload.length === 0 ? (
          <p style={styles.empty}>{t.no_workload_data}</p>
        ) : (
          <ul style={styles.list}>
            {workload.map((dept, idx) => (
              <li key={idx} style={styles.workloadItem}>
                <div style={styles.deptName}>{dept.department || dept.owner_department || "Unknown"}</div>
                <div style={styles.deptMeta}>
                  {/* Fix: Translated badges */}
                  <span style={styles.deptBadge}>
                    {dept.approved ?? 0} {t.approved || "approved"}
                  </span>
                  <span style={styles.deptBadge}>
                    {dept.completed ?? 0} {t.completed}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ ...styles.panel, marginTop: "16px" }}>
        <div style={styles.panelHeader}>
          <h3 style={styles.panelTitle}>{t.verified_action_plans || "Verified Action Plans"}</h3>
          {trustedActions.length > 0 && (
            <span style={styles.countBadge}>{t.actions_count.replace("{count}", trustedActions.length)}</span>
          )}
        </div>

        {!trustedActions.length ? (
          <p style={styles.empty}>{t.no_verified_actions || "No approved action plans yet."}</p>
        ) : (
          <ul style={styles.list}>
            {trustedActions.slice(0, 8).map((item) => (
              <li key={item.id} style={styles.listItem}>
                <div>
                  <strong>{t.case_action_label?.replace("{caseId}", item.case_id).replace("{actionId}", item.id) || `Case #${item.case_id} / Action #${item.id}`}</strong>
                  <div style={styles.meta}>{item.action_text}</div>
                  <div style={styles.meta}>{item.owner_department || t.department}</div>
                </div>
                <span style={styles.badge}>{t.lowercase?.[item.status] || item.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ ...styles.panel, marginTop: "16px" }}>
        <div style={styles.panelHeader}>
          <h3 style={styles.panelTitle}>{t.review_queue}</h3>
          {reviewQueue?.length > 0 && (
            <span style={styles.countBadge}>{t.actions_count.replace("{count}", reviewQueue.length)}</span>
          )}
        </div>

        {!reviewQueue?.length ? (
          <p style={styles.empty}>{t.no_pending_actions}</p>
        ) : (
          <>
            <ul style={styles.list}>
              {visibleQueue.map((item) => (
                <li key={item.id} style={styles.listItem}>
                  <div>
                    <strong>{t.case_action_label?.replace("{caseId}", item.case_id).replace("{actionId}", item.id) || `Case #${item.case_id} / Action #${item.id}`}</strong>
                    <div style={styles.meta}>{item.owner_department || t.department}</div>
                  </div>
                  {/* Fix: Translate status */}
                  <span style={styles.badge}>
                    {t.lowercase?.[item.status] || item.status}
                  </span>
                </li>
              ))}
            </ul>
            {reviewQueue.length > 5 && (
              <button
                style={styles.showAllBtn}
                onClick={() => setShowAll((prev) => !prev)}
              >
                {showAll
                  ? t.show_less
                  : t.show_all.replace("{count}", reviewQueue.length)}
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
