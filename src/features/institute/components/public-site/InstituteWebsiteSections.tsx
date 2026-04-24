import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Course = {
    id: string;
    name: string;
    slug?: string | null;
    description?: string | null;
    duration?: string | null;
    defaultFees?: number | null;
};

type Teacher = {
    id: string;
    name: string;
    subject?: string | null;
    experience?: string | null;
};

type Batch = {
    id: string;
    name: string;
    schedule?: string | null;
};

type Institute = {
    name?: string | null;
    phone?: string | null;
    description?: string | null;
    logo?: string | null;
    banner?: string | null;
    heroImage?: string | null;
    address?: {
        addressLine1?: string | null;
        addressLine2?: string | null;
        city?: string | null;
        state?: string | null;
    };
};

export function InstitutePageShell(props: {
    slug: string;
    institute: Institute;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
            <header className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">/{props.slug}</p>
                <h1 className="text-3xl font-bold">{props.title}</h1>
                {props.subtitle ? <p className="text-sm text-muted-foreground">{props.subtitle}</p> : null}
            </header>
            {props.children}
        </main>
    );
}

export function InstituteHeroSection({ slug, institute }: { slug: string; institute: Institute }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{institute.name || "Institute"}</CardTitle>
                <CardDescription>{institute.description || "Admissions open now."}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    <Button asChild>
                        <Link href={`/i/${slug}/contact`}>Contact</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={`/i/${slug}/courses`}>View Courses</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export function CoursesGrid({ slug, courses, maxItems, showDescription }: { slug: string; courses: Course[]; maxItems?: number; showDescription?: boolean }) {
    const items = maxItems ? courses.slice(0, maxItems) : courses;

    if (!items.length) {
        return <p className="text-sm text-muted-foreground">No courses published yet.</p>;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((course) => (
                <Card key={course.id}>
                    <CardHeader>
                        <CardTitle className="text-base">{course.name}</CardTitle>
                        <CardDescription>{course.duration || "Duration on request"}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        {showDescription ? <p>{course.description || "Detailed syllabus shared on enquiry."}</p> : null}
                        <p>Fees: {course.defaultFees ? `₹${course.defaultFees.toLocaleString("en-IN")}` : "N/A"}</p>
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/i/${slug}/courses/${course.slug || course.id}`}>View details</Link>
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function FacultyGrid({ teachers, maxItems }: { teachers: Teacher[]; maxItems?: number }) {
    const items = maxItems ? teachers.slice(0, maxItems) : teachers;

    if (!items.length) {
        return <p className="text-sm text-muted-foreground">Faculty details will be updated soon.</p>;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((teacher) => (
                <Card key={teacher.id}>
                    <CardHeader>
                        <CardTitle className="text-base">{teacher.name}</CardTitle>
                        <CardDescription>{teacher.subject || "Subject details coming soon"}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        <p>{teacher.experience || "Experience details available on enquiry."}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export function BatchTimings({ batches }: { batches: Batch[] }) {
    if (!batches.length) {
        return <p className="text-sm text-muted-foreground">Batch timings will be shared during counselling.</p>;
    }

    return (
        <div className="grid gap-3 md:grid-cols-2">
            {batches.map((batch) => (
                <Card key={batch.id}>
                    <CardHeader>
                        <CardTitle className="text-base">{batch.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">{batch.schedule || "Schedule to be announced"}</CardContent>
                </Card>
            ))}
        </div>
    );
}

export function LocationBlock({ institute }: { institute: Institute }) {
    const address = [
        institute.address?.addressLine1,
        institute.address?.addressLine2,
        institute.address?.city,
        institute.address?.state,
    ]
        .filter(Boolean)
        .join(", ");

    return (
        <Card>
            <CardHeader>
                <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{address || "Address will be updated soon."}</CardContent>
        </Card>
    );
}

export function EnquirySection({ slug }: { slug: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Send Enquiry</CardTitle>
                <CardDescription>Submit a quick callback request.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href={`/i/${slug}/contact`}>Open Enquiry Form</Link>
                </Button>
            </CardContent>
        </Card>
    );
}

export function StudentPortalCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Student Portal</CardTitle>
                <CardDescription>Access your classes, attendance and updates.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/student-login">Open Student Login</Link>
                </Button>
            </CardContent>
        </Card>
    );
}
