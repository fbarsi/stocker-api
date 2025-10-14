import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
  ) {}

  create(createItemDto: CreateItemDto, companyId: number): Promise<Item> {
    const newItem = this.itemsRepository.create({
      ...createItemDto,
      company: { company_id: companyId },
    });
    return this.itemsRepository.save(newItem);
  }

  findAllForCompany(companyId: number): Promise<Item[]> {
    return this.itemsRepository.find({
      where: { company: { company_id: companyId } },
      order: { item_name: 'ASC' },
    });
  }

  async findOneForCompany(id: number, companyId: number): Promise<Item> {
    const item = await this.itemsRepository.findOne({
      where: { item_id: id, company: { company_id: companyId } },
    });

    if (!item) {
      throw new NotFoundException(`Artículo con ID ${id} no encontrado o no pertenece a tu empresa.`);
    }
    return item;
  }

  async update(id: number, updateItemDto: UpdateItemDto, companyId: number): Promise<Item> {
    const item = await this.findOneForCompany(id, companyId);
    const updatedItem = this.itemsRepository.merge(item, updateItemDto);
    return this.itemsRepository.save(updatedItem);
  }

  async remove(id: number, companyId: number): Promise<{ message: string }> {
    const item = await this.findOneForCompany(id, companyId);
    await this.itemsRepository.remove(item);
    return { message: `Artículo "${item.item_name}" eliminado exitosamente.` };
  }
}