"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink, TRPCClientError } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import React from "react";

import { type AppRouter } from "@/server/api/root";
import { transformer } from "./shared";

export const api = createTRPCReact<AppRouter>();

type Props = {
  children: React.ReactNode;
};

export const TRPCReactProvider: React.FC<Props> = (props) => {
  const queryClient = React.useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry(failureCount, error) {
              if (error instanceof TRPCClientError) {
                const trpcError = error as TRPCClientError<never> & { httpStatus: number };
                return trpcError.httpStatus === 401;
              }
              return failureCount < 2;
            },
          },
        },
      }),
    []
  );

  const trpcClient = React.useMemo(
    () =>
      api.createClient({
        transformer,
        links: [
          loggerLink({
            enabled: (op) =>
              process.env.NODE_ENV === "development" ||
              (op.direction === "down" && op.result instanceof Error),
          }),
          httpBatchLink({
            url: "/api/trpc",
          }),
        ],
      }),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  );
};
