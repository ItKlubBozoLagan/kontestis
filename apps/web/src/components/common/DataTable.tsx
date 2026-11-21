import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type Row,
    type SortingState,
    useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

declare module "@tanstack/react-table" {
    // eslint-disable-next-line unused-imports/no-unused-vars
    interface ColumnMeta<TData, TValue> {
        className?: string;
    }
}

const INTERACTIVE_SELECTOR = "a,button,input,[role=checkbox],[data-no-row-click]";

type Props<T> = {
    columns: ColumnDef<T, any>[];
    data: T[];
    /** Shows a search box filtering over every column's accessor value. */
    searchable?: boolean;
    searchPlaceholder?: string;
    /** Client side pagination; omit to render every row. */
    pageSize?: number;
    initialSorting?: SortingState;
    /** Makes rows navigate on click (middle click / ctrl-click open a new tab). */
    rowHref?: (row: T) => string | undefined;
    onRowClick?: (row: T) => void;
    rowClassName?: (row: Row<T>) => string | undefined;
    getRowId?: (row: T) => string;
    toolbar?: ReactNode;
    empty?: ReactNode;
    className?: string;
    /** Use the monospace "classic Kontestis" table body. */
    mono?: boolean;
};

export function DataTable<T>({
    columns,
    data,
    searchable = false,
    searchPlaceholder,
    pageSize,
    initialSorting = [],
    rowHref,
    onRowClick,
    rowClassName,
    getRowId,
    toolbar,
    empty,
    className,
    mono = true,
}: Props<T>) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [sorting, setSorting] = useState<SortingState>(initialSorting);
    const [globalFilter, setGlobalFilter] = useState("");

    const table = useReactTable({
        data,
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getRowId,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        ...(pageSize
            ? {
                  getPaginationRowModel: getPaginationRowModel(),
                  initialState: { pagination: { pageSize, pageIndex: 0 } },
              }
            : {}),
        autoResetPageIndex: true,
    });

    const { rows } = table.getRowModel();
    const clickable = !!rowHref || !!onRowClick;

    const handleRowClick = (
        event: React.MouseEvent,
        href: string | undefined,
        fallback: () => void
    ) => {
        // let interactive children (links, buttons, checkboxes) handle their own clicks
        if ((event.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) return;

        if (!href) return fallback();

        if (event.ctrlKey || event.metaKey) window.open(href, "_blank");
        else navigate(href);
    };

    return (
        <div className={cn("flex w-full flex-col gap-3", className)}>
            {(searchable || toolbar) && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                    {searchable && (
                        <div className="relative w-full max-w-xs">
                            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                            <Input
                                value={globalFilter}
                                onChange={(event) => setGlobalFilter(event.target.value)}
                                placeholder={searchPlaceholder ?? t("common.search")}
                                className="pl-8"
                            />
                        </div>
                    )}
                    {toolbar && (
                        <div className="ml-auto flex flex-wrap items-center gap-2">{toolbar}</div>
                    )}
                </div>
            )}
            <div className="bg-card overflow-hidden rounded-md border">
                <Table>
                    <TableHeader className="bg-muted/70">
                        {table.getHeaderGroups().map((group) => (
                            <TableRow key={group.id} className="hover:bg-transparent">
                                {group.headers.map((header) => {
                                    const sortable = header.column.getCanSort();
                                    const sorted = header.column.getIsSorted();

                                    return (
                                        <TableHead
                                            key={header.id}
                                            className={cn(
                                                "h-10",
                                                header.column.columnDef.meta?.className
                                            )}
                                        >
                                            {header.isPlaceholder ? null : sortable ? (
                                                <button
                                                    type="button"
                                                    onClick={header.column.getToggleSortingHandler()}
                                                    className="hover:text-foreground -ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5"
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {sorted === "asc" ? (
                                                        <ArrowUp className="size-3.5" />
                                                    ) : sorted === "desc" ? (
                                                        <ArrowDown className="size-3.5" />
                                                    ) : (
                                                        <ArrowUpDown className="size-3.5 opacity-40" />
                                                    )}
                                                </button>
                                            ) : (
                                                flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )
                                            )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody className={cn(mono && "font-mono text-[13px]")}>
                        {rows.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell
                                    colSpan={columns.length}
                                    className="text-muted-foreground h-24 text-center font-sans"
                                >
                                    {empty ??
                                        (globalFilter ? t("common.noResults") : t("common.empty"))}
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row) => {
                                const href = rowHref?.(row.original);

                                return (
                                    <TableRow
                                        key={row.id}
                                        className={cn(
                                            "even:bg-muted/40",
                                            clickable && "cursor-pointer",
                                            rowClassName?.(row)
                                        )}
                                        onClick={(event) =>
                                            handleRowClick(event, href, () =>
                                                onRowClick?.(row.original)
                                            )
                                        }
                                        onAuxClick={(event) => {
                                            if (event.button === 1 && href)
                                                window.open(href, "_blank");
                                        }}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell
                                                key={cell.id}
                                                className={cell.column.columnDef.meta?.className}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
            {pageSize && table.getPageCount() > 1 && (
                <div className="text-muted-foreground flex items-center justify-end gap-2 text-sm">
                    <span>
                        {t("common.page", {
                            page: table.getState().pagination.pageIndex + 1,
                            pages: table.getPageCount(),
                        })}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        aria-label={t("common.previous")}
                    >
                        <ChevronLeft />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        aria-label={t("common.next")}
                    >
                        <ChevronRight />
                    </Button>
                </div>
            )}
        </div>
    );
}
