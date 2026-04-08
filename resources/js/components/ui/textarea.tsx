import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({
    className,
    ...props
}: React.ComponentProps<'textarea'>) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                'border-input flex min-h-[80px] w-full rounded-md border bg-white px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-accent focus-visible:ring-accent/40 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                'resize-y',
                className,
            )}
            {...props}
        />
    )
}

export { Textarea }

