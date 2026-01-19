import { useState, useEffect } from 'react';
import { AdminLayout, Modal, ConfirmDialog, Toast } from './index';
import { getPorts, createPort, updatePort, deletePort } from '@/lib/db';
import { formatCurrency } from '@/lib/calculator';

export default function PortsPage() {
    const [ports, setPorts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [toast, setToast] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        handling_charges: '',
        documentation_charges: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const data = await getPorts();
            setPorts(data || []);
        } catch (err) {
            console.error('Error loading ports:', err);
            setToast({ message: 'Failed to load ports', type: 'error' });
        }
        setLoading(false);
    }

    const resetForm = () => {
        setFormData({
            name: '',
            code: '',
            handling_charges: '',
            documentation_charges: ''
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
            code: item.code,
            handling_charges: item.handling_charges?.toString() || '',
            documentation_charges: item.documentation_charges?.toString() || ''
        });
        setEditingItem(item);
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = {
            name: formData.name,
            code: formData.code.toUpperCase(),
            handling_charges: parseFloat(formData.handling_charges) || 0,
            documentation_charges: parseFloat(formData.documentation_charges) || 0
        };

        try {
            if (editingItem) {
                await updatePort(editingItem.id, data);
                setToast({ message: 'Port updated successfully', type: 'success' });
            } else {
                await createPort(data);
                setToast({ message: 'Port added successfully', type: 'success' });
            }
            setModalOpen(false);
            loadData();
        } catch (err) {
            console.error('Error saving port:', err);
            setToast({ message: 'Failed to save port', type: 'error' });
        }
    };

    const handleDelete = async () => {
        try {
            await deletePort(deletingId);
            setToast({ message: 'Port deleted successfully', type: 'success' });
            setConfirmOpen(false);
            setDeletingId(null);
            loadData();
        } catch (err) {
            console.error('Error deleting port:', err);
            setToast({ message: 'Failed to delete port', type: 'error' });
        }
    };

    return (
        <AdminLayout activeTab="ports">
            <div className="admin-header">
                <h1 className="admin-title">Indian Ports</h1>
                <button className="btn btn-primary" onClick={openAddModal}>
                    + Add Port
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <div className="spinner"></div>
                </div>
            ) : ports.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">⚓</div>
                    <div className="empty-state-title">No ports yet</div>
                    <div className="empty-state-text">Add Indian ports for exports</div>
                    <button className="btn btn-primary" onClick={openAddModal} style={{ marginTop: 'var(--space-4)' }}>
                        Add Port
                    </button>
                </div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Port Name</th>
                            <th>Code</th>
                            <th>Handling Charges (USD)</th>
                            <th>Documentation (USD)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ports.map(item => (
                            <tr key={item.id}>
                                <td>{item.name}</td>
                                <td>{item.code}</td>
                                <td>{formatCurrency(item.handling_charges)}</td>
                                <td>{formatCurrency(item.documentation_charges)}</td>
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
                title={editingItem ? 'Edit Port' : 'Add Port'}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Port Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Jawaharlal Nehru Port"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Port Code *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            placeholder="e.g., INNSA"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Handling Charges (USD) *</label>
                        <input
                            type="number"
                            className="form-input"
                            value={formData.handling_charges}
                            onChange={(e) => setFormData({ ...formData, handling_charges: e.target.value })}
                            placeholder="e.g., 150"
                            step="0.01"
                            min="0"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Documentation Charges (USD) *</label>
                        <input
                            type="number"
                            className="form-input"
                            value={formData.documentation_charges}
                            onChange={(e) => setFormData({ ...formData, documentation_charges: e.target.value })}
                            placeholder="e.g., 50"
                            step="0.01"
                            min="0"
                            required
                        />
                    </div>

                    <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 'var(--space-4)' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {editingItem ? 'Update' : 'Add'} Port
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Delete Port"
                message="Are you sure you want to delete this port?"
            />

            {toast && (
                <div className="toast-container">
                    <Toast {...toast} onClose={() => setToast(null)} />
                </div>
            )}
        </AdminLayout>
    );
}
