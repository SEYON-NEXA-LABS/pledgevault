'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative';
  subtitle?: string;
  icon: LucideIcon;
  variant: 'primary' | 'vibrant' | 'danger' | 'deep';
}

export default function StatCard({
  title,
  value,
  change,
  changeType = 'positive',
  subtitle,
  icon: Icon,
  variant,
}: StatCardProps) {
  return (
    <div className={`pv-card stat-card variant-${variant} hover:scale-[1.02]`}>
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        <div className="stat-card-icon">
          <Icon size={20} />
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-meta">
        {change && (
          <span className={`stat-card-change ${changeType}`}>
            {changeType === 'positive' ? '↑' : '↓'} {change}
          </span>
        )}
        {subtitle && <span className="opacity-60">{subtitle}</span>}
      </div>
      
      {/* Decorative background element */}
      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
    </div>
  );
}
