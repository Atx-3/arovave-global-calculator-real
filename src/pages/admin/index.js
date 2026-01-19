import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Admin Layout Component
export function AdminLayout({ children, activeTab }) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if admin is logged in
        const adminSession = sessionStorage.getItem('adminSession');
        if (adminSession) {
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('adminSession');
        router.push('/admin');
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh'
            }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
    }

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊', href: '/admin' },
        { id: 'products', label: 'Products', icon: '📦', href: '/admin/products' },
        { id: 'locations', label: 'Factory Locations', icon: '🏭', href: '/admin/locations' },
        { id: 'ports', label: 'Indian Ports', icon: '⚓', href: '/admin/ports' },
        { id: 'countries', label: 'Countries & Ports', icon: '🌍', href: '/admin/countries' },
        { id: 'certifications', label: 'Certifications', icon: '📜', href: '/admin/certifications' },
        { id: 'settings', label: 'Settings', icon: '⚙️', href: '/admin/settings' },
    ];

    return (
        <>
            <Head>
                <title>Admin Panel | Arovave Global</title>
            </Head>
            <div className="admin-layout">
                <aside className="admin-sidebar">
                    <div className="logo">
                        <div className="logo-icon">AG</div>
                        <div>
                            <div className="logo-text">AROVAVE</div>
                            <div className="logo-tagline">Admin Panel</div>
                        </div>
                    </div>

                    <nav className="admin-nav">
                        {navItems.map(item => (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    <div style={{ marginTop: 'auto', paddingTop: 'var(--space-6)' }}>
                        <Link href="/" className="admin-nav-item">
                            <span>🔙</span>
                            <span>Back to Calculator</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="admin-nav-item"
                            style={{
                                width: '100%',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                textAlign: 'left'
                            }}
                        >
                            <span>🚪</span>
                            <span>Logout</span>
                        </button>
                    </div>
                </aside>

                <main className="admin-content">
                    {children}
                </main>
            </div>
        </>
    );
}

// Login Page Component
function LoginPage({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simple authentication (in production, use proper auth!)
        if (username === 'admin' && password === 'admin123') {
            sessionStorage.setItem('adminSession', JSON.stringify({ username, timestamp: Date.now() }));
            onLogin();
        } else {
            setError('Invalid credentials');
        }
        setLoading(false);
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 'var(--space-4)'
        }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                    <div className="logo-icon" style={{
                        margin: '0 auto var(--space-4)',
                        width: '64px',
                        height: '64px',
                        fontSize: 'var(--text-2xl)'
                    }}>AG</div>
                    <h2>Admin Login</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                        Arovave Global Export Calculator
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'var(--error-light)',
                        color: 'var(--error)',
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-4)',
                        fontSize: 'var(--text-sm)'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input
                            type="text"
                            className="form-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%' }}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p style={{
                    marginTop: 'var(--space-4)',
                    textAlign: 'center',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-muted)'
                }}>
                    Default: admin / admin123
                </p>
            </div>
        </div>
    );
}

// Modal Component
export function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
}

// Confirm Dialog
export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-body">
                    <p style={{ marginBottom: 'var(--space-6)' }}>{message}</p>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button
                            className="btn"
                            onClick={onConfirm}
                            style={{ background: 'var(--error)', color: 'white' }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Toast Notification
export function Toast({ message, type = 'success', onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast ${type}`}>
            {message}
        </div>
    );
}

export default function AdminDashboard() {
    return (
        <AdminLayout activeTab="dashboard">
            <div className="admin-header">
                <h1 className="admin-title">Dashboard</h1>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 'var(--space-6)'
            }}>
                <DashboardCard
                    title="Products"
                    value="Manage"
                    icon="📦"
                    href="/admin/products"
                    description="Add, edit, and manage export products"
                />
                <DashboardCard
                    title="Factory Locations"
                    value="Manage"
                    icon="🏭"
                    href="/admin/locations"
                    description="Configure manufacturing locations"
                />
                <DashboardCard
                    title="Indian Ports"
                    value="Manage"
                    icon="⚓"
                    href="/admin/ports"
                    description="Set port handling & documentation charges"
                />
                <DashboardCard
                    title="Countries & Ports"
                    value="Manage"
                    icon="🌍"
                    href="/admin/countries"
                    description="Manage destination countries and ports"
                />
                <DashboardCard
                    title="Certifications"
                    value="Manage"
                    icon="📜"
                    href="/admin/certifications"
                    description="Configure certification costs"
                />
                <DashboardCard
                    title="Settings"
                    value="Configure"
                    icon="⚙️"
                    href="/admin/settings"
                    description="Insurance rates, API keys, and more"
                />
            </div>

            <div className="card" style={{ marginTop: 'var(--space-8)' }}>
                <h3 style={{ marginBottom: 'var(--space-4)' }}>Quick Start Guide</h3>
                <ol style={{ paddingLeft: 'var(--space-6)', color: 'var(--text-secondary)' }}>
                    <li style={{ marginBottom: 'var(--space-3)' }}>
                        <strong>Add Products</strong> - Start by adding your export products with HSN codes and base prices
                    </li>
                    <li style={{ marginBottom: 'var(--space-3)' }}>
                        <strong>Configure Locations</strong> - Add your factory locations with transport costs
                    </li>
                    <li style={{ marginBottom: 'var(--space-3)' }}>
                        <strong>Set up Indian Ports</strong> - Add ports with handling and documentation charges
                    </li>
                    <li style={{ marginBottom: 'var(--space-3)' }}>
                        <strong>Add Destination Countries</strong> - Configure countries and their destination ports with freight rates
                    </li>
                    <li style={{ marginBottom: 'var(--space-3)' }}>
                        <strong>Configure Certifications</strong> - Add optional certifications with their costs
                    </li>
                    <li>
                        <strong>Update Settings</strong> - Set insurance percentages and other global settings
                    </li>
                </ol>
            </div>
        </AdminLayout>
    );
}

function DashboardCard({ title, value, icon, href, description }) {
    return (
        <Link href={href} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ height: '100%', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                    <div style={{
                        fontSize: 'var(--text-3xl)',
                        background: 'var(--bg-glass)',
                        padding: 'var(--space-3)',
                        borderRadius: 'var(--radius-lg)'
                    }}>
                        {icon}
                    </div>
                    <div>
                        <h3 style={{
                            fontSize: 'var(--text-lg)',
                            marginBottom: 'var(--space-2)',
                            color: 'var(--text-primary)'
                        }}>
                            {title}
                        </h3>
                        <p style={{
                            fontSize: 'var(--text-sm)',
                            color: 'var(--text-secondary)',
                            margin: 0
                        }}>
                            {description}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    );
}
