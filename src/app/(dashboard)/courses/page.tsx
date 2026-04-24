"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {  Loader2, MoreHorizontal, Plus } from "lucide-react";
import { TablePaginationControls } from "@/components/ui/table-pagination-controls";
import ListWidget from "@/components/custom/ListWidget";
import TableWidget, { Column } from "@/components/custom/TableWidget";
import { useCourses } from "@/features/dashboard/hooks/queries/useDashboardData";
import { useDeleteCourse, useSaveCourse } from "@/features/dashboard/hooks/mutations/useDashboardMutations";
import { useFileUpload } from "@/hooks/useFileUpload";
import { isImageFile, validateFile } from "@/lib/storage/utils";

type Course = {
    id: string;
    name: string;
    banner?: string | null;
    duration?: string | null;
    defaultFees?: number | null;
    description?: string | null;
};

type CourseForm = { name: string; banner: string; duration: string; defaultFees: string; description: string };

const emptyForm: CourseForm = { name: "", banner: "", duration: "", defaultFees: "", description: "" };
const PAGE_SIZE = 10;

export default function CoursesPage() {
    const { data: courses = [], isLoading: loading } = useCourses();
    const saveCourseMutation = useSaveCourse();
    const deleteCourseMutation = useDeleteCourse();
    const searchParams = useSearchParams();
    const saving = saveCourseMutation.isPending || deleteCourseMutation.isPending;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [form, setForm] = useState<CourseForm>(emptyForm);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const { uploadFile, isLoading: uploadingBanner } = useFileUpload();

    useEffect(() => {
        const query = searchParams.get("query") ?? "";
        if (query && !searchQuery) {
            const id = setTimeout(() => setSearchQuery(query), 0);
            return () => clearTimeout(id);
        }
    }, [searchParams, searchQuery]);

    useEffect(() => {
        const id = setTimeout(() => setPage(1), 0);
        return () => clearTimeout(id);
    }, [searchQuery, courses.length]);

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setDialogOpen(true);
    };

    const openEdit = (course: Course) => {
        setEditingId(course.id);
        setForm({
            name: course.name,
            banner: course.banner ?? "",
            duration: course.duration ?? "",
            defaultFees: course.defaultFees?.toString() ?? "",
            description: course.description ?? "",
        });
        setDialogOpen(true);
    };

    const saveCourse = async () => {
        if (!form.name.trim()) {
            toast.error("Course name is required");
            return;
        }

        try {
            const body: Record<string, unknown> = { name: form.name };
            if (form.banner) body.banner = form.banner;
            if (form.duration) body.duration = form.duration;
            if (form.defaultFees) body.defaultFees = parseFloat(form.defaultFees);
            if (form.description) body.description = form.description;

            await saveCourseMutation.mutateAsync({ editingId, body });
            toast.success(editingId ? "Course updated" : "Course added");
            setDialogOpen(false);
        } catch (error: any) {
            toast.error(error?.message ?? error?.response?.data?.error?.message ?? "Network error");
        }
    };

    const handleBannerUpload = async (file?: File) => {
        if (!file) return;

        const validation = validateFile(file);
        if (!validation.isValid) {
            toast.error(validation.error ?? "Invalid file");
            return;
        }

        if (!isImageFile(file)) {
            toast.error("Only image files are allowed for course banner");
            return;
        }

        try {
            const fileUrl = await uploadFile(file, "courses", file.name);
            setForm((prev) => ({ ...prev, banner: fileUrl }));
            toast.success("Banner uploaded successfully");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Banner upload failed");
        }
    };

    const deleteCourse = async (id: string) => {
        try {
            await deleteCourseMutation.mutateAsync(id);
            toast.success("Course deleted");
        } catch (error: any) {
            toast.error(error?.message ?? error?.response?.data?.error?.message ?? "Network error");
        }
    };

    const openView = (course: Course) => {
        setSelectedCourse(course);
        setViewDialogOpen(true);
    };

    const formatCurrency = (value: number | null | undefined) => {
        if (value == null) return "-";
        return `₹${value.toLocaleString("en-IN")}`;
    };

    const visibleCourses = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return courses;

        return courses.filter((course) =>
            [course.name, course.duration ?? "", course.description ?? ""]
                .join(" ")
                .toLowerCase()
                .includes(q)
        );
    }, [courses, searchQuery]);

    const paginatedCourses = useMemo(
        () => visibleCourses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        [visibleCourses, page]
    );

    const columns = useMemo<Column<Course>[]>(() => [
        {
            header: "Sr. No.",
            cell: (_course, index) => (page - 1) * PAGE_SIZE + index + 1,
        },
        {
            header: "Name",
            accessor: "name",
            className: "font-medium max-w-[220px] truncate",
            hoverCard: true,
            hoverCardContent: (course) => (
                <div className="space-y-1 text-sm">
                    <p className="font-medium">{course.name}</p>
                    <p className="text-muted-foreground">Duration: {course.duration || "-"}</p>
                    <p className="text-muted-foreground">Fees: {formatCurrency(course.defaultFees)}</p>
                    <p className="text-muted-foreground">{course.description || "No description"}</p>
                </div>
            ),
            sortable: true,
        },
        {
            header: "Banner",
            cell: (course) => (course.banner ? "Added" : "-"),
        },
        {
            header: "Duration",
            accessor: "duration",
            className: "max-w-[140px] truncate",
            tooltip: true,
            cell: (course) => course.duration || "-",
            tooltipContent: (course) => course.duration || "-",
        },
        {
            header: "Default Fees",
            accessor: "defaultFees",
            cell: (course) => formatCurrency(course.defaultFees),
            sortable: true,
        },
        {
            header: "Description",
            className: "max-w-[220px] truncate",
            tooltip: true,
            cell: (course) => course.description || "-",
            tooltipContent: (course) => course.description || "-",
        },
        {
            header: "Actions",
            type: "actions",
            className: "w-[120px]",
            cell: (course) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openView(course)}>View</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(course)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={() => deleteCourse(course.id)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ], [page, deleteCourse]);

    return (
        <>
            <ListWidget
                title="Courses"
                description={`${visibleCourses.length} shown • ${courses.length} total courses`}
                search={searchQuery}
                onSearchChange={setSearchQuery}
                searchPlaceholder="Search course or duration"
                loading={loading}
                isEmpty={!loading && visibleCourses.length === 0}
                emptyMessage="No matching courses found."
                actions={
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Add Course
                    </Button>
                }
                footer={
                    <TablePaginationControls
                        page={page}
                        pageSize={PAGE_SIZE}
                        totalItems={visibleCourses.length}
                        onPageChange={setPage}
                    />
                }
            >
                <TableWidget columns={columns} data={paginatedCourses} rowKey={(course) => course.id} />
            </ListWidget>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Course" : "Add Course"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Name *</Label>
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. NEET 2026, JEE Foundation" minLength={2} maxLength={120} />
                        </div>
                        <div className="space-y-2">
                            <Label>Banner</Label>
                            <Input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                disabled={saving || uploadingBanner}
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    void handleBannerUpload(file);
                                    event.currentTarget.value = "";
                                }}
                            />
                            {form.banner ? <p className="text-xs text-muted-foreground break-all">Current: {form.banner}</p> : null}
                            {form.banner ? (
                                <Button type="button" variant="outline" size="sm" onClick={() => setForm((prev) => ({ ...prev, banner: "" }))}>Remove Banner</Button>
                            ) : null}
                        </div>
                        <div className="space-y-2">
                            <Label>Duration</Label>
                            <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 6 months, 1 year" maxLength={120} />
                        </div>
                        <div className="space-y-2">
                            <Label>Default Fees (₹)</Label>
                            <Input type="number" value={form.defaultFees} onChange={(e) => setForm({ ...form, defaultFees: e.target.value })} placeholder="e.g. 50000" />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the course" rows={3} maxLength={1024} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                        <Button onClick={saveCourse} disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {editingId ? "Update" : "Add"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Course Details</DialogTitle>
                    </DialogHeader>
                    {selectedCourse ? (
                        <div className="space-y-3 py-2 text-sm">
                            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Name</span><span className="font-medium">{selectedCourse.name}</span></div>
                            <div className="space-y-1">
                                <p className="text-muted-foreground">Banner</p>
                                {selectedCourse.banner ? (
                                    <Image
                                        src={selectedCourse.banner}
                                        alt={selectedCourse.name}
                                        width={800}
                                        height={160}
                                        unoptimized
                                        className="h-20 w-full rounded border object-cover"
                                    />
                                ) : (
                                    <div className="h-20 w-full rounded border bg-linear-to-r from-indigo-500/20 via-violet-500/20 to-sky-500/20" />
                                )}
                            </div>
                            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Duration</span><span>{selectedCourse.duration || "-"}</span></div>
                            <div className="flex justify-between gap-4"><span className="text-muted-foreground">Default Fees</span><span>{formatCurrency(selectedCourse.defaultFees)}</span></div>
                            <div className="space-y-1">
                                <p className="text-muted-foreground">Description</p>
                                <p>{selectedCourse.description || "-"}</p>
                            </div>
                        </div>
                    ) : null}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
