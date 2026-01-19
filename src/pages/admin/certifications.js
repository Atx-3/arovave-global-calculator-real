import { useState, useEffect } from 'react';
import { AdminLayout, Modal, ConfirmDialog, Toast } from './index';
import { getCertifications, createCertification, updateCertification, deleteCertification } from '@/lib/db';
import { formatCurrency } from '@/lib/calculator';

export default function CertificationsPage() {
    const [certifications, setCertifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [toast, setToast] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        cost_flat: '',
        cost_percentage: '',
        is_mandatory: false
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const data = await getCertifications();
            setCertifications(data || []);
        } catch (err) {
            console.error('Error loading certifications:', err);
            setToast({ message: 'Failed to load certifications', type: 'error' });
        }
        setLoading(false);
    }

    const resetForm = () => {
        setFormData({ name: '', cost_flat: '', cost_percentage: '', is_mandatory: false });
        setEditingItem(null);
    };

    const openAddModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (item) => {
        setFormData({
            name: item.name,
            cost_flat: item.cost_flat?.toString() || '',
            cost_percentage: item.cost_percentage?.toString() || '',
            is_mandatory: item.is_mandatory
        });
        setEditingItem(item);
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = {
            name: formData.name,
            cost_flat: parseFloat(formData.cost_flat) || 0,
            cost_percentage: parseFloat(formData.cost_percentage) || 0,
            is_mandatory: formData.is_mandatory
        };

        try {
            if (editingItem) {
                await updateCertification(editingItem.id, data);
                setToast({ message: 'Certification updated', type: 'success' });
            } else {
                await createCertification(data);
                setToast({ message: 'Certification added', type: 'success' });
            }
            setModalOpen(false);
            loadData();
        } catch (err) {
            setToast({ message: 'Failed to save certification', type: 'error' });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteCertification(deletingId);
            setToast({ message: 'Certification deleted', type: 'success' });
            setConfirmOpen(false);
            setDeletingId(null);
            loadData();
        } catch (err) {
            setToast({ message: 'Failed to delete', type: 'error' });
        }
    };

    return (
        <AdminLayout activeTab="certifications">
            <div className="admin-header">
                <h1 className="admin-title">Certifications</h1>
                <button className="btn btn-primary" onClick={openAddModal}>
                    + Add Certification
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <div className="spinner"></div>
                </div>
            ) : certifications.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📜</div>
                    <div className="empty-state-title">No certifications yet</div>
                    <div className="empty-state-text">Add export certifications like FSSAI, APEDA, etc.</div>
                    <button className="btn btn-primary" onClick={openAddModal} style={{ marginTop: 'var(--space-4)' }}>
                        Add Certification
                    </button>
                </div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Certification Name</th>
                            <th>Flat Cost (USD)</th>
                            <th>Percentage Cost</th>
                            <th>Type</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {certifications.map(item => (
                            <tr key={item.id}>
                                <td>{item.name}</td>
                                <td>{item.cost_flat ? formatCurrency(item.cost_flat) : '-'}</td>
                                <td>{item.cost_percentage ? `${item.cost_percentage}%` : '-'}</td>
                                <td>
                                    <span className={`badge ${item.is_mandatory ? 'badge-warning' : 'badge-info'}`}>
                                        {item.is_mandatory ? 'Mandatory' : 'Optional'}
                                    </span>
                                </td>
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
                title={editingItem ? 'Edit Certification' : 'Add Certification'}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Certification Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., FSSAI, APEDA, Phytosanitary"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Flat Cost (USD)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={formData.cost_flat}
                            onChange={(e) => setFormData({ ...formData, cost_flat: e.target.value })}
                            placeholder="e.g., 100"
                            step="0.01"
                            min="0"
                        />
                        <small style={{ color: 'var(--text-muted)' }}>Fixed cost per certification</small>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Percentage Cost (%)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={formData.cost_percentage}
                            onChange={(e) => setFormData({ ...formData, cost_percentage: e.target.value })}
                            placeholder="e.g., 0.5"
                            step="0.01"
                            min="0"
                            max="100"
                        />
                        <small style={{ color: 'var(--text-muted)' }}>Percentage of EX-Factory price (overrides flat cost if set)</small>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-item" style={{ width: 'fit-content' }}>
                            <input
                                type="checkbox"
                                checked={formData.is_mandatory}
                                onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.checked })}
                            />
                            <span>Mandatory Certification</span>
                        </label>
                        <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 'var(--space-2)' }}>
                            Mandatory certifications are always included in calculations
                        </small>
                    </div>

                    <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 'var(--space-4)' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {editingItem ? 'Update' : 'Add'} Certification
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Delete Certification"
                message="Are you sure you want to delete this certification?"
            />

            {toast && (
                <div className="toast-container">
                    <Toast {...toast} onClose={() => setToast(null)} />
                </div>
            )}
        </AdminLayout>
    );
}
