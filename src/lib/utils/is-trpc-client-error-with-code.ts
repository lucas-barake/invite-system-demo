import { TRPCClientError } from "@trpc/client";
import { type TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc";

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/consistent-type-definitions
interface TRPCClientErrorWithCode extends TRPCClientError<any> {
  data: {
    code: TRPC_ERROR_CODE_KEY;
  };
}

export function isTRPCClientErrorWithCode(error: unknown): error is TRPCClientErrorWithCode {
  if (error instanceof TRPCClientError && typeof error.data === "object") {
    const potentialErrorWithCode = error as TRPCClientErrorWithCode;
    return (
      "code" in potentialErrorWithCode.data && typeof potentialErrorWithCode.data.code === "string"
    );
  }
  return false;
}
