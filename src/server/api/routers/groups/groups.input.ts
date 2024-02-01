import { z } from "zod";

export const CreateGroupInput = z.object({
  title: z.string().trim().min(2),
});
export type CreateGroupInputType = z.infer<typeof CreateGroupInput>;
