import { useTranslations } from "next-intl";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const columns = ["starter", "team", "growth", "scale"] as const;
const rows = [
    "users",
    "students",
    "enquiries",
    "enquiryTracking",
    "studentRecords",
    "coursesBatches",
    "feeTracking",
    "alerts",
    "emailAlerts",
    "dataOwnership",
    "support",
] as const;

export default function PricingComparisonTable() {
    const t = useTranslations("pricing");

    return (
        <section className="mt-14 space-y-4">
            <div className="space-y-1 text-center">
                <h3 className="text-2xl font-semibold">{t("comparisonTable.title")}</h3>
                <p className="text-sm text-muted-foreground">{t("comparisonTable.subtext")}</p>
            </div>

            <div className="overflow-hidden rounded-xl border bg-background">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[180px]">{t("comparisonTable.featureColumn")}</TableHead>
                            {columns.map((column) => (
                                <TableHead key={column} className="text-center">
                                    {t(`comparisonTable.columns.${column}`)}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row}>
                                <TableCell className="font-medium">{t(`comparisonTable.rows.${row}.feature`)}</TableCell>
                                {columns.map((column) => (
                                    <TableCell key={`${row}-${column}`} className="text-center text-sm text-muted-foreground">
                                        {t(`comparisonTable.rows.${row}.values.${column}`)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </section>
    );
}
