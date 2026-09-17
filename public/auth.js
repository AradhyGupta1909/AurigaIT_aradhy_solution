document.querySelectorAll('[data-auth-form]').forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = form.querySelector('.form-message');
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    message.textContent = 'Working...';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to continue');
      message.textContent = 'Success. Your account is ready.';
      window.location.href = '/dashboard';
    } catch (error) {
      message.textContent = error.message;
      submitButton.disabled = false;
    }
  });
});
