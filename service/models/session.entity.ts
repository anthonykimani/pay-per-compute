import { Entity, Column, ManyToOne, JoinColumn, Index, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Asset } from './asset.entity';


@Entity('sessions')
@Index(['asset'])
@Index(['payerWallet'])
export class Session {
  @PrimaryGeneratedColumn('uuid')
  token: string;

  @ManyToOne(() => Asset, { eager: true })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ name: 'payer_wallet', length: 44 })
  payerWallet: string;

  @Column({ name: 'amount_paid', type: 'decimal', precision: 20, scale: 6 })
  amountPaid: string;

  @Column({ name: 'started_at', type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  @Index()
  expiresAt: Date;

  @Column({ name: 'is_extended', type: 'boolean', default: false })
  isExtended: boolean;

  @CreateDateColumn()
  createdAt: Date;
}