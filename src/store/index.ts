import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/slices/authSlice";
import uiReducer from "@/features/ui/uiSlice";
import appTeamReducer from "@/features/appTeam/appTeamSlice";
import appInstituteReducer from "@/features/appInstitute/appInstituteSlice";
import studentPortalReducer from "@/features/studentPortal/studentPortalSlice";
import dashboardReducer from "@/features/dashboard/dashboardSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        ui: uiReducer,
        appTeam: appTeamReducer,
        appInstitute: appInstituteReducer,
        studentPortal: studentPortalReducer,
        dashboard: dashboardReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
