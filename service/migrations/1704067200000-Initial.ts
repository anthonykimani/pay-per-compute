import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class Initial1704067200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create assets table
    await queryRunner.createTable(new Table({
      name: 'assets',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true },
        { name: 'name', type: 'varchar', length: '255' },
        { name: 'price_per_unit', type: 'decimal', precision: 20, scale: 6 },
        { name: 'unit', type: 'enum', enum: ['minute', 'hour', 'day', 'session'] },
        { name: 'type', type: 'enum', enum: ['gpu', 'depin-hotspot', 'gaming-pc', 'compute-node'] },
        { name: 'status', type: 'enum', enum: ['available', 'occupied', 'offline'], default: "'available'" },
        { name: 'merchant_wallet', type: 'varchar', length: '44' },
        { name: 'current_session_token', type: 'uuid', isNullable: true },
        { name: 'metadata', type: 'jsonb', isNullable: true },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
      ]
    }));

    // Create sessions table
    await queryRunner.createTable(new Table({
      name: 'sessions',
      columns: [
        { name: 'token', type: 'uuid', isPrimary: true },
        { name: 'asset_id', type: 'uuid' },
        { name: 'payer_wallet', type: 'varchar', length: '44' },
        { name: 'amount_paid', type: 'decimal', precision: 20, scale: 6 },
        { name: 'started_at', type: 'timestamp' },
        { name: 'expires_at', type: 'timestamp' },
        { name: 'is_extended', type: 'boolean', default: false },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
      ],
      foreignKeys: [
        {
          columnNames: ['asset_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'assets',
          onDelete: 'CASCADE'
        }
      ]
    }));

    // Create payment_logs table
    await queryRunner.createTable(new Table({
      name: 'payment_logs',
      columns: [
        { name: 'id', type: 'bigint', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
        { name: 'signature', type: 'varchar', length: '88', isUnique: true },
        { name: 'amount', type: 'decimal', precision: 20, scale: 6 },
        { name: 'payer_wallet', type: 'varchar', length: '44' },
        { name: 'asset_id', type: 'uuid' },
        { name: 'session_token', type: 'uuid', isNullable: true },
        { name: 'success', type: 'boolean', default: true },
        { name: 'error', type: 'text', isNullable: true },
        { name: 'facilitator_response', type: 'jsonb' },
        { name: 'timestamp', type: 'timestamp', default: 'CURRENT_TIMESTAMP' }
      ],
      foreignKeys: [
        {
          columnNames: ['asset_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'assets',
          onDelete: 'SET NULL'
        },
        {
          columnNames: ['session_token'],
          referencedColumnNames: ['token'],
          referencedTableName: 'sessions',
          onDelete: 'SET NULL'
        }
      ]
    }));

    // Create indexes
    await queryRunner.query(`CREATE INDEX idx_assets_status_type ON assets(status, type);`);
    await queryRunner.query(`CREATE INDEX idx_sessions_asset_id ON sessions(asset_id);`);
    await queryRunner.query(`CREATE INDEX idx_payment_logs_signature ON payment_logs(signature);`);
    await queryRunner.query(`CREATE INDEX idx_payment_logs_payer ON payment_logs(payer_wallet);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('payment_logs');
    await queryRunner.dropTable('sessions');
    await queryRunner.dropTable('assets');
  }
}