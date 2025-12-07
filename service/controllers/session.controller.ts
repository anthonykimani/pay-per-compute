export class SessionService {
  private static expiryTimers = new Map<string, NodeJS.Timeout>();

  static async createSession(assetId: string, amount: number, payer: string) {
    const asset = await AssetRepository.findOneBy({ id: assetId });
    if (!asset) throw new Error('Asset not found');
    
    const minutes = amount / asset.pricePerUnit;
    const token = `sess_${Date.now()}`;
    
    const session = await sessionRepository.save({
      token,
      asset,
      payerWallet: payer,
      amountPaid: amount,
      expiresAt: new Date(Date.now() + minutes * 60000)
    });

    // Auto-expiry timer
    const timer = setTimeout(async () => {
      await this.expireSession(token);
    }, minutes * 60000);
    
    this.expiryTimers.set(token, timer);
    return session;
  }

  static async expireSession(token: string) {
    this.expiryTimers.delete(token);
    await sessionRepository.delete({ token });
    // Notify WebSocket clients
    WebSocketService.emit('session-expired', { token });
  }
}