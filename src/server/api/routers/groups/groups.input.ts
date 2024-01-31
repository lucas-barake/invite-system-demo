import { z } from "zod";

export const CreateGroupInput = z.object({
  title: z.string().trim().min(2),
});
export type CreateGroupInputType = z.infer<typeof CreateGroupInput>;

export const SendGroupInviteInput = z.object({
  groupId: z.string().uuid(),
  email: z.string().email(),
});
export type SendGroupInviteInputType = z.infer<typeof SendGroupInviteInput>;

export const AcceptGroupInviteInput = z.object({
  groupId: z.string().uuid(),
});
export type AcceptGroupInviteInputType = z.infer<typeof AcceptGroupInviteInput>;
