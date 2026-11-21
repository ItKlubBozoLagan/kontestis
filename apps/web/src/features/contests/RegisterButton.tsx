import type { Contest } from "@kontestis/models";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useCurrentUser } from "@/api/auth";
import { useRegisterForContest } from "@/api/contests";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const CONSENT_DOCUMENT =
    "https://docs.google.com/document/d/1X8neYV8vG4MyrM56_ExmANihbTVWkhKAy1wnenm4bkc/edit?usp=sharing";
const CONSENT_FORM = "https://forms.gle/pk2dLqpY7qZLUbu78";
const COMPETITION_WEBSITE = "https://nap.xfer.hr";
const COMPETITION_RULES =
    "https://docs.google.com/document/d/1tKBnTB1HlAMCwKXFPm1w7yS6f_2hgQzNyf2F1PFs6YI/edit?usp=sharing";

const ExternalLink = ({ href, children }: { href: string; children?: React.ReactNode }) => (
    <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-primary underline-offset-2 hover:underline"
    >
        {children}
    </a>
);

/** AAI@EduHr data processing notice shown after registering for an edu-verified contest. */
const EduConsentDialog = ({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) => {
    const { t } = useTranslation();
    const user = useCurrentUser();

    if (!user.is_edu) return null;

    const dob = user.edu_data.dob ?? new Date("2000-01-01");
    const adultCutoff = new Date();

    adultCutoff.setFullYear(adultCutoff.getFullYear() - 18);

    const minor = new Date(dob).getTime() > adultCutoff.getTime();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{t("contests.register.consentTitle")}</DialogTitle>
                    <DialogDescription asChild>
                        <div className="text-foreground text-sm leading-relaxed">
                            {minor ? (
                                <Trans
                                    i18nKey="contests.register.minor"
                                    components={{
                                        consent: <ExternalLink href={CONSENT_DOCUMENT} />,
                                        form: <ExternalLink href={CONSENT_FORM} />,
                                    }}
                                />
                            ) : (
                                t("contests.register.adult")
                            )}
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-1 text-sm">
                    <ExternalLink href={COMPETITION_WEBSITE}>
                        {t("contests.register.website")}
                    </ExternalLink>
                    <ExternalLink href={COMPETITION_RULES}>
                        {t("contests.register.rules")}
                    </ExternalLink>
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>{t("contests.register.ok")}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

type Props = {
    contest: Pick<Contest, "id" | "name" | "require_edu_verification">;
    size?: "sm" | "default";
    variant?: "link" | "button";
    className?: string;
};

/** Registers the logged in user for a contest, showing the AAI@EduHr consent notice when needed. */
export const RegisterButton = ({ contest, size = "sm", variant = "button", className }: Props) => {
    const { t } = useTranslation();
    const register = useRegisterForContest(contest.id);
    const [consentOpen, setConsentOpen] = useState(false);

    const onClick = () =>
        register.mutate(undefined, {
            onSuccess: () => {
                toast.success(t("contests.register.success", { name: contest.name }));

                if (contest.require_edu_verification) setConsentOpen(true);
            },
        });

    return (
        <>
            {variant === "link" ? (
                <button
                    type="button"
                    onClick={onClick}
                    disabled={register.isPending}
                    className={cn(
                        "inline-flex items-center gap-1 font-medium text-yellow-600 hover:text-yellow-700 disabled:opacity-50 dark:text-yellow-400",
                        className
                    )}
                >
                    <UserPlus className="size-3.5" />
                    {t("contests.table.register")}
                </button>
            ) : (
                <Button
                    size={size}
                    onClick={onClick}
                    disabled={register.isPending}
                    className={className}
                >
                    <UserPlus />
                    {t("contests.table.register")}
                </Button>
            )}
            <EduConsentDialog open={consentOpen} onOpenChange={setConsentOpen} />
        </>
    );
};
