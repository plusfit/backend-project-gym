export class Auth {
  name!: string;
  email!: string;
  token!: string;
  //COMPLETAR CON LOS DATOS DE UN USUARIO

  constructor(partial: Partial<Auth>) {
    Object.assign(this, partial);
  }
}
