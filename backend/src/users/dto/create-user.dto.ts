import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: "L'adresse email n'est pas valide." })
  @IsNotEmpty({ message: "L'email est obligatoire." })
  email!: string; // <-- Remarque le '!' ici

  @IsNotEmpty({ message: 'Le mot de passe est obligatoire.' })
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères.',
  })
  password!: string; // <-- Et le '!' ici
}
