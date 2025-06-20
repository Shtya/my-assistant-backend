// pomodoro.service.ts
import { addMinutes } from 'date-fns';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Pomodoro } from 'entities/pomodoro/pomodoro.entity';
import { PomodoroSettings } from 'entities/pomodoro/pomodoro-settings.entity';
import { Repository } from 'typeorm';
import {
  CreatePomodoroDto,
  CreatePomodoroSettingsDto,
  UpdatePomodoroSettingsDto,
} from 'dto/pomodoro.dto';

@Injectable()
export class PomodoroService {
  constructor(
    @InjectRepository(Pomodoro)
    private pomodoroRepo: Repository<Pomodoro>,
    @InjectRepository(PomodoroSettings)
    private settingsRepo: Repository<PomodoroSettings>,
  ) {}

  // createPomodoro(userId: string, dto: CreatePomodoroDto) {
  //   const pomodoro = this.pomodoroRepo.create({
  //     ...dto,
  //     user: { id: userId as any},
  //   }  );
  //   return this.pomodoroRepo.save(pomodoro);
  // }

  // pomodoro.service.ts

  async checkAndCompletePomodoros() {
    const now = new Date();

    // Get pomodoros that are running and not yet complete
    const runningPomodoros = await this.pomodoroRepo.find({
      where: { completed: false, skipped: false },
    });

    for (const pomodoro of runningPomodoros) {
      const endTime = new Date(
        pomodoro.startTime.getTime() + pomodoro.durationMinutes * 60_000,
      );
      if (now >= endTime) {
        pomodoro.completed = true;
        pomodoro.endTime = endTime;
        await this.pomodoroRepo.save(pomodoro);

        // Create next session based on type
        let nextType: 'short_break' | 'long_break' | null = null;
        if (pomodoro.type === 'pomodoro') nextType = 'short_break';

        if (nextType) {
          await this.pomodoroRepo.save(
            this.pomodoroRepo.create({
              user: pomodoro.user,
              type: nextType,
              startTime: new Date(), // start now or delay?
              durationMinutes: nextType === 'short_break' ? 5 : 15, // you can customize
            }),
          );
        }
      }
    }
  }

  async createPomodoro(userId: string, dto: CreatePomodoroDto) {
    const startTime = dto.startTime ? new Date(dto.startTime) : new Date();
    const durationMinutes = dto.durationMinutes ?? 25; // fallback to 25min if not provided

    const endTime = addMinutes(startTime, durationMinutes); // or use manual calc

    const pomodoro = this.pomodoroRepo.create({
      ...dto,
      user: { id: userId as any },
      startTime,
      endTime,
      durationMinutes,
      completed: endTime <= new Date(), // mark as completed if end already passed
    });

    const savedPomodoro = await this.pomodoroRepo.save(pomodoro);

    // ✅ Automatically schedule short break
    if (pomodoro.type === 'pomodoro') {
      const shortBreak = this.pomodoroRepo.create({
        user: { id: userId as any },
        type: 'short_break',
        startTime: endTime, // immediately after current ends
        endTime: addMinutes(endTime, 5), // 5 minute short break
        durationMinutes: 5,
        completed: false,
      });

      await this.pomodoroRepo.save(shortBreak);
    }

    return savedPomodoro;
  }

  getUserPomodoros(userId: string) {
    return this.pomodoroRepo.find({
      where: { user: { id: userId as any } },
      order: { startTime: 'DESC' },
    });
  }
async createOrUpdateSettings(userId: string, dto: CreatePomodoroSettingsDto) {
  const existing = await this.settingsRepo.findOne({
    where: { user: { id: userId as any } },
  });

  if (existing) {
    await this.settingsRepo.update(existing.id, dto);
    return this.settingsRepo.findOneBy({ id: existing.id });
  }

  const newSettings = this.settingsRepo.create({
    ...dto,
    user: { id: userId as any }, // TypeORM handles this correctly
  });
  return this.settingsRepo.save(newSettings);
}

async getSettings(userId: string) {
  return this.settingsRepo.findOne({
    where: { user: { id: userId as any } },
  });
}


}
