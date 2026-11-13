export const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export const printDocument = (title, content) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.alert('Please allow pop-ups to print or save this document as a PDF.');
    return;
  }

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
  printWindow.document.write(`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1e293b; margin: 40px; }
          h1 { color: #1d4ed8; margin-bottom: 4px; }
          .muted { color: #64748b; font-size: 13px; }
          .section { margin: 24px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { padding: 10px; text-align: left; border: 1px solid #cbd5e1; }
          th { background: #eff6ff; }
          .notes { white-space: pre-wrap; line-height: 1.5; }
          @media print { body { margin: 18mm; } }
        </style>
      </head>
      <body>${content}</body>
    </html>`);
  printWindow.document.close();
};
