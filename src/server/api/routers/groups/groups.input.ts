import { z } from "zod";

export const CreateGroupInput = z.object({
  title: z.string().trim().min(2),
  members: z.array(z.string().uuid()),
});
export type CreateGroupInputType = z.infer<typeof CreateGroupInput>;
