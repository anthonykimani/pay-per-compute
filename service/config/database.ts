import { DataSource } from 'typeorm';
import { ENV } from './env';
import { Asset } from '../models/asset.entity';
import { Session } from '../models/session.entity';
import { PaymentLog } from '../models/paymentlog.entity';
import { Merchant } from '../models/merchant.entity';
import { PlatformConfig } from '../models/platform.entity';


export const AppDataSource = new DataSource({
  type: 'postgres',
  url: ENV.DATABASE_URL,
  entities: [Asset, Session, PaymentLog, Merchant, PlatformConfig],
  synchronize: ENV.NODE_ENV === 'development',
  logging: ENV.NODE_ENV === 'development',
  migrations: ['dist/migrations/*.js'],
  migrationsRun: ENV.NODE_ENV === 'production',
  ssl: ENV.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};