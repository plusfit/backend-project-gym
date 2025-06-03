export enum Permission {
  // Client Permissions
  CLIENT_CREATE = "client:create",
  CLIENT_READ = "client:read",
  CLIENT_UPDATE = "client:update",
  CLIENT_DELETE = "client:delete",

  // Routine Permissions
  ROUTINE_CREATE = "routine:create",
  ROUTINE_READ = "routine:read",
  ROUTINE_UPDATE = "routine:update",
  ROUTINE_DELETE = "routine:delete",

  // Plan Permissions
  PLAN_CREATE = "plan:create",
  PLAN_READ = "plan:read",
  PLAN_UPDATE = "plan:update",
  PLAN_DELETE = "plan:delete",

  // Schedule Permissions
  SCHEDULE_CREATE = "schedule:create",
  SCHEDULE_READ = "schedule:read",
  SCHEDULE_UPDATE = "schedule:update",
  SCHEDULE_DELETE = "schedule:delete",

  // Exercise Permissions
  EXERCISE_CREATE = "exercise:create",
  EXERCISE_READ = "exercise:read",
  EXERCISE_UPDATE = "exercise:update",
  EXERCISE_DELETE = "exercise:delete",

  // Organization Management
  ORGANIZATION_ADMIN = "organization:admin",
}

export enum Module {
  CLIENTS = "clients",
  ROUTINES = "routines",
  PLANS = "plans",
  SCHEDULES = "schedules",
  EXERCISES = "exercises",
}

export const DEFAULT_PERMISSIONS = {
  [Module.CLIENTS]: [
    Permission.CLIENT_CREATE,
    Permission.CLIENT_READ,
    Permission.CLIENT_UPDATE,
    Permission.CLIENT_DELETE,
  ],
  [Module.ROUTINES]: [
    Permission.ROUTINE_CREATE,
    Permission.ROUTINE_READ,
    Permission.ROUTINE_UPDATE,
    Permission.ROUTINE_DELETE,
  ],
  [Module.PLANS]: [
    Permission.PLAN_CREATE,
    Permission.PLAN_READ,
    Permission.PLAN_UPDATE,
    Permission.PLAN_DELETE,
  ],
  [Module.SCHEDULES]: [
    Permission.SCHEDULE_CREATE,
    Permission.SCHEDULE_READ,
    Permission.SCHEDULE_UPDATE,
    Permission.SCHEDULE_DELETE,
  ],
  [Module.EXERCISES]: [
    Permission.EXERCISE_CREATE,
    Permission.EXERCISE_READ,
    Permission.EXERCISE_UPDATE,
    Permission.EXERCISE_DELETE,
  ],
};
