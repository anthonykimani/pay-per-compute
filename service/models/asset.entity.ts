import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UnitType } from '../enums/unit-type.enum';
import { AssetType } from '../enums/asset-type.enum';
import { AssetStatus } from '../enums/asset-status.enum';
import { Session } from './session.entity';


@Entity('assets')
@Index(['status', 'type'])
export class Asset {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'decimal', precision: 20, scale: 6 })
  pricePerUnit: string;

  @Column({ type: 'enum', enum: UnitType })
  unit: UnitType;

  @Column({ type: 'enum', enum: AssetType })
  type: AssetType;

  @Column({ type: 'enum', enum: AssetStatus, default: AssetStatus.AVAILABLE })
  status: AssetStatus;

  @Column({ type: 'varchar', length: 44 })
  merchantWallet: string;

  @OneToOne(() => Session, { nullable: true })
  @JoinColumn({ name: 'current_session_token' })
  currentSession: Session | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}