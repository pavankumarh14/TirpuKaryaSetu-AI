// frontend/src/App.jsx
import { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";
import CaseList from "./components/CaseList";
import CaseDetail from "./components/CaseDetail";
import CaseUpload from "./components/CaseUpload";
import ReviewPanel from "./components/ReviewPanel";
import { getCases, getDashboardStats, getReviewQueue } from "./services/api";

export default function App() {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [stats, setStats] = useState(null);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [casesData, statsData, queueData] = await Promise.all([
        getCases(),
        getDashboardStats(),
        getReviewQueue(),
      ]);
      setCases(casesData || []);
      setStats(statsData || null);
      setReviewQueue(queueData || []);
    } catch (error) {
      console.error("Failed to load app data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>TirpuKaryaSetu AI</h1>
          <p style={styles.subtitle}>
            From Court Judgments to Verified Government Actions
          </p>
        </div>
        <nav style={styles.nav}>
          <button onClick={() => setActiveTab("dashboard")} style={activeTab === "dashboard" ? styles.activeTab : styles.tab}>Dashboard</button>
          <button onClick={() => setActiveTab("cases")} style={activeTab === "cases" ? styles.activeTab : styles.tab}>Cases</button>
          <button onClick={() => setActiveTab("review")} style={activeTab === "review" ? styles.activeTab : styles.tab}>Review Queue</button>
        </nav>
      </header>
      {loading && <p style={styles.info}>Loading data...</p>}
      <main style={styles.main}>
        {activeTab === "dashboard" && (
          <Dashboard stats={stats} reviewQueue={reviewQueue} onRefresh={loadAll} />
        )}
        {activeTab === "cases" && (
          <div>
            <CaseUpload onUploadSuccess={loadAll} />
            <div style={styles.twoCol}>
              <CaseList
                cases={cases}
                selectedCase={selectedCase}
                onSelectCase={setSelectedCase}
                onRefresh={loadAll}
              />
              <CaseDetail
                caseItem={selectedCase}
                onSelectCase={setSelectedCase}
                onRefresh={loadAll}
              />
            </div>
          </div>
        )}
        {activeTab === "review" && (
          <ReviewPanel queue={reviewQueue} onRefresh={loadAll} />
        )}
      </main>
    </div>
  );
}

const styles = {
  app: {
    fontFamily: "Inter, system-ui, sans-serif",
    background: "#f7f8fa",
    minHeight: "100vh",
    color: "#1c1f26",
  },
  header: {
    padding: "20px 28px",
    background: "#0f172a",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  title: {
    margin: 0,
    fontSize: "28px",
  },
  subtitle: {
    margin: "6px 0 0",
    fontSize: "14px",
    color: "#cbd5e1",
  },
  nav: {
    display: "flex",
    gap: "12px",
  },
  tab: {
    border: "none",
    padding: "10px 14px",
    borderRadius: "8px",
    background: "#1e293b",
    color: "#e2e8f0",
    cursor: "pointer",
  },
  activeTab: {
    border: "none",
    padding: "10px 14px",
    borderRadius: "8px",
    background: "#22c55e",
    color: "#052e16",
    cursor: "pointer",
    fontWeight: 700,
  },
  main: {
    padding: "24px 28px",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1.4fr",
    gap: "20px",
  },
  info: {
    padding: "12px 28px",
    margin: 0,
    color: "#334155",
  },
};
