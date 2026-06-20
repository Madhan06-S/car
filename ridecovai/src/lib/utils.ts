export function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function calculateDays(start: string, end: string): number {
  return Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)));
}

export const coimbatoreLocations = ['Gandhipuram', 'RS Puram', 'Peelamedu', 'CJB Airport', 'Singanallur', 'Ukkadam', 'Saibaba Colony', 'Race Course'];
