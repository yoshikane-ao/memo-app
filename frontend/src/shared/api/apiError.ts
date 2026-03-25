import axios, { AxiosError } from "axios";

type ApiErrorPayload = {
  message?: unknown;
};

const isApiErrorPayload = (value: unknown): value is ApiErrorPayload =>
  typeof value === "object" && value !== null;

const extractPayloadMessage = (value: unknown) => {
  if (!isApiErrorPayload(value) || typeof value.message !== "string") {
    return null;
  }

  const normalized = value.message.trim();
  return normalized === "" ? null : normalized;
};

export class ApiRequestError extends Error {
  status?: number;

  constructor(message: string, options?: { status?: number }) {
    super(message);
    this.name = "ApiRequestError";
    this.status = options?.status;
  }
}

export const toApiRequestError = (error: unknown, fallback = "Request failed.") => {
  if (error instanceof ApiRequestError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const message =
      extractPayloadMessage(axiosError.response?.data) ??
      (typeof axiosError.message === "string" && axiosError.message.trim() !== ""
        ? axiosError.message
        : fallback);

    return new ApiRequestError(message, {
      status: axiosError.response?.status,
    });
  }

  if (error instanceof Error && error.message.trim() !== "") {
    return new ApiRequestError(error.message);
  }

  return new ApiRequestError(fallback);
};

export const getApiErrorMessage = (error: unknown, fallback: string) =>
  toApiRequestError(error, fallback).message;
