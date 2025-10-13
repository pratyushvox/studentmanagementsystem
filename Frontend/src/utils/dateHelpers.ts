// src/utils/dateHelpers.ts

/**
 * Format date to readable string (e.g., "Jan 15, 2024")
 */
export const formatDate = (dateString: string | Date): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format date with time (e.g., "Jan 15, 2024 at 2:30 PM")
 */
export const formatDateTime = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
  return `${dateStr} at ${timeStr}`;
};

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 */
export const formatTimeAgo = (dateString: string | Date): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  
  const diffSeconds = Math.floor(diffTime / 1000);
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "1d ago";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks === 1) return "1w ago";
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths === 1) return "1mo ago";
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  
  return formatDate(date);
};

/**
 * Get days remaining until deadline
 */
export const getDaysRemaining = (deadline: string | Date): string => {
  const today = new Date();
  const due = new Date(deadline);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return 'Overdue';
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `${diffDays} days left`;
};

/**
 * Check if date is overdue
 */
export const isOverdue = (deadline: string | Date): boolean => {
  const today = new Date();
  const due = new Date(deadline);
  return today > due;
};

/**
 * Get deadline urgency level
 */
export const getDeadlineUrgency = (
  deadline: string | Date
): 'high' | 'medium' | 'low' => {
  const today = new Date();
  const due = new Date(deadline);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0 || diffDays <= 1) return 'high';
  if (diffDays <= 3) return 'medium';
  return 'low';
};