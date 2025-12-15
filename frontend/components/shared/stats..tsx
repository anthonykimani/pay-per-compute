'use client';

import { motion } from 'framer-motion';
import { Zap, Users, Package, DollarSign } from 'lucide-react';

const stats = [
  { icon: Zap, label: 'Compute Hours', value: '10K+' },
  { icon: Users, label: 'Active Users', value: '500+' },
  { icon: Package, label: 'Assets Available', value: '100+' },
  { icon: DollarSign, label: 'Avg Cost/Min', value: '$0.05' },
];

export function Stats() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Icon className="h-16 w-16 mx-auto mb-4 text-cyan-500" />
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}