import styled from "styled-components";
import tw from "twin.macro";

export const Table = tw.table`
    table-fixed bg-neutral-100 border-collapse border-solid border-neutral-200 border-2 text-left
`;

export const TableHeadRow = tw.tr`
    border border-neutral-400 border-solid
`;

export const TableHeadItem = styled.td`
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    padding-left: 1rem;
    ${tw`text-lg font-mono text-neutral-900`}
`;

export const TableRow = styled.tr`
    border-bottom: 1px solid;
    ${tw`border-neutral-300`};
`;

export const TableItem = styled.td`
    padding-top: 1rem;
    padding-bottom: 1rem;
    padding-left: 1rem;
    ${tw`text-sm font-mono text-neutral-700`}
`;
