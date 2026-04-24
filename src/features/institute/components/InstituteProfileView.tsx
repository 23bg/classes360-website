"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type InstituteProfileViewProps = {
    data: {
        name: string;
        slug: string;
        description: string;
        phone: string;
        address: string;
        website: string;
        logo: string;
        banner: string;
        studentsCount: number;
        coursesCount: number;
    };
    onEdit: () => void;
};

export default function InstituteProfileView({ data, onEdit }: InstituteProfileViewProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{data.name || "Institute"}</CardTitle>
                <Button onClick={onEdit}>Edit</Button>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Slug: {data.slug || "-"}</p>
                <p>Phone: {data.phone || "-"}</p>
                <p>Address: {data.address || "-"}</p>
                <p>Website: {data.website || "-"}</p>
                <p>Students: {data.studentsCount}</p>
                <p>Courses: {data.coursesCount}</p>
                <p>{data.description || "No description provided."}</p>
            </CardContent>
        </Card>
    );
}
