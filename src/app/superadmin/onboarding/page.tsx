'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  UserPlus, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Globe,
  Settings,
  Trash2,
  Mail,
  Plus,
  Users,
  CreditCard,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { onboardFirmAction } from './actions';

export default function SuperadminOnboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const [firmData, setFirmData] = useState({
    name: '',
    slug: '',
    shortCode: '',
    plan: 'pro',
    location: 'Coimbatore, TN',
    primaryColor: '#107B88',
    gstNumber: '',
    licenseNumber: '',
    registrationNumber: ''
  });

  const [adminData, setAdminData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  const [staffMembers, setStaffMembers] = useState<any[]>([]);

  const addStaffRow = () => {
    setStaffMembers([...staffMembers, { fullName: '', email: '', password: '' }]);
  };

  const updateStaff = (index: number, field: string, value: string) => {
    const updated = [...staffMembers];
    updated[index][field] = value;
    setStaffMembers(updated);
  };

  const removeStaff = (index: number) => {
    setStaffMembers(staffMembers.filter((_, i) => i !== index));
  };

  const handleOnboard = async () => {
    setLoading(true);
    setError(null);

    const result = await onboardFirmAction({
      name: firmData.name,
      slug: firmData.slug,
      shortCode: firmData.shortCode,
      plan: firmData.plan,
      primaryColor: firmData.primaryColor,
      email: adminData.email,
      password: adminData.password,
      fullName: adminData.fullName,
      staffMembers: staffMembers
    });

    if (result.success) {
      setSuccess(true);
      setStep(3);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="pv-card" style={{ width: '100%', maxWidth: '1000px', padding: 0, display: 'grid', gridTemplateColumns: '320px 1fr', overflow: 'hidden', height: '650px' }}>
        <div style={{ background: 'var(--brand-deep)', color: 'white', padding: '48px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, marginBottom: '64px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--gold)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🪙</div>
            <span>PledgeVault <small style={{ fontSize: '10px', opacity: 0.7, verticalAlign: 'top' }}>ADMIN</small></span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div style={{ display: 'flex', gap: '16px', opacity: step >= 1 ? 1 : 0.4 }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid white', borderColor: step >= 1 ? 'var(--gold)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: step >= 1 ? 'var(--gold)' : 'white' }}>{step > 1 ? <CheckCircle size={16} /> : '1'}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>Shop Details</div>
                <div style={{ fontSize: '12px', opacity: 0.6 }}>Business & Plan</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', opacity: step >= 2 ? 1 : 0.4 }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid white', borderColor: step >= 2 ? 'var(--gold)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: step >= 2 ? 'var(--gold)' : 'white' }}>{step > 2 ? <CheckCircle size={16} /> : '2'}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>Admin Root</div>
                <div style={{ fontSize: '12px', opacity: 0.6 }}>Root Admin Account</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', opacity: step >= 3 ? 1 : 0.4 }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid white', borderColor: step >= 3 ? 'var(--gold)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: step >= 3 ? 'var(--gold)' : 'white' }}>{step > 3 ? <CheckCircle size={16} /> : '3'}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>Staff List</div>
                <div style={{ fontSize: '12px', opacity: 0.6 }}>Initial Directory</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', opacity: step >= 4 ? 1 : 0.4 }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid white', borderColor: step >= 4 ? 'var(--gold)' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: step >= 4 ? 'var(--gold)' : 'white' }}>{step >= 4 ? <CheckCircle size={16} /> : '4'}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>Deployment</div>
                <div style={{ fontSize: '12px', opacity: 0.6 }}>Shop Initialization</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '48px 64px', background: 'white', overflowY: 'auto' }}>
          {step === 1 && (
            <div style={{ animation: 'fadeInScale 0.3s ease' }}>
              <h2 style={{ fontSize: '32px', letterSpacing: '-1px', marginBottom: '8px' }}>Business Registration</h2>
              <p style={{ color: 'var(--text-tertiary)', marginBottom: '32px' }}>Onboard a new partner shop into the ecosystem.</p>
              
              <div className="form-grid">
                <div className="pv-input-group">
                  <label>Official Shop Name</label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input 
                      className="pv-input"
                      style={{ paddingLeft: '44px' }}
                      placeholder="e.g., Sri Ganesh Jewel Loans" 
                      value={firmData.name}
                      onChange={e => {
                        const name = e.target.value;
                        setFirmData({
                          ...firmData, 
                          name, 
                          slug: slugify(name),
                          shortCode: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4)
                        });
                      }}
                    />
                  </div>
                </div>
                <div className="pv-input-group">
                  <label>Business Location</label>
                  <div style={{ position: 'relative' }}>
                    <Globe size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input 
                      className="pv-input"
                      style={{ paddingLeft: '44px' }}
                      placeholder="City, State" 
                      value={firmData.location}
                      onChange={e => setFirmData({...firmData, location: e.target.value})}
                    />
                  </div>
                </div>
                <div className="pv-input-group">
                  <label>URL Slug (Branding)</label>
                  <div style={{ position: 'relative' }}>
                    <Settings size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input 
                      className="pv-input"
                      style={{ paddingLeft: '44px' }}
                      placeholder="e.g., emerald-gold" 
                      value={firmData.slug}
                      onChange={e => setFirmData({...firmData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                    />
                  </div>
                </div>
                <div className="pv-input-group">
                  <label>Short Code (Loan ID)</label>
                  <div style={{ position: 'relative' }}>
                    <ShieldCheck size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input 
                      className="pv-input"
                      style={{ paddingLeft: '44px' }}
                      placeholder="e.g., EG" 
                      value={firmData.shortCode}
                      maxLength={4}
                      onChange={e => setFirmData({...firmData, shortCode: e.target.value.toUpperCase()})}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Shop Theme / Primary Color</label>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {[
                      { name: 'Pacific', color: '#107B88' },
                      { name: 'Emerald', color: '#065f46' },
                      { name: 'Royal', color: '#7f1d1d' },
                      { name: 'Navy', color: '#1e3a8a' },
                      { name: 'Onyx', color: '#111827' }
                    ].map(theme => (
                      <div 
                        key={theme.color}
                        onClick={() => setFirmData({...firmData, primaryColor: theme.color})}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: theme.color,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: firmData.primaryColor === theme.color ? '3px solid var(--gold)' : '2px solid transparent',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                        title={theme.name}
                      >
                        {firmData.primaryColor === theme.color && <CheckCircle size={16} color="white" />}
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                      <input 
                        type="color" 
                        value={firmData.primaryColor}
                        onChange={e => setFirmData({...firmData, primaryColor: e.target.value})}
                        style={{ width: '32px', height: '32px', border: 'none', background: 'none' }}
                      />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Custom</span>
                    </div>
                  </div>
                </div>

                <div className="pv-input-group">
                  <label>Subscription Tier</label>
                  <select 
                    className="pv-input"
                    value={firmData.plan}
                    onChange={e => setFirmData({...firmData, plan: e.target.value})}
                  >
                    <option value="free">Standard (Free)</option>
                    <option value="pro">Premium (Growth)</option>
                    <option value="elite">Elite (Enterprise)</option>
                  </select>
                </div>

                <div className="pv-input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ margin: 0 }}>GSTIN</label>
                    <a 
                      href="https://razorpay.com/gst-number-search/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ fontSize: '11px', color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 800 }}
                    >
                      Verify Ext.
                    </a>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <CreditCard size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input 
                      className="pv-input"
                      style={{ paddingLeft: '44px' }}
                      placeholder="33AAAAA0000A1Z5" 
                      value={firmData.gstNumber}
                      onChange={e => setFirmData({...firmData, gstNumber: e.target.value.toUpperCase()})}
                    />
                  </div>
                </div>

                <div className="pv-input-group">
                  <label>Registration Number</label>
                  <div style={{ position: 'relative' }}>
                    <FileText size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input 
                      className="pv-input"
                      style={{ paddingLeft: '44px' }}
                      placeholder="REG-123456" 
                      value={firmData.registrationNumber}
                      onChange={e => setFirmData({...firmData, registrationNumber: e.target.value.toUpperCase()})}
                    />
                  </div>
                </div>

                <div className="pv-input-group">
                  <label>Branch License</label>
                  <div style={{ position: 'relative' }}>
                    <ShieldCheck size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input 
                      className="pv-input"
                      style={{ paddingLeft: '44px' }}
                      placeholder="JL-TN-456" 
                      value={firmData.licenseNumber}
                      onChange={e => setFirmData({...firmData, licenseNumber: e.target.value.toUpperCase()})}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                <button className="pv-btn pv-btn-gold" onClick={() => setStep(2)}>
                  Admin Root <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ animation: 'anim-fade-in 0.3s' }}>
              <h2 style={{ fontSize: '32px', letterSpacing: '-1px', marginBottom: '8px' }}>Owner Credentials</h2>
              <p style={{ color: 'var(--text-tertiary)', marginBottom: '32px' }}>Create the first administrative account for this shop.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="pv-input-group" style={{ gridColumn: 'span 2' }}>
                  <label>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <UserPlus size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input 
                      className="pv-input"
                      style={{ paddingLeft: '44px' }}
                      placeholder="Owner / Admin Name" 
                      value={adminData.fullName}
                      onChange={e => setAdminData({...adminData, fullName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="pv-input-group">
                  <label>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input 
                      type="email" 
                      className="pv-input"
                      style={{ paddingLeft: '44px' }}
                      placeholder="owner@shop.com" 
                      value={adminData.email}
                      onChange={e => setAdminData({...adminData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="pv-input-group">
                  <label>Initial Password</label>
                  <div style={{ position: 'relative' }}>
                    <ShieldCheck size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input 
                      type="password" 
                      className="pv-input"
                      style={{ paddingLeft: '44px' }}
                      placeholder="Min 8 chars" 
                      value={adminData.password}
                      onChange={e => setAdminData({...adminData, password: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {error && <div className="pv-badge" style={{ background: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', marginTop: '20px', width: '100%', justifyContent: 'center' }}><AlertCircle size={14} /> {error}</div>}

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                <button className="pv-btn pv-btn-outline" onClick={() => setStep(1)}>Back</button>
                <button className="pv-btn pv-btn-gold" onClick={() => setStep(3)}>
                  Add Staff <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ animation: 'anim-fade-in 0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <h2 style={{ fontSize: '32px', letterSpacing: '-1px', margin: 0 }}>Staff Directory</h2>
                  <p style={{ color: 'var(--text-tertiary)' }}>Add employees to manage daily operations.</p>
                </div>
                <button className="pv-btn pv-btn-outline pv-btn-sm" onClick={addStaffRow}>
                  <Plus size={16} /> Add Staff
                </button>
              </div>
              
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                {staffMembers.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-primary)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                    <Users size={32} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
                    <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 600 }}>No staff added yet. Root admin will be created in deployment.</p>
                  </div>
                )}
                {staffMembers.map((staff, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 40px', gap: '8px', alignItems: 'center' }}>
                    <input 
                      className="pv-input" 
                      style={{ height: '36px', fontSize: '13px' }}
                      placeholder="Full Name" 
                      value={staff.fullName}
                      onChange={e => updateStaff(idx, 'fullName', e.target.value)}
                    />
                    <input 
                      className="pv-input" 
                      style={{ height: '36px', fontSize: '13px' }}
                      placeholder="Email" 
                      value={staff.email}
                      onChange={e => updateStaff(idx, 'email', e.target.value)}
                    />
                    <input 
                      className="pv-input" 
                      style={{ height: '36px', fontSize: '13px' }}
                      type="password"
                      placeholder="Pass" 
                      value={staff.password}
                      onChange={e => updateStaff(idx, 'password', e.target.value)}
                    />
                    <button style={{ background: 'transparent', border: 'none', color: 'var(--status-overdue)', cursor: 'pointer' }} onClick={() => removeStaff(idx)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {error && <div className="pv-badge" style={{ background: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', marginTop: '20px', width: '100%', justifyContent: 'center' }}><AlertCircle size={14} /> {error}</div>}

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                <button className="pv-btn pv-btn-outline" onClick={() => setStep(2)}>Back</button>
                <button className="pv-btn pv-btn-gold" onClick={handleOnboard} disabled={loading}>
                  {loading ? <Loader2 className="spin" size={18} /> : 'Finalize & Onboard Firm'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: 'center', animation: 'anim-fade-in 0.4s' }}>
              <div style={{ width: '80px', height: '80px', background: 'var(--status-active-bg)', color: 'var(--status-active)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <CheckCircle size={40} />
              </div>
              <h2 style={{ fontSize: '32px', letterSpacing: '-1px', marginBottom: '8px' }}>Onboarding Complete!</h2>
              <p style={{ color: 'var(--text-tertiary)', maxWidth: '400px', margin: '0 auto 32px' }}>
                <strong>{firmData.name}</strong> has been successfully registered. 
                Invitation sent to <strong>{adminData.email}</strong>.
              </p>
              <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Instance ID</span> <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>FIRM_{Date.now().toString(36).toUpperCase()}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Root Role</span> <span className="pv-badge" style={{ background: 'var(--brand-deep)', color: 'white', fontWeight: 800 }}>FIRM_ADMIN</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Staff Count</span> <span style={{ fontWeight: 800 }}>{staffMembers.length} Members</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Sync Status</span> <span className="pv-badge" style={{ background: 'var(--status-active-bg)', color: 'var(--status-active)', fontWeight: 800 }}>ACTIVE</span></div>
              </div>
              <button className="pv-btn pv-btn-gold" style={{ width: '100%' }} onClick={() => window.location.reload()}>Onboard Another Shop</button>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
