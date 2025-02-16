import { z } from "zod";

export const PlayerRegistrationSchema = z.object({
	team: z.string(),
	playerName: z.string().trim().min(2),
	isKeeper: z.coerce.boolean(),
});

export type PlayerRegistration = z.infer<typeof PlayerRegistrationSchema>;
