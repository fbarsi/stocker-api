import {
  Injectable,
  ConflictException,
  UnauthorizedException,
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
import { ConfigService } from '@nestjs/config';
import type { JwtPayload, AuthenticatedUser } from 'src/interfaces';
import { StringValue } from 'ms';

type TokenUser = Partial<User> & { userId: number; email: string };

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
    private configService: ConfigService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Partial<User> | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      return {
        userId: user.userId,
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

  private generateTokens(user: TokenUser | AuthenticatedUser) {
    const roleName =
      (user as Partial<User>).role?.role_name ||
      (user as AuthenticatedUser).role;

    const companyId =
      (user as Partial<User>).company?.companyId ||
      (user as AuthenticatedUser).companyId;

    const branchId =
      (user as Partial<User>).branch?.branchId ||
      (user as AuthenticatedUser).branchId;

    const payload: JwtPayload = {
      email: user.email,
      sub: user.userId,
      role: roleName,
      companyId: companyId,
      branchId: branchId,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: this.configService.getOrThrow<StringValue>(
        'jwt.refreshExpiresIn',
      ),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  login(user: Partial<User>) {
    const tokenUser: TokenUser = {
      userId: user.userId!,
      email: user.email!,
      ...user,
    };
    const tokens = this.generateTokens(tokenUser);

    return {
      user: {
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        role: user.role?.role_name,
        companyId: user.company?.companyId,
        branchId: user.branch?.branchId,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async refreshToken(user: AuthenticatedUser) {
    const userProfile = await this.usersService.getProfile(user.userId);

    if (!userProfile) {
      throw new UnauthorizedException('User not found during token refresh');
    }

    const updatedUser: AuthenticatedUser = {
      userId: userProfile.userId,
      email: userProfile.email,
      role: userProfile.role?.role_name || user.role,
      companyId: userProfile.company?.companyId,
      branchId: userProfile.branch?.branchId,
    };

    const newTokens = this.generateTokens(updatedUser);

    return {
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
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
      passwordHash: hashedPassword,
    });

    await this.dataSource.getRepository(User).save(newUser);

    return {
      userId: newUser.userId,
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
