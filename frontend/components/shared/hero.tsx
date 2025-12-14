'use client';

import { motion } from 'framer-motion';
import { Bot, Zap, Shield, DollarSign } from 'lucide-react';
import { AgentChat } from '@/components/agent/agent-chat';
import { useState } from 'react';

export function Hero() {
  const [intentId, setIntentId] = useState<string | null>(null);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-tl from-cyan-500/20 via-blue-500/10 to-transparent animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            initial={{
              x: Math.random() * 1000,
              y: Math.random() * 1000,
            }}
            animate={{
              x: Math.random() * 1000,
              y: Math.random() * 1000,
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent mb-6">
              AI-Powered Compute Marketplace
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Chat with our AI agent to instantly find and access GPU compute, 
              3D printers, and IoT devices. Pay-per-use with Solana. No subscriptions. 
              No intermediaries.
            </p>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center">
                <Zap className="h-8 w-8 mx-auto mb-2 text-cyan-400" />
                <div className="text-2xl font-bold">Instant</div>
                <div className="text-sm text-gray-400">No waiting</div>
              </div>
              <div className="text-center">
                <Shield className="h-8 w-8 mx-auto mb-2 text-green-400" />
                <div className="text-2xl font-bold">Secure</div>
                <div className="text-sm text-gray-400">x402 verified</div>
              </div>
              <div className="text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
                <div className="text-2xl font-bold">Pay-per-use</div>
                <div className="text-sm text-gray-400">Only pay for what you use</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-cyan-400">
              <Bot className="h-4 w-4 animate-pulse" />
              <span>AI Agent is ready to help you find compute resources</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <AgentChat onIntentCreated={setIntentId} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}