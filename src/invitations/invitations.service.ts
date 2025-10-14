// src/invitations/invitations.service.ts
import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Invitation, InvitationStatus } from './entities/invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { User } from '../users/entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private invitationsRepository: Repository<Invitation>,
    private dataSource: DataSource,
  ) {}

  // Lógica para que un manager envíe una invitación
  async create(dto: CreateInvitationDto, manager: any) {
    const userToInvite = await this.dataSource
      .getRepository(User)
      .findOneBy({ email: dto.employee_email });
    if (userToInvite && userToInvite.company) {
      throw new ConflictException('Este usuario ya pertenece a una compañía.');
    }

    const invitationExists = await this.invitationsRepository.findOneBy({
      employee_email: dto.employee_email,
      company: { company_id: manager.companyId },
      status: InvitationStatus.PENDING,
    });
    if (invitationExists) {
      throw new ConflictException(
        'Ya existe una invitación pendiente para este email en su empresa.',
      );
    }

    const newInvitation = this.invitationsRepository.create({
      employee_email: dto.employee_email,
      company: { company_id: manager.companyId },
      branch: { branch_id: dto.branchId },
      manager: { user_id: manager.user_id },
    });

    return this.invitationsRepository.save(newInvitation);
  }

  // Lógica para que un usuario vea sus invitaciones
  async findForUser(email: string) {
    return this.invitationsRepository.find({
      where: { employee_email: email, status: InvitationStatus.PENDING },
      relations: ['company', 'branch', 'manager'],
    });
  }

  // Lógica para aceptar una invitación
  async accept(invitationId: number, employee: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const invitation = await queryRunner.manager.findOne(Invitation, {
        where: {
          invitation_id: invitationId,
          employee_email: employee.email,
          status: InvitationStatus.PENDING,
        },
        relations: ['company', 'branch'],
      });
      if (!invitation)
        throw new NotFoundException('Invitación no encontrada o no válida.');

      const user = await queryRunner.manager.findOneBy(User, {
        user_id: employee.user_id,
      });
      if (!user) {
        throw new NotFoundException(
          'El usuario que acepta la invitación no fue encontrado.',
        );
      }
      if (user.company) {
        throw new BadRequestException('Ya perteneces a una compañía.');
      }

      let employeeRole = await queryRunner.manager.findOneBy(Role, {
        role_name: 'Employee',
      });
      if (!employeeRole) {
        employeeRole = queryRunner.manager.create(Role, {
          role_name: 'Employee',
        });
        await queryRunner.manager.save(employeeRole);
      }

      // Asignar compañía, sucursal y rol al usuario
      user.company = invitation.company;
      user.branch = invitation.branch;
      user.role = employeeRole;
      await queryRunner.manager.save(user);

      // Actualizar estado de la invitación
      invitation.status = InvitationStatus.ACCEPTED;
      await queryRunner.manager.save(invitation);

      await queryRunner.commitTransaction();
      return { message: 'Te has unido a la compañía exitosamente.' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Lógica para rechazar una invitación
  async decline(invitationId: number, employee: any) {
    const invitation = await this.invitationsRepository.findOneBy({
      invitation_id: invitationId,
      employee_email: employee.email,
    });
    if (!invitation) throw new NotFoundException('Invitación no encontrada.');

    invitation.status = InvitationStatus.DECLINED;
    await this.invitationsRepository.save(invitation);
    return { message: 'Invitación rechazada.' };
  }
}
