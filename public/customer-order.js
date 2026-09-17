const orderForm = document.querySelector('#customer-order-form');

if (orderForm) {
  orderForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = document.querySelector('#order-message');
    const items = [...orderForm.querySelectorAll('[data-menu-id]:checked')].map((checkbox) => ({
      menu_item_id: Number(checkbox.dataset.menuId),
      quantity: Number(checkbox.closest('.menu-choice').querySelector('[data-quantity]').value)
    }));
    if (!items.length) {
      message.textContent = 'Choose at least one menu item.';
      return;
    }
    const response = await fetch(orderForm.action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) });
    const result = await response.text();
    if (!response.ok) {
      message.textContent = result;
      return;
    }
    document.open();
    document.write(result);
    document.close();
  });
}