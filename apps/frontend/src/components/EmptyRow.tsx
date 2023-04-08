import { useTranslation } from "../hooks/useTranslation";
import { TableItem, TableRow } from "./Table";

type Properties<T> = {
    contents: T[];
};

export const EmptyRow = <T,>({ contents }: Properties<T>) => {
    const { t } = useTranslation();

    if (contents.length > 0) return <></>;

    return (
        <TableRow>
            <TableItem colSpan={100} tw={"text-center"}>
                {t("helper.tableNoContents")}
            </TableItem>
        </TableRow>
    );
};
