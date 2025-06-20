import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PomodoroController } from './pomodoro.controller';
import { PomodoroService } from './pomodoro.service';
import { Pomodoro } from 'entities/pomodoro/pomodoro.entity';
import { PomodoroSettings } from 'entities/pomodoro/pomodoro-settings.entity';
import { JwtService } from '@nestjs/jwt';
import { User } from 'entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pomodoro, PomodoroSettings , User ])],
  controllers: [PomodoroController],
  providers: [PomodoroService , JwtService ],
})
export class PomodoroModule {}
