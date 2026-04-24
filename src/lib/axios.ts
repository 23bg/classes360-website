import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from "axios";
import { AppError } from "@/lib/utils/error";
import { API } from "@/constants/api";
import { getApiUrl } from "@/lib/api/url";

export const api = axios.create({
  baseURL: getApiUrl(API.BASE_V1),
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 10000,
});

type RetryableAxiosRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];
let isRefreshing = false;

const processQueue = (error: Error | null) => {
  failedQueue.forEach((pending) => {
    if (error) {
      pending.reject(error);
      return;
    }

    pending.resolve(undefined);
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableAxiosRequestConfig;

    if (error.response?.status === 401 && !originalRequest?._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((queuedError) => Promise.reject(queuedError));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post(API.AUTH.REFRESH_TOKEN);
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);


export async function handleApiCall<T>(promise: Promise<AxiosResponse<T>>): Promise<T> {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as {
        message?: string;
        response?: {
          status?: number;
          data?: {
            message?: string;
            [key: string]: unknown;
          };
        };
      };

      throw new AppError(
        axiosError.response?.data?.message || axiosError.message || "Request failed",
        axiosError.response?.status ?? 500,
        "API_REQUEST_FAILED",
        axiosError.response?.data
      );
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new AppError("An unexpected error occurred.", 500, "UNEXPECTED_ERROR", error);
  }
}



