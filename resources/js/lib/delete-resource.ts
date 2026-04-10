import { router } from '@inertiajs/react';

import { pushInlineFlash } from '@/lib/inline-flash';

/**
 * DELETE, show a short-lived alert, then reload props so index tables stay in sync.
 * Session flash from the redirect would be consumed before a manual reload could run,
 * so we surface delete confirmation via {@link pushInlineFlash} instead.
 */
export function deleteResource(url: string, message = 'Deleted successfully.'): void {
    router.delete(url, {
        preserveScroll: true,
        preserveState: false,
        onSuccess: () => {
            pushInlineFlash(message);
            router.reload();
        },
    });
}
