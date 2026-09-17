const form = document.querySelector('#new-customer-form');
const message = document.querySelector('#form-message');
const startDate = document.querySelector('#start_date');
startDate.value = new Date().toISOString().slice(0, 10);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  message.textContent = 'Creating customer...';
  const data = Object.fromEntries(new FormData(form));

  try {
    const customerResponse = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name, phone: data.phone })
    });
    const customerResult = await customerResponse.json();
    if (!customerResponse.ok) throw new Error(customerResult.error || 'Unable to create customer');

    const subscriptionResponse = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customerResult.customer.id, plan_id: Number(data.plan_id), start_date: data.start_date })
    });
    const subscriptionResult = await subscriptionResponse.json();
    if (!subscriptionResponse.ok) throw new Error(subscriptionResult.error || 'Unable to create subscription');
    window.location.href = '/dashboard';
  } catch (error) {
    message.textContent = error.message;
    submit.disabled = false;
  }
});
