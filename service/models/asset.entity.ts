import { Entity, Column, OneToOne, JoinColumn, Index, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { UnitType } from '../enums/unit-type.enum';
import { AssetType } from '../enums/asset-type.enum';
import { AssetStatus } from '../enums/asset-status.enum';
import { Merchant } from './merchant.entity';


@Entity('assets')
@Index(['status', 'type'])
@Index(['merchantId'])
export class Asset {
  @PrimaryGeneratedColumn('uuid')
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

  @Column({ name: 'merchant_wallet', type: 'varchar', length: 44 })
  merchantWallet: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Merchant, merchant => merchant.assets)
  @JoinColumn({ name: 'merchant_id' })
  merchant!: Merchant;

  @Column({ name: 'merchant_id' })
  merchantId!: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}