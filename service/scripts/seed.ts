import { AppDataSource } from "../config/database";
import { ENV } from "../config/env";
import { AssetType } from "../enums/asset-type.enum";
import { UnitType } from "../enums/unit-type.enum";
import { Asset } from "../models/asset.entity";
import logger from "../utils/logger";


const seedAssets = async () => {
  await AppDataSource.initialize();
  const assetRepository = AppDataSource.getRepository(Asset);

  const demoAssets: Partial<Asset>[] = [
    {
      id: 'gpu-node-01',
      name: 'RTX 4090 GPU Node',
      pricePerUnit: '0.10',
      unit: UnitType.MINUTE,
      type: AssetType.GPU,
      merchantWallet: ENV.MERCHANT_WALLET,
      metadata: {
        cudaVersion: '12.1',
        vram: '24GB',
        cores: 16384,
        location: 'us-east-1'
      }
    },
    {
      id: 'hotspot-02',
      name: 'DePIN Helium Hotspot',
      pricePerUnit: '0.01',
      unit: UnitType.HOUR,
      type: AssetType.COMPUTE_NODE, 
      merchantWallet: ENV.MERCHANT_WALLET,
      metadata: {
        location: 'San Francisco, CA',
        signalStrength: '95%',
        dailyEarnings: '2.5 HNT'
      }
    }
  ];

  for (const assetData of demoAssets) {
    const exists = await assetRepository.findOneBy({ id: assetData.id });
    if (!exists) {
      const asset = assetRepository.create(assetData);
      await assetRepository.save(asset);
      logger.info('🌱 Seeded asset', { id: asset.id });
    }
  }

  logger.info('✅ Seeding complete');
  await AppDataSource.destroy(); // ✅ Close connection
  process.exit(0);
};

seedAssets().catch(error => {
  logger.error('💥 Seeding failed', { error });
  process.exit(1);
});