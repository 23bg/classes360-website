import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const flowSteps = ["enquiry", "followUp", "admission", "student"] as const;

export default function Hero() {
    const t = useTranslations("hero");

    return (
        <div className="w-full">
            <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
                {/* Left: Headline & CTA */}
                <div className="max-w-2xl space-y-6">
                    <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("label")}
                    </p>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground">
                        {t("headline")}
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground">
                        {t("subtext")}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button asChild size="lg" className="w-full sm:w-auto">
                            <Link href="/signup">{t("cta")}</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                            <Link href="/contact">{t("secondaryCta")}</Link>
                        </Button>
                    </div>

                    <p className="text-sm font-medium text-muted-foreground">
                        {t("trustLine")}
                    </p>
                </div>

                {/* Right: System Flow Visual */}
                <Card className="border-border bg-card h-full">
                    <CardContent className="p-4 md:p-6">
                        <h2 className="mb-4 text-sm font-semibold text-primary">{t("flow.title")}</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {flowSteps.map((step, index) => (
                                <div key={step} className="flex flex-col items-center">
                                    <div className="rounded-lg border border-border bg-background px-4 py-3 text-center text-sm font-medium shadow-sm transition-all hover:scale-[1.03] hover:shadow-md">
                                        {t(`flow.${step}.label`)}
                                    </div>
                                    {index < flowSteps.length - 1 && (
                                        <span className="hidden sm:block text-primary mt-2">→</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                            {flowSteps.map((step) => (
                                <p key={`${step}-line`}>{t(`flow.${step}.description`)}</p>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

