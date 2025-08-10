import jwt from 'jsonwebtoken';

// Usar el mismo secreto que está en el .env
const JWT_ACCESS_SECRET = 'a02BJR9nGK+L0jRjModg+tWNn6BlW8K8dpo2ry5Ltx20BYJnfNWJUYzmeObyyiYUiqIq4YhTO9Rwq8lqsDKMTA==';

// Crear un payload de prueba para un usuario admin
const payload = {
  sub: '507f1f77bcf86cd799439011', // ID de usuario de prueba
  email: 'admin@test.com',
  role: 'Admin',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // Expira en 24 horas
};

// Generar el token
const token = jwt.sign(payload, JWT_ACCESS_SECRET);

console.log('JWT Token generado:');
console.log(token);
console.log('\nPara usar en las peticiones HTTP:');
console.log(`Authorization: Bearer ${token}`);