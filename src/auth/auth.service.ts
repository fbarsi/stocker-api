import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { Role } from '../roles/entities/role.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private dataSource: DataSource, // 👈 Inyectamos DataSource
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password_hash))) {
      const { password_hash, ...result } = user;
      return result; // Devuelve el usuario sin el hash de la contraseña
    }
    return null;
  }

  async login(user: any) {
    // El payload es la información que guardamos dentro del token JWT
    const payload = {
      email: user.email,
      sub: user.user_id,
      role: user.role?.role_name, // Usamos optional chaining por si el rol es nulo
      companyId: user.company?.company_id, // Añadimos companyId
      branchId: user.branch?.branch_id, // Añadimos branchId
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(createUserDto: CreateUserDto) {
    const { full_name, email, password } = createUserDto;

    // 1. Verificar si el email ya existe
    const userExists = await this.usersService.findOneByEmail(email);
    if (userExists) {
      throw new ConflictException('Email already registered');
    }

    // 2. Hashear la contraseña
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Crear el nuevo usuario (sin compañía, sucursal o rol)
    const newUser = this.dataSource.getRepository(User).create({
      full_name,
      email,
      password_hash: hashedPassword,
    });

    await this.dataSource.getRepository(User).save(newUser);

    const { password_hash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }
}
