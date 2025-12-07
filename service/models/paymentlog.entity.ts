import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity('payment_logs')
@Index(['signature'])
@Index(['payerWallet'])
@Index(['assetId'])
export class PaymentLog {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 88, unique: true })
  signature: string;

  @Column({ type: 'decimal', precision: 20, scale: 6 })
  amount: string;

  @Column({ name: 'payer_wallet', length: 44 })
  payerWallet: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId: string;

  @Column({ name: 'session_token', type: 'uuid', nullable: true })
  sessionToken: string | null;

  @Column({ type: 'boolean', default: true })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @Column({ name: 'facilitator_response', type: 'jsonb' })
  facilitatorResponse: Record<string, any>;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;
}