// frontend/src/components/Dashboard.jsx

export default function Dashboard({ stats, reviewQueue, onRefresh }) {
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

  return (
    <div>
      <div style={styles.topBar}>
        <div>
          <h2 style={styles.heading}>Operational Dashboard</h2>
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

      <div style={styles.panel}>
        <h3 style={styles.panelTitle}>Pending Officer Review</h3>
        {!reviewQueue?.length ? (
          <p style={styles.empty}>No pending actions in the review queue.</p>
        ) : (
          <ul style={styles.list}>
            {reviewQueue.slice(0, 5).map((item) => (
              <li key={item.id} style={styles.listItem}>
                <div>
                  <strong>Action #{item.id}</strong>
                  <div style={styles.meta}>{item.owner_department || "Department pending"}</div>
                </div>
                <span style={styles.badge}>{item.status}</span>
              </li>
            ))}
          </ul>
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
  panelTitle: { marginTop: 0 },
  empty: { color: "#64748b" },
  list: { listStyle: "none", padding: 0, margin: 0 },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e2e8f0",
    padding: "12px 0",
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
};