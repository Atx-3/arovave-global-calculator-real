import { useState, useEffect } from 'react';
import { AdminLayout, Toast } from './index';
import { getSettings, updateSetting } from '@/lib/db';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        insurance_percent: '2',
        min_insurance: '50',
        google_maps_api: '',
        currency_api: '',
        freight_api: '',
        company_name: 'Arovave Global',
        company_email: 'exports@arovaveglobal.com',
        company_phone: '',
        company_address: '',
        quotation_validity_days: '7'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const data = await getSettings();
            if (data) {
                setSettings(prev => ({ ...prev, ...data }));
            }
        } catch (err) {
            console.error('Error loading settings:', err);
        }
        setLoading(false);
    }

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save each setting individually
            const promises = Object.entries(settings).map(([key, value]) =>
                updateSetting(key, value)
            );
            await Promise.all(promises);
            setToast({ message: 'Settings saved successfully', type: 'success' });
        } catch (err) {
            console.error('Error saving settings:', err);
            setToast({ message: 'Failed to save settings', type: 'error' });
        }
        setSaving(false);
    };

    return (
        <AdminLayout activeTab="settings">
            <div className="admin-header">
                <h1 className="admin-title">Settings</h1>
                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <div className="spinner"></div>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
                    {/* Insurance Settings */}
                    <div className="card">
                        <h3 style={{ marginBottom: 'var(--space-4)' }}>Insurance Settings</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Insurance Percentage (%)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={settings.insurance_percent}
                                    onChange={(e) => handleChange('insurance_percent', e.target.value)}
                                    placeholder="e.g., 2"
                                    step="0.1"
                                    min="0"
                                />
                                <small style={{ color: 'var(--text-muted)' }}>Percentage of FOB value for insurance</small>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Minimum Insurance (USD)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={settings.min_insurance}
                                    onChange={(e) => handleChange('min_insurance', e.target.value)}
                                    placeholder="e.g., 50"
                                    step="1"
                                    min="0"
                                />
                                <small style={{ color: 'var(--text-muted)' }}>Minimum insurance charge regardless of FOB</small>
                            </div>
                        </div>
                    </div>

                    {/* Company Information */}
                    <div className="card">
                        <h3 style={{ marginBottom: 'var(--space-4)' }}>Company Information</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Company Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={settings.company_name}
                                    onChange={(e) => handleChange('company_name', e.target.value)}
                                    placeholder="Company name for quotations"
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Company Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={settings.company_email}
                                    onChange={(e) => handleChange('company_email', e.target.value)}
                                    placeholder="exports@company.com"
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Company Phone</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={settings.company_phone}
                                    onChange={(e) => handleChange('company_phone', e.target.value)}
                                    placeholder="+91 XXXXX XXXXX"
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Quotation Validity (Days)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={settings.quotation_validity_days}
                                    onChange={(e) => handleChange('quotation_validity_days', e.target.value)}
                                    placeholder="e.g., 7"
                                    min="1"
                                />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginTop: 'var(--space-4)', marginBottom: 0 }}>
                            <label className="form-label">Company Address</label>
                            <textarea
                                className="form-input"
                                value={settings.company_address}
                                onChange={(e) => handleChange('company_address', e.target.value)}
                                placeholder="Full company address for quotations"
                                rows={3}
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    {/* API Settings */}
                    <div className="card">
                        <h3 style={{ marginBottom: 'var(--space-4)' }}>API Settings</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
                            Configure external API integrations for enhanced functionality (optional)
                        </p>
                        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Google Maps API Key</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={settings.google_maps_api}
                                    onChange={(e) => handleChange('google_maps_api', e.target.value)}
                                    placeholder="For distance calculation (optional)"
                                />
                                <small style={{ color: 'var(--text-muted)' }}>Used to calculate distance-based transport costs</small>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Currency Exchange API Key</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={settings.currency_api}
                                    onChange={(e) => handleChange('currency_api', e.target.value)}
                                    placeholder="For currency conversion (optional)"
                                />
                                <small style={{ color: 'var(--text-muted)' }}>Used for real-time currency conversion</small>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Freight Rate API Key</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={settings.freight_api}
                                    onChange={(e) => handleChange('freight_api', e.target.value)}
                                    placeholder="For real-time freight rates (optional)"
                                />
                                <small style={{ color: 'var(--text-muted)' }}>Used to fetch real-time shipping rates</small>
                            </div>
                        </div>
                    </div>

                    {/* Database Info */}
                    <div className="card">
                        <h3 style={{ marginBottom: 'var(--space-4)' }}>Database Information</h3>
                        <div style={{
                            padding: 'var(--space-4)',
                            background: 'var(--bg-glass)',
                            borderRadius: 'var(--radius-lg)',
                            fontSize: 'var(--text-sm)'
                        }}>
                            <p style={{ marginBottom: 'var(--space-2)' }}>
                                <strong>Database:</strong> Supabase
                            </p>
                            <p style={{ marginBottom: 'var(--space-2)' }}>
                                <strong>Status:</strong> <span style={{ color: 'var(--success)' }}>Connected</span>
                            </p>
                            <p style={{ color: 'var(--text-muted)', marginBottom: 0 }}>
                                All data is stored securely in your Supabase database.
                            </p>
                        </div>
                    </div>

                    {/* Admin Credentials */}
                    <div className="card">
                        <h3 style={{ marginBottom: 'var(--space-4)' }}>Admin Credentials</h3>
                        <div style={{
                            padding: 'var(--space-4)',
                            background: 'rgba(255, 191, 0, 0.1)',
                            border: '1px solid var(--accent-500)',
                            borderRadius: 'var(--radius-lg)',
                            fontSize: 'var(--text-sm)'
                        }}>
                            <p style={{ marginBottom: 'var(--space-2)', color: 'var(--accent-400)' }}>
                                <strong>⚠️ Security Notice</strong>
                            </p>
                            <p style={{ marginBottom: 'var(--space-2)' }}>
                                Current credentials: <code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>admin / admin123</code>
                            </p>
                            <p style={{ color: 'var(--text-muted)', marginBottom: 0 }}>
                                For production, please implement proper authentication with hashed passwords in Supabase.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="toast-container">
                    <Toast {...toast} onClose={() => setToast(null)} />
                </div>
            )}
        </AdminLayout>
    );
}
