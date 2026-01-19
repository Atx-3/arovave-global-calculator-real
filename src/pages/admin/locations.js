import { useState, useEffect } from 'react';
import { AdminLayout, Modal, ConfirmDialog, Toast } from './index';
import { getLocations, createLocation, updateLocation, deleteLocation } from '@/lib/db';
import { formatCurrency } from '@/lib/calculator';

export default function LocationsPage() {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [toast, setToast] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        transport_rate_per_km: '',
        fixed_transport_cost: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const data = await getLocations();
            setLocations(data || []);
        } catch (err) {
            console.error('Error loading locations:', err);
            setToast({ message: 'Failed to load locations', type: 'error' });
        }
        setLoading(false);
    }

    const resetForm = () => {
        setFormData({
            name: '',
            transport_rate_per_km: '',
            fixed_transport_cost: ''
        });
        setEditingItem(null);
    };

    const openAddModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (item) => {
        setFormData({
            name: item.name,
            transport_rate_per_km: item.transport_rate_per_km?.toString() || '',
            fixed_transport_cost: item.fixed_transport_cost?.toString() || ''
        });
        setEditingItem(item);
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = {
            name: formData.name,
            transport_rate_per_km: parseFloat(formData.transport_rate_per_km) || 0,
            fixed_transport_cost: parseFloat(formData.fixed_transport_cost) || 0
        };

        try {
            if (editingItem) {
                await updateLocation(editingItem.id, data);
                setToast({ message: 'Location updated successfully', type: 'success' });
            } else {
                await createLocation(data);
                setToast({ message: 'Location added successfully', type: 'success' });
            }
            setModalOpen(false);
            loadData();
        } catch (err) {
            console.error('Error saving location:', err);
            setToast({ message: 'Failed to save location', type: 'error' });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteLocation(deletingId);
            setToast({ message: 'Location deleted successfully', type: 'success' });
            setConfirmOpen(false);
            setDeletingId(null);
            loadData();
        } catch (err) {
            console.error('Error deleting location:', err);
            setToast({ message: 'Failed to delete location', type: 'error' });
        }
    };

    return (
        <AdminLayout activeTab="locations">
            <div className="admin-header">
                <h1 className="admin-title">Factory Locations</h1>
                <button className="btn btn-primary" onClick={openAddModal}>
                    + Add Location
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <div className="spinner"></div>
                </div>
            ) : locations.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🏭</div>
                    <div className="empty-state-title">No locations yet</div>
                    <div className="empty-state-text">Add your manufacturing locations</div>
                    <button className="btn btn-primary" onClick={openAddModal} style={{ marginTop: 'var(--space-4)' }}>
                        Add Location
                    </button>
                </div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Location Name</th>
                            <th>Rate per KM (USD)</th>
                            <th>Fixed Transport Cost (USD)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {locations.map(item => (
                            <tr key={item.id}>
                                <td>{item.name}</td>
                                <td>{item.transport_rate_per_km ? formatCurrency(item.transport_rate_per_km) : '-'}</td>
                                <td>{item.fixed_transport_cost ? formatCurrency(item.fixed_transport_cost) : '-'}</td>
                                <td className="actions">
                                    <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(item)}>
                                        Edit
                                    </button>
                                    <button
                                        className="btn btn-sm"
                                        style={{ background: 'var(--error)', color: 'white' }}
                                        onClick={() => { setDeletingId(item.id); setConfirmOpen(true); }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingItem ? 'Edit Location' : 'Add Location'}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Location Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Delhi NCR, Mumbai, Chennai"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Transport Rate per KM (USD)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={formData.transport_rate_per_km}
                            onChange={(e) => setFormData({ ...formData, transport_rate_per_km: e.target.value })}
                            placeholder="e.g., 0.50"
                            step="0.01"
                            min="0"
                        />
                        <small style={{ color: 'var(--text-muted)' }}>Leave empty if using fixed cost</small>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Fixed Transport Cost (USD)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={formData.fixed_transport_cost}
                            onChange={(e) => setFormData({ ...formData, fixed_transport_cost: e.target.value })}
                            placeholder="e.g., 500"
                            step="0.01"
                            min="0"
                        />
                        <small style={{ color: 'var(--text-muted)' }}>Fixed cost to nearest port (overrides per-km rate)</small>
                    </div>

                    <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 'var(--space-4)' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {editingItem ? 'Update' : 'Add'} Location
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Delete Location"
                message="Are you sure you want to delete this location?"
            />

            {toast && (
                <div className="toast-container">
                    <Toast {...toast} onClose={() => setToast(null)} />
                </div>
            )}
        </AdminLayout>
    );
}
