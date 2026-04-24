'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  Camera,
  CheckCircle2,
  X
} from 'lucide-react';
import { customerStore } from '@/lib/store';
import { supabaseService } from '@/lib/supabase/service';
import { compressImage } from '@/lib/image';
import Link from 'next/link';

export default function NewCustomerPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    altPhone: '',
    primaryIdType: 'aadhaar',
    primaryIdNumber: '',
    primaryIdPhoto: '',
    secondaryIdType: 'pan',
    secondaryIdNumber: '',
    secondaryIdPhoto: '',
    selfiePhoto: '',
    address: '',
    city: 'Coimbatore',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const now = new Date().toISOString();
      const newCustomer = await supabaseService.createCustomer({
        ...formData,
        createdAt: now,
        updatedAt: now,
      } as any);

      router.push(`/customers/${newCustomer.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to save customer to Supabase');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCapturePhoto = async (field: 'primaryIdPhoto' | 'secondaryIdPhoto' | 'selfiePhoto') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const rawBase64 = reader.result as string;
          // Automagically compress to save DB space
          const optimizedBase64 = await compressImage(rawBase64, 1024, 0.6);
          setFormData(prev => ({ ...prev, [field]: optimizedBase64 }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <Link href="/customers" className="pv-btn pv-btn-outline" style={{ height: '36px', padding: '0 12px', fontSize: '13px', marginBottom: '12px' }}>
            <ArrowLeft size={16} /> Back to Customers
          </Link>
          <h2 style={{ fontSize: '28px' }}>Register New Customer</h2>
          <p className="subtitle" style={{ color: 'var(--text-tertiary)' }}>Add a new customer to the database for pledge loans</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="content-grid full">
        
        {/* Identity Portrait (Selfie) */}
        <div className="pv-card" style={{ marginBottom: '24px', textAlign: 'center', padding: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div 
              style={{ 
                width: '180px', 
                height: '180px', 
                borderRadius: '50%', 
                border: '3px solid var(--gold)', 
                background: 'var(--bg-primary)',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-md)'
              }}
              onClick={() => handleCapturePhoto('selfiePhoto')}
            >
              {formData.selfiePhoto ? (
                <img src={formData.selfiePhoto} alt="Customer Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ color: 'var(--text-tertiary)', textAlign: 'center' }}>
                  <Camera size={48} style={{ marginBottom: '8px' }} />
                  <p style={{ fontSize: '10px', fontWeight: 800 }}>TAP TO SNAP<br/>SELFIE-WITH-ID</p>
                </div>
              )}
              {formData.selfiePhoto && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '6px', fontSize: '10px', fontWeight: 700 }}>
                  CHANGE
                </div>
              )}
            </div>
            <h3 style={{ fontSize: '20px' }}>Customer Verification Portrait</h3>
            <p className="subtitle" style={{ maxWidth: '400px', margin: '8px auto 0', color: 'var(--text-tertiary)' }}>
              Snap a photo of the customer holding their primary ID card near their face.
            </p>
          </div>
        </div>

        <div className="pv-card">
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}><User size={18} /> Basic Information</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="pv-input-group">
                <label>Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <input 
                    type="text" 
                    name="name"
                    className="pv-input" 
                    style={{ paddingLeft: '44px' }}
                    placeholder="Enter customer's full name"
                    value={formData.name}
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>
              <div className="pv-input-group">
                <label>Primary Phone *</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <input 
                    type="tel" 
                    name="phone"
                    className="pv-input" 
                    style={{ paddingLeft: '44px' }}
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>
              <div className="pv-input-group">
                <label>Alt Contact</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <input 
                    type="tel" 
                    name="altPhone"
                    className="pv-input" 
                    style={{ paddingLeft: '44px' }}
                    placeholder="Optional phone"
                    value={formData.altPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="pv-input-group">
                <label>City</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <input 
                    type="text" 
                    name="city"
                    className="pv-input" 
                    style={{ paddingLeft: '44px' }}
                    placeholder="Coimbatore"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="pv-input-group" style={{ gridColumn: 'span 2' }}>
                <label>Residential Address *</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-tertiary)' }} />
                  <textarea 
                    name="address"
                    className="pv-input" 
                    placeholder="Complete door number, street, and area"
                    style={{ minHeight: '100px', paddingTop: '14px', paddingLeft: '44px', height: 'auto' }}
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pv-card" style={{ marginTop: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}><CreditCard size={18} /> KYC Verification</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              
              {/* Primary ID */}
              <div className="id-block">
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="label" style={{ margin: 0, fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Primary ID *</label>
                  <span className="badge active">Verify L1</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <select 
                    name="primaryIdType" 
                    className="pv-input" 
                    style={{ flex: 1, padding: '0 12px', height: '52px' }}
                    value={formData.primaryIdType}
                    onChange={handleChange}
                  >
                    <option value="aadhaar">Aadhaar</option>
                    <option value="voter">Voter ID</option>
                    <option value="dl">Driving License</option>
                    <option value="passport">Passport</option>
                  </select>
                  <div style={{ flex: 2, position: 'relative' }}>
                    <CreditCard size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input 
                      type="text" 
                      name="primaryIdNumber"
                      className="pv-input" 
                      style={{ paddingLeft: '44px' }}
                      placeholder="ID Number"
                      value={formData.primaryIdNumber}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div 
                  className={`photo-upload-zone ${formData.primaryIdPhoto ? 'has-photo' : ''}`}
                  onClick={() => handleCapturePhoto('primaryIdPhoto')}
                >
                  {formData.primaryIdPhoto ? (
                    <div className="photo-preview">
                      <img src={formData.primaryIdPhoto} alt="Primary ID" />
                      <div className="photo-overlay"><Camera size={20} /> Retake Photo</div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <Camera size={32} />
                      <p>Capture Primary ID Image</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Secondary ID */}
              <div className="id-block">
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="label" style={{ margin: 0, fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Secondary ID</label>
                  <span className="badge" style={{ background: 'var(--bg-primary)', color: 'var(--text-tertiary)' }}>Elective</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <select 
                    name="secondaryIdType" 
                    className="pv-input" 
                    style={{ flex: 1, padding: '0 12px', height: '52px' }}
                    value={formData.secondaryIdType}
                    onChange={handleChange}
                  >
                    <option value="pan">PAN Card</option>
                    <option value="ration">Ration Card</option>
                    <option value="gas">Utility Bill</option>
                    <option value="other">Other</option>
                  </select>
                  <div style={{ flex: 2, position: 'relative' }}>
                    <CreditCard size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input 
                      type="text" 
                      name="secondaryIdNumber"
                      className="pv-input" 
                      style={{ paddingLeft: '44px' }}
                      placeholder="ID Number"
                      value={formData.secondaryIdNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div 
                  className={`photo-upload-zone ${formData.secondaryIdPhoto ? 'has-photo' : ''}`}
                  onClick={() => handleCapturePhoto('secondaryIdPhoto')}
                >
                  {formData.secondaryIdPhoto ? (
                    <div className="photo-preview">
                      <img src={formData.secondaryIdPhoto} alt="Secondary ID" />
                      <div className="photo-overlay"><Camera size={20} /> Retake</div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <Camera size={32} />
                      <p>Capture Secondary ID</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <Link href="/customers" className="pv-btn pv-btn-outline">Cancel</Link>
          <button type="submit" className="pv-btn pv-btn-gold" style={{ padding: '0 40px' }}>
            <Save size={18} /> Register Customer
          </button>
        </div>
      </form>


    </div>
  );
}
