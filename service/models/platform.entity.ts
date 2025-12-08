import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('platform_config')
export class PlatformConfig {
    @PrimaryGeneratedColumn()
    id: 'singleton' = 'singleton';

    @Column({ type: 'varchar', length: 44 })
    walletAddress!: string; // Platform wallet

    @Column({ type: 'jsonb' })
    feeSchedule!: {
        default: number; // 2%
        highVolume: number; // 1.5% for merchants >$10k/mo
        enterprise: number; // 1% for negotiated deals
    };

    @Column({ type: 'jsonb' })
    supportedNetworks!: string[]; // ['solana', 'base', 'polygon']
}