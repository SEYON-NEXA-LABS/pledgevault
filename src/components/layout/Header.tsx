'use client';

import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';

interface HeaderProps {
  greeting?: string;
  onMenuClick?: () => void;
}

export default function Header({ greeting, onMenuClick }: HeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className="header-bar">
      <div className="header-bar-left">
        <button
          className="btn btn-ghost mobile-menu-btn"
          onClick={onMenuClick}
          style={{ display: 'none' }}
        >
          <Menu size={20} />
        </button>
        <div className="header-greeting">
          {greeting || getGreeting()} <span>👋</span>
        </div>
      </div>
      <div className="header-bar-right">
        <div className="header-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search loans, customers..."
            id="global-search"
          />
        </div>
        <button className="header-icon-btn" id="notifications-btn">
          <Bell size={20} />
          <span className="notification-dot" />
        </button>
      </div>
    </header>
  );
}
