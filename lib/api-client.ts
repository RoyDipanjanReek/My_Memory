// Client-side API utility for making type-safe JSON requests
// Handles request configuration, error handling, and response parsing
"use client";

import type { ApiErrorResponse } from "@/types/template.types";

/**
 * Makes a fetch request with default JSON configuration and error handling
 * Automatically includes Content-Type header and disables caching
 * Throws on non-2xx responses with error message from response body
 * @template T - The expected response type
 * @param input - URL or Request object
 * @param init - Optional request initialization settings
 * @returns Parsed JSON response of type T
 * @throws Error if request fails with error message from response
 */
export async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    cache: "no-store", // Don't cache API responses
    headers: {
      "Content-Type": "application/json", // Tell server we're sending/receiving JSON
      ...(init?.headers ?? {}) // Allow user to override headers
    }
  });

  // If response status is not OK, parse error and throw
  if (!response.ok) {
    // Try to parse error response, fallback to generic message
    const error = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new Error(error?.error ?? "Request failed.");
  }

  // Parse and return successful response as JSON
  return response.json() as Promise<T>;
}
