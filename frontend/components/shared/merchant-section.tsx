'use client';

import { motion } from 'framer-motion';
import { Store, DollarSign, Zap, Shield, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MerchantSection() {
  const features = [
    {
      icon: DollarSign,
      title: 'Earn Passive Income',
      description: 'Monetize idle GPUs, 3D printers, and IoT devices with pay-per-use pricing',
    },
    {
      icon: Zap,
      title: 'Instant Setup',
      description: 'Register and list assets in under 5 minutes. No paperwork, no waiting',
    },
    {
      icon: Shield,
      title: 'Secure & Trustless',
      description: 'Cryptographic verification ensures payment before access. Zero chargebacks',
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Analytics',
      description: 'Track earnings, utilization rates, and customer demand live',
    },
    {
      icon: Users,
      title: 'Global Marketplace',
      description: 'Reach AI researchers, gamers, and businesses worldwide',
    },
    {
      icon: Store,
      title: 'You Control Pricing',
      description: 'Set your own rates per minute/hour. Adjust anytime based on demand',
    },
  ];

  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-tl from-cyan-500/10 via-blue-500/5 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent mb-6">
            Monetize Your Compute Hardware
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Turn idle GPUs, 3D printers, and IoT devices into revenue streams. 
            The AI agent automatically matches your assets with paying customers.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full hover:bg-white/10 transition-colors">
                  <CardHeader>
                    <Icon className="h-10 w-10 text-cyan-400 mb-4" />
                    <CardTitle className="text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-6 text-lg"
              onClick={() => window.location.href = '/merchant/register'}
            >
              Start Earning Today
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 px-8 py-6 text-lg"
              onClick={() => window.location.href = '/merchant/login'}
            >
              Already a Merchant? Login
            </Button>
          </div>
          
          <p className="text-sm text-gray-400 mt-6">
            No setup fees • Only 2% platform fee • Instant payouts
          </p>
        </motion.div>
      </div>
    </section>
  );
}