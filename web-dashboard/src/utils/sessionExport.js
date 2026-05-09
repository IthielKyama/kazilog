import { api, buildAuthConfig } from '../lib/api';

function extractFilename(contentDisposition, fallbackName) {
  const match = contentDisposition?.match(/filename="?(?<name>[^"]+)"?/i);
  return match?.groups?.name || fallbackName;
}

export async function downloadSessionLogsPdf(sessionId, token, fallbackName = 'kazilog-session-logs.pdf') {
  const response = await api.get(`/logs/session/${sessionId}/export`, {
    ...buildAuthConfig(token),
    responseType: 'blob',
  });

  const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = extractFilename(response.headers?.['content-disposition'], fallbackName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
