import type { FullUser } from "@kontestis/models";
import { useTranslation } from "react-i18next";

import { Section } from "@/components/common/Section";
import { AaiEduButton } from "@/features/auth/AaiEduButton";
import { formatDate } from "@/lib/format";

const Field = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col gap-0.5">
        <span className="text-muted-foreground text-xs">{label}</span>
        <span className="font-mono text-sm break-all">{value}</span>
    </div>
);

/** Linked AAI@EduHr identity, or a button to link one. */
export const EduDetails = ({ user }: { user: FullUser }) => {
    const { t } = useTranslation();

    if (!user.is_edu)
        return (
            <Section title={t("account.aaiedu.linkTitle")}>
                <div className="flex flex-col items-center gap-3 py-2 text-center sm:flex-row sm:justify-between sm:text-left">
                    <p className="text-muted-foreground text-sm">
                        {t("account.aaiedu.linkDescription")}
                    </p>
                    <AaiEduButton purpose="link" />
                </div>
            </Section>
        );

    const edu = user.edu_data;

    return (
        <Section title={t("account.aaiedu.title")}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t("account.aaiedu.userId")} value={edu.uid} />
                <Field label={t("account.aaiedu.fullName")} value={edu.full_name} />
                <Field label={t("account.aaiedu.email")} value={edu.email} />
                <Field label={t("account.aaiedu.associatedOrg")} value={edu.associated_org} />
                {edu.dob && (
                    <Field label={t("account.aaiedu.dob")} value={formatDate(new Date(edu.dob))} />
                )}
                {edu.student_category && (
                    <Field
                        label={t("account.aaiedu.studentCategory")}
                        value={edu.student_category}
                    />
                )}
                {edu.professional_status && (
                    <Field
                        label={t("account.aaiedu.professionalStatus")}
                        value={edu.professional_status}
                    />
                )}
            </div>
        </Section>
    );
};
