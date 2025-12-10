import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  ManyToOne, 
  JoinColumn, 
  BaseEntity 
} from 'typeorm';
import { Asset } from './asset.entity';

@Entity('agent_intents')
export class AgentIntent extends BaseEntity {  // ✅ Extend BaseEntity
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 44 })
  userWallet: string;

  @Column({ type: 'varchar', length: 50 })
  assetType: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  assetName?: string;

  @Column({ type: 'int' })
  durationMinutes: number;

  @Column({ type: 'decimal', precision: 20, scale: 6 })
  maxPricePerUnit: string;

  @Column({ type: 'uuid', nullable: true })
  selectedAssetId?: string;

  @ManyToOne(() => Asset, { nullable: true })
  @JoinColumn({ name: 'selected_asset_id' })
  selectedAsset?: Asset;

  @Column({ type: 'boolean', default: false })
  isFulfilled: boolean;

  @CreateDateColumn()
  createdAt: Date;
}