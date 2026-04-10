export const INLINE_FLASH_EVENT = 'hims:inline-flash';

export type InlineFlashDetail = {
    message: string;
    variant?: 'success' | 'error';
};

export function pushInlineFlash(message: string, variant: InlineFlashDetail['variant'] = 'success'): void {
    window.dispatchEvent(new CustomEvent(INLINE_FLASH_EVENT, { detail: { message, variant } }));
}
