export class UserInfo {
  name!: string;
  age!: number;

  constructor(partial: Partial<UserInfo>) {
    Object.assign(this, partial);
  }
}
export class Client {
  type!: string;
  planId!: string;
  email!: string;
  userInfo!: UserInfo;

  constructor(partial: Partial<Client>) {
    Object.assign(this, partial);
  }
}
