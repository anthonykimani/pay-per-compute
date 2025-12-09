import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Asset } from "./asset.entity";

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 44, unique: true })
  walletAddress!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  apiKey!: string;

  @Column({ type: 'int' })
  platformFeePercent!: number; // Per-merchant fee tier

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => Asset, asset => asset.merchant, { cascade: ['remove'] })
  assets!: Asset[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}