"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeleteTeamMember, useTeamData } from "@/features/appTeam/hooks/useAppTeam";

export default function TeamPage() {
    const { data, isLoading } = useTeamData();
    const deleteMember = useDeleteTeamMember();

    if (isLoading) {
        return <main className="p-6">Loading...</main>;
    }

    return (
        <main className="p-6 space-y-4">
            <h1 className="text-2xl font-semibold">Team</h1>
            <div className="grid gap-4 md:grid-cols-2">
                {(data?.rows ?? []).map((row) => (
                    <Card key={`${row.source}-${row.id}`}>
                        <CardHeader>
                            <CardTitle className="text-base">{row.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p>{row.email || "No email"}</p>
                            <p>{row.phone || "No phone"}</p>
                            <p>Role: {row.role}</p>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                    try {
                                        await deleteMember.mutateAsync(row);
                                        toast.success("Member deleted");
                                    } catch {
                                        toast.error("Failed to delete member");
                                    }
                                }}
                            >
                                Remove
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </main>
    );
}
