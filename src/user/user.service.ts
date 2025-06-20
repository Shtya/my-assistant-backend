import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'common/base.service';
import { UpdateUserDto } from 'dto/user.dto';
import { User } from 'entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService extends BaseService<User> {
  constructor(
	@InjectRepository(User)
	private readonly userRepo: Repository<User>,
  ) {
	super(userRepo);
  }





  async customUpdate(userId: number, dto: UpdateUserDto, currentUser: any): Promise<User> {
  const user = await this.userRepo.findOne({ where: { id: userId } });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  // Only allow user to update their own data
  if (userId !== currentUser.id && currentUser.role !== 'admin') {
    throw new ForbiddenException('You are not allowed to update this user');
  }

  // Prevent normal users from updating role or status
  if (currentUser.role !== 'admin') {
    delete dto.role;
    delete dto.status;
  }

  Object.assign(user, dto);

  return this.userRepo.save(user);
}

}
