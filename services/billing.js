function monthDetails(month) {
  if (!/^\d{4}-\d{2}$/.test(month)) return null;

  const year = Number(month.slice(0, 4));
  const monthIndex = Number(month.slice(5, 7)) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;

  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return { year, monthIndex, daysInMonth };
}

function dateString(year, monthIndex, day) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isWeekday(year, monthIndex, day) {
  const weekday = new Date(Date.UTC(year, monthIndex, day)).getUTCDay();
  return weekday >= 1 && weekday <= 5;
}

function calculateBill({ month, planPrice, startDate, pauses, fromDate = null, toDate = null }) {
  const details = monthDetails(month);
  if (!details) throw new Error('month must use YYYY-MM format');

  const weekdays = [];
  for (let day = 1; day <= details.daysInMonth; day += 1) {
    if (isWeekday(details.year, details.monthIndex, day)) {
      weekdays.push(dateString(details.year, details.monthIndex, day));
    }
  }

  const daysDelivered = weekdays.filter((date) => {
    if (date < startDate) return false;
    if (fromDate && date < fromDate) return false;
    if (toDate && date >= toDate) return false;
    return !pauses.some((pause) => (
      pause.paused_from <= date && (pause.paused_to === null || date <= pause.paused_to)
    ));
  }).length;

  const bill = Math.round((Number(planPrice) * daysDelivered / weekdays.length) * 100) / 100;
  return {
    total_weekdays: weekdays.length,
    days_delivered: daysDelivered,
    bill
  };
}

module.exports = { monthDetails, calculateBill };