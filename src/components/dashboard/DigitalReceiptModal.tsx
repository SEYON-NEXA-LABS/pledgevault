'use client';

import React, { useRef, useState } from 'react';
import { X, Download, Share2, MessageCircle, Check, Copy, RefreshCw } from 'lucide-react';
import { Loan, Customer, ShopSettings } from '@/lib/types';
import { formatCurrency, formatWeight, formatDate } from '@/lib/constants';

interface DigitalReceiptModalProps {
  loan: Loan;
  customer: Customer;
  settings: ShopSettings;
  onClose: () => void;
}

export default function DigitalReceiptModal({ loan, customer, settings, onClose }: DigitalReceiptModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const generateReceiptImage = async () => {
    setIsGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set dimensions for a vertical "Social/Mobile" friendly receipt (1080x1920 scaled down)
    const width = 800;
    const height = 1200;
    canvas.width = width;
    canvas.height = height;

    // 1. Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#f8fafc');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. Premium Header Bar
    ctx.fillStyle = '#107B88'; // Brand Primary
    ctx.fillRect(0, 0, width, 160);

    // 3. Shop Name
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(settings.shopName.toUpperCase(), width / 2, 90);

    ctx.font = '600 22px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('OFFICIAL DIGITAL RECEIPT', width / 2, 130);

    // 4. Content Area Shadows (Subtle)
    ctx.shadowColor = 'rgba(0,0,0,0.05)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(40, 180, width - 80, height - 240, 24);
    ctx.fill();
    ctx.shadowBlur = 0; // Reset shadow

    // 5. Success Checkmark Circle
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(width / 2, 230, 50, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(width / 2 - 20, 230);
    ctx.lineTo(width / 2 - 5, 245);
    ctx.lineTo(width / 2 + 25, 215);
    ctx.stroke();

    // 6. Main Loan Details
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    ctx.font = '800 24px sans-serif';
    ctx.fillText('LOAN AMOUNT', width / 2, 330);
    
    ctx.fillStyle = '#1e293b';
    ctx.font = '900 84px sans-serif';
    ctx.fillText(formatCurrency(loan.loanAmount), width / 2, 420);

    // 7. Divider
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(80, 480);
    ctx.lineTo(width - 80, 480);
    ctx.stroke();
    ctx.setLineDash([]);

    // 8. Info Grid
    const drawInfoRow = (label: string, value: string, x: number, y: number, align: 'left' | 'right' = 'left') => {
      ctx.textAlign = align;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '800 20px sans-serif';
      ctx.fillText(label, x, y);
      
      ctx.fillStyle = '#1e293b';
      ctx.font = '800 28px sans-serif';
      ctx.fillText(value, x, y + 40);
    };

    let yPos = 560;
    drawInfoRow('LOAN NUMBER', `#${loan.loanNumber}`, 80, yPos);
    drawInfoRow('DATE', formatDate(loan.startDate), width - 80, yPos, 'right');

    yPos += 120;
    drawInfoRow('CUSTOMER', loan.customerName, 80, yPos);
    drawInfoRow('DUE DATE', formatDate(loan.dueDate), width - 80, yPos, 'right');

    yPos += 120;
    drawInfoRow('GOLD WEIGHT', formatWeight(loan.totalNetWeight), 80, yPos);
    drawInfoRow('INTEREST RATE', `${loan.interestRate}% / mo`, width - 80, yPos, 'right');

    // 9. Items Section
    yPos += 120;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(80, yPos - 30, width - 160, 180, 16);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '900 18px sans-serif';
    ctx.fillText('PLEDGED ASSETS', 110, yPos + 10);

    loan.items.slice(0, 3).forEach((item, idx) => {
      ctx.fillStyle = '#334155';
      ctx.font = '800 24px sans-serif';
      ctx.fillText(`• ${item.itemType} (${item.purity}${item.metalType === 'gold' ? 'K' : ''})`, 110, yPos + 50 + (idx * 40));
      
      ctx.textAlign = 'right';
      ctx.fillText(formatWeight(item.netWeight), width - 110, yPos + 50 + (idx * 40));
      ctx.textAlign = 'left';
    });

    // 10. Footer Seal
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '800 18px sans-serif';
    ctx.fillText('SECURED BY PLEDGEVAULT CRYPTO-AUDIT ENGINE', width / 2, height - 100);
    
    ctx.font = '600 16px sans-serif';
    ctx.fillText(settings.shopAddress || 'Visit us for more details', width / 2, height - 70);

    // Convert to Image
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    setGeneratedImage(dataUrl);
    setIsGenerating(false);
  };

  const handleShare = async () => {
    if (!generatedImage) return;

    const blob = await (await fetch(generatedImage)).blob();
    const file = new File([blob], `Receipt_${loan.loanNumber}.png`, { type: 'image/png' });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Receipt for Loan #${loan.loanNumber}`,
          text: `Digital receipt for ${loan.customerName}. Generated by ${settings.shopName}.`
        });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      // Fallback: Download
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `Receipt_${loan.loanNumber}.png`;
      link.click();
    }
  };

  const handleWhatsApp = () => {
    if (!generatedImage) return;
    
    // WhatsApp doesn't allow direct image sending via URL, 
    // but we can prompt the user to download then open WhatsApp
    const message = `*Digital Receipt Generated!* \nDownload the receipt image and share it with the customer. \n\nLoan No: ${loan.loanNumber}\nCustomer: ${loan.customerName}\nAmount: ${formatCurrency(loan.loanAmount)}`;
    const url = `https://wa.me/${loan.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `Receipt_${loan.loanNumber}.png`;
    link.click();
    
    setTimeout(() => {
      window.open(url, '_blank');
    }, 1000);
  };

  React.useEffect(() => {
    generateReceiptImage();
  }, []);

  return (
    <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', zIndex: 3000 }}>
      <div className="pv-card" style={{ width: '500px', maxWidth: '95%', maxHeight: '90vh', padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: 'var(--bg-primary)' }}>
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/10">
          <div className="flex items-center gap-3">
            <Share2 size={20} className="text-primary" />
            <h3 className="text-sm font-black uppercase tracking-widest">Share Digital Receipt</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] flex flex-col items-center">
          {generatedImage ? (
            <div className="relative group">
              <img 
                src={generatedImage} 
                alt="Digital Receipt" 
                className="w-full h-auto rounded-2xl shadow-2xl border border-border"
                style={{ maxWidth: '340px' }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl pointer-events-none">
                <p className="text-white font-black text-xs uppercase tracking-widest">Preview Only</p>
              </div>
            </div>
          ) : (
            <div className="w-[340px] h-[510px] bg-muted/20 animate-pulse rounded-2xl flex items-center justify-center">
              <RefreshCw size={40} className="animate-spin text-muted-foreground opacity-20" />
            </div>
          )}

          <div className="w-full mt-8 grid grid-cols-1 gap-3">
            <button 
              onClick={handleWhatsApp} 
              className="pv-btn pv-btn-gold h-14 flex items-center justify-center gap-3 text-base shadow-xl"
            >
              <MessageCircle size={22} />
              <span>Share via WhatsApp</span>
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleShare} className="pv-btn pv-btn-outline h-12 flex items-center justify-center gap-2">
                <Share2 size={18} /> Share System
              </button>
              <button 
                onClick={() => {
                   const link = document.createElement('a');
                   link.href = generatedImage!;
                   link.download = `Receipt_${loan.loanNumber}.png`;
                   link.click();
                }} 
                className="pv-btn pv-btn-outline h-12 flex items-center justify-center gap-2"
              >
                <Download size={18} /> Save Image
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted/5 rounded-xl border border-border/50 w-full">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Check size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Premium Feature</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              This digital receipt is cryptographically generated for visual verification. Sharing this image with customers improves transparency and trust.
            </p>
          </div>
        </div>

        {/* Hidden Canvas for Generation */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}
