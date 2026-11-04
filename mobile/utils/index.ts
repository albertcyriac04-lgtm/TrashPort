export const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
};

export const getTimeOfDay = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
};

export const getVehicleIcon = (type: string): string => {
  const lower = type.toLowerCase();
  if (lower.includes('truck')) return 'truck-outline';
  if (lower.includes('van')) return 'car-outline';
  if (lower.includes('three') || lower.includes('rickshaw')) return 'bicycle-outline';
  if (lower.includes('pickup')) return 'truck-outline';
  if (lower.includes('tempo')) return 'truck-outline';
  if (lower.includes('mini')) return 'car-outline';
  return 'car-outline';
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    REQUESTED: 'Requested',
    PENDING: 'Pending',
    AWAITING_PAYMENT: 'Awaiting Payment',
    ASSIGNED: 'Assigned',
    IN_TRANSIT: 'In Transit',
    ON_ROUTE: 'On Route',
    PICKED_UP: 'Picked Up',
    COMPLETED: 'Completed',
    HELD: 'Held',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
  };
  return labels[status] || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};
