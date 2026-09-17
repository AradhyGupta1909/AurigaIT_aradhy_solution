const billForm = document.querySelector('#bill-filters');
const monthInput = document.querySelector('#month');
const billRows = document.querySelector('#bill-rows');
const billMessage = document.querySelector('#bill-message');
const billTotal = document.querySelector('#bill-total');

if (!monthInput.value) monthInput.value = new Date().toISOString().slice(0, 7);
billForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loadBills();
});

async function loadBills() {
  billMessage.textContent = '';
  billRows.innerHTML = '<tr><td colspan="5">Loading bills...</td></tr>';
  const month = monthInput.value;
  const response = await fetch(`/api/bills?month=${encodeURIComponent(month)}`);
  const result = await response.json();
  if (!response.ok) {
    billMessage.textContent = result.error || 'Unable to load bills';
    return;
  }
  billRows.innerHTML = result.bills.length ? result.bills.map((bill) => `
    <tr><td><strong>${escapeHtml(bill.customer_name)}</strong></td><td>${escapeHtml(bill.customer_phone)}</td><td>${escapeHtml(bill.plan_name)}</td><td>${bill.days_delivered} / ${bill.total_weekdays}</td><td class="amount">${Number(bill.bill).toFixed(2)}</td></tr>
  `).join('') : '<tr><td colspan="5">No subscriptions found.</td></tr>';
  billTotal.textContent = result.bills.reduce((total, bill) => total + Number(bill.bill), 0).toFixed(2);
  window.history.replaceState({}, '', `/bills?month=${encodeURIComponent(month)}`);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

if (monthInput.value) loadBills();
