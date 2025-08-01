import { queryOptions } from "@tanstack/react-query";

import {
  fetchParameterEntities,
  fetchParameters,
  fetchParameterTypes,
} from "@/api/parameters";

export const queryParameters = () =>
  queryOptions({
    queryKey: ["parameters"],
    queryFn: fetchParameters,
    staleTime: 1000 * 60 * 10, // 5 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });

export const queryParameterTypes = () =>
  queryOptions({
    queryKey: ["parameterTypes"],
    queryFn: fetchParameterTypes,
    staleTime: 1000 * 60 * 10, // 5 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });

export const queryParameterEntities = () =>
  queryOptions({
    queryKey: ["parameterEntities"],
    queryFn: fetchParameterEntities,
    staleTime: 1000 * 60 * 10, // 5 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
