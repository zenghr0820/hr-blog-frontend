import { apiClient } from "./client";

export interface UploadResponse {
  url: string;
  file_id: string;
}

export async function uploadFile(
  file: File,
  policyFlag = "default"
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("policyFlag", policyFlag);

  const response = await apiClient.post<UploadResponse>("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
}
