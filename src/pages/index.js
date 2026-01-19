import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
    getProducts,
    getContainerTypes,
    getLocations,
    getPorts,
    getCountries,
    getDestinationPorts,
    getCertifications,
    getCostHeads,
    getLocalFreightRate,
    getFreightRate,
    getCurrencySettings,
    getSettings,
    isDemoMode
} from '@/lib/db';
import {
    calculateExportPricing,
    calculateContainers,
    formatINR,
    formatUSD,
    formatNumber
} from '@/lib/calculator';
import { downloadQuotationPDF } from '@/lib/pdf';

export default function Home() {
    // Master Data
    const [products, setProducts] = useState([]);
    const [containerTypes, setContainerTypes] = useState([]);
    const [locations, setLocations] = useState([]);
    const [ports, setPorts] = useState([]);
    const [countries, setCountries] = useState([]);
    const [destinationPorts, setDestinationPorts] = useState([]);
    const [certifications, setCertifications] = useState([]);
    const [costHeads, setCostHeads] = useState([]);
    const [settings, setSettings] = useState({});

    // Form State
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedContainerType, setSelectedContainerType] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [qtyPerContainer, setQtyPerContainer] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedPort, setSelectedPort] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedDestPort, setSelectedDestPort] = useState('');
    const [selectedCerts, setSelectedCerts] = useState([]);

    // Calculated
    const [containerCount, setContainerCount] = useState(0);

    // UI State
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [showCurrency, setShowCurrency] = useState('INR');

    // Load initial data
    useEffect(() => {
        async function loadData() {
            try {
                const [
                    productsData,
                    containerTypesData,
                    locationsData,
                    portsData,
                    countriesData,
                    certsData,
                    costHeadsData,
                    settingsData
                ] = await Promise.all([
                    getProducts(),
                    getContainerTypes(),
                    getLocations(),
                    getPorts(),
                    getCountries(),
                    getCertifications(),
                    getCostHeads(),
                    getSettings()
                ]);

                setProducts(productsData || []);
                setContainerTypes(containerTypesData || []);
                setLocations(locationsData || []);
                setPorts(portsData || []);
                setCountries(countriesData || []);
                setCertifications(certsData || []);
                setCostHeads(costHeadsData || []);
                setSettings(settingsData || {});

                // Set default container type
                if (containerTypesData?.length > 0) {
                    setSelectedContainerType(containerTypesData[0]);
                }

                setLoading(false);
            } catch (err) {
                console.error('Error loading data:', err);
                setError('Failed to load data. Please refresh.');
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // Load destination ports when country changes
    useEffect(() => {
        async function loadDestPorts() {
            if (selectedCountry) {
                const ports = await getDestinationPorts(selectedCountry);
                setDestinationPorts(ports || []);
                setSelectedDestPort('');
            } else {
                setDestinationPorts([]);
            }
        }
        loadDestPorts();
    }, [selectedCountry]);

    // Auto-fill qty per container when product + container type changes
    useEffect(() => {
        if (selectedProduct && selectedContainerType) {
            const defaultQty = selectedContainerType.code === '20FT'
                ? selectedProduct.qty_per_20ft
                : selectedProduct.qty_per_40ft;

            if (defaultQty) {
                setQtyPerContainer(defaultQty.toString());
            }
        }
    }, [selectedProduct, selectedContainerType]);

    // Calculate container count when quantity or qty per container changes
    useEffect(() => {
        if (quantity && qtyPerContainer) {
            const count = calculateContainers(parseFloat(quantity), parseFloat(qtyPerContainer));
            setContainerCount(count);
        } else {
            setContainerCount(0);
        }
        setResult(null);
    }, [quantity, qtyPerContainer]);

    // Handle product selection
    const handleProductChange = (e) => {
        const productId = e.target.value;
        const product = products.find(p => p.id.toString() === productId);
        setSelectedProduct(product || null);
        setResult(null);
    };

    // Handle container type selection
    const handleContainerTypeChange = (e) => {
        const typeId = e.target.value;
        const containerType = containerTypes.find(c => c.id.toString() === typeId);
        setSelectedContainerType(containerType || null);
        setResult(null);
    };

    // Handle certification toggle
    const toggleCertification = (certId) => {
        setSelectedCerts(prev => {
            if (prev.includes(certId)) {
                return prev.filter(id => id !== certId);
            }
            return [...prev, certId];
        });
        setResult(null);
    };

    // Calculate rates
    const handleCalculate = async () => {
        // Validation
        if (!selectedProduct) return setError('Please select a product');
        if (!quantity || parseFloat(quantity) <= 0) return setError('Please enter a valid quantity');
        if (!qtyPerContainer || parseFloat(qtyPerContainer) <= 0) return setError('Please enter quantity per container');
        if (!selectedContainerType) return setError('Please select a container type');
        if (!selectedLocation) return setError('Please select manufacturing location');
        if (!selectedPort) return setError('Please select port of loading');
        if (!selectedCountry) return setError('Please select destination country');
        if (!selectedDestPort) return setError('Please select destination port');

        setError('');
        setCalculating(true);

        try {
            // Get related data
            const location = locations.find(l => l.id.toString() === selectedLocation);
            const port = ports.find(p => p.id.toString() === selectedPort);
            const country = countries.find(c => c.id.toString() === selectedCountry);
            const destPort = destinationPorts.find(p => p.id.toString() === selectedDestPort);
            const selectedCertifications = certifications.filter(c => selectedCerts.includes(c.id));

            // Get freight and local freight rates
            const localFreightRate = await getLocalFreightRate(
                selectedLocation,
                selectedPort,
                selectedContainerType.id
            );

            const freightData = await getFreightRate(
                selectedPort,
                selectedDestPort,
                selectedContainerType.id
            );

            const currencyData = await getCurrencySettings('USD');

            // Calculate
            const pricing = calculateExportPricing({
                product: selectedProduct,
                quantity: parseFloat(quantity),
                containerType: selectedContainerType,
                qtyPerContainer: parseFloat(qtyPerContainer),
                localFreightRate,
                portHandlingPerContainer: port?.handling_per_container || 0,
                chaCharges: port?.cha_charges || 0,
                customsClearance: port?.customs_per_shipment || 0,
                costHeads,
                certifications: selectedCertifications,
                freightRate: freightData?.rate_amount || 0,
                freightCurrency: freightData?.currency || 'USD',
                freightConversionRate: freightData?.freight_conversion_rate || 1.0,
                freightGST: freightData?.gst_percent || 5,
                exchangeRate: currencyData?.exchange_rate_to_inr || 83.50,
                bankMargin: currencyData?.bank_margin || 0.50,
                ecgcRate: country?.ecgc_rate_percent || 0.50,
                insuranceRate: parseFloat(settings.insurance_rate) || 0.50,
                minInsurance: parseFloat(settings.min_insurance) || 5000,
                bankChargeRate: parseFloat(settings.bank_charge_rate) || 0.25,
                profitRate: parseFloat(settings.profit_rate) || 5.0,
                profitType: settings.profit_type || 'percentage'
            });

            setResult({
                pricing,
                productName: selectedProduct.name,
                hsnCode: selectedProduct.hsn_code,
                unit: selectedProduct.unit,
                quantity: parseFloat(quantity),
                containerType: selectedContainerType.name,
                containerCode: selectedContainerType.code,
                containerCount: pricing.containerCount,
                factoryLocation: location?.name,
                loadingPort: port?.name,
                country: country?.name,
                destinationPort: destPort?.name,
                certifications: selectedCertifications.map(c => c.name)
            });
        } catch (err) {
            console.error('Calculation error:', err);
            setError('Error calculating prices. Please try again.');
        }

        setCalculating(false);
    };

    // Download PDF
    const handleDownloadPDF = () => {
        if (result) {
            downloadQuotationPDF(result);
        }
    };

    // Share via WhatsApp
    const handleWhatsAppShare = () => {
        if (result) {
            const text = `*AROVAVE GLOBAL - Export Quotation*%0A%0A` +
                `Product: ${result.productName}%0A` +
                `Quantity: ${formatNumber(result.quantity)} ${result.unit}%0A` +
                `Containers: ${result.containerCount} × ${result.containerCode}%0A` +
                `Destination: ${result.destinationPort}, ${result.country}%0A%0A` +
                `*Prices:*%0A` +
                `EX-FACTORY: ${formatUSD(result.pricing.exFactory.usd)}%0A` +
                `FOB: ${formatUSD(result.pricing.fob.usd)}%0A` +
                `CIF: ${formatUSD(result.pricing.cif.usd)}%0A%0A` +
                `Contact us for more details!`;

            window.open(`https://wa.me/?text=${text}`, '_blank');
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading calculator...</p>
                <style jsx>{`
          .loading-screen {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            gap: 1rem;
          }
        `}</style>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Export Rate Calculator | Arovave Global</title>
            </Head>

            <div className="container">
                {/* Header */}
                <header className="header">
                    <div className="header-content">
                        <div className="logo">
                            <div className="logo-icon">AG</div>
                            <div>
                                <div className="logo-text">AROVAVE GLOBAL</div>
                                <div className="logo-tagline">FCL Export Rate Calculator</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            {isDemoMode && (
                                <span className="badge badge-warning">Demo Mode</span>
                            )}
                            <a href="/admin" className="btn btn-secondary btn-sm">Admin</a>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main>
                    <div className="card">
                        <h2 style={{ marginBottom: 'var(--space-6)' }}>Calculate Export Rates</h2>

                        {error && (
                            <div style={{
                                background: 'var(--error-light)',
                                color: 'var(--error)',
                                padding: 'var(--space-4)',
                                borderRadius: 'var(--radius-lg)',
                                marginBottom: 'var(--space-4)'
                            }}>
                                {error}
                            </div>
                        )}

                        {/* Product Selection */}
                        <div className="form-group">
                            <label className="form-label">Product *</label>
                            <select
                                className="form-select"
                                value={selectedProduct?.id || ''}
                                onChange={handleProductChange}
                            >
                                <option value="">Select a product</option>
                                {products.map(product => (
                                    <option key={product.id} value={product.id}>
                                        {product.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Product Info */}
                        {selectedProduct && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                                gap: 'var(--space-3)',
                                padding: 'var(--space-4)',
                                background: 'var(--bg-glass)',
                                borderRadius: 'var(--radius-lg)',
                                marginBottom: 'var(--space-5)'
                            }}>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>HSN Code</span>
                                    <div style={{ fontWeight: 'var(--font-semibold)' }}>{selectedProduct.hsn_code}</div>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Unit</span>
                                    <div style={{ fontWeight: 'var(--font-semibold)' }}>{selectedProduct.unit}</div>
                                </div>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Base Price</span>
                                    <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--primary-400)' }}>
                                        {formatUSD(selectedProduct.base_price_usd)}/{selectedProduct.unit}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Container Type Selection */}
                        <div className="form-group">
                            <label className="form-label">Container Type *</label>
                            <select
                                className="form-select"
                                value={selectedContainerType?.id || ''}
                                onChange={handleContainerTypeChange}
                            >
                                {containerTypes.map(ct => (
                                    <option key={ct.id} value={ct.id}>
                                        {ct.name} ({ct.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Quantity and Qty per Container - Side by Side */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                            <div className="form-group">
                                <label className="form-label">
                                    Total Quantity ({selectedProduct?.unit || 'Units'}) *
                                </label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="e.g., 50000"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    min="1"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    Qty per Container ({selectedProduct?.unit || 'Units'}) *
                                </label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="How much fits in 1 container"
                                    value={qtyPerContainer}
                                    onChange={(e) => setQtyPerContainer(e.target.value)}
                                    min="1"
                                />
                                <small style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                                    How much of this product fits in one {selectedContainerType?.code || 'container'}?
                                </small>
                            </div>
                        </div>

                        {/* Container Count Display */}
                        {containerCount > 0 && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 'var(--space-4)',
                                padding: 'var(--space-4)',
                                background: 'linear-gradient(135deg, rgba(0, 168, 168, 0.2), rgba(0, 168, 168, 0.1))',
                                border: '2px solid var(--primary-500)',
                                borderRadius: 'var(--radius-lg)',
                                marginBottom: 'var(--space-5)'
                            }}>
                                <span style={{ fontSize: 'var(--text-3xl)' }}>📦</span>
                                <div>
                                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--primary-400)' }}>
                                        {containerCount} Container{containerCount > 1 ? 's' : ''} Required
                                    </div>
                                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                        {containerCount} × {selectedContainerType?.code} ({formatNumber(quantity)} {selectedProduct?.unit || 'units'} total)
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Manufacturing Location */}
                        <div className="form-group">
                            <label className="form-label">Manufacturing Location *</label>
                            <select
                                className="form-select"
                                value={selectedLocation}
                                onChange={(e) => { setSelectedLocation(e.target.value); setResult(null); }}
                            >
                                <option value="">Select location</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Port of Loading */}
                        <div className="form-group">
                            <label className="form-label">Port of Loading (India) *</label>
                            <select
                                className="form-select"
                                value={selectedPort}
                                onChange={(e) => { setSelectedPort(e.target.value); setResult(null); }}
                            >
                                <option value="">Select port</option>
                                {ports.map(port => (
                                    <option key={port.id} value={port.id}>{port.name} ({port.code})</option>
                                ))}
                            </select>
                        </div>

                        {/* Destination Country */}
                        <div className="form-group">
                            <label className="form-label">Destination Country *</label>
                            <select
                                className="form-select"
                                value={selectedCountry}
                                onChange={(e) => { setSelectedCountry(e.target.value); setResult(null); }}
                            >
                                <option value="">Select country</option>
                                {countries.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Destination Port */}
                        <div className="form-group">
                            <label className="form-label">Destination Port *</label>
                            <select
                                className="form-select"
                                value={selectedDestPort}
                                onChange={(e) => { setSelectedDestPort(e.target.value); setResult(null); }}
                                disabled={!selectedCountry}
                            >
                                <option value="">{!selectedCountry ? 'Select country first' : 'Select port'}</option>
                                {destinationPorts.map(port => (
                                    <option key={port.id} value={port.id}>{port.name} ({port.code})</option>
                                ))}
                            </select>
                        </div>

                        {/* Certifications */}
                        <div className="form-group">
                            <label className="form-label">Certifications (Optional)</label>
                            <div className="checkbox-group">
                                {certifications.map(cert => (
                                    <label
                                        key={cert.id}
                                        className={`checkbox-item ${selectedCerts.includes(cert.id) ? 'selected' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedCerts.includes(cert.id)}
                                            onChange={() => toggleCertification(cert.id)}
                                        />
                                        <span>{cert.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Calculate Button */}
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleCalculate}
                            disabled={calculating || containerCount === 0}
                            style={{ width: '100%', marginTop: 'var(--space-4)' }}
                        >
                            {calculating ? (
                                <>
                                    <span className="spinner"></span>
                                    Calculating...
                                </>
                            ) : (
                                'CALCULATE RATE'
                            )}
                        </button>
                    </div>

                    {/* Results */}
                    {result && (
                        <div className="result-card fade-in">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                                <h3>Your Export Quote</h3>
                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                    <button
                                        className={`btn btn-sm ${showCurrency === 'INR' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setShowCurrency('INR')}
                                    >₹ INR</button>
                                    <button
                                        className={`btn btn-sm ${showCurrency === 'USD' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setShowCurrency('USD')}
                                    >$ USD</button>
                                </div>
                            </div>

                            {/* Container Info */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-4)',
                                padding: 'var(--space-4)',
                                background: 'var(--bg-glass)',
                                borderRadius: 'var(--radius-lg)',
                                marginBottom: 'var(--space-6)'
                            }}>
                                <span style={{ fontSize: 'var(--text-2xl)' }}>🚢</span>
                                <div>
                                    <div style={{ fontWeight: 'var(--font-semibold)' }}>
                                        {result.containerCount} × {result.containerCode} Container{result.containerCount > 1 ? 's' : ''}
                                    </div>
                                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                                        {result.factoryLocation} → {result.loadingPort} → {result.destinationPort}, {result.country}
                                    </div>
                                </div>
                            </div>

                            {/* Price Summary */}
                            <div className="price-grid">
                                <div className="price-item">
                                    <div className="price-label">EX-Factory</div>
                                    <div className="price-value">
                                        {showCurrency === 'INR'
                                            ? formatINR(result.pricing.exFactory.inr)
                                            : formatUSD(result.pricing.exFactory.usd)}
                                    </div>
                                </div>
                                <div className="price-item">
                                    <div className="price-label">FOB</div>
                                    <div className="price-value">
                                        {showCurrency === 'INR'
                                            ? formatINR(result.pricing.fob.inr)
                                            : formatUSD(result.pricing.fob.usd)}
                                    </div>
                                </div>
                                <div className="price-item highlight">
                                    <div className="price-label">CIF</div>
                                    <div className="price-value accent">
                                        {showCurrency === 'INR'
                                            ? formatINR(result.pricing.cif.inr)
                                            : formatUSD(result.pricing.cif.usd)}
                                    </div>
                                </div>
                            </div>

                            {/* Per Unit Prices */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: 'var(--space-3)',
                                marginTop: 'var(--space-4)',
                                padding: 'var(--space-3)',
                                background: 'var(--bg-glass)',
                                borderRadius: 'var(--radius-md)',
                                textAlign: 'center',
                                fontSize: 'var(--text-sm)'
                            }}>
                                <div>
                                    <div style={{ color: 'var(--text-muted)' }}>Per {result.unit}</div>
                                    <div style={{ fontWeight: 'var(--font-semibold)' }}>
                                        {formatUSD(result.pricing.perUnit.exFactory)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)' }}>Per {result.unit}</div>
                                    <div style={{ fontWeight: 'var(--font-semibold)' }}>
                                        {formatUSD(result.pricing.perUnit.fob)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)' }}>Per {result.unit}</div>
                                    <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--accent-400)' }}>
                                        {formatUSD(result.pricing.perUnit.cif)}
                                    </div>
                                </div>
                            </div>

                            {/* Cost Breakdown */}
                            <h4 style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
                                Cost Breakdown
                            </h4>
                            <table className="breakup-table">
                                <thead>
                                    <tr>
                                        <th>Component</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Product Base */}
                                    <tr>
                                        <td>Product ({formatNumber(result.quantity)} × {formatUSD(result.pricing.breakdown.productBase.perUnit)})</td>
                                        <td><span className="badge badge-info">Per Unit</span></td>
                                        <td>{formatINR(result.pricing.breakdown.productBase.total)}</td>
                                    </tr>

                                    {/* Local Freight */}
                                    <tr>
                                        <td>Local Freight ({result.containerCount} × {formatINR(result.pricing.breakdown.localFreight.perContainer)})</td>
                                        <td><span className="badge badge-warning">Per Container</span></td>
                                        <td>{formatINR(result.pricing.breakdown.localFreight.total)}</td>
                                    </tr>

                                    {/* Handling */}
                                    {result.pricing.breakdown.handling.breakdown.map((item, idx) => (
                                        <tr key={`handling-${idx}`}>
                                            <td>{item.name} {item.chargeType === 'per_container' ? `(${item.quantity}×)` : ''}</td>
                                            <td>
                                                <span className={`badge ${item.chargeType === 'per_container' ? 'badge-warning' : 'badge-info'}`}>
                                                    {item.chargeType === 'per_container' ? 'Per Container' : 'Per Shipment'}
                                                </span>
                                            </td>
                                            <td>{formatINR(item.total)}</td>
                                        </tr>
                                    ))}

                                    {/* Port Charges */}
                                    <tr>
                                        <td>Port Handling ({result.containerCount}×)</td>
                                        <td><span className="badge badge-warning">Per Container</span></td>
                                        <td>{formatINR(result.pricing.breakdown.port.handling)}</td>
                                    </tr>
                                    <tr>
                                        <td>CHA Charges</td>
                                        <td><span className="badge badge-info">Per Shipment</span></td>
                                        <td>{formatINR(result.pricing.breakdown.port.cha)}</td>
                                    </tr>
                                    <tr>
                                        <td>Customs Clearance</td>
                                        <td><span className="badge badge-info">Per Shipment</span></td>
                                        <td>{formatINR(result.pricing.breakdown.port.customs)}</td>
                                    </tr>

                                    {/* Certifications */}
                                    {result.pricing.breakdown.certifications.items.map((cert, idx) => (
                                        <tr key={`cert-${idx}`}>
                                            <td>{cert.name}</td>
                                            <td><span className="badge badge-info">Per Shipment</span></td>
                                            <td>{formatINR(cert.cost)}</td>
                                        </tr>
                                    ))}

                                    {/* FOB Subtotal */}
                                    <tr style={{ background: 'var(--bg-glass)', fontWeight: 'var(--font-semibold)' }}>
                                        <td colSpan="2">FOB Total</td>
                                        <td>{formatINR(result.pricing.fob.inr)}</td>
                                    </tr>

                                    {/* ECGC */}
                                    <tr>
                                        <td>ECGC Premium ({result.pricing.breakdown.ecgc.rate}%)</td>
                                        <td><span className="badge badge-info">Percentage</span></td>
                                        <td>{formatINR(result.pricing.breakdown.ecgc.total)}</td>
                                    </tr>

                                    {/* International Freight */}
                                    <tr>
                                        <td>
                                            Int'l Freight ({result.containerCount} × {formatUSD(result.pricing.breakdown.freight.perContainer)})
                                            <br />
                                            <small style={{ color: 'var(--text-muted)' }}>
                                                + {result.pricing.breakdown.freight.gstRate}% GST = {formatINR(result.pricing.breakdown.freight.totalWithGST)}
                                            </small>
                                        </td>
                                        <td><span className="badge badge-warning">Per Container</span></td>
                                        <td>{formatINR(result.pricing.breakdown.freight.totalWithGST)}</td>
                                    </tr>

                                    {/* Insurance */}
                                    <tr>
                                        <td>Marine Insurance ({result.pricing.breakdown.insurance.rate}%)</td>
                                        <td><span className="badge badge-info">Percentage</span></td>
                                        <td>{formatINR(result.pricing.breakdown.insurance.total)}</td>
                                    </tr>

                                    {/* Bank Charges */}
                                    <tr>
                                        <td>Bank Charges ({result.pricing.breakdown.bankCharges.rate}%)</td>
                                        <td><span className="badge badge-info">Percentage</span></td>
                                        <td>{formatINR(result.pricing.breakdown.bankCharges.total)}</td>
                                    </tr>

                                    {/* Profit */}
                                    <tr>
                                        <td>Company Margin ({result.pricing.breakdown.profit.rate}%)</td>
                                        <td><span className="badge badge-success">Profit</span></td>
                                        <td>{formatINR(result.pricing.breakdown.profit.total)}</td>
                                    </tr>

                                    {/* CIF Total */}
                                    <tr style={{ background: 'linear-gradient(135deg, rgba(0, 168, 168, 0.2), rgba(0, 168, 168, 0.1))', fontWeight: 'var(--font-bold)' }}>
                                        <td colSpan="2">CIF Total</td>
                                        <td style={{ color: 'var(--accent-400)' }}>{formatINR(result.pricing.cif.inr)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Summary */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 'var(--space-4)',
                                marginTop: 'var(--space-6)'
                            }}>
                                <div style={{
                                    padding: 'var(--space-4)',
                                    background: 'var(--bg-glass)',
                                    borderRadius: 'var(--radius-lg)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                                        Per-Shipment Costs (Fixed)
                                    </div>
                                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>
                                        {formatINR(result.pricing.summary.perShipmentCosts)}
                                    </div>
                                </div>
                                <div style={{
                                    padding: 'var(--space-4)',
                                    background: 'var(--bg-glass)',
                                    borderRadius: 'var(--radius-lg)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                                        Per-Container Costs (× {result.containerCount})
                                    </div>
                                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>
                                        {formatINR(result.pricing.summary.perContainerCosts)}
                                    </div>
                                </div>
                            </div>

                            {/* Currency Info */}
                            <div style={{
                                marginTop: 'var(--space-4)',
                                padding: 'var(--space-3)',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: 'var(--text-xs)',
                                color: 'var(--text-muted)',
                                textAlign: 'center'
                            }}>
                                Exchange Rate: 1 USD = ₹{result.pricing.currency.exchange} |
                                Bank Margin: +₹{result.pricing.currency.bankMargin} |
                                Effective: ₹{result.pricing.currency.effective}
                            </div>

                            {/* Action Buttons */}
                            <div className="action-buttons">
                                <button className="btn btn-accent" onClick={handleDownloadPDF}>
                                    📄 Download PDF
                                </button>
                                <button className="btn btn-secondary" onClick={handleWhatsAppShare}>
                                    📱 Share WhatsApp
                                </button>
                            </div>
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer style={{
                    textAlign: 'center',
                    padding: 'var(--space-8) 0',
                    color: 'var(--text-muted)',
                    fontSize: 'var(--text-sm)'
                }}>
                    <p>© {new Date().getFullYear()} Arovave Global. All rights reserved.</p>
                </footer>
            </div>
        </>
    );
}
