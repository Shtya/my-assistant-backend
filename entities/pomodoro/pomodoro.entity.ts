import { User } from 'entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';


@Entity()
export class Pomodoro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.pomodoros)
  user: User;

  @Column({ type: 'enum', enum: ['pomodoro', 'short_break', 'long_break'] })
  type: 'pomodoro' | 'short_break' | 'long_break';

  @Column('timestamp')
  startTime: Date;

  @Column('timestamp', { nullable: true })
  endTime: Date;

  @Column({ default: false })
  completed: boolean;

  @Column({ default: false })
  skipped: boolean;

  @Column('int', { nullable: true })
  durationMinutes: number; // actual duration

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
