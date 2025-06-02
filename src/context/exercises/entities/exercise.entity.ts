export enum MediaType {
	IMAGE = 'image',
	VIDEO = 'video'
}

export class Exercise {
	id?: string;
	name?: string;
	description?: string;
	gifUrl?: string;
	mediaType?: MediaType;
	type?: string;
	minutes?: number;
	rest?: number;
	reps?: number;
	series?: number;

	constructor(partial: Partial<Exercise>) {
		Object.assign(this, partial);
	}
}
