'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Zap, ChartBar, Wallet } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home', icon: Zap },
    { href: '/agent', label: 'AI Agent', icon: Bot, gradient: true },
    { href: '/assets', label: 'Browse Assets', icon: Zap },
    { href: '/merchant/dashboard', label: 'Merchant Dashboard', icon: ChartBar },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <Zap className="h-6 w-6 text-cyan-400" />
              PayPerCompute
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {links.map(({ href, label, icon: Icon, gradient }) => {
                const isActive = pathname === href;
                
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'relative flex items-center gap-2 text-sm font-medium transition-colors',
                      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                      gradient && 'px-3 py-1 rounded-md'
                    )}
                  >
                    {gradient && (
                      <motion.div
                        className="absolute inset-0 -z-10 rounded-md opacity-20"
                        animate={{
                          background: [
                            'linear-gradient(45deg, #ff0080, #7928ca)',
                            'linear-gradient(45deg, #7928ca, #ff0080)',
                            'linear-gradient(45deg, #ff0080, #7928ca)',
                          ],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                    )}
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>

          <WalletMultiButton />
        </div>
      </div>
    </nav>
  );
}