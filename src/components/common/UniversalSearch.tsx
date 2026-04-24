'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  User, 
  FileText, 
  ArrowRight, 
  Loader2, 
  X,
  Command,
  History
} from 'lucide-react';
import { supabaseService } from '@/lib/supabase/service';
import { authStore } from '@/lib/authStore';

interface SearchResult {
  customers: any[];
  loans: any[];
}

export default function UniversalSearch({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({ customers: [], loans: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const flatResults = [
    ...results.customers.map(c => ({ id: c.id, type: 'customer', title: c.name, sub: c.phone })),
    ...results.loans.map(l => ({ id: l.id, type: 'loan', title: l.loanNumber, sub: l.customerName }))
  ];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults({ customers: [], loans: [] });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleSearch = async () => {
      if (query.length < 2) {
        setResults({ customers: [], loans: [] });
        return;
      }
      setLoading(true);
      const auth = authStore.get();
      const data = await supabaseService.globalSearch(auth.firmId as string, query);
      setResults(data);
      setLoading(false);
      setSelectedIndex(0);
    };

    const timer = setTimeout(handleSearch, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(flatResults.length, 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + flatResults.length) % Math.max(flatResults.length, 1));
      }
      if (e.key === 'Enter' && flatResults[selectedIndex]) {
        handleNavigate(flatResults[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatResults, selectedIndex]);

  const handleNavigate = (res: any) => {
    if (res.type === 'customer') router.push(`/customers/${res.id}`);
    else router.push(`/loans/${res.id}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-header">
          <Search className="search-icon" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for customers, loans, or transaction IDs..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {loading ? <Loader2 className="spin" size={18} /> : <div className="esc-key">ESC</div>}
        </div>

        <div className="search-body">
          {flatResults.length > 0 ? (
            <div className="results-container">
              {/* Customers Section */}
              {results.customers.length > 0 && (
                <div className="result-section">
                  <div className="section-title">Customers</div>
                  {results.customers.map((c, idx) => {
                    const absIdx = idx;
                    return (
                      <button 
                        key={c.id} 
                        className={`result-item ${selectedIndex === absIdx ? 'selected' : ''}`}
                        onClick={() => handleNavigate({ id: c.id, type: 'customer' })}
                        onMouseEnter={() => setSelectedIndex(absIdx)}
                      >
                        <User size={16} className="item-icon" />
                        <div className="item-content">
                           <span className="main-txt">{c.name}</span>
                           <span className="sub-txt">{c.phone} • {c.city}</span>
                        </div>
                        <ArrowRight size={14} className="arrow" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Loans Section */}
              {results.loans.length > 0 && (
                <div className="result-section">
                  <div className="section-title">Loans</div>
                  {results.loans.map((l, idx) => {
                    const absIdx = results.customers.length + idx;
                    return (
                      <button 
                        key={l.id} 
                        className={`result-item ${selectedIndex === absIdx ? 'selected' : ''}`}
                        onClick={() => handleNavigate({ id: l.id, type: 'loan' })}
                        onMouseEnter={() => setSelectedIndex(absIdx)}
                      >
                        <FileText size={16} className="item-icon" />
                        <div className="item-content">
                           <span className="main-txt">{l.loanNumber}</span>
                           <span className="sub-txt">{l.customerName} • {l.status}</span>
                        </div>
                        <ArrowRight size={14} className="arrow" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : query.length >= 2 && !loading ? (
            <div className="empty-state">
               <X size={40} className="empty-icon" />
               <p>No results found for "{query}"</p>
               <span>Try searching by name, phone number, or loan ID</span>
            </div>
          ) : (
            <div className="initial-state">
               <div className="tip-row">
                  <Command size={14} />
                  <span>Use up/down arrows to navigate</span>
               </div>
               <div className="tip-row">
                  <History size={14} />
                  <span>Active search covers all branches</span>
               </div>
            </div>
          )}
        </div>

        <div className="search-footer">
           <div className="footer-tip">
              <span>Navigate</span> <div className="key-tag">↑↓</div>
              <span>Select</span> <div className="key-tag">Enter</div>
              <span>Close</span> <div className="key-tag">Esc</div>
           </div>
        </div>
      </div>
    </div>
  );
}
