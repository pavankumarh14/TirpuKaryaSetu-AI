// frontend/src/components/ProofUpload.jsx

import { useState } from "react";
import { uploadProof } from "../services/api";
import en from "../locales/en.json";
import kn from "../locales/kn.json";

// Fix: Complete bilingual support with lang prop
export default function ProofUpload({ caseId, actions = [], onUploaded, lang = "en" }) {
  const [file, setFile] = useState(null);
  const [proofType, setProofType] = useState("compliance_report");
  const [uploadedBy, setUploadedBy] = useState("Officer");
  const [selectedActionId, setSelectedActionId] = useState("");
  const [message, setMessage] = useState("");
  
  const t = lang === "kn" ? kn : en;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !caseId) return;
    setMessage("");

    try {
      await uploadProof(caseId, file, proofType, uploadedBy, selectedActionId);
      const successMessage = t.proof_upload_success || "Proof uploaded successfully.";
      setMessage(successMessage);
      window.alert(successMessage);
      setFile(null);
      onUploaded?.();
    } catch (error) {
      console.error("Proof upload failed", error);
      setMessage(error?.message || t.upload_failed || "Upload failed");
    }
  };

  const getProofTypeLabel = (type) => {
    switch (type) {
      case "compliance_report": return t.compliance_report;
      case "order_copy": return t.order_copy;
      case "supporting_document": return t.supporting_document;
      default: return type;
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <select value={proofType} onChange={(e) => setProofType(e.target.value)} style={styles.input}>
        <option value="compliance_report">{t.compliance_report}</option>
        <option value="order_copy">{t.order_copy}</option>
        <option value="supporting_document">{t.supporting_document}</option>
      </select>

      <input
        style={styles.input}
        value={uploadedBy}
        onChange={(e) => setUploadedBy(e.target.value)}
        placeholder={t.uploaded_by || "Uploaded by"}
      />

      {actions.length > 0 && (
        <select
          value={selectedActionId}
          onChange={(e) => setSelectedActionId(e.target.value)}
          style={styles.input}
        >
          <option value="">{t.select_completed_action || "Select completed action"}</option>
          {actions.map((action) => (
            <option key={action.id} value={action.id}>
              {t.action_id.replace("{id}", action.caseActionNumber || action.id)}
            </option>
          ))}
        </select>
      )}

      <input
        style={styles.input}
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button style={styles.button} type="submit">
        {t.upload}
      </button>

      {message && <p style={styles.message}>{message}</p>}
    </form>
  );
}

const styles = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxWidth: "420px",
  },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
  },
  button: {
    border: "none",
    background: "#2563eb",
    color: "white",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
  },
  message: {
    margin: 0,
    fontSize: "14px",
    color: "#334155",
  },
};
