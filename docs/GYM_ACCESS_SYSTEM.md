# Gym Access System Implementation

## Overview
Complete gym access validation system for NestJS backend with client validation via cedula (Uruguayan ID), access tracking, and rewards system.

## Features Implemented

### 1. Gym Access Module (`/gym-access`)

#### Main Endpoint: `POST /gym-access/validate`
- **Input**: `{ cedula: string }` (8-digit Uruguayan ID)
- **Validation Logic**:
  1. Find client by cedula (`userInfo.CI` field)
  2. Check if client exists and is enabled
  3. Verify no previous access today (using `accessDay` YYYY-MM-DD format)
  4. Check gym operating hours (via schedules collection)
  5. Create access record and update client statistics
  6. Calculate consecutive days streak
  7. Check for earned rewards

#### Additional Endpoints:
- `GET /gym-access/history` - Paginated access history with filters (Admin only)
- `GET /gym-access/stats` - Daily/monthly statistics (Admin only)  
- `GET /gym-access/client/:cedula/history` - Client-specific history (Admin only)

### 2. Rewards Module (`/rewards`)

#### Complete CRUD Operations:
- `POST /rewards` - Create new reward
- `GET /rewards` - List all rewards with pagination/filters
- `GET /rewards/active` - Get active rewards only
- `GET /rewards/:id` - Get specific reward
- `PATCH /rewards/:id` - Update reward
- `PATCH /rewards/:id/toggle-active` - Toggle active status
- `DELETE /rewards/:id` - Delete reward

### 3. Database Schema Updates

#### New Collections:

**GymAccess Collection:**
```typescript
{
  clientId: ObjectId,        // Reference to client
  cedula: string,            // Client's cedula (8 digits)
  accessDate: Date,          // Access date and time
  accessDay: string,         // "YYYY-MM-DD" format for validation
  successful: boolean,       // Whether access was granted
  reason?: string,           // Reason for denial (if applicable)
  clientName: string,        // Denormalized client name
  clientPhoto?: string,      // Denormalized client photo
  createdAt: Date,
  updatedAt: Date
}
```

**Rewards Collection:**
```typescript
{
  name: string,              // Reward name
  description: string,       // Reward description
  requiredDays: number,      // Days needed to earn reward
  isActive: boolean,         // Whether reward is active
  createdAt: Date,
  updatedAt: Date
}
```

#### Updated Client Schema:
```typescript
{
  // ... existing fields
  lastAccess?: Date,         // Last successful access date
  totalAccesses?: number,    // Total successful accesses (default: 0)
  consecutiveDays?: number,  // Current consecutive days streak (default: 0)
}
```

### 4. Business Logic

#### Access Validation Rules:
1. **Client Validation**: Must exist in database and be enabled
2. **Daily Limit**: Only one access per day per client
3. **Operating Hours**: Must be within gym schedule times
4. **Consecutive Days**: Calculated based on daily access pattern
5. **Rewards**: Automatically checked and returned when earned

#### Response Format:
```typescript
{
  success: boolean,
  message: string,
  client?: {
    name: string,
    photo?: string,
    plan?: string,
    consecutiveDays: number,
    totalAccesses: number,
  },
  reward?: {
    name: string,
    description: string,
    requiredDays: number,
  },
  reason?: string // if access denied
}
```

### 5. Default Rewards (Seeded)
- **7 days**: "Guerrero de la Semana"
- **15 days**: "Disciplina de Acero" 
- **30 days**: "Campeón del Mes"
- **60 days**: "Máquina Imparable"
- **90 days**: "Leyenda del Gimnasio"

## Security & Access Control

- **Gym Access Validation**: No authentication required (tablet access)
- **Admin Endpoints**: Protected with Role-based guards (Admin only)
- **Input Validation**: class-validator for all DTOs
- **Error Handling**: Comprehensive error responses

## Usage Examples

### Validate Client Access (Tablet)
```bash
POST /gym-access/validate
{
  "cedula": "12345678"
}
```

### Get Access History (Admin)
```bash
GET /gym-access/history?page=1&limit=10&successful=true
```

### Create New Reward (Admin)
```bash
POST /rewards
{
  "name": "Dedicated Athlete",
  "description": "21 days of consistent training!",
  "requiredDays": 21,
  "isActive": true
}
```

## File Structure
```
src/context/
├── gym-access/
│   ├── dto/
│   ├── entities/
│   ├── repositories/
│   ├── schemas/
│   ├── gym-access.controller.ts
│   ├── gym-access.service.ts
│   └── gym-access.module.ts
├── rewards/
│   ├── dto/
│   ├── entities/
│   ├── repositories/
│   ├── schemas/
│   ├── rewards.controller.ts
│   ├── rewards.service.ts
│   └── rewards.module.ts
└── clients/schemas/client.schema.ts (updated)
```

## Integration Notes

- Integrated with existing `ClientsModule` and `SchedulesModule`
- Follows existing project patterns (repository pattern, DTOs, entities)
- Uses MongoDB with Mongoose
- Implements proper pagination for all list endpoints
- Includes comprehensive error handling and validation
- Middleware configured to allow unauthenticated gym access validation