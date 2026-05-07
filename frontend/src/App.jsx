// frontend/src/App.jsx
import { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";
import CaseList from "./components/CaseList";
import CaseDetail from "./components/CaseDetail";
import CaseUpload from "./components/CaseUpload";
import ReviewPanel from "./components/ReviewPanel";
import { getCase, getCases, getDashboardStats, getReviewQueue } from "./services/api";
import en from "./locales/en.json";
import kn from "./locales/kn.json";

export default function App() {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [stats, setStats] = useState(null);
  const [reviewQueue, setReviewQueue] = useState([]);
  const [casesLoadError, setCasesLoadError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  // Gap 1: Language toggle state
  const [lang, setLang] = useState("en");
  const t = lang === "kn" ? kn : en;

  const loadAll = async () => {
    setLoading(true);
    try {
      const [casesData, statsData, queueData] = await Promise.all([
        getCases(),
        getDashboardStats(),
        getReviewQueue(),
      ]);
      const orderedCases = [...(casesData || [])].sort((a, b) => a.id - b.id);
      setCases(orderedCases);
      setCasesLoadError("");
      setSelectedCase((current) => {
        if (!current) return current;
        const stillExists = orderedCases.some((item) => item.id === current.id);
        // Keep current full-detail object; list payload may not include actions.
        return stillExists ? current : null;
      });
      setStats(statsData || null);
      setReviewQueue(queueData || []);
      return orderedCases;
    } catch (error) {
      console.error("Failed to load app data", error);
      setCasesLoadError(error?.message || "Failed to load case list");
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleSelectCase = async (listItem) => {
    if (!listItem?.id) {
      setSelectedCase(null);
      return;
    }
    try {
      const fullCase = await getCase(listItem.id);
      setSelectedCase(fullCase || listItem);
    } catch (error) {
      console.error("Failed to fetch full case details", error);
      setSelectedCase(listItem);
    }
  };

  const tabs = [
    {
      id: "dashboard",
      label: t.dashboard || "Dashboard",
      hint: t.tab_dashboard_hint || "Verified summary",
    },
    {
      id: "cases",
      label: t.cases || "Cases",
      hint: t.tab_cases_hint || "Case detail + actions",
    },
    {
      id: "review",
      label: t.review_queue || "Review Queue",
      hint: t.tab_review_hint || "Officer verification",
    },
    {
      id: "upload",
      label: t.upload_judgment_order || "Upload Judgment Order",
      hint: t.tab_upload_hint || "Upload or import judgment",
    },
  ];

  return (
    <div style={styles.app}>
      {/* Top Nav */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <span style={styles.brandName}>{t.app_name || "TirpuKaryaSetu AI"}</span>
          <span style={styles.tagline}>{t.tagline || ""}</span>
        </div>
        <div style={styles.navRight}>
          {/* Gap 1: Language switcher */}
          <button
            style={{
              ...styles.langBtn,
              background: lang === "en" ? "#2563eb" : "white",
              color: lang === "en" ? "white" : "#334155",
            }}
            onClick={() => setLang("en")}
          >
            EN
          </button>
          <button
            style={{
              ...styles.langBtn,
              background: lang === "kn" ? "#2563eb" : "white",
              color: lang === "kn" ? "white" : "#334155",
            }}
            onClick={() => setLang("kn")}
          >
            ಕಂ
          </button>
        </div>
      </header>

      {/* Tab Bar */}
      <nav style={styles.nav}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.activeTab : {}),
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            <span style={styles.tabLabel}>{tab.label}</span>
            <span style={styles.tabHint}>{tab.hint}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main style={styles.main}>
        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <Dashboard
                stats={stats}
                reviewQueue={reviewQueue}
                onRefresh={loadAll}
                lang={lang}
              />
            )}
            {activeTab === "cases" && (
              <div style={styles.caseLayout}>
                <div style={styles.caseLeft}>
                  <CaseList
                    cases={cases}
                    loadError={casesLoadError}
                    selectedCase={selectedCase}
                    onSelectCase={handleSelectCase}
                    onRefresh={loadAll}
                    lang={lang}
                  />
                </div>
                <div style={styles.caseRight}>
                  <CaseDetail
                    caseItem={selectedCase}
                    onSelectCase={setSelectedCase}
                    onRefresh={loadAll}
                    lang={lang}
                  />
                </div>
              </div>
            )}
            {activeTab === "review" && (
              <ReviewPanel queue={reviewQueue} onRefresh={loadAll} lang={lang} />
            )}
            {activeTab === "upload" && (
              <CaseUpload
                onUploaded={async (uploadedCase) => {
                  const orderedCases = await loadAll();
                  setActiveTab("cases");
                  if (uploadedCase?.id) {
                    const found = orderedCases.find((item) => item.id === uploadedCase.id);
                    setSelectedCase(found || uploadedCase);
                  }
                }}
                lang={lang}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#f1f5f9",
    fontFamily: "system-ui, sans-serif",
  },
  header: {
    background: "#1e293b",
    color: "white",
    padding: "12px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: { display: "flex", flexDirection: "column" },
  brandName: { fontWeight: 700, fontSize: "18px" },
  tagline: { fontSize: "12px", color: "#94a3b8", marginTop: "2px" },
  navRight: { display: "flex", gap: "6px", alignItems: "center" },
  langBtn: {
    border: "1px solid #475569",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "13px",
  },
  nav: {
    background: "white",
    borderBottom: "1px solid #e2e8f0",
    padding: "0 24px",
    display: "flex",
    gap: "4px",
  },
  tab: {
    background: "none",
    border: "none",
    outline: "none",
    appearance: "none",
    borderBottom: "3px solid transparent",
    padding: "10px 18px 11px",
    cursor: "pointer",
    color: "#64748b",
    fontSize: "14px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "2px",
  },
  tabLabel: { fontWeight: 700, lineHeight: 1.2 },
  tabHint: { fontSize: "11px", color: "#94a3b8", lineHeight: 1.2 },
  activeTab: {
    borderBottomColor: "#2563eb",
    color: "#1d4ed8",
  },
  main: { padding: "24px" },
  loading: { textAlign: "center", padding: "60px", color: "#64748b" },
  caseLayout: {
    display: "grid",
    gridTemplateColumns: "380px 1fr",
    gap: "20px",
    alignItems: "start",
  },
  caseLeft: {},
  caseRight: {},
};
