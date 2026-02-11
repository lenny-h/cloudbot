import { type QueryClient } from "@tanstack/react-query";
import { type AdminApiType } from "@workspace/api-routes/routes/admin/index";
import { type ProtectedApiType } from "@workspace/api-routes/routes/protected/index";
import { type ClientResponse, hc } from "hono/client";
import { checkResponse, type ErrorDictionary } from "./translation-utils";

function createProtectedApiClient() {
  return hc<ProtectedApiType>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/protected`,
    {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        return fetch(input, {
          ...init,
          credentials: "include",
        });
      },
    },
  );
}

function createAdminApiClient() {
  return hc<AdminApiType>(`${process.env.NEXT_PUBLIC_API_URL}/api/admin`, {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => {
      return fetch(input, {
        ...init,
        credentials: "include",
      });
    },
  });
}

/**
 * Type-safe fetcher using Hono client
 * @example
 * const data = await apiFetcher(
 *   (client) => client.users.$get(),
 *   errorDictionary
 * );
 */
export async function apiFetcher<T>(
  clientCallback: (
    client: ReturnType<typeof createProtectedApiClient>,
  ) => Promise<ClientResponse<T>>,
  errorDictionary: ErrorDictionary,
): Promise<T> {
  const client = createProtectedApiClient();
  const response = await clientCallback(client);
  await checkResponse(response, errorDictionary);
  return response.json() as Promise<T>;
}

/**
 * Type-safe fetcher for admin API endpoints using Hono client
 * @example
 * const data = await adminApiFetcher(
 *   (client) => client.users.$get(),
 *   errorDictionary
 * );
 */
export async function adminApiFetcher<T>(
  clientCallback: (
    client: ReturnType<typeof createAdminApiClient>,
  ) => Promise<ClientResponse<T>>,
  errorDictionary: ErrorDictionary,
): Promise<T> {
  const client = createAdminApiClient();
  const response = await clientCallback(client);
  await checkResponse(response, errorDictionary);
  return response.json() as Promise<T>;
}

export async function removeFromCache<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: string[],
  itemId: string,
) {
  queryClient.setQueryData(queryKey, (oldData: T[]) => {
    if (!oldData) return oldData;
    return oldData.filter((item) => item.id !== itemId);
  });
}

export function removeFromInfiniteCache<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: string[],
  itemId: string,
) {
  queryClient.setQueryData(
    queryKey,
    (oldData: { pages: Array<T[]>; pageParams: number[] }) => {
      if (!oldData) return oldData;
      return {
        pages: oldData.pages.map((page) =>
          page.filter((item) => item.id !== itemId),
        ),
        pageParams: oldData.pageParams,
      };
    },
  );
}

export function updateInfiniteCache<T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: string[],
  updateFunction: (item: T) => T,
) {
  queryClient.setQueryData(
    queryKey,
    (oldData: { pages: Array<T[]>; pageParams: number[] }) => {
      if (!oldData) return oldData;
      return {
        pages: oldData.pages.map((page) => page.map(updateFunction)),
        pageParams: oldData.pageParams,
      };
    },
  );
}
