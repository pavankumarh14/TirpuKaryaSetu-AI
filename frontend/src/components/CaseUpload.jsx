// frontend/src/components/CaseUpload.jsx

import { useState } from "react";
import en from "../locales/en.json";
import kn from "../locales/kn.json";

// Fix: Complete bilingual support with lang prop
export default function CaseUpload({ onUploaded, lang = "en" }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  
  const t = lang === "kn" ? kn : en;

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
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:8000/api/cases/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(t.upload_failed || "Upload failed");
      }

      const data = await response.json();
      setMessage((t.upload_success || "✅ Case #{id} uploaded successfully!").replace("{id}", data.id));
      setFile(null);
      onUploaded?.();
    } catch (error) {
      setMessage(`❌ ${t.error || "Error"}: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>{t.upload_case || "Upload Case"}</h3>
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
  );
}

const styles = {
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
};
