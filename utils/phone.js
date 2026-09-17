function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!/^\d{10,13}$/.test(digits)) return null;
  if (digits.length === 10) return `+91${digits}`;
  return `+${digits}`;
}

module.exports = { normalizePhone };