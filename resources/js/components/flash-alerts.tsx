import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { INLINE_FLASH_EVENT, type InlineFlashDetail } from '@/lib/inline-flash';

type Flash = {
    success?: string | null;
    error?: string | null;
};

export function FlashAlerts() {
    const { flash } = usePage().props as { flash?: Flash };
    const [serverOpen, setServerOpen] = useState<{ text: string; variant: 'success' | 'error' } | null>(null);
    const [clientOpen, setClientOpen] = useState<{ text: string; variant: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const success = flash?.success ?? null;
        const error = flash?.error ?? null;

        if (!success && !error) {
            setServerOpen(null);
            return;
        }

        const variant = error ? 'error' : 'success';
        const text = (error ?? success) as string;
        setServerOpen({ text, variant });

        const id = window.setTimeout(() => setServerOpen(null), 5000);
        return () => window.clearTimeout(id);
    }, [flash?.success, flash?.error]);

    useEffect(() => {
        let timeoutId = 0;
        const handler = (event: Event) => {
            const e = event as CustomEvent<InlineFlashDetail>;
            const variant = e.detail.variant ?? 'success';
            window.clearTimeout(timeoutId);
            setClientOpen({ text: e.detail.message, variant });
            timeoutId = window.setTimeout(() => setClientOpen(null), 5000);
        };
        window.addEventListener(INLINE_FLASH_EVENT, handler);
        return () => {
            window.removeEventListener(INLINE_FLASH_EVENT, handler);
            window.clearTimeout(timeoutId);
        };
    }, []);

    const open = clientOpen ?? serverOpen;

    if (!open) {
        return null;
    }

    return (
        <Alert
            variant={open.variant === 'error' ? 'destructive' : 'default'}
            className={cn(
                'shadow-md',
                open.variant === 'success' &&
                    'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-50',
            )}
        >
            <AlertDescription
                className={open.variant === 'success' ? 'text-emerald-950 dark:text-emerald-50' : ''}
            >
                {open.text}
            </AlertDescription>
        </Alert>
    );
}
