import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from 'entities/user.entity';
import { Repository } from 'typeorm';
import { randomInt } from 'crypto';
import dayjs from 'dayjs';
import { MailService } from 'common/nodemailer';
import { CreateUserDto } from 'dto/user.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}



  async getMe(id: any) {
    const entity: any = await this.userRepository.findOne({ where: { id }});
    return entity;
  }



async signup(dto: CreateUserDto) {
  const emailExists = await this.userRepository.findOne({ where: { email: dto.email } });
  if (emailExists) throw new BadRequestException('Email already exists');

  const phoneExists = await this.userRepository.findOne({ where: { phone: dto.phone } });
  if (phoneExists) throw new BadRequestException('Phone number already exists');
  

  if (dto.role && dto.role.toLowerCase() === 'admin') {
    throw new BadRequestException('You cannot assign yourself the admin role');
  }

  const hash = await argon.hash(dto.password);

  const user = this.userRepository.create({
    ...dto,
    password: hash,
    status: 'active', 
  });

  const savedUser = await this.userRepository.save(user);

  return {
    id: savedUser.id,
    name: savedUser.name,
    email: savedUser.email,
    role: savedUser.role,
    phone: savedUser.phone,
    message: 'Account created successfully.',
  };
}


async approveUser(userId: number, role: UserRole) {
  const user = await this.userRepository.findOne({ where: { id: userId } });
  if (!user) throw new BadRequestException('User not found');

  if (user.status !== 'pending') {
    throw new BadRequestException('User is already approved');
  }

  user.status = 'active';
  user.role = role;

  await this.userRepository.save(user);

  return {
    message: `User ${user.email} approved as ${user.role}`,
    status: user.status,
    role: user.role
  };
}



  async verifyOtp(email: string, otp: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) throw new BadRequestException('User not found');
    if (user.status !== 'pending') throw new BadRequestException('User already verified or invalid request');

    if (!user.resetPasswordToken || !user.resetPasswordExpires || 
        user.resetPasswordToken !== otp || 
        dayjs().isAfter(user.resetPasswordExpires)) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Update user status to active and clear OTP fields
    user.status = 'active';
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await this.userRepository.save(user);

    // Generate tokens
    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    return {
      message: 'Account verified successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
      accessToken,
      refreshToken
    };
  }

  async resendOtp(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new BadRequestException('User not found');
    if (user.status !== 'pending') throw new BadRequestException('User already verified');

    // Generate new OTP
    const otpCode = randomInt(100000, 999999).toString();
    const otpExpire = dayjs().add(5, 'minutes').toDate();

    user.resetPasswordToken = otpCode;
    user.resetPasswordExpires = otpExpire;
    await this.userRepository.save(user);

    await this.mailService.sendOTPEmail(user.email, otpCode, 'Verify email');

    return { message: 'New OTP sent to your email' };
  }
async signin(email: string, password: string) {
  const user = await this.userRepository.findOne({ where: { email } });
  if (!user) throw new UnauthorizedException('Invalid credentials');

  // Check account status
  switch (user.status) {
    case 'blocked':
      throw new UnauthorizedException('Your account has been blocked. Please contact support.');
    case 'pending':
      throw new UnauthorizedException('Your account is pending approval by an administrator.');
    case 'rejected':
      throw new UnauthorizedException('Your account has been rejected. Please contact support.');
    case 'active':
      // continue
      break;
    default:
      throw new UnauthorizedException('Invalid account status.');
  }

  const passwordValid = await argon.verify(user.password, password);
  if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

  const accessToken = await this.generateAccessToken(user);
  const refreshToken = await this.generateRefreshToken(user);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    department: user.department,
    avatar: user.avatar,
    status: user.status,
    accessToken,
    refreshToken
  };
}

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new BadRequestException('User not found');

    // Check if user is blocked
    if (user.status === 'blocked') {
      throw new UnauthorizedException('Your account has been blocked. Please contact support.');
    }

    // Check if there's an existing unexpired OTP
    if (user.resetPasswordExpires && user.resetPasswordExpires > new Date()) {
      const remainingTime = Math.ceil((user.resetPasswordExpires.getTime() - Date.now()) / 1000);
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;
      throw new BadRequestException(
        `Please wait ${minutes}m ${seconds}s before requesting a new OTP`
      );
    }

    // Generate new OTP
    const otpCode = randomInt(100000, 999999).toString();
    const otpExpire = dayjs().add(5, 'minutes').toDate();

    user.resetPasswordToken = otpCode;
    user.resetPasswordExpires = otpExpire;
    await this.userRepository.save(user);

    await this.mailService.sendOTPEmail(user.email, otpCode, 'reset your password');

    return { message: 'OTP sent to your email' };
  }

  async verifyPasswordResetOtp(email: string, otp: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new BadRequestException('User not found');

    if (!user.resetPasswordToken || !user.resetPasswordExpires || 
        user.resetPasswordToken !== otp || 
        dayjs().isAfter(user.resetPasswordExpires)) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    return { message: 'OTP verified successfully' };
  }

  async resetPassword(email: string, otp: string, newPassword: string, confirmPassword: string) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) throw new BadRequestException('User not found');

    // Verify OTP if provided (for password reset flow)
    if (otp) {
      if (!user.resetPasswordToken || !user.resetPasswordExpires || 
          user.resetPasswordToken !== otp || 
          dayjs().isAfter(user.resetPasswordExpires)) {
        throw new BadRequestException('Invalid or expired OTP');
      }
    }

    // Hash new password
    const hash = await argon.hash(newPassword);
    user.password = hash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepository.save(user);

    return { message: 'Password reset successfully' };
  }

  async refreshAccessToken(refreshToken: string) {
    if (!refreshToken) throw new BadRequestException('Refresh token is required');

    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('User not found');

      // Check if user is blocked
      if (user.status === 'blocked') {
        throw new UnauthorizedException('Your account has been blocked');
      }

      return {
        accessToken: await this.generateAccessToken(user),
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token expired');
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateAccessToken(user: User): Promise<string> {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      status: user.status
    };
    return this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRE || '15m',
    });
  }

  private async generateRefreshToken(user: User): Promise<string> {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };
    return this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
    });
  }


  async toggleBlockUser(requestingUser: any, targetUserId: string) {
  if (requestingUser.role !== 'admin') {
    throw new UnauthorizedException('Only admins can block/unblock users');
  }

  const user = await this.userRepository.findOne({ where: { id: targetUserId as any } });

  if (!user) {
    throw new BadRequestException('User not found');
  }

  user.status = user.status === 'blocked' ? 'active' : 'blocked';
  await this.userRepository.save(user);

  return {
    message: `User ${user.email} is now ${user.status}`,
    status: user.status,
  };
}


}