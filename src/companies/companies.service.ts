// src/companies/companies.service.ts
import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Company } from './entities/company.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class CompaniesService {
  constructor(
    private dataSource: DataSource,
    private jwtService: JwtService,
  ) {}

  async createAndAssignManager(createCompanyDto: CreateCompanyDto, tokenUser: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verificar que el usuario no tenga ya una compañía
      const user = await queryRunner.manager.findOneBy(User, { user_id: tokenUser.user_id });
      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }
      if (user.company) {
        throw new BadRequestException('Ya perteneces a una compañía.');
      }

      // 2. Verificar que el nombre de la compañía no exista
      const companyExists = await queryRunner.manager.findOneBy(Company, { company_name: createCompanyDto.company_name });
      if (companyExists) {
        throw new ConflictException('Ya existe una compañía con ese nombre.');
      }

      // 3. Crear la nueva compañía
      const newCompany = queryRunner.manager.create(Company, createCompanyDto);
      await queryRunner.manager.save(newCompany);

      // 4. Buscar o crear el rol de "Manager"
      let managerRole = await queryRunner.manager.findOneBy(Role, { role_name: 'Manager' });
      if (!managerRole) {
        managerRole = queryRunner.manager.create(Role, { role_name: 'Manager' });
        await queryRunner.manager.save(managerRole);
      }
      
      // 5. Actualizar el usuario para asignarle la compañía y el rol 👑
      user.company = newCompany;
      user.role = managerRole;
      await queryRunner.manager.save(user);

      // 6. Generar un NUEVO token JWT con la información actualizada
      const payload = {
        email: user.email,
        sub: user.user_id,
        role: managerRole.role_name,
        companyId: newCompany.company_id,
      };
      const newAccessToken = this.jwtService.sign(payload);

      await queryRunner.commitTransaction();

      // 7. Devolver la compañía creada y el nuevo token
      return {
        company: newCompany,
        access_token: newAccessToken,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; // Relanzar el error para que NestJS lo maneje
    } finally {
      await queryRunner.release();
    }
  }
}