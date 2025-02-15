import { z } from "zod";

export const PlayerRegistrationSchema = z.object({
	team: z.string(),
	playerName: z.string().trim().min(2),
});

export type PlayerRegistration = z.infer<typeof PlayerRegistrationSchema>;
