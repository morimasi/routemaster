import type { DocumentItem } from './types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export class DocumentApiService {
  static async getDocuments(tenantId: string): Promise<DocumentItem[]> {
    try {
      return await post(`${API_BASE}/api/v5/documents/list`, { tenant_id: tenantId });
    } catch {
      await delay(300);
      return [
        { id: 'd1', name: 'Sabah_Bandi_Ogrenci_Listesi.pdf', type: 'pdf', size: '2.4 MB', date: '24 Tem 2026', status: 'processed', pages: 3 },
        { id: 'd2', name: 'WhatsApp_Rota_Listesi.png', type: 'image', size: '1.8 MB', date: '23 Tem 2026', status: 'processed' },
        { id: 'd3', name: 'Okul_Servis_Planı.xlsx', type: 'spreadsheet', size: '856 KB', date: '22 Tem 2026', status: 'processing' },
        { id: 'd4', name: 'Veli_Izin_Formu.pdf', type: 'pdf', size: '412 KB', date: '21 Tem 2026', status: 'processed', pages: 1 },
        { id: 'd5', name: 'Guzergah_Notu.jpg', type: 'image', size: '3.2 MB', date: '20 Tem 2026', status: 'error' },
        { id: 'd6', name: 'Arac_Bakim_Raporu.xlsx', type: 'spreadsheet', size: '1.1 MB', date: '19 Tem 2026', status: 'processed' },
      ];
    }
  }

  static async uploadDocument(tenantId: string, file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tenant_id', tenantId);
      const res = await fetch(`${API_BASE}/api/v5/documents/upload`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    } catch {
      await delay(1500);
      return { status: 'UPLOADED', document_id: `doc_${Date.now()}`, message: 'Dosya yüklendi ve OCR kuyruğuna alındı.' };
    }
  }

  static async downloadDocument(tenantId: string, documentId: string): Promise<string> {
    try {
      const res = await fetch(`${API_BASE}/api/v5/documents/${documentId}/download?tenant=${tenantId}`);
      if (!res.ok) throw new Error('Download failed');
      return URL.createObjectURL(await res.blob());
    } catch {
      await delay(200);
      return '#';
    }
  }

  static async deleteDocument(tenantId: string, documentId: string): Promise<any> {
    try {
      return await post(`${API_BASE}/api/v5/documents/${documentId}/delete`, { tenant_id: tenantId });
    } catch {
      await delay(200);
      return { status: 'DELETED' };
    }
  }
}
