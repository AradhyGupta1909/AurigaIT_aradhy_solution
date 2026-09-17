const rows = document.querySelector('#customer-rows');
const filters = document.querySelector('#customer-filters');
const tableMessage = document.querySelector('#table-message');
const pageSummary = document.querySelector('#page-summary');
const previousPage = document.querySelector('#previous-page');
const nextPage = document.querySelector('#next-page');
const state = new URLSearchParams(window.location.search);
let page = Number(state.get('page') || 1);
let sort = state.get('sort') || 'created_at';
let order = state.get('order') || 'desc';
const limit = 10;

filters.search.value = state.get('search') || '';
filters.status.value = state.get('status') || '';

document.querySelectorAll('[data-sort]').forEach((button) => {
  button.addEventListener('click', () => {
    const nextSort = button.dataset.sort;
    if (sort === nextSort) order = order === 'asc' ? 'desc' : 'asc';
    else { sort = nextSort; order = 'asc'; }
    page = 1;
    loadCustomers();
  });
});

filters.addEventListener('submit', (event) => {
  event.preventDefault();
  page = 1;
  loadCustomers();
});

previousPage.addEventListener('click', () => { if (page > 1) { page -= 1; loadCustomers(); } });
nextPage.addEventListener('click', () => { page += 1; loadCustomers(); });

function queryString() {
  const params = new URLSearchParams({
    search: filters.search.value.trim(),
    status: filters.status.value,
    page,
    limit,
    sort,
    order
  });
  return params;
}

function updateUrl() {
  window.history.replaceState({}, '', `/dashboard?${queryString()}`);
}

function displayDate(value) {
  return value ? new Date(`${value.replace(' ', 'T')}Z`).toLocaleDateString() : '-';
}

async function loadCustomers() {
  tableMessage.textContent = '';
  rows.innerHTML = '<tr><td colspan="5">Loading customers...</td></tr>';
  updateUrl();
  const response = await fetch(`/api/customers?${queryString()}`);
  const result = await response.json();
  if (!response.ok) {
    tableMessage.textContent = result.error || 'Unable to load customers';
    rows.innerHTML = '<tr><td colspan="5">No customers found.</td></tr>';
    return;
  }

  rows.innerHTML = result.customers.length ? result.customers.map((customer) => `
    <tr>
      <td><strong>${escapeHtml(customer.name)}</strong></td>
      <td>${escapeHtml(customer.phone)}</td>
      <td><span class="status status-${customer.current_status}">${customer.current_status}</span></td>
      <td>${displayDate(customer.created_at)}</td>
      <td>${actionButton(customer)}</td>
    </tr>
  `).join('') : '<tr><td colspan="5">No customers found.</td></tr>';
  pageSummary.textContent = `Page ${result.pagination.page} of ${Math.max(result.pagination.total_pages, 1)} · ${result.pagination.total} customers`;
  previousPage.disabled = page <= 1;
  nextPage.disabled = page >= result.pagination.total_pages;
  document.querySelectorAll('[data-subscription-action]').forEach((button) => button.addEventListener('click', changeSubscriptionStatus));
  document.querySelectorAll('[data-transfer-toggle]').forEach((button) => button.addEventListener('click', toggleTransferForm));
  document.querySelectorAll('[data-transfer-search]').forEach((input) => input.addEventListener('input', searchTransferCustomers));
  document.querySelectorAll('[data-transfer-form]').forEach((form) => form.addEventListener('submit', transferSubscription));
  document.querySelectorAll('[data-sort]').forEach((button) => {
    button.querySelector('span').textContent = button.dataset.sort === sort ? (order === 'asc' ? '↑' : '↓') : '';
  });
}

function actionButton(customer) {
  if (customer.current_status === 'active' || customer.current_status === 'paused') {
    const statusButton = `<button class="small-button" data-subscription-action="${customer.current_status === 'active' ? 'pause' : 'resume'}" data-subscription-id="${customer.subscription_id}">${customer.current_status === 'active' ? 'Pause' : 'Resume'}</button>`;
    if (customer.current_status !== 'active') return statusButton;
    return `${statusButton}
      <button class="small-button" data-transfer-toggle data-subscription-id="${customer.subscription_id}">Transfer</button>
      <form class="transfer-form" data-transfer-form data-subscription-id="${customer.subscription_id}" hidden>
        <input data-transfer-search type="search" placeholder="Search name or phone" aria-label="Search new customer">
        <select data-transfer-customer required aria-label="New customer"><option value="">Choose customer</option></select>
        <input data-transfer-date type="date" value="${new Date().toISOString().slice(0, 10)}" required aria-label="Transfer date">
        <button class="small-button" type="submit">Save</button>
      </form>`;
  }
  return '<span class="muted">-</span>';
}

function toggleTransferForm(event) {
  const button = event.currentTarget;
  const form = document.querySelector(`[data-transfer-form][data-subscription-id="${button.dataset.subscriptionId}"]`);
  form.hidden = !form.hidden;
}

async function searchTransferCustomers(event) {
  const input = event.currentTarget;
  const form = input.closest('[data-transfer-form]');
  const select = form.querySelector('[data-transfer-customer]');
  const response = await fetch(`/api/customers?search=${encodeURIComponent(input.value.trim())}&limit=20&sort=name&order=asc`);
  if (!response.ok) return;
  const result = await response.json();
  select.innerHTML = '<option value="">Choose customer</option>' + result.customers.map((customer) => `<option value="${customer.id}">${escapeHtml(customer.name)} - ${escapeHtml(customer.phone)}</option>`).join('');
}

async function transferSubscription(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const response = await fetch(`/api/subscriptions/${form.dataset.subscriptionId}/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      new_customer_id: Number(form.querySelector('[data-transfer-customer]').value),
      transferred_on: form.querySelector('[data-transfer-date]').value
    })
  });
  if (!response.ok) {
    const result = await response.json();
    tableMessage.textContent = result.error || 'Unable to transfer subscription';
    return;
  }
  loadCustomers();
}

async function changeSubscriptionStatus(event) {
  const button = event.currentTarget;
  const action = button.dataset.subscriptionAction;
  const response = await fetch(`/api/subscriptions/${button.dataset.subscriptionId}/${action}`, { method: 'POST' });
  if (!response.ok) {
    const result = await response.json();
    tableMessage.textContent = result.error || 'Unable to update subscription';
    return;
  }
  loadCustomers();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

loadCustomers();
