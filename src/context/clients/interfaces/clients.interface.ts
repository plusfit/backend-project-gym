import { EClientRole } from "@/src/context/shared/enums/clients-role.enum";

export interface ClientFilters {
	name?: string;
	email?: string;
	CI?: string;
	role?: EClientRole;
	withoutPlan?: boolean;
	disabled?: boolean;
}
