import { 
  verifySignature as verifyKitSignature, 
  type SignatureBytes,
  type Address
} from '@solana/kit';
import bs58 from 'bs58';
import logger from './logger';

export async function verifySignature(
  message: string,
  signature: string,
  walletAddress: string
): Promise<boolean> {
  try {
    // Decode inputs
    const messageBytes = new TextEncoder().encode(message);
    const publicKeyBytes = bs58.decode(walletAddress);

    const signatureBytes = bs58.decode(signature) as SignatureBytes;
    
    // Import Ed25519 public key
    const publicKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(publicKeyBytes),
      { name: 'Ed25519' },
      false,
      ['verify']
    );

    // Verify signature
    const verified = await verifyKitSignature(publicKey, signatureBytes, messageBytes);
    return verified;
  } catch (error) {
    logger.error('❌ Signature verification failed', { error, walletAddress });
    return false;
  }
}