// frontend/src/components/CaseUpload.jsx

import { useEffect, useState } from "react";
import { getCcmsDisposedCases, importCcmsCase, uploadCase } from "../services/api";
import en from "../locales/en.json";
import kn from "../locales/kn.json";

// Fix: Complete bilingual support with lang prop
export default function CaseUpload({ onUploaded, lang = "en" }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [ccmsCases, setCcmsCases] = useState([]);
  const [importingId, setImportingId] = useState(null);
  const [message, setMessage] = useState("");
  
  const t = lang === "kn" ? kn : en;

  useEffect(() => {
    getCcmsDisposedCases()
      .then((data) => setCcmsCases(Array.isArray(data) ? data : []))
      .catch(() => setCcmsCases([]));
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage(t.select_pdf || "Please select a PDF file");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const data = await uploadCase(file);
      const successMessage = (t.upload_success || "Case #{id} uploaded successfully!").replace("{id}", data.id);
      setMessage(successMessage);
      window.alert(successMessage);
      setFile(null);
      onUploaded?.();
    } catch (error) {
      setMessage(`❌ ${t.error || "Error"}: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCcmsImport = async (ccmsCaseId) => {
    setImportingId(ccmsCaseId);
    setMessage("");

    try {
      const data = await importCcmsCase(ccmsCaseId);
      const successMessage = (t.ccms_import_success || "CCMS case #{id} imported successfully.").replace("{id}", data.id);
      setMessage(successMessage);
      window.alert(successMessage);
      onUploaded?.();
    } catch (error) {
      setMessage(`${t.error || "Error"}: ${error.message}`);
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div style={styles.stack}>
      <div style={styles.container}>
        <h3 style={styles.title}>{t.upload_judgment_order || "Upload Judgment Order"}</h3>
        <div style={styles.row}>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            style={styles.input}
            disabled={uploading}
          />
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            style={file && !uploading ? styles.button : styles.buttonDisabled}
          >
            {uploading ? t.uploading : (t.upload_pdf || "Upload PDF")}
          </button>
        </div>
        {message && <p style={styles.message}>{message}</p>}
      </div>

      <div style={styles.container}>
        <h3 style={styles.title}>{t.ccms_import_title || "Import from CCMS/CIS"}</h3>
        <p style={styles.subtext}>
          {t.ccms_import_subtext || "Disposed judgments fetched from CCMS/CIS will enter the same AI extraction and review workflow."}
        </p>
        {ccmsCases.length === 0 ? (
          <p style={styles.message}>{t.no_ccms_cases || "No disposed CCMS/CIS cases available."}</p>
        ) : (
          <div style={styles.ccmsList}>
            {ccmsCases.map((item) => (
              <div key={item.ccms_case_id} style={styles.ccmsItem}>
                <div>
                  <div style={styles.caseNo}>{item.case_number}</div>
                  <div style={styles.meta}>{item.court_name} · {item.respondent_department}</div>
                  <div style={styles.meta}>{item.disposal_status} · {item.ccms_case_id}</div>
                </div>
                <button
                  style={importingId === item.ccms_case_id ? styles.buttonDisabled : styles.button}
                  disabled={Boolean(importingId)}
                  onClick={() => handleCcmsImport(item.ccms_case_id)}
                >
                  {importingId === item.ccms_case_id ? t.importing || "Importing..." : t.import_judgment || "Import"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  container: {
    background: "white",
    borderRadius: "12px",
    padding: "18px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    marginBottom: "16px",
  },
  title: {
    margin: "0 0 12px 0",
    fontSize: "16px",
    color: "#1c1f26",
  },
  subtext: { margin: "0 0 14px", color: "#64748b", fontSize: "14px" },
  row: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: "8px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
  },
  button: {
    background: "#22c55e",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },
  buttonDisabled: {
    background: "#cbd5e1",
    color: "#64748b",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "not-allowed",
  },
  message: {
    marginTop: "12px",
    fontSize: "14px",
    color: "#334155",
  },
  ccmsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  ccmsItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "12px",
  },
  caseNo: { fontWeight: 700, marginBottom: "4px" },
  meta: { fontSize: "13px", color: "#64748b", marginTop: "2px" },
};
