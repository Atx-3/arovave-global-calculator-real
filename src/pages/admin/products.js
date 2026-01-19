import { useState, useEffect } from 'react';
import { AdminLayout, Modal, ConfirmDialog, Toast } from './index';
import { getAllProducts, createProduct, updateProduct, deleteProduct } from '@/lib/db';
import { formatCurrency } from '@/lib/calculator';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [toast, setToast] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        hsn_code: '',
        unit: 'KG',
        base_price: '',
        active: true
    });

    useEffect(() => {
        loadProducts();
    }, []);

    async function loadProducts() {
        try {
            const data = await getAllProducts();
            setProducts(data || []);
        } catch (err) {
            console.error('Error loading products:', err);
            setToast({ message: 'Failed to load products', type: 'error' });
        }
        setLoading(false);
    }

    const resetForm = () => {
        setFormData({
            name: '',
            hsn_code: '',
            unit: 'KG',
            base_price: '',
            active: true
        });
        setEditingProduct(null);
    };

    const openAddModal = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEditModal = (product) => {
        setFormData({
            name: product.name,
            hsn_code: product.hsn_code,
            unit: product.unit,
            base_price: product.base_price.toString(),
            active: product.active
        });
        setEditingProduct(product);
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const productData = {
            name: formData.name,
            hsn_code: formData.hsn_code,
            unit: formData.unit,
            base_price: parseFloat(formData.base_price),
            active: formData.active
        };

        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, productData);
                setToast({ message: 'Product updated successfully', type: 'success' });
            } else {
                await createProduct(productData);
                setToast({ message: 'Product added successfully', type: 'success' });
            }
            setModalOpen(false);
            loadProducts();
        } catch (err) {
            console.error('Error saving product:', err);
            setToast({ message: 'Failed to save product', type: 'error' });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteProduct(deletingId);
            setToast({ message: 'Product deleted successfully', type: 'success' });
            setConfirmOpen(false);
            setDeletingId(null);
            loadProducts();
        } catch (err) {
            console.error('Error deleting product:', err);
            setToast({ message: 'Failed to delete product', type: 'error' });
        }
    };

    const openDeleteConfirm = (id) => {
        setDeletingId(id);
        setConfirmOpen(true);
    };

    return (
        <AdminLayout activeTab="products">
            <div className="admin-header">
                <h1 className="admin-title">Products</h1>
                <button className="btn btn-primary" onClick={openAddModal}>
                    + Add Product
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <div className="spinner"></div>
                </div>
            ) : products.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📦</div>
                    <div className="empty-state-title">No products yet</div>
                    <div className="empty-state-text">Add your first product to get started</div>
                    <button className="btn btn-primary" onClick={openAddModal} style={{ marginTop: 'var(--space-4)' }}>
                        Add Product
                    </button>
                </div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>HSN Code</th>
                            <th>Unit</th>
                            <th>Base Price (USD)</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id}>
                                <td>{product.name}</td>
                                <td>{product.hsn_code}</td>
                                <td>{product.unit}</td>
                                <td>{formatCurrency(product.base_price)}</td>
                                <td>
                                    <span className={`badge ${product.active ? 'badge-success' : 'badge-warning'}`}>
                                        {product.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="actions">
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => openEditModal(product)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="btn btn-sm"
                                        style={{ background: 'var(--error)', color: 'white' }}
                                        onClick={() => openDeleteConfirm(product.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingProduct ? 'Edit Product' : 'Add Product'}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Product Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Premium Basmati Rice"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">HSN Code *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.hsn_code}
                            onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                            placeholder="e.g., 10063020"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Unit *</label>
                        <select
                            className="form-select"
                            value={formData.unit}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        >
                            <option value="KG">KG (Kilogram)</option>
                            <option value="MT">MT (Metric Ton)</option>
                            <option value="LTR">LTR (Liter)</option>
                            <option value="PCS">PCS (Pieces)</option>
                            <option value="CTN">CTN (Carton)</option>
                            <option value="BAG">BAG</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Base EX-Factory Price (USD) *</label>
                        <input
                            type="number"
                            className="form-input"
                            value={formData.base_price}
                            onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                            placeholder="e.g., 1.50"
                            step="0.01"
                            min="0"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="checkbox-item" style={{ width: 'fit-content' }}>
                            <input
                                type="checkbox"
                                checked={formData.active}
                                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                            />
                            <span>Active (visible in calculator)</span>
                        </label>
                    </div>

                    <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 'var(--space-4)' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {editingProduct ? 'Update' : 'Add'} Product
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Delete Product"
                message="Are you sure you want to delete this product? This action cannot be undone."
            />

            {/* Toast Notification */}
            {toast && (
                <div className="toast-container">
                    <Toast {...toast} onClose={() => setToast(null)} />
                </div>
            )}
        </AdminLayout>
    );
}
