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
    <div className={`stat-card variant-${variant}`}>
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
            {changeType === 'positive' ? '+' : ''}{change}
          </span>
        )}
        {subtitle && <span>{subtitle}</span>}
      </div>
    </div>
  );
}
