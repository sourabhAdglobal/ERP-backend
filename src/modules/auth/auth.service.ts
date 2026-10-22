import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Use the same response for an unknown email and an invalid password.
    if (!user || !user.passwordHash || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid email or password');
    }

    let passwordMatches = false;

    try {
      passwordMatches = await argon2.verify(user.passwordHash, dto.password);
    } catch {
      // Treat malformed stored hashes as authentication failures.
    }

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const memberships = await this.prisma.organizationMembership.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        organization: { isActive: true },
      },
      select: {
        organization: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    const organizations = memberships.map(
      (membership) => membership.organization,
    );
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
      },
      organizations,
    };
  }
}