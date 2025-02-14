import { type DialogProps } from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import * as React from "react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const Command = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...properties }, reference) => (
    <CommandPrimitive
        ref={reference}
        className={cn(
            "flex h-full w-full flex-col overflow-hidden rounded-md bg-white text-slate-950 dark:bg-slate-950 dark:text-slate-50",
            className
        )}
        {...properties}
    />
));

Command.displayName = CommandPrimitive.displayName;

const CommandDialog = ({ children, ...properties }: DialogProps) => {
    return (
        <Dialog {...properties}>
            <DialogContent className="overflow-hidden p-0 shadow-lg">
                <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5 dark:[&_[cmdk-group-heading]]:text-slate-400">
                    {children}
                </Command>
            </DialogContent>
        </Dialog>
    );
};

const CommandInput = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.Input>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...properties }, reference) => (
    <div className="flex items-center border-b px-3 dark:border-slate-700" cmdk-input-wrapper="">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandPrimitive.Input
            ref={reference}
            className={cn(
                "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50 dark:placeholder:text-slate-400",
                className
            )}
            {...properties}
        />
    </div>
));

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...properties }, reference) => (
    <CommandPrimitive.List
        ref={reference}
        className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
        {...properties}
    />
));

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.Empty>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((properties, reference) => (
    <CommandPrimitive.Empty ref={reference} className="py-6 text-center text-sm" {...properties} />
));

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.Group>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...properties }, reference) => (
    <CommandPrimitive.Group
        ref={reference}
        className={cn(
            "overflow-hidden p-1 text-slate-950 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-500 dark:text-slate-50 dark:[&_[cmdk-group-heading]]:text-slate-400",
            className
        )}
        {...properties}
    />
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...properties }, reference) => (
    <CommandPrimitive.Separator
        ref={reference}
        className={cn("-mx-1 h-px bg-slate-200 dark:bg-slate-800", className)}
        {...properties}
    />
));

CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<
    React.ElementRef<typeof CommandPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...properties }, reference) => (
    <CommandPrimitive.Item
        ref={reference}
        className={cn(
            "relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected='true']:bg-slate-100 data-[selected=true]:text-slate-900 data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:data-[selected='true']:bg-slate-800 dark:data-[selected=true]:text-slate-50",
            className
        )}
        {...properties}
    />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({ className, ...properties }: React.HTMLAttributes<HTMLSpanElement>) => {
    return (
        <span
            className={cn(
                "ml-auto text-xs tracking-widest text-slate-500 dark:text-slate-400",
                className
            )}
            {...properties}
        />
    );
};

CommandShortcut.displayName = "CommandShortcut";

export {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
};
