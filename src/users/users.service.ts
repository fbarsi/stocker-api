import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['company', 'role'],
    });
  }

  async findAllInCompany(
    companyId: number,
  ): Promise<Omit<User, 'password_hash'>[]> {
    return this.usersRepository.find({
      where: { company: { company_id: companyId } },
      select: ['user_id', 'name', 'lastname', 'email'],
      relations: ['role', 'branch'],
    });
  }

  /**
   * Obtiene el perfil del usuario actual, excluyendo la contraseña.
   */
  async getProfile(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { user_id: userId },
      relations: ['company', 'branch', 'role'], // Carga la información relacionada
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    const { password_hash, ...profile } = user;
    return profile;
  }

  /**
   * Actualiza el perfil del usuario actual.
   */
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.usersRepository.findOneBy({ user_id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (dto.name) {
      user.name = dto.name;
    }
    if (dto.lastname) {
      user.lastname = dto.lastname;
    }
    await this.usersRepository.save(user);

    const { password_hash, ...profile } = user;
    return profile;
  }

  /**
   * Cambia la contraseña del usuario actual.
   */
  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.usersRepository.findOneBy({ user_id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // 1. Verificar que la contraseña actual sea correcta
    const isPasswordMatching = await bcrypt.compare(
      dto.currentPassword,
      user.password_hash,
    );

    if (!isPasswordMatching) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    // 2. Hashear y guardar la nueva contraseña
    const salt = await bcrypt.genSalt();
    user.password_hash = await bcrypt.hash(dto.newPassword, salt);
    await this.usersRepository.save(user);

    return { message: 'Contraseña actualizada exitosamente.' };
  }
}
