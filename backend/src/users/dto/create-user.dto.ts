import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: "L'adresse email n'est pas valide." })
  @IsNotEmpty({ message: "L'email est obligatoire." })
  email!: string; // <-- Remarque le '!' ici*

  @IsNotEmpty({ message: 'Le nom complet est obligatoire.' })
  @MinLength(2, {
    message: 'Le nom complet doit contenir au moins 2 caractères.',
  })
  name!: string; // <-- Et le '!' ici
  @IsNotEmpty({ message: "Le nom d'utilisateur est obligatoire." })
  @MinLength(3, {
    message: "Le nom d'utilisateur doit contenir au moins 3 caractères.",
  })
  username!: string; // <-- Et le '!' ici

  @IsNotEmpty({ message: 'Le mot de passe est obligatoire.' })
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères.',
  })
  password!: string; // <-- Et le '!' ici
}
