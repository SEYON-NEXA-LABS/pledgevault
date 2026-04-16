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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = new Date().toISOString();
    const newCustomer = customerStore.create({
      ...formData,
      createdAt: now,
      updatedAt: now,
    });

    router.push(`/customers/${newCustomer.id}`);
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
          <Link href="/customers" className="btn btn-outline btn-sm" style={{ marginBottom: '12px' }}>
            <ArrowLeft size={16} /> Back to Customers
          </Link>
          <h2>Register New Customer</h2>
          <p className="subtitle">Add a new customer to the database for pledge loans</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="content-grid full">
        
        {/* Identity Portrait (Selfie) */}
        <div className="card" style={{ marginBottom: '24px', textAlign: 'center' }}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px' }}>
            <div 
              style={{ 
                width: '180px', 
                height: '180px', 
                borderRadius: '50%', 
                border: '3px solid var(--gold)', 
                background: 'var(--bg-input)',
                overflow: 'hidden',
                position: 'relative',
                marginBottom: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={() => handleCapturePhoto('selfiePhoto')}
            >
              {formData.selfiePhoto ? (
                <img src={formData.selfiePhoto} alt="Customer Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ color: 'var(--text-tertiary)', textAlign: 'center' }}>
                  <Camera size={48} style={{ marginBottom: '8px' }} />
                  <p style={{ fontSize: '12px', fontWeight: 600 }}>TAP TO SNAP<br/>SELFIE-WITH-ID</p>
                </div>
              )}
              {formData.selfiePhoto && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px', fontSize: '10px' }}>
                  CHANGE
                </div>
              )}
            </div>
            <h3>Customer Verification Portrait</h3>
            <p className="subtitle" style={{ maxWidth: '400px', margin: '8px auto 0' }}>
              Snap a photo of the customer holding their primary ID card near their face.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3><User size={18} /> Basic Information</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="form-group">
                <label className="label">Full Name *</label>
                <div className="input-with-icon">
                  <User size={18} />
                  <input 
                    type="text" 
                    name="name"
                    className="input" 
                    placeholder="Enter customer's full name"
                    value={formData.name}
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Primary Phone *</label>
                <div className="input-with-icon">
                  <Phone size={18} />
                  <input 
                    type="tel" 
                    name="phone"
                    className="input" 
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Alternative Phone</label>
                <div className="input-with-icon">
                  <Phone size={18} />
                  <input 
                    type="tel" 
                    name="altPhone"
                    className="input" 
                    placeholder="Secondary contact number"
                    value={formData.altPhone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="label">City</label>
                <div className="input-with-icon">
                  <MapPin size={18} />
                  <input 
                    type="text" 
                    name="city"
                    className="input" 
                    placeholder="Coimbatore"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="label">Residential Address *</label>
                <div className="input-with-icon" style={{ alignItems: 'flex-start' }}>
                  <MapPin size={18} style={{ marginTop: '10px' }} />
                  <textarea 
                    name="address"
                    className="input" 
                    placeholder="Complete door number, street, and area"
                    style={{ minHeight: '100px', paddingTop: '10px' }}
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <h3><CreditCard size={18} /> KYC Verification (Dual-ID System)</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              
              {/* Primary ID */}
              <div className="id-block">
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="label" style={{ margin: 0 }}>Primary ID (Mandatory) *</label>
                  <span className="badge active">Level 1 Verify</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <select 
                    name="primaryIdType" 
                    className="input" 
                    style={{ flex: 1, padding: '12px' }}
                    value={formData.primaryIdType}
                    onChange={handleChange}
                  >
                    <option value="aadhaar">Aadhaar Card</option>
                    <option value="voter">Voter ID (EPIC)</option>
                    <option value="dl">Driving License</option>
                    <option value="passport">Passport</option>
                  </select>
                  <div className="input-with-icon" style={{ flex: 2 }}>
                    <CreditCard size={18} />
                    <input 
                      type="text" 
                      name="primaryIdNumber"
                      className="input" 
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
                  <label className="label" style={{ margin: 0 }}>Secondary ID (Elective)</label>
                  <span className="badge" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-tertiary)' }}>Advanced KYC</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <select 
                    name="secondaryIdType" 
                    className="input" 
                    style={{ flex: 1, padding: '12px' }}
                    value={formData.secondaryIdType}
                    onChange={handleChange}
                  >
                    <option value="pan">PAN Card</option>
                    <option value="ration">Ration Card / Smart Card</option>
                    <option value="gas">Utility Bill</option>
                    <option value="other">Other Proof</option>
                  </select>
                  <div className="input-with-icon" style={{ flex: 2 }}>
                    <CreditCard size={18} />
                    <input 
                      type="text" 
                      name="secondaryIdNumber"
                      className="input" 
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
                      <div className="photo-overlay"><Camera size={20} /> Retake Photo</div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <Camera size={32} />
                      <p>Capture Secondary ID Image</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <Link href="/customers" className="btn btn-outline">Cancel</Link>
          <button type="submit" className="btn btn-gold" style={{ padding: '12px 32px' }}>
            <Save size={18} /> Register Customer
          </button>
        </div>
      </form>

      <style jsx>{`
        .form-group {
          margin-bottom: 4px;
        }
        .label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }
        .input-with-icon {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 0 16px;
          transition: all var(--transition-fast);
        }
        .input-with-icon:focus-within {
          border-color: var(--gold);
          box-shadow: 0 0 0 3px var(--gold-glow);
          background: white;
        }
        .input-with-icon svg {
          color: var(--text-tertiary);
          flex-shrink: 0;
        }
        .input {
          width: 100%;
          padding: 12px 0;
          background: transparent;
          font-size: 14px;
        }
        .input::placeholder {
          color: var(--text-tertiary);
        }

        .photo-upload-zone {
          height: 160px;
          border: 2px dashed var(--border);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--bg-input);
          overflow: hidden;
          position: relative;
        }

        .photo-upload-zone:hover {
          border-color: var(--gold);
          background: var(--gold-glow);
        }

        .photo-upload-zone.has-photo {
          border: 2px solid var(--gold);
        }

        .upload-placeholder {
          text-align: center;
          color: var(--text-tertiary);
        }

        .upload-placeholder p {
          font-size: 11px;
          margin-top: 8px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .photo-preview {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .photo-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .photo-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 600;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .photo-preview:hover .photo-overlay {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
