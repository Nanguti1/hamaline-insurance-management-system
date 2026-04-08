import * as React from 'react'

import { cn } from '@/lib/utils'

const Table = React.forwardRef<
    HTMLTableElement,
    React.ComponentProps<'table'>
>(({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
        <table
            ref={ref}
            data-slot="table"
            className={cn(
                'w-full caption-bottom text-sm [&_td]:text-foreground [&_th]:text-foreground',
                className,
            )}
            {...props}
        />
    </div>
))
Table.displayName = 'Table'

const TableHeader = React.forwardRef<
    HTMLTableSectionElement,
    React.ComponentProps<'thead'>
>(({ className, ...props }, ref) => (
    <thead
        ref={ref}
        data-slot="table-header"
        className={cn('bg-primary text-primary-foreground [&_tr]:border-b [&_tr]:border-primary/70', className)}
        {...props}
    />
))
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<
    HTMLTableSectionElement,
    React.ComponentProps<'tbody'>
>(({ className, ...props }, ref) => (
    <tbody
        ref={ref}
        data-slot="table-body"
        className={cn('[&_tr:last-child]:border-0 [&_tr:nth-child(odd)]:bg-white [&_tr:nth-child(even)]:bg-surface/60', className)}
        {...props}
    />
))
TableBody.displayName = 'TableBody'

const TableFooter = React.forwardRef<
    HTMLTableSectionElement,
    React.ComponentProps<'tfoot'>
>(({ className, ...props }, ref) => (
    <tfoot
        ref={ref}
        data-slot="table-footer"
        className={cn('bg-background font-medium text-foreground', className)}
        {...props}
    />
))
TableFooter.displayName = 'TableFooter'

const TableRow = React.forwardRef<
    HTMLTableRowElement,
    React.ComponentProps<'tr'>
>(({ className, ...props }, ref) => (
    <tr
        ref={ref}
        data-slot="table-row"
        className={cn(
            'border-b border-border/50 transition-colors hover:bg-secondary/40 data-[state=selected]:bg-secondary/50',
            className,
        )}
        {...props}
    />
))
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<
    HTMLTableCellElement,
    React.ComponentProps<'th'>
>(({ className, ...props }, ref) => (
    <th
        ref={ref}
        data-slot="table-head"
        className={cn(
            'h-12 px-4 text-left align-middle font-semibold text-primary-foreground [&:has([role=checkbox])]:pr-0',
            className,
        )}
        {...props}
    />
))
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<
    HTMLTableCellElement,
    React.ComponentProps<'td'>
>(({ className, ...props }, ref) => (
    <td
        ref={ref}
        data-slot="table-cell"
        className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
        {...props}
    />
))
TableCell.displayName = 'TableCell'

export {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
}

