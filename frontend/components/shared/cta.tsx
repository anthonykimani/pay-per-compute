'use client';

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function CTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-purple-900 to-blue-900">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-4xl font-bold mb-6">Ready to Find Compute?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Let our AI agent find the perfect compute resources for your needs
          </p>
          <Link href="/agent">
            <Button size="lg" className="text-lg px-8 py-6">
              <Bot className="mr-2 h-5 w-5" />
              Chat with AI Agent
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}