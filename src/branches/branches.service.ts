import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private branchesRepository: Repository<Branch>,
  ) {}

  // --- Método para crear una sucursal ---
  create(createBranchDto: CreateBranchDto, companyId: number): Promise<Branch> {
    const newBranch = this.branchesRepository.create({
      ...createBranchDto,
      company: { company_id: companyId }, // Asocia con la empresa del manager
    });
    return this.branchesRepository.save(newBranch);
  }

  // --- Método para listar todas las sucursales de la empresa ---
  findAllForCompany(companyId: number): Promise<Branch[]> {
    return this.branchesRepository.find({
      where: { company: { company_id: companyId } },
      order: { branch_name: 'ASC' },
    });
  }

  // --- Método seguro para encontrar UNA sucursal de la empresa ---
  async findOneForCompany(id: number, companyId: number): Promise<Branch> {
    const branch = await this.branchesRepository.findOne({
      where: { branch_id: id, company: { company_id: companyId } },
    });

    if (!branch) {
      throw new NotFoundException(`Sucursal con ID ${id} no encontrada o no pertenece a tu empresa.`);
    }
    return branch;
  }

  // --- Método para actualizar una sucursal ---
  async update(id: number, updateBranchDto: UpdateBranchDto, companyId: number): Promise<Branch> {
    // Primero, verificamos que la sucursal exista y pertenezca a la empresa
    const branch = await this.findOneForCompany(id, companyId);
    
    // Mezclamos los datos existentes con los nuevos y guardamos
    const updatedBranch = this.branchesRepository.merge(branch, updateBranchDto);
    return this.branchesRepository.save(updatedBranch);
  }

  // --- Método para eliminar una sucursal ---
  async remove(id: number, companyId: number): Promise<{ message: string }> {
    const branch = await this.findOneForCompany(id, companyId);
    await this.branchesRepository.remove(branch);
    return { message: `Sucursal "${branch.branch_name}" eliminada exitosamente.` };
  }
}