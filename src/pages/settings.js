import { useState, useEffect } from 'react';
import Head from 'next/head';

// Default settings from file (fallback)
import {
    CONTAINER_TYPES as DEFAULT_CONTAINERS,
    PRODUCTS as DEFAULT_PRODUCTS,
    LOCATIONS as DEFAULT_LOCATIONS,
    PORTS as DEFAULT_PORTS,
    COUNTRIES as DEFAULT_COUNTRIES,
    DESTINATION_PORTS as DEFAULT_DEST_PORTS,
    CERTIFICATIONS as DEFAULT_CERTS,
    SETTINGS as DEFAULT_SETTINGS,
} from '@/lib/settings';

// Local storage keys
const STORAGE_KEYS = {
    products: 'arovave_products',
    locations: 'arovave_locations',
    ports: 'arovave_ports',
    countries: 'arovave_countries',
    destPorts: 'arovave_dest_ports',
    containers: 'arovave_containers',
    certifications: 'arovave_certifications',
    settings: 'arovave_settings',
};

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [locations, setLocations] = useState([]);
    const [ports, setPorts] = useState([]);
    const [countries, setCountries] = useState([]);
    const [destPorts, setDestPorts] = useState([]);
    const [containers, setContainers] = useState([]);
    const [certifications, setCertifications] = useState([]);
    const [generalSettings, setGeneralSettings] = useState({});

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({});
    const [saveMessage, setSaveMessage] = useState(''); // Shows "Saved!" confirmation
    const [loading, setLoading] = useState(true);

    // Load from API (file-based storage)
    useEffect(() => {
        loadAllData();
    }, []);

    async function loadAllData() {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products || DEFAULT_PRODUCTS);
                setLocations(data.locations || DEFAULT_LOCATIONS);
                setPorts(data.ports || DEFAULT_PORTS);
                setCountries(data.countries || DEFAULT_COUNTRIES);
                setDestPorts(data.destPorts || DEFAULT_DEST_PORTS);
                setContainers(data.containers || DEFAULT_CONTAINERS);
                setCertifications(data.certifications || DEFAULT_CERTS);
                setGeneralSettings(data.settings || DEFAULT_SETTINGS);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            // Fall back to defaults
            setProducts(DEFAULT_PRODUCTS);
            setLocations(DEFAULT_LOCATIONS);
            setPorts(DEFAULT_PORTS);
            setCountries(DEFAULT_COUNTRIES);
            setDestPorts(DEFAULT_DEST_PORTS);
            setContainers(DEFAULT_CONTAINERS);
            setCertifications(DEFAULT_CERTS);
            setGeneralSettings(DEFAULT_SETTINGS);
        }
        setLoading(false);
    }

    async function saveData(key, data) {
        console.log('saveData called with key:', key, 'data length:', Array.isArray(data) ? data.length : 'not array');
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: key, data })
            });
            console.log('saveData response status:', res.status);
            if (res.ok) {
                setSaveMessage('✓ Saved to file!');
                setTimeout(() => setSaveMessage(''), 2000);
                return true;
            } else {
                const errText = await res.text();
                console.error('saveData failed:', errText);
                setSaveMessage('❌ Save failed');
                setTimeout(() => setSaveMessage(''), 3000);
                return false;
            }
        } catch (error) {
            console.error('Error saving:', error);
            setSaveMessage('❌ Save failed: ' + error.message);
            setTimeout(() => setSaveMessage(''), 3000);
            return false;
        }
    }

    // CRUD functions
    function handleAdd(type) {
        setEditingItem(null);
        setFormData(getEmptyForm(type));
        setShowModal(true);
    }

    function handleEdit(type, item) {
        setEditingItem(item);
        setFormData({ ...item });
        setShowModal(true);
    }

    function handleDelete(type, id) {
        if (!confirm('Are you sure you want to delete this item?')) return;

        const dataMap = { products, locations, ports, countries, destPorts, containers, certifications };
        const setterMap = {
            products: setProducts, locations: setLocations, ports: setPorts,
            countries: setCountries, destPorts: setDestPorts, containers: setContainers,
            certifications: setCertifications
        };

        const newData = dataMap[type].filter(item => item.id !== id);
        setterMap[type](newData);
        saveData(type, newData);
    }

    async function handleSave() {
        console.log('handleSave called, activeTab:', activeTab);
        console.log('editingItem:', editingItem);
        console.log('formData:', formData);
        const dataMap = { products, locations, ports, countries, destPorts, containers, certifications };
        const setterMap = {
            products: setProducts, locations: setLocations, ports: setPorts,
            countries: setCountries, destPorts: setDestPorts, containers: setContainers,
            certifications: setCertifications
        };

        let newData;
        if (editingItem) {
            // Update existing
            newData = dataMap[activeTab].map(item =>
                item.id === editingItem.id ? { ...formData, id: item.id } : item
            );
        } else {
            // Add new
            const newId = Math.max(0, ...dataMap[activeTab].map(i => i.id)) + 1;
            newData = [...dataMap[activeTab], { ...formData, id: newId }];
        }

        console.log('About to save, newData length:', newData.length);
        const saved = await saveData(activeTab, newData);
        console.log('Save result:', saved);
        if (saved) {
            setterMap[activeTab](newData);
            setShowModal(false);
            console.log('Modal closed, data updated');
        } else {
            console.error('Save failed, modal stays open');
        }
    }

    function handleSettingChange(key, value) {
        const newSettings = { ...generalSettings, [key]: value };
        setGeneralSettings(newSettings);
        saveData('settings', newSettings);
    }

    function resetToDefaults(type) {
        if (!confirm(`Reset ${type} to defaults? This will remove all custom changes.`)) return;

        const defaultsMap = {
            products: DEFAULT_PRODUCTS, locations: DEFAULT_LOCATIONS, ports: DEFAULT_PORTS,
            countries: DEFAULT_COUNTRIES, destPorts: DEFAULT_DEST_PORTS,
            containers: DEFAULT_CONTAINERS, certifications: DEFAULT_CERTS, settings: DEFAULT_SETTINGS
        };
        const setterMap = {
            products: setProducts, locations: setLocations, ports: setPorts,
            countries: setCountries, destPorts: setDestPorts, containers: setContainers,
            certifications: setCertifications, settings: setGeneralSettings
        };

        setterMap[type](defaultsMap[type]);
        saveData(type, defaultsMap[type]);
    }

    function getEmptyForm(type) {
        switch (type) {
            case 'products': return { name: '', hsn_code: '', unit: 'KG', base_price_usd: 0, qty_per_20ft: 0, qty_per_40ft: 0, active: true, linked_manufacturers: [] };
            case 'locations': return { name: '', state: '', pincode: '' };
            case 'ports': return { name: '', code: '', city: '', pincode: '', handling_per_container: 0, cha_charges: 0, customs_per_shipment: 0 };
            case 'countries': return { name: '', code: '', ecgc_risk_category: 'A', ecgc_rate_percent: 0.3, sea_freight_usd: 0 };
            case 'destPorts': return { name: '', code: '', country_id: 1 };
            case 'containers': return { name: '', code: '', max_weight_kg: 0, max_volume_cbm: 0, length_cm: 0, width_cm: 0, height_cm: 0, is_active: true };
            case 'certifications': return { name: '', cost_flat: 0, charge_type: 'per_shipment', is_mandatory: false };
            default: return {};
        }
    }

    const tabs = [
        { id: 'products', label: 'Products' },
        { id: 'locations', label: 'Locations' },
        { id: 'ports', label: 'Indian Ports' },
        { id: 'countries', label: 'Countries' },
        { id: 'destPorts', label: 'Destination Ports' },
        { id: 'containers', label: 'Containers' },
        { id: 'certifications', label: 'Certifications' },
        { id: 'settings', label: 'General' },
    ];

    return (
        <>
            <Head>
                <title>Calculator Settings | Arovave Global</title>
            </Head>

            <div className="container">
                <header className="header">
                    <div className="header-content">
                        <div className="logo">
                            <div className="logo-icon">AG</div>
                            <div>
                                <div className="logo-text">AROVAVE GLOBAL</div>
                                <div className="logo-tagline">Calculator Settings</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            {saveMessage && (
                                <span style={{ color: 'green', fontWeight: 'var(--font-medium)', fontSize: 'var(--text-sm)' }}>
                                    {saveMessage}
                                </span>
                            )}
                            <a href="/" className="btn btn-primary btn-sm">Back to Calculator</a>
                        </div>
                    </div>
                </header>

                <main>
                    <div className="card">
                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-5)', borderBottom: '1px solid var(--gray-200)', paddingBottom: 'var(--space-3)' }}>
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        {activeTab !== 'settings' && (
                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                <button className="btn btn-primary btn-sm" onClick={() => handleAdd(activeTab)}>
                                    + Add New
                                </button>
                            </div>
                        )}

                        {/* Products Tab */}
                        {activeTab === 'products' && (
                            <table className="breakup-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>HSN</th>
                                        <th>Price (USD)</th>

                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.name}</td>
                                            <td>{item.hsn_code}</td>
                                            <td>${item.base_price_usd}</td>

                                            <td><span className={`badge ${item.active ? 'badge-success' : 'badge-warning'}`}>{item.active ? 'Active' : 'Inactive'}</span></td>
                                            <td>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit('products', item)} style={{ marginRight: '4px' }}>Edit</button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleDelete('products', item.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Locations Tab */}
                        {activeTab === 'locations' && (
                            <table className="breakup-table">
                                <thead><tr><th>Name</th><th>State</th><th>Pincode</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {locations.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.name}</td>
                                            <td>{item.state}</td>
                                            <td>{item.pincode}</td>
                                            <td>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit('locations', item)} style={{ marginRight: '4px' }}>Edit</button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleDelete('locations', item.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'ports' && (
                            <table className="breakup-table">
                                <thead><tr><th>Name</th><th>Code</th><th>City</th><th>Pincode</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {ports.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.name}</td>
                                            <td>{item.code}</td>
                                            <td>{item.city}</td>
                                            <td>{item.pincode || '-'}</td>
                                            <td>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit('ports', item)} style={{ marginRight: '4px' }}>Edit</button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleDelete('ports', item.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Countries Tab */}
                        {activeTab === 'countries' && (
                            <table className="breakup-table">
                                <thead><tr><th>Country</th><th>Code</th><th>ECGC Rate</th><th>Sea Freight (USD)</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {countries.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.name}</td>
                                            <td>{item.code}</td>
                                            <td>{item.ecgc_rate_percent}%</td>
                                            <td>${item.sea_freight_usd || 0}</td>
                                            <td>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit('countries', item)} style={{ marginRight: '4px' }}>Edit</button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleDelete('countries', item.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Destination Ports Tab */}
                        {activeTab === 'destPorts' && (
                            <table className="breakup-table">
                                <thead><tr><th>Port Name</th><th>Code</th><th>Country</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {destPorts.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.name}</td>
                                            <td>{item.code}</td>
                                            <td>{countries.find(c => c.id === item.country_id)?.name || 'Unknown'}</td>
                                            <td>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit('destPorts', item)} style={{ marginRight: '4px' }}>Edit</button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleDelete('destPorts', item.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Containers Tab */}
                        {activeTab === 'containers' && (
                            <table className="breakup-table">
                                <thead><tr><th>Name</th><th>Code</th><th>Max Weight</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {containers.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.name}</td>
                                            <td>{item.code}</td>
                                            <td>{item.max_weight_kg?.toLocaleString()} KG</td>
                                            <td><span className={`badge ${item.is_active ? 'badge-success' : 'badge-warning'}`}>{item.is_active ? 'Active' : 'Inactive'}</span></td>
                                            <td>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit('containers', item)} style={{ marginRight: '4px' }}>Edit</button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleDelete('containers', item.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Certifications Tab */}
                        {activeTab === 'certifications' && (
                            <table className="breakup-table">
                                <thead><tr><th>Name</th><th>Cost</th><th>Type</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {certifications.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.name}</td>
                                            <td>₹{item.cost_flat?.toLocaleString()}</td>
                                            <td>{item.charge_type}</td>
                                            <td>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit('certifications', item)} style={{ marginRight: '4px' }}>Edit</button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => handleDelete('certifications', item.id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* General Settings Tab */}
                        {activeTab === 'settings' && (
                            <div>
                                <div className="form-group">
                                    <label className="form-label">Company Name</label>
                                    <input className="form-input" value={generalSettings.company_name || ''} onChange={(e) => handleSettingChange('company_name', e.target.value)} />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">USD Exchange Rate</label>
                                        <input className="form-input" type="number" step="0.01" value={generalSettings.exchange_rate_usd || ''} onChange={(e) => handleSettingChange('exchange_rate_usd', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Bank Margin</label>
                                        <input className="form-input" type="number" step="0.01" value={generalSettings.bank_margin || ''} onChange={(e) => handleSettingChange('bank_margin', e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Default Profit Rate (%)</label>
                                        <input className="form-input" type="number" step="0.1" value={generalSettings.profit_rate || ''} onChange={(e) => handleSettingChange('profit_rate', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Marine Insurance Rate (%)</label>
                                        <input className="form-input" type="number" step="0.01" value={generalSettings.marine_insurance_rate || ''} onChange={(e) => handleSettingChange('marine_insurance_rate', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Indian Insurance Rate (%)</label>
                                        <input className="form-input" type="number" step="0.01" value={generalSettings.indian_insurance_rate || ''} onChange={(e) => handleSettingChange('indian_insurance_rate', e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Min Insurance (INR)</label>
                                        <input className="form-input" type="number" value={generalSettings.min_insurance || ''} onChange={(e) => handleSettingChange('min_insurance', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Bank Charge Rate (%)</label>
                                        <input className="form-input" type="number" step="0.01" value={generalSettings.bank_charge_rate || ''} onChange={(e) => handleSettingChange('bank_charge_rate', e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Container Stuffing Rate (₹/container)</label>
                                        <input className="form-input" type="number" value={generalSettings.container_stuffing_rate || ''} onChange={(e) => handleSettingChange('container_stuffing_rate', e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Sea Freight 20FT ($)</label>
                                        <input className="form-input" type="number" value={generalSettings.sea_freight_20ft || ''} onChange={(e) => handleSettingChange('sea_freight_20ft', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Sea Freight 40FT ($)</label>
                                        <input className="form-input" type="number" value={generalSettings.sea_freight_40ft || ''} onChange={(e) => handleSettingChange('sea_freight_40ft', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                <footer style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                    <p>Settings are saved in your browser. © {new Date().getFullYear()} Arovave Global.</p>
                </footer>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }} onClick={() => setShowModal(false)}>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: 'var(--space-4)' }}>{editingItem ? 'Edit' : 'Add New'} {activeTab.replace(/([A-Z])/g, ' $1')}</h3>

                        {/* Dynamic form fields based on type */}
                        {activeTab === 'products' && (
                            <>
                                <div className="form-group"><label className="form-label">Product Name</label><input className="form-input" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">HSN Code</label><input className="form-input" value={formData.hsn_code || ''} onChange={e => setFormData({ ...formData, hsn_code: e.target.value })} /></div>
                                    <div className="form-group"><label className="form-label">Unit</label><input className="form-input" value={formData.unit || ''} onChange={e => setFormData({ ...formData, unit: e.target.value })} /></div>
                                </div>
                                <div className="form-group"><label className="form-label">Base Price (USD)</label><input className="form-input" type="number" step="0.01" value={formData.base_price_usd || ''} onChange={e => setFormData({ ...formData, base_price_usd: parseFloat(e.target.value) || 0 })} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Qty per 20FT</label><input className="form-input" type="number" value={formData.qty_per_20ft || ''} onChange={e => setFormData({ ...formData, qty_per_20ft: parseInt(e.target.value) || 0 })} /></div>
                                    <div className="form-group"><label className="form-label">Qty per 40FT</label><input className="form-input" type="number" value={formData.qty_per_40ft || ''} onChange={e => setFormData({ ...formData, qty_per_40ft: parseInt(e.target.value) || 0 })} /></div>
                                </div>
                                <div className="form-group"><label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" checked={formData.active || false} onChange={e => setFormData({ ...formData, active: e.target.checked })} /> Active</label></div>


                            </>
                        )}

                        {activeTab === 'locations' && (
                            <>
                                <div className="form-group"><label className="form-label">Location Name</label><input className="form-input" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">State</label><input className="form-input" value={formData.state || ''} onChange={e => setFormData({ ...formData, state: e.target.value })} /></div>
                                    <div className="form-group"><label className="form-label">Pincode</label><input className="form-input" value={formData.pincode || ''} onChange={e => setFormData({ ...formData, pincode: e.target.value })} /></div>
                                </div>
                            </>
                        )}

                        {activeTab === 'ports' && (
                            <>
                                <div className="form-group"><label className="form-label">Port Name</label><input className="form-input" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Port Code</label><input className="form-input" value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} /></div>
                                    <div className="form-group"><label className="form-label">City</label><input className="form-input" value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })} /></div>
                                    <div className="form-group"><label className="form-label">Pincode</label><input className="form-input" value={formData.pincode || ''} onChange={e => setFormData({ ...formData, pincode: e.target.value })} /></div>
                                </div>
                                <div className="form-group"><label className="form-label">Handling per Container (INR)</label><input className="form-input" type="number" value={formData.handling_per_container || ''} onChange={e => setFormData({ ...formData, handling_per_container: parseInt(e.target.value) || 0 })} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">CHA Charges (INR)</label><input className="form-input" type="number" value={formData.cha_charges || ''} onChange={e => setFormData({ ...formData, cha_charges: parseInt(e.target.value) || 0 })} /></div>
                                    <div className="form-group"><label className="form-label">Customs per Shipment (INR)</label><input className="form-input" type="number" value={formData.customs_per_shipment || ''} onChange={e => setFormData({ ...formData, customs_per_shipment: parseInt(e.target.value) || 0 })} /></div>
                                </div>
                            </>
                        )}

                        {activeTab === 'countries' && (
                            <>
                                <div className="form-group"><label className="form-label">Country Name</label><input className="form-input" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Country Code</label><input className="form-input" value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} /></div>
                                    <div className="form-group"><label className="form-label">ECGC Risk Category</label><input className="form-input" value={formData.ecgc_risk_category || ''} onChange={e => setFormData({ ...formData, ecgc_risk_category: e.target.value })} /></div>
                                </div>
                                <div className="form-group"><label className="form-label">ECGC Rate (%)</label><input className="form-input" type="number" step="0.01" value={formData.ecgc_rate_percent || ''} onChange={e => setFormData({ ...formData, ecgc_rate_percent: parseFloat(e.target.value) || 0 })} /></div>
                                <div className="form-group"><label className="form-label">Sea Freight (USD per container)</label><input className="form-input" type="number" value={formData.sea_freight_usd || ''} onChange={e => setFormData({ ...formData, sea_freight_usd: parseFloat(e.target.value) || 0 })} /></div>
                            </>
                        )}

                        {activeTab === 'destPorts' && (
                            <>
                                <div className="form-group"><label className="form-label">Port Name</label><input className="form-input" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Port Code</label><input className="form-input" value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} /></div>
                                <div className="form-group">
                                    <label className="form-label">Country</label>
                                    <select className="form-select" value={formData.country_id || ''} onChange={e => setFormData({ ...formData, country_id: parseInt(e.target.value) })}>
                                        {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </>
                        )}

                        {activeTab === 'containers' && (
                            <>
                                <div className="form-group"><label className="form-label">Container Name</label><input className="form-input" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Code (e.g. 20FT, 40FT)</label><input className="form-input" value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} /></div>
                                <div className="form-row">
                                    <div className="form-group"><label className="form-label">Max Weight (KG)</label><input className="form-input" type="number" value={formData.max_weight_kg || ''} onChange={e => setFormData({ ...formData, max_weight_kg: parseInt(e.target.value) || 0 })} /></div>
                                    <div className="form-group"><label className="form-label">Max Volume (CBM)</label><input className="form-input" type="number" value={formData.max_volume_cbm || ''} onChange={e => setFormData({ ...formData, max_volume_cbm: parseInt(e.target.value) || 0 })} /></div>
                                </div>
                                <label className="form-label" style={{ marginTop: 'var(--space-3)', marginBottom: 'var(--space-2)', display: 'block', fontWeight: '600' }}>Internal Dimensions (cm)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                                    <div className="form-group"><label className="form-label" style={{ fontSize: 'var(--text-xs)' }}>Length (cm)</label><input className="form-input" type="number" placeholder="e.g. 590" value={formData.length_cm || ''} onChange={e => setFormData({ ...formData, length_cm: parseInt(e.target.value) || 0 })} /></div>
                                    <div className="form-group"><label className="form-label" style={{ fontSize: 'var(--text-xs)' }}>Width (cm)</label><input className="form-input" type="number" placeholder="e.g. 235" value={formData.width_cm || ''} onChange={e => setFormData({ ...formData, width_cm: parseInt(e.target.value) || 0 })} /></div>
                                    <div className="form-group"><label className="form-label" style={{ fontSize: 'var(--text-xs)' }}>Height (cm)</label><input className="form-input" type="number" placeholder="e.g. 239" value={formData.height_cm || ''} onChange={e => setFormData({ ...formData, height_cm: parseInt(e.target.value) || 0 })} /></div>
                                </div>
                                <div className="form-group"><label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" checked={formData.is_active || false} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} /> Active</label></div>
                            </>
                        )}

                        {activeTab === 'certifications' && (
                            <>
                                <div className="form-group"><label className="form-label">Certification Name</label><input className="form-input" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Cost (INR)</label><input className="form-input" type="number" value={formData.cost_flat || ''} onChange={e => setFormData({ ...formData, cost_flat: parseInt(e.target.value) || 0 })} /></div>
                                <div className="form-group">
                                    <label className="form-label">Charge Type</label>
                                    <select className="form-select" value={formData.charge_type || ''} onChange={e => setFormData({ ...formData, charge_type: e.target.value })}>
                                        <option value="per_shipment">Per Shipment</option>
                                        <option value="per_container">Per Container</option>
                                        <option value="by_exporter">By Exporter</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
                            <button className="btn btn-primary" onClick={handleSave} style={{ flex: 1 }}>Save</button>
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
