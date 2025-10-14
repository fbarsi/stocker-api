// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtenemos los roles requeridos para la ruta (ej: ['Manager'])
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true; // Si no se especifican roles, se permite el acceso
    }

    // Obtenemos el objeto 'user' que fue adjuntado por el JwtAuthGuard
    const { user } = context.switchToHttp().getRequest();

    // Comprobamos si el rol del usuario está en la lista de roles requeridos
    return requiredRoles.some((role) => user.role === role);
  }
}