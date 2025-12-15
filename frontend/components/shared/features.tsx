'use client';

import { motion } from 'framer-motion';
import { Bot, Zap, Shield, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Bot,
    title: 'AI-Powered Discovery',
    description: 'Natural language interface to find the perfect compute resources',
  },
  {
    icon: Zap,
    title: 'Instant Access',
    description: 'No subscriptions, no accounts. Just pay and start using',
  },
  {
    icon: Shield,
    title: 'Secure & Verifiable',
    description: 'Built on Solana with x402 protocol for cryptographically verified payments',
  },
  {
    icon: DollarSign,
    title: 'Pay Per Use',
    description: 'Only pay for what you use. Minute-by-minute billing or session-based',
  },
];

export function Features() {
  return (
    <section className="py-20 bg-muted">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Why PayPerCompute?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <Icon className="h-12 w-12 mx-auto mb-4 text-cyan-500" />
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}