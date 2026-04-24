"use client";

import { useState } from "react";
import InstituteProfileView from "@/features/institute/components/InstituteProfileView";
import InstituteProfileForm, { InstituteFormValues as InstituteFormState } from "@/features/institute/components/InstituteProfileForm";
import { useInstituteSummary } from "@/features/appInstitute/hooks/useAppInstitute";

const emptyForm: InstituteFormState = {
    name: "",
    slug: "",
    description: "",
    phone: "",
    whatsapp: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    region: "",
    postalCode: "",
    country: "India",
    countryCode: "",
    timings: "",
    logo: "",
    banner: "",
    website: "",
    instagram: "",
    facebook: "",
    youtube: "",
    linkedin: "",
};

export default function InstitutePage() {
    const { data: summary, refetch } = useInstituteSummary();
    const [mode, setMode] = useState<"view" | "edit">("view");

    const form = (summary?.form ?? emptyForm) as InstituteFormState;
    const studentsCount = summary?.studentsCount ?? 0;
    const coursesCount = summary?.coursesCount ?? 0;

    if (mode === "edit") {
        return (
            <main className="p-6">
                <InstituteProfileForm
                    initialValues={form}
                    onCancel={() => setMode("view")}
                    onSaved={async () => {
                        await refetch();
                        setMode("view");
                    }}
                />
            </main>
        );
    }

    return (
        <main className="p-6">
            <InstituteProfileView
                data={{
                    name: form.name,
                    slug: form.slug,
                    description: form.description,
                    phone: form.phone,
                    address: [
                        form.addressLine1,
                        form.addressLine2,
                        form.city,
                        form.state,
                        form.region,
                        form.postalCode,
                        form.country,
                    ]
                        .filter((value) => Boolean(value && value.trim().length > 0))
                        .join(", "),
                    website: form.website,
                    logo: form.logo,
                    banner: form.banner,
                    studentsCount,
                    coursesCount,
                }}
                onEdit={() => setMode("edit")}
            />
        </main>
    );
}
