import { cpp } from "@codemirror/lang-cpp";
import { go } from "@codemirror/lang-go";
import { java } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { StreamLanguage } from "@codemirror/language";
import { gas } from "@codemirror/legacy-modes/mode/gas";
import { oCaml } from "@codemirror/legacy-modes/mode/mllike";
import type { EvaluationLanguage } from "@kontestis/models";
import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { useMemo } from "react";

import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

const extensionFor = (language: EvaluationLanguage | "plain") => {
    switch (language) {
        case "c":
        case "cpp":
            return [cpp()];
        case "python":
            return [python()];
        case "java":
            return [java()];
        case "go":
            return [go()];
        case "rust":
            return [rust()];
        case "ocaml":
            return [StreamLanguage.define(oCaml)];
        case "gnu_asm_x86_linux":
            return [StreamLanguage.define(gas)];
        default:
            return [];
    }
};

type Props = {
    value: string;
    onChange?: (value: string) => void;
    language: EvaluationLanguage | "plain";
    readOnly?: boolean;
    minHeight?: string;
    maxHeight?: string;
    className?: string;
    placeholder?: string;
};

export const CodeEditor = ({
    value,
    onChange,
    language,
    readOnly = false,
    minHeight = "240px",
    maxHeight = "70vh",
    className,
    placeholder,
}: Props) => {
    const { resolvedTheme } = useTheme();
    const extensions = useMemo(
        () => [...extensionFor(language), EditorView.lineWrapping],
        [language]
    );

    return (
        <CodeMirror
            value={value}
            onChange={onChange}
            extensions={extensions}
            editable={!readOnly}
            readOnly={readOnly}
            theme={resolvedTheme === "dark" ? "dark" : "light"}
            minHeight={minHeight}
            maxHeight={maxHeight}
            placeholder={placeholder}
            basicSetup={{ foldGutter: false, highlightActiveLine: !readOnly }}
            className={cn("overflow-hidden rounded-md border font-mono text-sm", className)}
        />
    );
};
