const formatCurrency = (value) =>
  new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR"
  }).format(value);

const prepareData = (data) => {
  const items = data.items.map((item) => {
    const lineBase = item.price * item.quantity;
    const commissionAmount = lineBase * (item.commission / 100);
    const lineTotal = lineBase - commissionAmount;

    return {
      ...item,
      price_formatted: formatCurrency(item.price),
      commission_formatted: `${item.commission.toFixed(2).replace(".", ",")}%`,
      total_formatted: formatCurrency(lineTotal),
      line_total: lineTotal
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
  const vatAmount = subtotal * (data.vat.percentage / 100);
  const total = subtotal + vatAmount;

  return {
    ...data,
    items,
    totals: {
      subtotal: formatCurrency(subtotal),
      vat: formatCurrency(vatAmount),
      total: formatCurrency(total)
    }
  };
};

module.exports = {
  prepareData
};
