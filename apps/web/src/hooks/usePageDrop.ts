import { useEffect } from "react";

type Handlers = {
    /** Text pasted anywhere on the page outside of a text field. */
    onText: (text: string) => void;
    /** A file dropped anywhere on the page. */
    onFile: (file: File) => void;
    onDragging?: (dragging: boolean) => void;
};

const isEditable = (target: EventTarget | null) =>
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes("Files") ?? false;

/**
 * Page-wide paste and file drop. Contestants write code in their own editor, so the whole page
 * acts as the drop target instead of making them aim for a text box first.
 */
export const usePageDrop = ({ onText, onFile, onDragging }: Handlers) => {
    useEffect(() => {
        const onPaste = (event: ClipboardEvent) => {
            if (isEditable(event.target)) return;

            const text = event.clipboardData?.getData("text/plain");

            if (!text?.trim()) return;

            event.preventDefault();
            onText(text);
        };

        const onDragOver = (event: DragEvent) => {
            if (!hasFiles(event)) return;

            event.preventDefault();
            onDragging?.(true);
        };

        const onDragLeave = (event: DragEvent) => {
            if (event.relatedTarget === null) onDragging?.(false);
        };

        const onDrop = (event: DragEvent) => {
            if (!hasFiles(event)) return;

            event.preventDefault();
            onDragging?.(false);

            const file = event.dataTransfer?.files[0];

            if (file) onFile(file);
        };

        document.addEventListener("paste", onPaste);
        window.addEventListener("dragover", onDragOver);
        window.addEventListener("dragleave", onDragLeave);
        window.addEventListener("drop", onDrop);

        return () => {
            document.removeEventListener("paste", onPaste);
            window.removeEventListener("dragover", onDragOver);
            window.removeEventListener("dragleave", onDragLeave);
            window.removeEventListener("drop", onDrop);
        };
    }, [onText, onFile, onDragging]);
};
