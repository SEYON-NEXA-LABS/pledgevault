'use client';

import React from 'react';
import { Loan, PledgeItem, Customer, ShopSettings } from '@/lib/types';
import { 
  formatCurrency, 
  formatWeight, 
  formatDate, 
  GOLD_PURITY_MAP, 
  SILVER_PURITY_MAP 
} from '@/lib/constants';

interface ReceiptContentProps {
  loan: Loan;
  customer: Customer;
  settings: ShopSettings;
  type: 'modern' | 'thermal';
}

export default function ReceiptContent({ loan, customer, settings, type }: ReceiptContentProps) {
  const isThermal = type === 'thermal';

  if (isThermal) {
    return (
      <div className="thermal-receipt" style={{
        width: '80mm',
        padding: '5mm',
        fontFamily: 'monospace',
        fontSize: '12px',
        lineHeight: '1.4',
        color: '#000',
        background: '#fff'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>{settings.shopName}</div>
          <div style={{ fontSize: '10px' }}>{settings.shopAddress}</div>
          <div style={{ fontSize: '10px' }}>Phone: {settings.shopPhone}</div>
          {settings.licenseNumber && <div style={{ fontSize: '10px' }}>Lic: {settings.licenseNumber}</div>}
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
          <span>LOAN RECEIPT</span>
          <span>{loan.loanNumber}</span>
        </div>
        <div style={{ fontSize: '11px' }}>Date: {formatDate(loan.startDate)}</div>

        <div style={{ margin: '10px 0' }}>
          <strong>Customer:</strong> {customer.name}<br />
          <strong>Phone:</strong> {customer.phone}
        </div>

        <div style={{ borderTop: '1px solid #000', paddingTop: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '2px' }}>
            <span style={{ flex: 2 }}>Item</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Weight</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Value</span>
          </div>
          {loan.items.map((item, idx) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ flex: 2 }}>{idx + 1}. {item.itemType} ({item.purity}{item.metalType === 'gold' ? 'K' : ''})</span>
              <span style={{ flex: 1, textAlign: 'right' }}>{formatWeight(item.netWeight)}</span>
              <span style={{ flex: 1, textAlign: 'right' }}>{formatCurrency(item.itemValue)}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px dashed #000', margin: '10px 0', paddingTop: '5px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Loan Amount:</span>
            <strong>{formatCurrency(loan.loanAmount)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Monthly Int:</span>
            <span>{loan.interestRate}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Due Date:</span>
            <span>{formatDate(loan.dueDate)}</span>
          </div>
        </div>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '10px' }}>
          Terms: Loan tenure is {loan.tenureMonths} months. 
          Interest is calculated on {loan.interestMode} basis.
          Original receipt required for redemption.
        </div>

        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ borderTop: '1px solid #000', width: '30mm', textAlign: 'center', paddingTop: '5px', fontSize: '10px' }}>Customer</div>
          <div style={{ borderTop: '1px solid #000', width: '30mm', textAlign: 'center', paddingTop: '5px', fontSize: '10px' }}>Authorized</div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', fontWeight: 'bold' }}>
          THANK YOU
        </div>
      </div>
    );
  }

  // Modern A5/Standard Layout
  return (
    <div className="modern-receipt" style={{
      width: '148mm', // A5 Width
      minHeight: '210mm',
      padding: '10mm',
      fontFamily: "'Inter', sans-serif",
      color: '#1a1d1f',
      background: '#fff',
      margin: '0 auto',
      border: '1px solid #eee',
      boxShadow: '0 0 10px rgba(0,0,0,0.05)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1A3C34', fontSize: '24px', fontWeight: 800 }}>{settings.shopName}</h1>
          <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#6F767E', maxWidth: '300px' }}>{settings.shopAddress}</p>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6F767E' }}>Phone: {settings.shopPhone}</p>
          {settings.licenseNumber && <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9A9FA5' }}>License: {settings.licenseNumber}</p>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ 
            background: '#D4A843', 
            color: '#fff', 
            padding: '4px 12px', 
            borderRadius: '4px', 
            fontSize: '12px', 
            fontWeight: 700,
            display: 'inline-block',
            marginBottom: '8px'
          }}>
            PLEDGE RECEIPT
          </div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>#{loan.loanNumber}</h2>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6F767E' }}>Date: {formatDate(loan.startDate)}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px', 
        marginBottom: '30px',
        padding: '15px',
        background: '#f8f8f5',
        borderRadius: '8px'
      }}>
        <div>
          <h4 style={{ margin: '0 0 8px', fontSize: '11px', color: '#9A9FA5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pledger Details</h4>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '15px' }}>{customer.name}</p>
          <p style={{ margin: '2px 0 0', fontSize: '13px' }}>{customer.phone}</p>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6F767E' }}>{customer.address}, {customer.city}</p>
        </div>
        <div style={{ borderLeft: '1px solid #e8e8e3', paddingLeft: '20px' }}>
          <h4 style={{ margin: '0 0 8px', fontSize: '11px', color: '#9A9FA5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>KYC Info</h4>
          <p style={{ margin: 0, fontSize: '13px' }}>{customer.primaryIdType.toUpperCase()}: <strong>{customer.primaryIdNumber}</strong></p>
          {customer.secondaryIdNumber && (
            <p style={{ margin: '4px 0 0', fontSize: '13px' }}>{customer.secondaryIdType?.toUpperCase()}: <strong>{customer.secondaryIdNumber}</strong></p>
          )}
        </div>
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #1A3C34' }}>
            <th style={{ padding: '8px 0', fontSize: '12px', fontWeight: 700 }}>Description of Article</th>
            <th style={{ padding: '8px 0', fontSize: '12px', fontWeight: 700 }}>Purity</th>
            <th style={{ padding: '8px 0', fontSize: '12px', fontWeight: 700, textAlign: 'right' }}>Gross</th>
            <th style={{ padding: '8px 0', fontSize: '12px', fontWeight: 700, textAlign: 'right' }}>Net Weight</th>
            <th style={{ padding: '8px 0', fontSize: '12px', fontWeight: 700, textAlign: 'right' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {loan.items.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #f0f0eb' }}>
              <td style={{ padding: '10px 0', fontSize: '13px', fontWeight: 600 }}>{item.itemType} ({item.metalType})</td>
              <td style={{ padding: '10px 0', fontSize: '13px' }}>{item.purity}{item.metalType === 'gold' ? 'K' : ''}</td>
              <td style={{ padding: '10px 0', fontSize: '13px', textAlign: 'right' }}>{formatWeight(item.grossWeight)}</td>
              <td style={{ padding: '10px 0', fontSize: '13px', textAlign: 'right', fontWeight: 600 }}>{formatWeight(item.netWeight)}</td>
              <td style={{ padding: '10px 0', fontSize: '13px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(item.itemValue)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f8f8f5' }}>
            <td colSpan={3} style={{ padding: '12px 10px', fontSize: '12px', fontWeight: 700 }}>TOTAL PLEDGED WEIGHT</td>
            <td style={{ padding: '12px 0', fontSize: '14px', fontWeight: 800, textAlign: 'right' }}>{formatWeight(loan.totalNetWeight)}</td>
            <td style={{ padding: '12px 0', fontSize: '14px', fontWeight: 800, textAlign: 'right', color: '#1A3C34' }}>{formatCurrency(loan.totalAppraisedValue)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Loan Financials */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1.5fr 1fr', 
        gap: '40px',
        marginBottom: '40px'
      }}>
        <div style={{ fontSize: '11px', color: '#6F767E', lineHeight: '1.6' }}>
          <h4 style={{ margin: '0 0 10px', color: '#1A3C34', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Terms & Conditions</h4>
          <ol style={{ paddingLeft: '15px', margin: 0 }}>
            <li>The pledgee is entitled to sell the pledged articles if not redeemed within the tenure.</li>
            <li>Interest is payable monthly at the rate of {loan.interestRate}% ({loan.interestMode}).</li>
            <li>Loss of receipt must be reported to the shop immediately.</li>
            <li>The articles shall be returned only to the pledger with this original receipt.</li>
          </ol>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px' }}>Principal Amount:</span>
            <span style={{ fontSize: '16px', fontWeight: 700 }}>{formatCurrency(loan.loanAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px' }}>Monthly Interest:</span>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{loan.interestRate}%</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
            <span style={{ fontSize: '14px' }}>Due Date:</span>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{formatDate(loan.dueDate)}</span>
          </div>
          <div style={{ 
            border: '2px solid #1A3C34', 
            padding: '12px', 
            borderRadius: '6px', 
            textAlign: 'center',
            background: 'rgba(26, 60, 52, 0.02)'
          }}>
            <span style={{ fontSize: '11px', color: '#6F767E', display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>NET LOAN DISBURSED</span>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#1A3C34' }}>{formatCurrency(loan.loanAmount)}</span>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '150px', borderTop: '1px solid #e8e8e3', paddingTop: '8px', fontSize: '12px', color: '#9A9FA5' }}>
            Signature of Pledger
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ height: '40px', fontSize: '11px', color: '#eee' }}>Authorized Seal/Stamp</div>
          <div style={{ width: '150px', borderTop: '1px solid #e8e8e3', paddingTop: '8px', fontSize: '12px', color: '#9A9FA5' }}>
            For {settings.shopName}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '50px', 
        borderTop: '1px dashed #e8e8e3', 
        paddingTop: '20px',
        fontSize: '11px',
        color: '#9A9FA5'
      }}>
        This is a computer-generated receipt. Generated on {new Date().toLocaleString('en-IN')}.
      </div>
    </div>
  );
}
