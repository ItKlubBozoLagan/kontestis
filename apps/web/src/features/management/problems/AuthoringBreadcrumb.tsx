import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Crumb = { label: string; to?: string };

/** "Problems › <problem> › Cluster #2 › Testcase #5" trail inside contest management. */
export const AuthoringBreadcrumb = ({
    contestId,
    items,
}: {
    contestId: bigint;
    items: Crumb[];
}) => {
    const { t } = useTranslation();
    const crumbs: Crumb[] = [
        {
            label: t("managementProblems.breadcrumb.problems"),
            to: `/management/${contestId}/problems`,
        },
        ...items,
    ];

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {crumbs.map((crumb, index) => (
                    <Fragment key={index}>
                        {index > 0 && <BreadcrumbSeparator />}
                        <BreadcrumbItem className="max-w-64">
                            {crumb.to && index < crumbs.length - 1 ? (
                                <BreadcrumbLink asChild>
                                    <Link to={crumb.to} className="truncate">
                                        {crumb.label}
                                    </Link>
                                </BreadcrumbLink>
                            ) : (
                                <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                            )}
                        </BreadcrumbItem>
                    </Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
};

export const problemPath = (contestId: bigint, problemId: bigint | string) =>
    `/management/${contestId}/problems/${problemId}`;
