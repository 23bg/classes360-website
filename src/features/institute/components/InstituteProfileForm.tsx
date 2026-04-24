"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type InstituteFormValues = {
    name: string;
    slug: string;
    description: string;
    phone: string;
    whatsapp: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    region: string;
    postalCode: string;
    country: string;
    countryCode: string;
    timings: string;
    logo: string;
    banner: string;
    website: string;
    instagram: string;
    facebook: string;
    youtube: string;
    linkedin: string;
};

type InstituteProfileFormProps = {
    initialValues: InstituteFormValues;
    onCancel: () => void;
    onSaved: () => Promise<void>;
};

export default function InstituteProfileForm({ initialValues, onCancel, onSaved }: InstituteProfileFormProps) {
    const [form, setForm] = useState<InstituteFormValues>(initialValues);
    const [saving, setSaving] = useState(false);

    const setField = <K extends keyof InstituteFormValues>(key: K, value: InstituteFormValues[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Edit Institute Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="Institute name" />
                <Input value={form.slug} onChange={(event) => setField("slug", event.target.value)} placeholder="Slug" />
                <Input value={form.phone} onChange={(event) => setField("phone", event.target.value)} placeholder="Phone" />
                <Textarea
                    value={form.description}
                    onChange={(event) => setField("description", event.target.value)}
                    placeholder="Description"
                    rows={4}
                />
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button
                        disabled={saving}
                        onClick={async () => {
                            setSaving(true);
                            try {
                                await onSaved();
                            } finally {
                                setSaving(false);
                            }
                        }}
                    >
                        {saving ? "Saving..." : "Save"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
