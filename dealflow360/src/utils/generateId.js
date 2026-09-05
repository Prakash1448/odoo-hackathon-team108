export const generateId = (prefix) => {
  const counterKey = `dealflow_${prefix.toLowerCase()}_counter`;
  let current = parseInt(localStorage.getItem(counterKey) || '1043', 10);
  localStorage.setItem(counterKey, (current + 1).toString());
  return `${prefix}-${current}`;
};
