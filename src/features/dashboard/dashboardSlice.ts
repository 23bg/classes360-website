import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { apiFetch } from "@/lib/api/client";

const ensureArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const ensureObject = <T extends Record<string, unknown>>(value: unknown, fallback: T): T => {
    if (value && typeof value === "object") {
        return value as T;
    }

    return fallback;
};

const pending = { loading: false };

type DashboardState = {
    students: {
        data: any;
        loading: boolean;
        mutation: { loading: boolean };
        assignments: { data: any[]; loading: boolean };
        upload: { loading: boolean };
    };
    leads: {
        data: any[];
        loading: boolean;
        timeline: { data: any[]; loading: boolean };
        mutation: { loading: boolean };
        import: { loading: boolean };
    };
    batches: {
        data: any;
        loading: boolean;
        details: { data: any; loading: boolean };
        mutation: { loading: boolean };
        noteMutation: { loading: boolean };
        attendanceMutation: { loading: boolean };
    };
    billing: {
        data: any;
        loading: boolean;
        subscription: { loading: boolean };
        invoice: { loading: boolean };
        retry: { loading: boolean };
        confirm: { loading: boolean };
    };
};

const initialState: DashboardState = {
    students: {
        data: null,
        loading: false,
        mutation: { ...pending },
        assignments: { data: [], loading: false },
        upload: { ...pending },
    },
    leads: {
        data: [],
        loading: false,
        timeline: { data: [], loading: false },
        mutation: { ...pending },
        import: { ...pending },
    },
    batches: {
        data: null,
        loading: false,
        details: { data: null, loading: false },
        mutation: { ...pending },
        noteMutation: { ...pending },
        attendanceMutation: { ...pending },
    },
    billing: {
        data: null,
        loading: false,
        subscription: { ...pending },
        invoice: { ...pending },
        retry: { ...pending },
        confirm: { ...pending },
    },
};

export const fetchStudentsDashboard = createAsyncThunk("dashboard/fetchStudentsDashboard", async () => {
    const [rows, courses, batches] = await Promise.all([
        apiFetch("/students").catch(() => []),
        apiFetch("/courses").catch(() => []),
        apiFetch("/batches").catch(() => []),
    ]);

    return {
        rows: ensureArray(rows),
        courses: ensureArray(courses),
        batches: ensureArray(batches),
        feeSummaries: {},
    };
});

export const fetchStudentAssignments = createAsyncThunk("dashboard/fetchStudentAssignments", async (studentId: string) => {
    const response = await apiFetch(`/students/${studentId}/courses`).catch(() => []);
    return ensureArray(response);
});

export const saveStudent = createAsyncThunk(
    "dashboard/saveStudent",
    async ({ editingId, body }: { editingId: string | null; body: Record<string, unknown> }) => {
        const endpoint = editingId ? `/students/${editingId}` : "/students";
        const method = editingId ? "PUT" : "POST";
        return apiFetch(endpoint, { method, body: JSON.stringify(body) });
    }
);

export const deleteStudent = createAsyncThunk("dashboard/deleteStudent", async (id: string) => {
    await apiFetch(`/students/${id}`, { method: "DELETE" });
    return id;
});

export const assignStudentCourse = createAsyncThunk(
    "dashboard/assignStudentCourse",
    async ({ studentId, body }: { studentId: string; body: Record<string, unknown> }) => {
        return apiFetch(`/students/${studentId}/courses`, { method: "POST", body: JSON.stringify(body) });
    }
);

export const updateStudentPortalCredentials = createAsyncThunk(
    "dashboard/updateStudentPortalCredentials",
    async ({ studentId, body }: { studentId: string; body: Record<string, unknown> }) => {
        return apiFetch(`/students/${studentId}`, { method: "PUT", body: JSON.stringify(body) });
    }
);

export const uploadStudentsCsv = createAsyncThunk("dashboard/uploadStudentsCsv", async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/v1/students/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Upload failed");
    }

    return response.json();
});

export const fetchLeads = createAsyncThunk("dashboard/fetchLeads", async (queryString?: string) => {
    const suffix = queryString ? `?${queryString}` : "";
    const response = await apiFetch(`/leads${suffix}`).catch(() => []);
    return ensureArray(response);
});

export const fetchLeadTimeline = createAsyncThunk("dashboard/fetchLeadTimeline", async (leadId: string) => {
    const response = await apiFetch(`/leads/${leadId}/timeline`).catch(() => []);
    return ensureArray(response);
});

export const updateLeadStatus = createAsyncThunk(
    "dashboard/updateLeadStatus",
    async ({ leadId, nextStatus }: { leadId: string; nextStatus: string }) => {
        return apiFetch(`/leads/${leadId}`, {
            method: "PUT",
            body: JSON.stringify({ status: nextStatus }),
        });
    }
);

export const saveLeadDetails = createAsyncThunk(
    "dashboard/saveLeadDetails",
    async ({ leadId, message, followUpAt }: { leadId: string; message: string | null; followUpAt: string | null }) => {
        return apiFetch(`/leads/${leadId}`, {
            method: "PUT",
            body: JSON.stringify({ message, followUpAt }),
        });
    }
);

export const downloadLeadImportTemplate = createAsyncThunk("dashboard/downloadLeadImportTemplate", async (format: string) => {
    const response = await fetch(`/api/v1/leads/import?format=${encodeURIComponent(format)}`, {
        method: "GET",
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("Failed to download template");
    }

    return { blob: await response.blob() };
});

export const previewLeadImport = createAsyncThunk("dashboard/previewLeadImport", async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/v1/leads/import?action=preview", {
        method: "POST",
        credentials: "include",
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Failed to preview import");
    }

    return response.json();
});

export const confirmLeadImport = createAsyncThunk("dashboard/confirmLeadImport", async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/v1/leads/import?action=confirm", {
        method: "POST",
        credentials: "include",
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Failed to import leads");
    }

    return response.json();
});

export const fetchBatchesDashboard = createAsyncThunk("dashboard/fetchBatchesDashboard", async () => {
    const [rows, courses, teachers, students] = await Promise.all([
        apiFetch("/batches").catch(() => []),
        apiFetch("/courses").catch(() => []),
        apiFetch("/teachers").catch(() => []),
        apiFetch("/students").catch(() => []),
    ]);

    return {
        rows: ensureArray(rows),
        courses: ensureArray(courses),
        teachers: ensureArray(teachers),
        students: ensureArray(students),
    };
});

export const fetchBatchDetails = createAsyncThunk("dashboard/fetchBatchDetails", async (batchId: string) => {
    const [notes, attendance] = await Promise.all([
        apiFetch(`/notes?batchId=${encodeURIComponent(batchId)}`).catch(() => []),
        apiFetch(`/attendance?batchId=${encodeURIComponent(batchId)}`).catch(() => []),
    ]);

    return {
        notes: ensureArray(notes),
        attendance: ensureArray(attendance),
    };
});

export const saveBatch = createAsyncThunk(
    "dashboard/saveBatch",
    async ({ editingId, body }: { editingId: string | null; body: Record<string, unknown> }) => {
        const endpoint = editingId ? `/batches/${editingId}` : "/batches";
        const method = editingId ? "PUT" : "POST";
        return apiFetch(endpoint, { method, body: JSON.stringify(body) });
    }
);

export const deleteBatch = createAsyncThunk("dashboard/deleteBatch", async (batchId: string) => {
    await apiFetch(`/batches/${batchId}`, { method: "DELETE" });
    return batchId;
});

export const addBatchNote = createAsyncThunk(
    "dashboard/addBatchNote",
    async ({ batchId, body }: { batchId: string; courseId: string; body: Record<string, unknown> }) => {
        return apiFetch(`/notes?batchId=${encodeURIComponent(batchId)}`, {
            method: "POST",
            body: JSON.stringify(body),
        });
    }
);

export const addBatchAttendance = createAsyncThunk(
    "dashboard/addBatchAttendance",
    async ({ batchId, body }: { batchId: string; courseId: string; body: Record<string, unknown> }) => {
        return apiFetch(`/attendance?batchId=${encodeURIComponent(batchId)}`, {
            method: "POST",
            body: JSON.stringify(body),
        });
    }
);

export const fetchBillingDashboard = createAsyncThunk("dashboard/fetchBillingDashboard", async () => {
    const response = await apiFetch("/billing").catch(() => ({}));
    return ensureObject(response, {});
});

export const createBillingSubscription = createAsyncThunk(
    "dashboard/createBillingSubscription",
    async (payload: Record<string, unknown>) => {
        return apiFetch("/billing", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    }
);

export const generateBillingInvoice = createAsyncThunk(
    "dashboard/generateBillingInvoice",
    async (payload: Record<string, unknown> = {}) => {
        return apiFetch("/billing", {
            method: "POST",
            body: JSON.stringify({ action: "invoice", ...payload }),
        });
    }
);

export const retryBillingInvoice = createAsyncThunk("dashboard/retryBillingInvoice", async (invoiceId: string) => {
    return apiFetch("/billing", {
        method: "POST",
        body: JSON.stringify({ action: "retry", invoiceId }),
    });
});

export const confirmBillingSubscription = createAsyncThunk(
    "dashboard/confirmBillingSubscription",
    async (payload: Record<string, unknown>) => {
        return apiFetch("/billing/confirm", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    }
);

const dashboardSlice = createSlice({
    name: "dashboard",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchStudentsDashboard.pending, (state) => {
                state.students.loading = true;
            })
            .addCase(fetchStudentsDashboard.fulfilled, (state, action: PayloadAction<Record<string, unknown>>) => {
                state.students.loading = false;
                state.students.data = action.payload;
            })
            .addCase(fetchStudentsDashboard.rejected, (state) => {
                state.students.loading = false;
            })
            .addCase(fetchStudentAssignments.pending, (state) => {
                state.students.assignments.loading = true;
            })
            .addCase(fetchStudentAssignments.fulfilled, (state, action: PayloadAction<unknown[]>) => {
                state.students.assignments.loading = false;
                state.students.assignments.data = action.payload;
            })
            .addCase(fetchStudentAssignments.rejected, (state) => {
                state.students.assignments.loading = false;
            })
            .addCase(saveStudent.pending, (state) => {
                state.students.mutation.loading = true;
            })
            .addCase(saveStudent.fulfilled, (state) => {
                state.students.mutation.loading = false;
            })
            .addCase(saveStudent.rejected, (state) => {
                state.students.mutation.loading = false;
            })
            .addCase(deleteStudent.pending, (state) => {
                state.students.mutation.loading = true;
            })
            .addCase(deleteStudent.fulfilled, (state) => {
                state.students.mutation.loading = false;
            })
            .addCase(deleteStudent.rejected, (state) => {
                state.students.mutation.loading = false;
            })
            .addCase(assignStudentCourse.pending, (state) => {
                state.students.assignments.loading = true;
            })
            .addCase(assignStudentCourse.fulfilled, (state) => {
                state.students.assignments.loading = false;
            })
            .addCase(assignStudentCourse.rejected, (state) => {
                state.students.assignments.loading = false;
            })
            .addCase(updateStudentPortalCredentials.pending, (state) => {
                state.students.mutation.loading = true;
            })
            .addCase(updateStudentPortalCredentials.fulfilled, (state) => {
                state.students.mutation.loading = false;
            })
            .addCase(updateStudentPortalCredentials.rejected, (state) => {
                state.students.mutation.loading = false;
            })
            .addCase(uploadStudentsCsv.pending, (state) => {
                state.students.upload.loading = true;
            })
            .addCase(uploadStudentsCsv.fulfilled, (state) => {
                state.students.upload.loading = false;
            })
            .addCase(uploadStudentsCsv.rejected, (state) => {
                state.students.upload.loading = false;
            })
            .addCase(fetchLeads.pending, (state) => {
                state.leads.loading = true;
            })
            .addCase(fetchLeads.fulfilled, (state, action: PayloadAction<unknown[]>) => {
                state.leads.loading = false;
                state.leads.data = action.payload;
            })
            .addCase(fetchLeads.rejected, (state) => {
                state.leads.loading = false;
            })
            .addCase(fetchLeadTimeline.pending, (state) => {
                state.leads.timeline.loading = true;
            })
            .addCase(fetchLeadTimeline.fulfilled, (state, action: PayloadAction<unknown[]>) => {
                state.leads.timeline.loading = false;
                state.leads.timeline.data = action.payload;
            })
            .addCase(fetchLeadTimeline.rejected, (state) => {
                state.leads.timeline.loading = false;
            })
            .addCase(updateLeadStatus.pending, (state) => {
                state.leads.mutation.loading = true;
            })
            .addCase(updateLeadStatus.fulfilled, (state) => {
                state.leads.mutation.loading = false;
            })
            .addCase(updateLeadStatus.rejected, (state) => {
                state.leads.mutation.loading = false;
            })
            .addCase(saveLeadDetails.pending, (state) => {
                state.leads.mutation.loading = true;
            })
            .addCase(saveLeadDetails.fulfilled, (state) => {
                state.leads.mutation.loading = false;
            })
            .addCase(saveLeadDetails.rejected, (state) => {
                state.leads.mutation.loading = false;
            })
            .addCase(previewLeadImport.pending, (state) => {
                state.leads.import.loading = true;
            })
            .addCase(previewLeadImport.fulfilled, (state) => {
                state.leads.import.loading = false;
            })
            .addCase(previewLeadImport.rejected, (state) => {
                state.leads.import.loading = false;
            })
            .addCase(confirmLeadImport.pending, (state) => {
                state.leads.import.loading = true;
            })
            .addCase(confirmLeadImport.fulfilled, (state) => {
                state.leads.import.loading = false;
            })
            .addCase(confirmLeadImport.rejected, (state) => {
                state.leads.import.loading = false;
            })
            .addCase(fetchBatchesDashboard.pending, (state) => {
                state.batches.loading = true;
            })
            .addCase(fetchBatchesDashboard.fulfilled, (state, action: PayloadAction<Record<string, unknown>>) => {
                state.batches.loading = false;
                state.batches.data = action.payload;
            })
            .addCase(fetchBatchesDashboard.rejected, (state) => {
                state.batches.loading = false;
            })
            .addCase(fetchBatchDetails.pending, (state) => {
                state.batches.details.loading = true;
            })
            .addCase(fetchBatchDetails.fulfilled, (state, action: PayloadAction<Record<string, unknown>>) => {
                state.batches.details.loading = false;
                state.batches.details.data = action.payload;
            })
            .addCase(fetchBatchDetails.rejected, (state) => {
                state.batches.details.loading = false;
            })
            .addCase(saveBatch.pending, (state) => {
                state.batches.mutation.loading = true;
            })
            .addCase(saveBatch.fulfilled, (state) => {
                state.batches.mutation.loading = false;
            })
            .addCase(saveBatch.rejected, (state) => {
                state.batches.mutation.loading = false;
            })
            .addCase(deleteBatch.pending, (state) => {
                state.batches.mutation.loading = true;
            })
            .addCase(deleteBatch.fulfilled, (state) => {
                state.batches.mutation.loading = false;
            })
            .addCase(deleteBatch.rejected, (state) => {
                state.batches.mutation.loading = false;
            })
            .addCase(addBatchNote.pending, (state) => {
                state.batches.noteMutation.loading = true;
            })
            .addCase(addBatchNote.fulfilled, (state) => {
                state.batches.noteMutation.loading = false;
            })
            .addCase(addBatchNote.rejected, (state) => {
                state.batches.noteMutation.loading = false;
            })
            .addCase(addBatchAttendance.pending, (state) => {
                state.batches.attendanceMutation.loading = true;
            })
            .addCase(addBatchAttendance.fulfilled, (state) => {
                state.batches.attendanceMutation.loading = false;
            })
            .addCase(addBatchAttendance.rejected, (state) => {
                state.batches.attendanceMutation.loading = false;
            })
            .addCase(fetchBillingDashboard.pending, (state) => {
                state.billing.loading = true;
            })
            .addCase(fetchBillingDashboard.fulfilled, (state, action: PayloadAction<Record<string, unknown>>) => {
                state.billing.loading = false;
                state.billing.data = action.payload;
            })
            .addCase(fetchBillingDashboard.rejected, (state) => {
                state.billing.loading = false;
            })
            .addCase(createBillingSubscription.pending, (state) => {
                state.billing.subscription.loading = true;
            })
            .addCase(createBillingSubscription.fulfilled, (state) => {
                state.billing.subscription.loading = false;
            })
            .addCase(createBillingSubscription.rejected, (state) => {
                state.billing.subscription.loading = false;
            })
            .addCase(generateBillingInvoice.pending, (state) => {
                state.billing.invoice.loading = true;
            })
            .addCase(generateBillingInvoice.fulfilled, (state) => {
                state.billing.invoice.loading = false;
            })
            .addCase(generateBillingInvoice.rejected, (state) => {
                state.billing.invoice.loading = false;
            })
            .addCase(retryBillingInvoice.pending, (state) => {
                state.billing.retry.loading = true;
            })
            .addCase(retryBillingInvoice.fulfilled, (state) => {
                state.billing.retry.loading = false;
            })
            .addCase(retryBillingInvoice.rejected, (state) => {
                state.billing.retry.loading = false;
            })
            .addCase(confirmBillingSubscription.pending, (state) => {
                state.billing.confirm.loading = true;
            })
            .addCase(confirmBillingSubscription.fulfilled, (state) => {
                state.billing.confirm.loading = false;
            })
            .addCase(confirmBillingSubscription.rejected, (state) => {
                state.billing.confirm.loading = false;
            });
    },
});

export default dashboardSlice.reducer;
