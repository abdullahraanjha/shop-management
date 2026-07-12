import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { ApiError } from '../../utils/ApiError.js';
import { signToken } from '../../utils/jwt.js';
import type { LoginInput, RegisterInput } from './auth.schema.js';

/** Strip the password before returning a user to the client. */
function sanitize(user: { password: string } & Record<string, unknown>) {
  const { password: _pw, ...safe } = user;
  return safe;
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw ApiError.conflict('Email is already registered');

    const hash = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, password: hash, role: input.role ?? 'ADMIN' },
    });

    const token = signToken({ sub: user.id, role: user.role, email: user.email });
    return { user: sanitize(user), token };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive) throw ApiError.unauthorized('Invalid credentials');

    const ok = await bcrypt.compare(input.password, user.password);
    if (!ok) throw ApiError.unauthorized('Invalid credentials');

    const token = signToken({ sub: user.id, role: user.role, email: user.email });
    return { user: sanitize(user), token };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');
    return sanitize(user);
  },
};
