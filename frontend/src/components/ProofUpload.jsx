// frontend/src/components/ProofUpload.jsx

import { useState } from "react";
import { uploadProof } from "../services/api";

export default function ProofUpload({ caseId, onUploaded }) {
  const [file, setFile] = useState(null);
  const [proofType, setProofType] = useState("compliance_report");
  const [uploadedBy, setUploadedBy] = useState("Officer");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !caseId) return;

    try {
      await uploadProof(caseId, file, proofType, uploadedBy);
      setFile(null);
      onUploaded?.();
    } catch (error) {
      console.error("Proof upload failed", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <select value={proofType} onChange={(e) => setProofType(e.target.value)} style={styles.input}>
        <option value="compliance_report">Compliance Report</option>
        <option value="order_copy">Order Copy</option>
        <option value="supporting_document">Supporting Document</option>
      </select>

      <input
        style={styles.input}
        value={uploadedBy}
        onChange={(e) => setUploadedBy(e.target.value)}
        placeholder="Uploaded by"
      />

      <input
        style={styles.input}
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button style={styles.button} type="submit">
        Upload Proof
      </button>
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
};
