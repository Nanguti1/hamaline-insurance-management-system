export function formatDate(value?: string | null): string {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-KE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

export function formatDateRange(start?: string | null, end?: string | null): string {
    if (!start || !end) return '-';
    return `${formatDate(start)} - ${formatDate(end)}`;
}

