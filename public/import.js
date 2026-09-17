const importForm = document.querySelector('#import-form');
const csvFile = document.querySelector('#csv-file');
const csvText = document.querySelector('#csv-text');
const importMessage = document.querySelector('#import-message');
const importReport = document.querySelector('#import-report');

csvFile.addEventListener('change', () => {
  const file = csvFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener('load', () => { csvText.value = reader.result; });
  reader.readAsText(file);
});

importForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  importMessage.textContent = 'Importing...';
  const response = await fetch('/api/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csv: csvText.value })
  });
  const result = await response.json();
  if (!response.ok) {
    importMessage.textContent = result.error || 'Unable to import CSV';
    return;
  }
  importMessage.textContent = 'Import complete.';
  importReport.hidden = false;
  document.querySelector('#imported-count').textContent = result.imported;
  document.querySelector('#deduped-count').textContent = result.deduped;
  document.querySelector('#rejected-rows').innerHTML = result.rejected.length
    ? result.rejected.map((item) => `<li>Row ${item.row}: ${escapeHtml(item.reason)}</li>`).join('')
    : '<li>No rejected rows.</li>';
});

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}