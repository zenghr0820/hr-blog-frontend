import { apiClient } from "./client";
import { toSameOriginMediaUrl } from "@/utils/same-origin-media-url";

export interface UploadResponse {
  url: string;
  file_id: string;
}

export async function uploadFile(
  file: File,
  policyFlag = "default"
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("policyFlag", policyFlag);

  const response = await apiClient.post<UploadResponse>("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  if (response.code === 200 && response.data) {
    const { url } = response.data;
    if (url) {
      return toSameOriginMediaUrl(url);
    }
  }

  throw new Error(response.message || "上传图片失败");
}
