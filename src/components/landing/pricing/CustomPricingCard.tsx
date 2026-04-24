"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EXTRA_STUDENT_COST, EXTRA_USER_COST, PLAN_CONFIG, type PlanType } from "@/config/plans";

export default function CustomPricingCard() {
    const plans: PlanType[] = ["STARTER", "TEAM", "GROWTH", "SCALE"];

    const [selectedPlan, setSelectedPlan] = useState<PlanType>("GROWTH");
    const includedUsers = PLAN_CONFIG[selectedPlan].userLimit ?? 0;
    const includedStudents = PLAN_CONFIG[selectedPlan].studentLimit ?? 0;
    const includedEnquiries = PLAN_CONFIG[selectedPlan].enquiryLimit ?? 0;

    const [users, setUsers] = useState<number>(includedUsers || 1);
    const [students, setStudents] = useState<number>(includedStudents || 0);
    const [enquiries, setEnquiries] = useState<number>(includedEnquiries || 0);
    const [customBase, setCustomBase] = useState<number>(0);

    const basePrice = selectedPlan === "SCALE" ? customBase : PLAN_CONFIG[selectedPlan].priceMonthly ?? 0;
    const extraUsers = Math.max(0, users - (PLAN_CONFIG[selectedPlan].userLimit ?? users));
    const extraUsersCost = extraUsers * EXTRA_USER_COST;

    const extraStudents = Math.max(0, students - (PLAN_CONFIG[selectedPlan].studentLimit ?? students));
    const extraStudentsCost = extraStudents * EXTRA_STUDENT_COST;

    const total = basePrice + extraUsersCost + extraStudentsCost;

    return (
        <Card className="rounded-lg border">
            <CardHeader>
                <CardTitle className="text-2xl">Estimate custom pricing</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Quick estimate for extra users and students beyond the included plan limits.</p>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                    <label className="flex flex-col">
                        <span className="text-xs font-medium text-muted-foreground">Start from plan</span>
                        <select
                            value={selectedPlan}
                            onChange={(e) => {
                                const p = e.target.value as PlanType;
                                setSelectedPlan(p);
                                setUsers(PLAN_CONFIG[p].userLimit ?? 1);
                                setStudents(PLAN_CONFIG[p].studentLimit ?? 0);
                                setEnquiries(PLAN_CONFIG[p].enquiryLimit ?? 0);
                                setCustomBase(0);
                            }}
                            className="mt-1 rounded-md border px-2 py-1"
                        >
                            {plans.map((p) => (
                                <option key={p} value={p}>{PLAN_CONFIG[p].name}</option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col">
                        <span className="text-xs font-medium text-muted-foreground">Number of users</span>
                        <input
                            type="number"
                            min={1}
                            value={users}
                            onChange={(e) => setUsers(Number(e.target.value) || 0)}
                            className="mt-1 rounded-md border px-2 py-1"
                        />
                        <span className="text-xs text-muted-foreground mt-1">
                            Included: {PLAN_CONFIG[selectedPlan].userLimit ?? "Unlimited"} users
                        </span>
                    </label>

                    <label className="flex flex-col">
                        <span className="text-xs font-medium text-muted-foreground">Students in system</span>
                        <input
                            type="number"
                            min={0}
                            value={students}
                            onChange={(e) => setStudents(Number(e.target.value) || 0)}
                            className="mt-1 rounded-md border px-2 py-1"
                        />
                        <span className="text-xs text-muted-foreground mt-1">
                            Included: {PLAN_CONFIG[selectedPlan].studentLimit ?? "Unlimited"} students
                        </span>
                    </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col">
                        <span className="text-xs font-medium text-muted-foreground">Monthly enquiries</span>
                        <input
                            type="number"
                            min={0}
                            value={enquiries}
                            onChange={(e) => setEnquiries(Number(e.target.value) || 0)}
                            className="mt-1 rounded-md border px-2 py-1"
                        />
                        <span className="text-xs text-muted-foreground mt-1">
                            Included: {PLAN_CONFIG[selectedPlan].enquiryLimit ?? "Unlimited"} enquiries
                        </span>
                    </label>
                </div>

                {selectedPlan === "SCALE" ? (
                    <div className="space-y-1">
                        <label className="flex flex-col">
                            <span className="text-xs font-medium text-muted-foreground">Base monthly (enter your expected base)</span>
                            <input
                                type="number"
                                min={0}
                                value={customBase}
                                onChange={(e) => setCustomBase(Number(e.target.value) || 0)}
                                className="mt-1 rounded-md border px-2 py-1"
                            />
                        </label>
                        <p className="text-xs text-muted-foreground">Enterprise is custom—enter an initial base or contact sales for a quote.</p>
                    </div>
                ) : null}

                <div className="rounded-md bg-muted/10 p-3">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">Base price</div>
                        <div className="font-medium">
                            INR {basePrice.toLocaleString("en-IN")}{selectedPlan !== "SCALE" ? "/month" : ""}
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        <div className="text-sm text-muted-foreground">Extra users ({extraUsers})</div>
                        <div className="font-medium">INR {extraUsersCost.toLocaleString("en-IN")}/month</div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        <div className="text-sm text-muted-foreground">Extra students ({extraStudents})</div>
                        <div className="font-medium">INR {extraStudentsCost.toLocaleString("en-IN")}/month</div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        <div className="text-sm text-muted-foreground">Enquiry volume</div>
                        <div className="font-medium">{enquiries.toLocaleString("en-IN")} /month</div>
                    </div>

                    <div className="flex items-center justify-between mt-3 border-t pt-3">
                        <div className="text-sm font-semibold">Estimated monthly total</div>
                        <div className="text-lg font-semibold">INR {total.toLocaleString("en-IN")}</div>
                    </div>
                </div>
            </CardContent>

            <CardFooter>
                <div className="w-full grid gap-2 sm:grid-cols-2">
                    <Button className="h-11">Contact Sales</Button>
                    <Button variant="secondary" className="h-11">Save estimate</Button>
                </div>
            </CardFooter>
        </Card>
    );
}
