import { z } from "zod";

export const SendGroupInviteInput = z.object({
  groupId: z.string().uuid(),
  email: z.string().email(),
});
export type SendGroupInviteInputType = z.infer<typeof SendGroupInviteInput>;

export const AcceptGroupInviteInput = z.object({
  groupId: z.string().uuid(),
});
export type AcceptGroupInviteInputType = z.infer<typeof AcceptGroupInviteInput>;
