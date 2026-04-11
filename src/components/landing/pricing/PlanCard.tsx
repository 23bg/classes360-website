import Link from "next/link";
import { useTranslations } from "next-intl";

import type { PlanType } from "@/config/plans";
import { PLAN_CONFIG } from "@/config/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import type { PlanDefinition } from "./pricing-data";
import { formatPlanPrice } from "./pricing-data";

type PlanCardProps = {
    plan: PlanDefinition;
    yearlyBilling: boolean;
    billingSuffix: string;
};

export default function PlanCard({
    plan,
    yearlyBilling,
    billingSuffix,
}: PlanCardProps) {
    const t = useTranslations("pricing");
    const planKey = plan.key.toLowerCase();
    const userLimit = PLAN_CONFIG[plan.key].userLimit;

    const usersLabel = userLimit === null
        ? t(`plans.${planKey}.usersUnlimited`)
        : t("plans.usersUpTo", { count: userLimit });

    const bestFitLines = [
        t(`plans.${planKey}.whenToUseLine1`),
        t(`plans.${planKey}.whenToUseLine2`),
        t(`plans.${planKey}.whenToUseLine3`),
    ];

    const includesLines = [
        t("plans.capabilities.item1"),
        t("plans.capabilities.item2"),
        t("plans.capabilities.item3"),
        t("plans.capabilities.item4"),
        t("plans.capabilities.item5"),
    ];

    return (
        <Card
            className={plan.highlight ? "rounded-lg border-2 border-primary shadow-lg" : "rounded-lg border"}
        >
            <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-4xl font-semibold">
                        INR {formatPlanPrice(plan.key, yearlyBilling)}
                    </CardTitle>
                    {plan.highlight ? <Badge>{t("mostPopular")}</Badge> : null}
                </div>

                <p className="text-sm text-muted-foreground">{billingSuffix}</p>

                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{t(`plans.${planKey}.name`)}</h3>
                    <p className="text-sm text-muted-foreground">{t(`plans.${planKey}.description`)}</p>
                    <p className="inline-flex rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {usersLabel}
                    </p>
                </div>
            </CardHeader>

            <CardContent className="space-y-5">
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("plans.includesLabel")}
                    </p>
                    <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                        {includesLines.map((line) => (
                            <li key={line} className="leading-5">
                                {line}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("plans.whenToUse")}
                    </p>
                    <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                        {bestFitLines.map((line) => (
                            <li key={line} className="leading-5">
                                {line}
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>

            <CardFooter>
                <Button asChild className="h-11 w-full">
                    <Link href={plan.link}>{t(`plans.${planKey}.cta`)}</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
