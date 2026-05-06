// frontend/src/services/api.js

function normalizeApiBase(rawBase) {
  if (!rawBase) return "/api";
  const trimmed = String(rawBase).replace(/\/+$/, "");
  if (trimmed.endsWith("/api")) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return `${trimmed}/api`;
  }
  return trimmed;
}

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_URL || "/api");

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  let response = await fetch(url, {
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API request failed: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    let text = await response.text();

    // Local fallback: if a static frontend server returns index.html for /api,
    // retry directly against backend on :8000.
    const canRetryLocal =
      typeof window !== "undefined" &&
      window.location.hostname === "localhost" &&
      API_BASE === "/api";

    if (canRetryLocal && text.includes("<!DOCTYPE html>")) {
      const directUrl = `http://localhost:8000/api${path}`;
      response = await fetch(directUrl, {
        headers: {
          ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
          ...(options.headers || {}),
        },
        ...options,
      });

      if (!response.ok) {
        const retryText = await response.text();
        throw new Error(retryText || `API request failed: ${response.status}`);
      }

      const retryType = response.headers.get("content-type") || "";
      if (!retryType.includes("application/json")) {
        text = await response.text();
        throw new Error(
          `Expected JSON from API but got '${retryType || "unknown"}'. URL: ${directUrl}. Response starts with: ${text.slice(0, 120)}`
        );
      }

      return response.json();
    }

    throw new Error(
      `Expected JSON from API but got '${contentType || "unknown"}'. URL: ${url}. Response starts with: ${text.slice(0, 120)}`
    );
  }

  return response.json();
}

export async function getCases() {
  return request("/cases");
}

export async function uploadCase(file) {
  const formData = new FormData();
  formData.append("file", file);

  return request("/cases/upload", {
    method: "POST",
    body: formData,
  });
}

export async function getCase(caseId) {
  return request(`/cases/${caseId}`);
}

export async function deleteCase(caseId) {
  return request(`/cases/${caseId}`, {
    method: "DELETE",
  });
}

export async function getCcmsDisposedCases() {
  return request("/ccms/disposed-cases");
}

export async function importCcmsCase(ccmsCaseId) {
  return request(`/ccms/import/${encodeURIComponent(ccmsCaseId)}`, {
    method: "POST",
  });
}

export async function triggerExtraction(caseId) {
  return request(`/cases/${caseId}/extract`, {
    method: "POST",
  });
}

export async function getDashboardStats() {
  return request("/dashboard/stats");
}

export async function getTrustedActions() {
  return request("/dashboard/trusted-actions");
}

// Gap 4: Department workload
export async function getDepartmentWorkload() {
  return request("/dashboard/workload");
}

// Gap 3 & 6: Urgent actions with deadline + appeal window
export async function getUrgentActions() {
  return request("/dashboard/urgent");
}

// Gap 2: Audit trail
export async function getCaseAuditLog(caseId) {
  return request(`/dashboard/audit/case/${caseId}`);
}

export async function getAllAuditLogs(limit = 50) {
  return request(`/dashboard/audit?limit=${limit}`);
}

export async function getReviewQueue() {
  return request("/review/queue");
}

export async function submitReview(actionId, payload) {
  return request(`/review/actions/${actionId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function completeAction(actionId) {
  return request(`/actions/${actionId}/complete`, {
    method: "POST",
  });
}

export async function uploadProof(caseId, file, proofType, uploadedBy, actionId) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("proof_type", proofType);
  formData.append("uploaded_by", uploadedBy);
  if (actionId) {
    formData.append("action_id", actionId);
  }

  return request(`/proofs/upload/${caseId}`, {
    method: "POST",
    body: formData,
  });
}
