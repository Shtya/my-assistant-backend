// pomodoro.controller.ts

import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  CreatePomodoroDto,
  CreatePomodoroSettingsDto,
  UpdatePomodoroSettingsDto,
} from 'dto/pomodoro.dto';
import { PomodoroService } from './pomodoro.service';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('pomodoro')
export class PomodoroController {
  constructor(private readonly service: PomodoroService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreatePomodoroDto) {
    const userId = req.user.id; 
    return this.service.createPomodoro(userId, dto);
  }

  @Post('complete')
  async checkAndCompletePomodoros() {
    await this.service.checkAndCompletePomodoros();
    return { success: true, message: 'Pomodoro check completed' };
  }


  @Get()
  getAllForUser(@Req() req: any) {
    const userId = req.user.id;
    return this.service.getUserPomodoros(userId);
  }


  @Post('settings')
  createSettings(@Req() req: any, @Body() dto: CreatePomodoroSettingsDto) {
    const userId = req.user.id;
    return this.service.createOrUpdateSettings(userId, dto);
  }

  @Get('settings')
  getSettings(@Req() req: any) {
    const userId = req.user.id;
    return this.service.getSettings(userId);
  }
}
