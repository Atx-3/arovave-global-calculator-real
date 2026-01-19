import { useState, useEffect } from 'react';
import { AdminLayout, Modal, ConfirmDialog, Toast } from './index';
import {
    getCountries,
    createCountry,
    updateCountry,
    deleteCountry,
    getDestinationPorts,
    createDestinationPort,
    updateDestinationPort,
    deleteDestinationPort
} from '@/lib/db';
import { formatCurrency } from '@/lib/calculator';

export default function CountriesPage() {
    const [countries, setCountries] = useState([]);
    const [destPorts, setDestPorts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [countryModalOpen, setCountryModalOpen] = useState(false);
    const [portModalOpen, setPortModalOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [editingCountry, setEditingCountry] = useState(null);
    const [editingPort, setEditingPort] = useState(null);
    const [deletingItem, setDeletingItem] = useState(null);
    const [toast, setToast] = useState(null);
    const [activeTab, setActiveTab] = useState('countries');

    const [countryForm, setCountryForm] = useState({ name: '', code: '' });
    const [portForm, setPortForm] = useState({
        country_id: '',
        name: '',
        code: '',
        freight_per_kg: '',
        freight_per_cbm: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [countriesData, portsData] = await Promise.all([
                getCountries(),
                getDestinationPorts()
            ]);
            setCountries(countriesData || []);
            setDestPorts(portsData || []);
        } catch (err) {
            console.error('Error loading data:', err);
            setToast({ message: 'Failed to load data', type: 'error' });
        }
        setLoading(false);
    }

    // Country handlers
    const openAddCountry = () => {
        setCountryForm({ name: '', code: '' });
        setEditingCountry(null);
        setCountryModalOpen(true);
    };

    const openEditCountry = (item) => {
        setCountryForm({ name: item.name, code: item.code });
        setEditingCountry(item);
        setCountryModalOpen(true);
    };

    const handleCountrySubmit = async (e) => {
        e.preventDefault();
        const data = { name: countryForm.name, code: countryForm.code.toUpperCase() };

        try {
            if (editingCountry) {
                await updateCountry(editingCountry.id, data);
                setToast({ message: 'Country updated', type: 'success' });
            } else {
                await createCountry(data);
                setToast({ message: 'Country added', type: 'success' });
            }
            setCountryModalOpen(false);
            loadData();
        } catch (err) {
            setToast({ message: 'Failed to save country', type: 'error' });
        }
    };

    // Port handlers
    const openAddPort = () => {
        setPortForm({ country_id: '', name: '', code: '', freight_per_kg: '', freight_per_cbm: '' });
        setEditingPort(null);
        setPortModalOpen(true);
    };

    const openEditPort = (item) => {
        setPortForm({
            country_id: item.country_id?.toString() || '',
            name: item.name,
            code: item.code,
            freight_per_kg: item.freight_per_kg?.toString() || '',
            freight_per_cbm: item.freight_per_cbm?.toString() || ''
        });
        setEditingPort(item);
        setPortModalOpen(true);
    };

    const handlePortSubmit = async (e) => {
        e.preventDefault();
        const data = {
            country_id: parseInt(portForm.country_id),
            name: portForm.name,
            code: portForm.code.toUpperCase(),
            freight_per_kg: parseFloat(portForm.freight_per_kg) || 0,
            freight_per_cbm: parseFloat(portForm.freight_per_cbm) || 0
        };

        try {
            if (editingPort) {
                await updateDestinationPort(editingPort.id, data);
                setToast({ message: 'Port updated', type: 'success' });
            } else {
                await createDestinationPort(data);
                setToast({ message: 'Port added', type: 'success' });
            }
            setPortModalOpen(false);
            loadData();
        } catch (err) {
            setToast({ message: 'Failed to save port', type: 'error' });
        }
    };

    const handleDelete = async () => {
        try {
            if (deletingItem.type === 'country') {
                await deleteCountry(deletingItem.id);
            } else {
                await deleteDestinationPort(deletingItem.id);
            }
            setToast({ message: 'Deleted successfully', type: 'success' });
            setConfirmOpen(false);
            setDeletingItem(null);
            loadData();
        } catch (err) {
            setToast({ message: 'Failed to delete', type: 'error' });
        }
    };

    return (
        <AdminLayout activeTab="countries">
            <div className="admin-header">
                <h1 className="admin-title">Countries & Destination Ports</h1>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
                <button
                    className={`btn ${activeTab === 'countries' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('countries')}
                >
                    Countries
                </button>
                <button
                    className={`btn ${activeTab === 'ports' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('ports')}
                >
                    Destination Ports
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <div className="spinner"></div>
                </div>
            ) : activeTab === 'countries' ? (
                <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
                        <button className="btn btn-primary" onClick={openAddCountry}>+ Add Country</button>
                    </div>

                    {countries.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🌍</div>
                            <div className="empty-state-title">No countries yet</div>
                            <button className="btn btn-primary" onClick={openAddCountry} style={{ marginTop: 'var(--space-4)' }}>
                                Add Country
                            </button>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Country Name</th>
                                    <th>Code</th>
                                    <th>Ports</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {countries.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.name}</td>
                                        <td>{item.code}</td>
                                        <td>{destPorts.filter(p => p.country_id === item.id).length}</td>
                                        <td className="actions">
                                            <button className="btn btn-secondary btn-sm" onClick={() => openEditCountry(item)}>
                                                Edit
                                            </button>
                                            <button
                                                className="btn btn-sm"
                                                style={{ background: 'var(--error)', color: 'white' }}
                                                onClick={() => { setDeletingItem({ id: item.id, type: 'country' }); setConfirmOpen(true); }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            ) : (
                <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
                        <button className="btn btn-primary" onClick={openAddPort}>+ Add Destination Port</button>
                    </div>

                    {destPorts.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">🚢</div>
                            <div className="empty-state-title">No destination ports yet</div>
                            <button className="btn btn-primary" onClick={openAddPort} style={{ marginTop: 'var(--space-4)' }}>
                                Add Port
                            </button>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Port Name</th>
                                    <th>Code</th>
                                    <th>Country</th>
                                    <th>Freight/KG</th>
                                    <th>Freight/CBM</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {destPorts.map(item => (
                                    <tr key={item.id}>
                                        <td>{item.name}</td>
                                        <td>{item.code}</td>
                                        <td>{item.countries?.name || '-'}</td>
                                        <td>{formatCurrency(item.freight_per_kg)}</td>
                                        <td>{formatCurrency(item.freight_per_cbm)}</td>
                                        <td className="actions">
                                            <button className="btn btn-secondary btn-sm" onClick={() => openEditPort(item)}>
                                                Edit
                                            </button>
                                            <button
                                                className="btn btn-sm"
                                                style={{ background: 'var(--error)', color: 'white' }}
                                                onClick={() => { setDeletingItem({ id: item.id, type: 'port' }); setConfirmOpen(true); }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </>
            )}

            {/* Country Modal */}
            <Modal isOpen={countryModalOpen} onClose={() => setCountryModalOpen(false)} title={editingCountry ? 'Edit Country' : 'Add Country'}>
                <form onSubmit={handleCountrySubmit}>
                    <div className="form-group">
                        <label className="form-label">Country Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={countryForm.name}
                            onChange={(e) => setCountryForm({ ...countryForm, name: e.target.value })}
                            placeholder="e.g., United Arab Emirates"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Country Code *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={countryForm.code}
                            onChange={(e) => setCountryForm({ ...countryForm, code: e.target.value })}
                            placeholder="e.g., AE"
                            maxLength={3}
                            required
                        />
                    </div>
                    <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 'var(--space-4)' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setCountryModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingCountry ? 'Update' : 'Add'}</button>
                    </div>
                </form>
            </Modal>

            {/* Port Modal */}
            <Modal isOpen={portModalOpen} onClose={() => setPortModalOpen(false)} title={editingPort ? 'Edit Port' : 'Add Destination Port'}>
                <form onSubmit={handlePortSubmit}>
                    <div className="form-group">
                        <label className="form-label">Country *</label>
                        <select
                            className="form-select"
                            value={portForm.country_id}
                            onChange={(e) => setPortForm({ ...portForm, country_id: e.target.value })}
                            required
                        >
                            <option value="">Select country</option>
                            {countries.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Port Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={portForm.name}
                            onChange={(e) => setPortForm({ ...portForm, name: e.target.value })}
                            placeholder="e.g., Jebel Ali Port"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Port Code *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={portForm.code}
                            onChange={(e) => setPortForm({ ...portForm, code: e.target.value })}
                            placeholder="e.g., AEJEA"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Freight Rate per KG (USD)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={portForm.freight_per_kg}
                            onChange={(e) => setPortForm({ ...portForm, freight_per_kg: e.target.value })}
                            placeholder="e.g., 0.15"
                            step="0.01"
                            min="0"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Freight Rate per CBM (USD)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={portForm.freight_per_cbm}
                            onChange={(e) => setPortForm({ ...portForm, freight_per_cbm: e.target.value })}
                            placeholder="e.g., 50"
                            step="0.01"
                            min="0"
                        />
                    </div>
                    <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 'var(--space-4)' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setPortModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingPort ? 'Update' : 'Add'}</button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Delete Item"
                message="Are you sure you want to delete this item?"
            />

            {toast && (
                <div className="toast-container">
                    <Toast {...toast} onClose={() => setToast(null)} />
                </div>
            )}
        </AdminLayout>
    );
}
