import "twin.macro";

import { DOMAttributes } from "react";
import styledImport, { css as cssImport,CSSProp } from "styled-components/macro";

declare module "twin.macro" {
    // The styled and css imports
    const styled: typeof styledImport;
    const css: typeof cssImport;
}

declare module "react" {
    // The css prop
    interface HTMLAttributes<T> extends DOMAttributes<T> {
        css?: CSSProp
        tw?: string
    }
    // The inline svg css prop
    interface SVGProps<_T> extends SVGProps<SVGSVGElement> {
        css?: CSSProp
        tw?: string
    }
}
