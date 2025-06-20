import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Task } from './pomodoro/pomodoro-task.entity';
import { Pomodoro } from './pomodoro/pomodoro.entity';
import { PomodoroSettings } from './pomodoro/pomodoro-settings.entity';
import { Asset } from 'entities/assets.entity';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
}

export enum BoardVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  TEAM = 'team',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ nullable: true })
  department: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ default: null })
  resetPasswordExpires: Date;

  @Column({ default: null })
  resetPasswordToken: string;

  @Column({ nullable: true })
  phone: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Trello-like relationships
  @OneToMany(() => Board, (board) => board.owner)
  ownedBoards: Board[];

  @ManyToMany(() => Board, (board) => board.members)
  @JoinTable()
  memberBoards: Board[];

  @OneToMany(() => Team, (team) => team.owner)
  ownedTeams: Team[];

  @ManyToMany(() => Team, (team) => team.members)
  @JoinTable()
  memberTeams: Team[];

  @OneToMany(() => CardAssignment, (assignment) => assignment.user)
  cardAssignments: CardAssignment[];



  @OneToMany(() => Task, task => task.user)
  tasks: Task[];

  @OneToMany(() => Pomodoro, pomodoro => pomodoro.user)
  pomodoros: Pomodoro[];

  @OneToOne(() => PomodoroSettings, settings => settings.user)
  pomodoroSettings: PomodoroSettings;

  @OneToMany(() => Asset, upload => upload.user)
  uploads: Asset[];
}



@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => User, (user) => user.ownedTeams)
  @JoinColumn()
  owner: User;

  @ManyToMany(() => User, (user) => user.memberTeams)
  @JoinTable()
  members: User[];

  @OneToMany(() => Board, (board) => board.team)
  boards: Board[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity()
export class Board {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: BoardVisibility,
    default: BoardVisibility.PRIVATE,
  })
  visibility: BoardVisibility;

  @ManyToOne(() => User, (user) => user.ownedBoards)
  @JoinColumn()
  owner: User;

  @ManyToMany(() => User, (user) => user.memberBoards)
  @JoinTable()
  members: User[];

  @ManyToOne(() => Team, (team) => team.boards, { nullable: true })
  team: Team;

  @OneToMany(() => List, (list) => list.board, { cascade: true })
  lists: List[];

  @Column({ default: '#0079BF' })
  backgroundColor: string;

  @Column({ nullable: true })
  backgroundImage: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity()
export class List {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  position: number;

  @ManyToOne(() => Board, (board) => board.lists)
  @JoinColumn()
  board: Board;

  @OneToMany(() => Card, (card) => card.list, { cascade: true })
  cards: Card[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity()
export class Card {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  position: number;

  @ManyToOne(() => List, (list) => list.cards)
  @JoinColumn()
  list: List;

  @OneToMany(() => CardAssignment, (assignment) => assignment.card)
  assignments: CardAssignment[];

  @OneToMany(() => CardComment, (comment) => comment.card)
  comments: CardComment[];

  @OneToMany(() => CardAttachment, (attachment) => attachment.card)
  attachments: CardAttachment[];

  @OneToMany(() => CardChecklist, (checklist) => checklist.card)
  checklists: CardChecklist[];

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ default: false })
  isComplete: boolean;

  @Column({ nullable: true })
  coverImage: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity()
export class CardAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.cardAssignments)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Card, (card) => card.assignments)
  @JoinColumn()
  card: Card;

  @CreateDateColumn()
  created_at: Date;
}

@Entity()
export class CardComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @ManyToOne(() => User)
  @JoinColumn()
  author: User;

  @ManyToOne(() => Card, (card) => card.comments)
  @JoinColumn()
  card: Card;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity()
export class CardAttachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  type: string; // 'image', 'file', 'link'

  @ManyToOne(() => Card, (card) => card.attachments)
  @JoinColumn()
  card: Card;

  @CreateDateColumn()
  created_at: Date;
}

@Entity()
export class CardChecklist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @ManyToOne(() => Card, (card) => card.checklists)
  @JoinColumn()
  card: Card;

  @OneToMany(() => ChecklistItem, (item) => item.checklist, { cascade: true })
  items: ChecklistItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity()
export class ChecklistItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;

  @Column({ default: false })
  isComplete: boolean;

  @ManyToOne(() => CardChecklist, (checklist) => checklist.items)
  @JoinColumn()
  checklist: CardChecklist;

  @CreateDateColumn()
  created_at: Date;
}
