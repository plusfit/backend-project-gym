import { IsOptional, IsNumber, Min, Max, IsString, IsDateString, ValidationArguments, registerDecorator, ValidationOptions } from "class-validator";
import { Transform } from "class-transformer";

export class GetGymAccessHistoryDto {
	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	@IsNumber()
	@Min(1)
	page?: number = 1;

	@IsOptional()
	@Transform(({ value }) => parseInt(value))
	@IsNumber()
	@Min(1)
	@Max(100)
	limit?: number = 10;

	@IsOptional()
	@IsString()
	cedula?: string;

	@IsOptional()
	@IsString()
	clientName?: string;

	@IsOptional()
	@Transform(({ value }) => {
		// Handle string values from query parameters
		if (typeof value === 'string') {
			return value === "true";
		}
		// Handle boolean values that might come from other sources
		if (typeof value === 'boolean') {
			return value;
		}
		// Default to undefined for other types
		return undefined;
	})
	successful?: boolean;

	@IsOptional()
	@IsDateString({}, { message: 'startDate debe ser una fecha válida en formato ISO (YYYY-MM-DD)' })
	startDate?: string;

	@IsOptional()
	@IsDateString({}, { message: 'endDate debe ser una fecha válida en formato ISO (YYYY-MM-DD)' })
	@IsDateRangeValid()
	endDate?: string;
}

// Custom validator to ensure startDate <= endDate
function IsDateRangeValid(validationOptions?: ValidationOptions) {
	return function (object: Object, propertyName: string) {
		registerDecorator({
			name: 'isDateRangeValid',
			target: object.constructor,
			propertyName: propertyName,
			constraints: [],
			options: validationOptions,
			validator: {
				validate(value: any, args: ValidationArguments) {
					const object = args.object as any;
					const startDate = object.startDate;
					const endDate = value;

					// If either date is missing, validation passes (handled by @IsOptional)
					if (!startDate || !endDate) {
						return true;
					}

					// Validate that startDate <= endDate
					return new Date(startDate) <= new Date(endDate);
				},
				defaultMessage(args: ValidationArguments) {
					return 'La fecha de inicio debe ser anterior o igual a la fecha de fin';
				},
			},
		});
	};
}