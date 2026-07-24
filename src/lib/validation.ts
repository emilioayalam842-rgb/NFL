import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  ref: z.string().max(20).optional(),
});

export const paymentClaimSchema = z.object({
  subscriptionId: z.string().min(1),
  amountMXN: z.number().int().positive(),
  claveRastreo: z.string().min(6).max(40),
  fechaOperacion: z.string().min(1),
  bancoEmisor: z.string().min(2),
  cuentaOrdenante: z.string().min(4).max(20),
});
