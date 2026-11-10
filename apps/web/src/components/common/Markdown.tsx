import "highlight.js/styles/github.css";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { cn } from "@/lib/utils";

/** Problem statements and other user authored markdown (GFM + KaTeX math + highlighted code). */
export const Markdown = ({ children, className }: { children: string; className?: string }) => (
    <div
        className={cn(
            "prose prose-neutral dark:prose-invert max-w-none",
            "prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
            "prose-pre:bg-muted prose-pre:text-foreground prose-pre:border prose-pre:w-fit prose-pre:min-w-64",
            "prose-code:before:content-none prose-code:after:content-none",
            "prose-img:mx-auto prose-table:w-auto",
            className
        )}
    >
        <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex, rehypeHighlight]}
        >
            {children}
        </ReactMarkdown>
    </div>
);
