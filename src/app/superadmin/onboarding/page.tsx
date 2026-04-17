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
} from 'lucide-react';
import { onboardFirmAction } from './actions';

export default function SuperadminOnboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firmData, setFirmData] = useState({
    name: '',
    plan: 'pro',
    location: 'Coimbatore, TN'
  });

  const [managerData, setManagerData] = useState({
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
      plan: firmData.plan,
      email: managerData.email,
      password: managerData.password,
      fullName: managerData.fullName,
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
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-sidebar">
          <div className="sidebar-logo">
            <span>🪙</span> PledgeVault <sup>Admin</sup>
          </div>
          <div className="steps-list">
            <div className={`step-item ${step >= 1 ? 'active' : ''}`}>
              <div className="step-num">{step > 1 ? <CheckCircle size={16} /> : '1'}</div>
              <div>
                <div className="step-title">Shop Details</div>
                <div className="step-desc">Business information & plan</div>
              </div>
            </div>
            <div className={`step-item ${step >= 2 ? 'active' : ''}`}>
              <div className="step-num">{step > 2 ? <CheckCircle size={16} /> : '2'}</div>
              <div>
                <div className="step-title">Manager Account</div>
                <div className="step-desc">Shop owner credentials</div>
              </div>
            </div>
            <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
              <div className="step-num">{step > 3 ? <CheckCircle size={16} /> : '3'}</div>
              <div>
                <div className="step-title">Staff Members</div>
                <div className="step-desc">Add shop employees</div>
              </div>
            </div>
            <div className={`step-item ${step >= 4 ? 'active' : ''}`}>
              <div className="step-num">{step >= 4 ? <CheckCircle size={16} /> : '4'}</div>
              <div>
                <div className="step-title">Initialization</div>
                <div className="step-desc">Finalizing setup</div>
              </div>
            </div>
          </div>
        </div>

        <div className="onboarding-content">
          {step === 1 && (
            <div className="step-view">
              <h2>New Business Registration</h2>
              <p>Onboard a new pawn shop into the PledgeVault ecosystem.</p>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Official Shop Name</label>
                  <div className="input-box">
                    <Building2 size={18} />
                    <input 
                      placeholder="e.g., Sri Ganesh Jewel Loans" 
                      value={firmData.name}
                      onChange={e => setFirmData({...firmData, name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Business Location</label>
                  <div className="input-box">
                    <Globe size={18} />
                    <input 
                      placeholder="City, State" 
                      value={firmData.location}
                      onChange={e => setFirmData({...firmData, location: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Subscription Tier</label>
                  <select 
                    className="form-select"
                    value={firmData.plan}
                    onChange={e => setFirmData({...firmData, plan: e.target.value})}
                  >
                    <option value="free">Standard (Free)</option>
                    <option value="pro">Premium (Growth)</option>
                    <option value="enterprise">Multi-Store (Enterprise)</option>
                  </select>
                </div>
              </div>

              <div className="onboarding-footer">
                <button className="btn btn-gold" onClick={() => setStep(2)}>
                  Next Step: Owner Access <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="step-view">
              <h2>Owner Credentials</h2>
              <p>Create the first administrative account for this shop.</p>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <div className="input-box">
                    <UserPlus size={18} />
                    <input 
                      placeholder="Owner / Manager Name" 
                      value={managerData.fullName}
                      onChange={e => setManagerData({...managerData, fullName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-box">
                    <Settings size={18} />
                    <input 
                      type="email" 
                      placeholder="owner@shop.com" 
                      value={managerData.email}
                      onChange={e => setManagerData({...managerData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Initial Password</label>
                  <div className="input-box">
                    <ShieldCheck size={18} />
                    <input 
                      type="password" 
                      placeholder="Minimum 8 characters" 
                      value={managerData.password}
                      onChange={e => setManagerData({...managerData, password: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {error && <div className="error-pill"><AlertCircle size={14} /> {error}</div>}

              <div className="onboarding-footer">
                <button className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
                <button className="btn btn-gold" onClick={() => setStep(3)}>
                  Next Step: Add Staff <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-view">
              <div className="header-with-action">
                <div>
                  <h2>Staff Directory</h2>
                  <p>Add employees who will manage daily operations.</p>
                </div>
                <button className="btn btn-outline btn-sm" onClick={addStaffRow}>
                  <Plus size={16} /> Add Staff Member
                </button>
              </div>
              
              <div className="staff-list-onboarding">
                {staffMembers.length === 0 && (
                  <div className="empty-staff">
                    <Users size={32} />
                    <p>No staff added yet. All shops must have at least one manager (created in Step 2).</p>
                  </div>
                )}
                {staffMembers.map((staff, idx) => (
                  <div key={idx} className="staff-onboarding-row">
                    <div className="form-group no-margin">
                      <input 
                        className="form-input-sm" 
                        placeholder="Full Name" 
                        value={staff.fullName}
                        onChange={e => updateStaff(idx, 'fullName', e.target.value)}
                      />
                    </div>
                    <div className="form-group no-margin">
                      <input 
                        className="form-input-sm" 
                        placeholder="Email" 
                        value={staff.email}
                        onChange={e => updateStaff(idx, 'email', e.target.value)}
                      />
                    </div>
                    <div className="form-group no-margin">
                      <input 
                        className="form-input-sm" 
                        type="password"
                        placeholder="Password" 
                        value={staff.password}
                        onChange={e => updateStaff(idx, 'password', e.target.value)}
                      />
                    </div>
                    <button className="remove-staff-btn" onClick={() => removeStaff(idx)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {error && <div className="error-pill"><AlertCircle size={14} /> {error}</div>}

              <div className="onboarding-footer">
                <button className="btn btn-outline" onClick={() => setStep(2)}>Back</button>
                <button className="btn btn-gold" onClick={handleOnboard} disabled={loading}>
                  {loading ? <Loader2 className="spin" /> : 'Finalize & Onboard Firm'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="success-view">
              <div className="success-icon">
                <CheckCircle size={64} color="var(--gold)" />
              </div>
              <h2>Onboarding Complete!</h2>
              <p>
                <strong>{firmData.name}</strong> has been successfully registered. 
                An invitation has been sent to <strong>{managerData.email}</strong>.
              </p>
              <div className="info-summary">
                <div className="info-row"><span>ID</span> <span>FIRM_{Date.now().toString(36).toUpperCase()}</span></div>
                <div className="info-row"><span>Role</span> <span className="badge active">Firm Manager</span></div>
                <div className="info-row"><span>Staff Onboarded</span> <span>{staffMembers.length} Employees</span></div>
                <div className="info-row"><span>Status</span> <span className="badge active">Synced</span></div>
              </div>
              <button className="btn btn-gold" onClick={() => window.location.reload()}>Onboard Another Shop</button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .onboarding-page {
          min-height: 100vh;
          background: #f8f8f5;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }

        .header-with-action {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .onboarding-card {
          width: 100%;
          max-width: 1000px;
          height: 650px;
          background: #fff;
          border-radius: 32px;
          box-shadow: 0 40px 100px -20px rgba(0,0,0,0.1);
          display: grid;
          grid-template-columns: 320px 1fr;
          overflow: hidden;
        }

        .onboarding-sidebar {
          background: #1A3C34;
          padding: 48px;
          color: #fff;
          display: flex;
          flex-direction: column;
        }

        .sidebar-logo {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 64px;
        }

        .steps-list {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .step-item {
          display: flex;
          gap: 16px;
          opacity: 0.4;
          transition: all 0.3s;
        }

        .step-item.active {
          opacity: 1;
        }

        .step-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .step-item.active .step-num {
          border-color: var(--gold);
          color: var(--gold);
        }

        .step-title {
          font-weight: 700;
          font-size: 15px;
        }

        .step-desc {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
        }

        .onboarding-content {
          padding: 48px 64px;
          background: #fff;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .step-view h2 {
          font-size: 32px;
          letter-spacing: -1px;
          margin-bottom: 12px;
          color: #1A3C34;
        }

        .step-view p {
          color: #6F767E;
          margin-bottom: 24px;
        }

        .form-grid {
          display: grid;
          gap: 24px;
        }

        .input-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #F4F4F2;
          border: 1px solid #E8E8E3;
          border-radius: 12px;
          padding: 4px 16px;
          color: #1A3C34;
        }

        .input-box input {
          border: none;
          background: transparent;
          padding: 12px 0;
          width: 100%;
          font-size: 15px;
          outline: none;
        }

        .form-select {
          width: 100%;
          background: #F4F4F2;
          border: 1px solid #E8E8E3;
          border-radius: 12px;
          padding: 12px 16px;
          outline: none;
        }

        .onboarding-footer {
          margin-top: 32px;
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          padding-top: 24px;
          border-top: 1px solid #F4F4F2;
        }

        /* Staff List Styles */
        .staff-list-onboarding {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 280px;
          overflow-y: auto;
          margin-bottom: 20px;
        }

        .staff-onboarding-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 40px;
          gap: 10px;
          align-items: center;
          background: #F8F8F5;
          padding: 8px;
          border-radius: 10px;
        }

        .form-input-sm {
          width: 100%;
          background: #fff;
          border: 1px solid #E8E8E3;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 13px;
          outline: none;
        }

        .no-margin { margin-bottom: 0; }

        .remove-staff-btn {
          background: transparent;
          border: none;
          color: #DC2626;
          opacity: 0.6;
          cursor: pointer;
        }

        .remove-staff-btn:hover { opacity: 1; }

        .empty-staff {
          text-align: center;
          padding: 40px;
          color: #9A9FA5;
          background: #F8F8F5;
          border-radius: 20px;
          border: 2px dashed #E8E8E3;
        }

        .empty-staff p {
          margin-top: 12px;
          font-size: 13px;
        }

        .success-view {
          text-align: center;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .success-icon {
          margin-bottom: 24px;
          animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes scaleIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .info-summary {
          width: 100%;
          max-width: 320px;
          background: #f8f8f5;
          padding: 20px;
          border-radius: 16px;
          margin: 32px 0;
          text-align: left;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 13px;
          border-bottom: 1px solid #eee;
        }

        .info-row:last-child {
          border: none;
        }

        .info-row span:first-child {
          color: #6F767E;
        }

        .error-pill {
          margin-top: 16px;
          padding: 8px 16px;
          background: #FEF2F2;
          color: #DC2626;
          border-radius: 8px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .spin {
          animation: rotate 1s linear infinite;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
