# Plan de Implementación Multi-tenant - Backend (+FIT)

Este documento detalla la estrategia técnica para transformar el sistema actual en una solución jerárquica multitenant.

## 1. Jerarquía de Datos
El sistema seguirá la estructura: **SuperAdmin** -> **Organizaciones** -> **Sucursales**.
*   **SuperAdmin**: Gestiona Organizaciones y sus módulos habilitados.
*   **Organización**: Entidad paraguas que agrupa sucursales.
*   **Sucursal**: Unidad operativa donde viven los datos (Clientes, Rutinas, etc.).

## 2. Modelos de Datos (MongoDB)

### Nuevas Colecciones:
1.  **Organizations**:
    *   `name`: String
    *   `logoUrl`: String
    *   `adminId`: ObjectId (Admin de la Organización)
    *   `status`: 'active' | 'disabled'
2.  **Branches**:
    *   `organizationId`: ObjectId
    *   `name`: String
    *   `modulesEnabled`: String[] (Ej: `['horarios', 'rutinas', 'pagos']`)
    *   `planId`: String (Vinculado a la configuración de módulos)

### Cambios en Colecciones Existentes:
Se inyectarán los campos `organizationId` y `branchId` en:
*   `Clients`, `Exercises`, `Routines`, `Schedules`, `Rewards`, `Payments`.
*   Se crearán **índices compuestos** (`branchId` + `_id`) para optimizar el aislamiento.

## 3. Arquitectura de Aislamiento (NestJS)

### Contexto de Ejecución:
*   Utilizaremos **AsyncLocalStorage** (vía `nestjs-cls`) para mantener el contexto del tenant durante el ciclo de vida de la solicitud.
*   **AuthMiddleware**: Extraerá `orgId` y `branchId` del JWT.
*   **TenantInterceptor**: Poblará el almacén de contexto con los IDs detectados.

### Filtrado Automático (Mongoose Plugin):
*   Se implementará un plugin global que intercepte todas las queries (`find`, `findOne`, `updateMany`, etc.).
*   Inyectará automáticamente el filtro `{ branchId: context.branchId }` a menos que el usuario sea SuperAdmin.

## 4. Gestión de Módulos (Feature Gating)
*   **ModuleGuard**: Un guardia global que verificará si el módulo solicitado (detectado por el path o decorador) está incluido en el array `modulesEnabled` de la Sucursal actual.
*   Si no está habilitado, retornará `403 Forbidden`.

## 5. Roadmap de Tareas (Backend)
1.  [ ] Infraestructura: Configurar `nestjs-cls` e Interceptor de Tenant.
2.  [ ] Persistencia: Crear Plugin de Mongoose para aislamiento.
3.  [ ] Modelado: Implementar CRUD de Organizations y Branches.
4.  [ ] Seguridad: Actualizar JWT y Auth para roles jerárquicos.
5.  [ ] Dominio: Migrar esquemas existentes para incluir IDs de tenant.
6.  [ ] Gating: Implementar ModuleGuard.
