// frontend/src/services/api.js

const API_BASE = "http://localhost:8000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
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

  return response.json();
}

export async function getCases() {
  return request("/cases");
}

export async function getCase(caseId) {
  return request(`/cases/${caseId}`);
}

export async function triggerExtraction(caseId) {
  return request(`/cases/${caseId}/extract`, {
    method: "POST",
  });
}

export async function getDashboardStats() {
  return request("/dashboard/stats");
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

export async function uploadProof(caseId, file, proofType, uploadedBy) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("proof_type", proofType);
  formData.append("uploaded_by", uploadedBy);

  return request(`/proofs/upload?case_id=${caseId}`, {
    method: "POST",
    body: formData,
  });
}