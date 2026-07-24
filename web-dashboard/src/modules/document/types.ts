export interface DocumentItem {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'spreadsheet' | 'other';
  size: string;
  date: string;
  status: 'processed' | 'processing' | 'pending' | 'error';
  pages?: number;
}
