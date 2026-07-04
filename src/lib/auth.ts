import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  name: z.string().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// Extend Express Request with user
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        name: string | null;
        email: string;
        role: "USER" | "ADMIN";
      } | undefined;
    }
  }
}
