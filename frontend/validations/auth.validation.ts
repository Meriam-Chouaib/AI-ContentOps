import { z } from 'zod'

// Schéma partagé pour la connexiondd
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "L'email est obligatoire." })
    .email({ message: "L'adresse email n'est pas valide." }),
  password: z.string().min(1, { message: 'Le mot de passe est obligatoire.' }),
})

// Schéma partagé pour l'inscription
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, { message: "L'email est obligatoire." })
    .email({ message: "L'adresse email n'est pas valide." }),
  name: z
    .string()
    .min(2, { message: 'Le nom complet doit contenir au moins 2 caractères.' }),
  username: z
    .string()
    .min(3, {
      message: "Le nom d'utilisateur doit contenir au moins 3 caractères.",
    })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message:
        "Le nom d'utilisateur ne peut contenir que des lettres, chiffres et underscores.",
    }),
  password: z.string().min(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères.',
  }),
})

// Génération automatique des types TypeScript à partir des schémas Zod (très valorisé)
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
