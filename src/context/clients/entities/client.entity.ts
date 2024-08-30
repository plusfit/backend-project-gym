export class Client {
  type!: string;
  planId!: string;
  email!: string;
  userInfo!: any;

  constructor(partial: Partial<Client>) {
    Object.assign(this, partial);
  }
}
