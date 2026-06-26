import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, name, username } = createUserDto;

    // 1. Vérifier si l'utilisateur existe déjà
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé.');
    }

    // 2. Hacher le mot de passe
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Créer et sauvegarder l'utilisateur
    const newUser = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      username,
    });

    return this.userRepository.save(newUser);
  }

  // --- MÉTHODES REQUISES POUR L'AUTHENTIFICATION (JWT & REFRESH) ---

  // Corrigé en 'number' pour correspondre aux contraintes de la clé primaire TypeORM
  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  // Corrigé en 'number' pour matcher l'ID de la relation
  async updateRefreshToken(
    userId: number,
    hashedRefreshToken: string | null,
  ): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    user.hashedRefreshToken = hashedRefreshToken;
    await this.userRepository.save(user);
  }

  // --- AUTRES MÉTHODES CRUD (TYPÉES EN NUMBER) ---

  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    console.log("🚀 ~ UsersService ~ update ~ updateUserDto:", updateUserDto)
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(
        `L'utilisateur avec l'ID #${id} n'existe pas.`,
      );
    }

    const updatedUser = this.userRepository.merge(user, updateUserDto);
    console.log("🚀 ~ UsersService ~ update ~ updatedUser:", updatedUser)
    return this.userRepository.save(updatedUser);
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `L'utilisateur avec l'ID #${id} n'existe pas.`,
      );
    }
  }
}
