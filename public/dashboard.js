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
  document.querySelectorAll('[data-sort]').forEach((button) => {
    button.querySelector('span').textContent = button.dataset.sort === sort ? (order === 'asc' ? '↑' : '↓') : '';
  });
}

function actionButton(customer) {
  if (customer.current_status === 'active' || customer.current_status === 'paused') {
      return `<button class="small-button" data-subscription-action="${customer.current_status === 'active' ? 'pause' : 'resume'}" data-subscription-id="${customer.subscription_id}">${customer.current_status === 'active' ? 'Pause' : 'Resume'}</button>`;
  }
  return '<span class="muted">-</span>';
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
