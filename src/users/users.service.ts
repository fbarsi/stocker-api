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

  async getProfile(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { user_id: userId },
      relations: ['company', 'branch', 'role'],
    });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      lastname: user.lastname,
      company: user.company,
      branch: user.branch,
      role: user.role,
      movements: user.movements,
    };
  }

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

    return {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      lastname: user.lastname,
      company: user.company,
      branch: user.branch,
      role: user.role,
      movements: user.movements,
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.usersRepository.findOneBy({ user_id: userId });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const isPasswordMatching = await bcrypt.compare(
      dto.currentPassword,
      user.password_hash,
    );

    if (!isPasswordMatching) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    const salt = await bcrypt.genSalt();
    user.password_hash = await bcrypt.hash(dto.newPassword, salt);
    await this.usersRepository.save(user);

    return { message: 'Contraseña actualizada exitosamente.' };
  }
}
