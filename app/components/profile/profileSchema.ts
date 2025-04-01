import * as z from 'zod';

// Define the Zod schema for the profile form
export const profileFormSchema = z.object({
    name: z.string().min(2, {
        message: 'Имя пользователя должно содержать не менее 2 символов',
    }),
    email: z.string().email({
        message: 'Пожалуйста, введите корректный email',
    }),
    category: z.string().optional(),
    inn: z.string().optional(),
});

// Infer the type from the schema
export type ProfileFormData = z.infer<typeof profileFormSchema>;