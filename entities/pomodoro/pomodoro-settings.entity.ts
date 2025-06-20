import { User } from 'entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';


// pomodoro-settings.entity.ts
@Entity()
export class PomodoroSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  // ⏱ Timer durations
  @Column({ default: 25 })
  pomodoroDuration: number;

  @Column({ default: 5 })
  shortBreakDuration: number;

  @Column({ default: 15 })
  longBreakDuration: number;

  @Column({ default: 4 })
  roundsBeforeLongBreak: number;

  // 🔔 Sound and notifications
  @Column({ default: true })
  soundEnabled: boolean;

  @Column({ default: 'Chime' })
  defaultSound: string;

  @Column({ default: true })
  desktopNotifications: boolean;

  @Column({ type: 'float', default: 0.5 }) // range: 0 to 1
  volume: number;

  // 🔐 Focus behavior
  @Column({ default: false })
  autoStartNextSession: boolean;

  @Column({ default: false })
  blockPCDuringBreaks: boolean;

  @Column({ default: false })
  focusMode: boolean;

  // 🎨 Background theme/image
  @Column({ nullable: true })
  backgroundTheme: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
