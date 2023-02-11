import styled from "styled-components";
import tw from "twin.macro";

export const Table = tw.table`
    table-auto bg-neutral-100 border-collapse border-solid border-neutral-200 border-2 text-left
`;

export const TableHeadRow = tw.tr`
    border border-neutral-400 border-solid
`;

export const TableHeadItem = tw.td`
    text-lg font-mono text-neutral-900 py-2 px-4
`;

export const TableRow = styled.tr`
    border-bottom: 1px solid;
    ${tw`border-neutral-300`};
`;

export const TableItem = tw.td`
    text-sm font-mono text-neutral-700 py-4 px-4
`;
