interface PlatformBadgeProps {
  platform: string;
  status: string;
}

export function PlatformBadge({ platform, status }: PlatformBadgeProps) {
  const statusColor = {
    SUCCESS: 'bg-green-50 text-green-600 border-green-200',
    PUBLISHING: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    PENDING: 'bg-gray-50 text-gray-500 border-gray-200',
    FAILED: 'bg-red-50 text-red-600 border-red-200',
  }[status] || 'bg-gray-50 text-gray-500 border-gray-200';

  const statusIcon = {
    SUCCESS: '✅',
    PUBLISHING: '⏳',
    PENDING: '⏳',
    FAILED: '❌',
  }[status] || '⏳';

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColor}`}>
      {statusIcon} {platform}
    </span>
  );
}
