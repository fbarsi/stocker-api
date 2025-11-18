import { Injectable, ConflictException } from '@nestjs/common';
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
    private dataSource: DataSource,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Partial<User> | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(password, user.password_hash))) {
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
    return null;
  }

  login(user: Partial<User>) {
    const payload = {
      email: user.email,
      sub: user.user_id,
      role: user.role?.role_name,
      companyId: user.company?.company_id,
      branchId: user.branch?.branch_id,
    };
    return {
      user: {
        name: user.name,
        lastname: user.lastname,
        email: user.email,
      },
      token: this.jwtService.sign(payload),
    };
  }

  async register(createUserDto: CreateUserDto) {
    const { name, lastname, email, password } = createUserDto;

    const userExists = await this.usersService.findOneByEmail(email);
    if (userExists) {
      throw new ConflictException('Email already registered');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = this.dataSource.getRepository(User).create({
      name,
      lastname,
      email,
      password_hash: hashedPassword,
    });

    await this.dataSource.getRepository(User).save(newUser);

    return {
      user_id: newUser.user_id,
      email: newUser.email,
      name: newUser.name,
      lastname: newUser.lastname,
      company: newUser.company,
      branch: newUser.branch,
      role: newUser.role,
      movements: newUser.movements,
    };
  }
}
