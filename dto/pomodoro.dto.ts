import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, Max } from 'class-validator';

export enum PomodoroType {
  POMODORO = 'pomodoro',
  SHORT_BREAK = 'short_break',
  LONG_BREAK = 'long_break',
}

export class CreatePomodoroDto {

  @IsEnum(PomodoroType)
  type: PomodoroType;

  @IsOptional()
  startTime?: Date;

  @IsOptional()
  endTime?: Date;

  @IsBoolean()
  completed: boolean;

  @IsBoolean()
  skipped: boolean;

  @IsOptional()
  @IsInt()
  durationMinutes?: number;
}


export class CreatePomodoroSettingsDto {

  @IsInt()
  @Min(1)
  pomodoroDuration: number;

  @IsInt()
  shortBreakDuration: number;

  @IsInt()
  longBreakDuration: number;

  @IsInt()
  roundsBeforeLongBreak: number;

  @IsBoolean()
  soundEnabled: boolean;

  @IsString()
  defaultSound: string;

  @IsBoolean()
  desktopNotifications: boolean;

  @IsInt()
  @Min(0)
  @Max(100)
  volume: number;

  @IsBoolean()
  autoStartNextSession: boolean;

  @IsBoolean()
  blockPCDuringBreaks: boolean;

  @IsBoolean()
  focusMode: boolean;

  @IsOptional()
  @IsString()
  backgroundTheme?: string;
}

export class UpdatePomodoroSettingsDto extends PartialType(CreatePomodoroSettingsDto) {}
