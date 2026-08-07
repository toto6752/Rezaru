import { newRequestId } from "@rezaru/observability";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorBody = {
  error: { code: string; message: string; details?: unknown; requestId: string };
};

export function apiSuccess<T>(data: T, status = 200, headers?: HeadersInit) {
  return NextResponse.json({ data, requestId: newRequestId() }, { status, headers });
}

export function apiError(error: unknown) {
  const requestId = newRequestId();
  if (error instanceof ZodError) {
    return NextResponse.json<ApiErrorBody>({
      error: { code: "VALIDATION_ERROR", message: "Some supplied values are invalid.", details: error.flatten(), requestId }
    }, { status: 400 });
  }
  const typed = error as { status?: number; code?: string; message?: string };
  const status = typed.status && typed.status >= 400 && typed.status < 600 ? typed.status : 500;
  const message = status === 500 ? "Something went wrong while processing the request." : typed.message ?? "Request failed";
  return NextResponse.json<ApiErrorBody>({
    error: { code: typed.code ?? (status === 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR"), message, requestId }
  }, { status });
}

export async function withApi<T>(handler: () => Promise<T | NextResponse>) {
  try {
    const result = await handler();
    return result instanceof NextResponse ? result : apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
