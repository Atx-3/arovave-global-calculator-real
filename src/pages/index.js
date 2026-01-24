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
    const [boxesPerContainer, setBoxesPerContainer] = useState(''); // Number of boxes that fit in container
    const [boxWeightMain, setBoxWeightMain] = useState(''); // Weight per box in KG
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
    const [selectedTier, setSelectedTier] = useState('cif'); // 'exFactory', 'fob', or 'cif'

    // Custom charges state
    const [customProfitRate, setCustomProfitRate] = useState(''); // User-defined profit margin %
    const [packagingCharges, setPackagingCharges] = useState(''); // Packaging charges in INR
    const [extraCharges, setExtraCharges] = useState([]); // Array of {name, amount} for extra charges

    // Container Calculator Modal State
    const [showCalcModal, setShowCalcModal] = useState(false);
    const [boxLength, setBoxLength] = useState('');
    const [boxWidth, setBoxWidth] = useState('');
    const [boxHeight, setBoxHeight] = useState('');
    const [boxWeight, setBoxWeight] = useState('');
    const [calcResult, setCalcResult] = useState(null);
    const [calcError, setCalcError] = useState('');

    // Container specifications (internal dimensions in cm)
    const CONTAINER_SPECS = {
        '20FT': { lengthCm: 590, widthCm: 235, heightCm: 239, maxWeightKg: 28000 },
        '40FT': { lengthCm: 1200, widthCm: 235, heightCm: 239, maxWeightKg: 28000 }
    };

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

    // Auto-fill boxes per container when product + container type changes
    useEffect(() => {
        if (selectedProduct && selectedContainerType) {
            const defaultBoxes = selectedContainerType.code === '20FT'
                ? selectedProduct.qty_per_20ft
                : selectedProduct.qty_per_40ft;

            if (defaultBoxes) {
                setBoxesPerContainer(defaultBoxes.toString());
            }
        }
    }, [selectedProduct, selectedContainerType]);

    // Calculate container count when quantity, boxes per container, or box weight changes
    useEffect(() => {
        if (quantity && boxesPerContainer && boxWeightMain) {
            const totalQty = parseFloat(quantity);
            const boxWeight = parseFloat(boxWeightMain);
            const boxesPerCont = parseFloat(boxesPerContainer);

            // Total boxes needed = Total quantity / Weight per box
            const totalBoxes = Math.ceil(totalQty / boxWeight);
            // Containers = Total boxes / Boxes per container
            const count = Math.ceil(totalBoxes / boxesPerCont);
            setContainerCount(count);
        } else if (quantity && boxesPerContainer && !boxWeightMain) {
            // Fallback: if no box weight, assume direct division (for backward compatibility)
            const count = calculateContainers(parseFloat(quantity), parseFloat(boxesPerContainer));
            setContainerCount(count);
        } else {
            setContainerCount(0);
        }
        setResult(null);
    }, [quantity, boxesPerContainer, boxWeightMain]);

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

    // Extra charges management
    const addExtraCharge = () => {
        setExtraCharges([...extraCharges, { name: '', amount: '' }]);
    };

    const updateExtraCharge = (index, field, value) => {
        const updated = [...extraCharges];
        updated[index][field] = value;
        setExtraCharges(updated);
        setResult(null);
    };

    const removeExtraCharge = (index) => {
        setExtraCharges(extraCharges.filter((_, i) => i !== index));
        setResult(null);
    };

    // Calculate rates
    const handleCalculate = async () => {
        // Validation
        if (!selectedProduct) return setError('Please select a product');
        if (!quantity || parseFloat(quantity) <= 0) return setError('Please enter a valid quantity');
        if (!boxesPerContainer || parseFloat(boxesPerContainer) <= 0) return setError('Please enter boxes per container');
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
            // If weight per box is set (from calculator modal), use: boxes × weight
            // Otherwise, use boxesPerContainer directly (user enters qty per container)
            const qtyPerContainer = boxWeightMain && parseFloat(boxWeightMain) > 0
                ? parseFloat(boxesPerContainer) * parseFloat(boxWeightMain)
                : parseFloat(boxesPerContainer);

            // Calculate total boxes needed
            const totalBoxesNeeded = boxWeightMain && parseFloat(boxWeightMain) > 0
                ? Math.ceil(parseFloat(quantity) / parseFloat(boxWeightMain))
                : Math.ceil(parseFloat(quantity) / parseFloat(boxesPerContainer));

            // Calculate packaging per box (packaging charge × total boxes)
            const totalPackagingCharges = (parseFloat(packagingCharges) || 0) * totalBoxesNeeded;

            // Calculate total extra charges (packaging + custom extras)
            const totalExtraCharges = totalPackagingCharges +
                extraCharges.reduce((sum, charge) => sum + (parseFloat(charge.amount) || 0), 0);

            // Use custom profit rate if provided (even if 0), otherwise use settings
            const effectiveProfitRate = customProfitRate !== '' && !isNaN(parseFloat(customProfitRate))
                ? parseFloat(customProfitRate)
                : parseFloat(settings.profit_rate) || 5.0;

            const pricing = calculateExportPricing({
                product: selectedProduct,
                quantity: parseFloat(quantity),
                containerType: selectedContainerType,
                qtyPerContainer: qtyPerContainer,
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
                profitRate: effectiveProfitRate,
                profitType: settings.profit_type || 'percentage',
                selectedTier: selectedTier,
                packagingCharges: parseFloat(packagingCharges) || 0,
                extraCharges: totalExtraCharges
            });

            setResult({
                pricing,
                productName: selectedProduct.name,
                hsnCode: selectedProduct.hsn_code,
                unit: selectedProduct.unit,
                quantity: parseFloat(quantity),
                containerType: selectedContainerType.name,
                containerCode: selectedContainerType.code,
                containerCount: containerCount, // Use form's containerCount state for consistency
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

    // Container capacity calculation
    const handleContainerCalc = () => {
        setCalcError('');
        setCalcResult(null);

        const length = parseFloat(boxLength);
        const width = parseFloat(boxWidth);
        const height = parseFloat(boxHeight);
        const weight = parseFloat(boxWeight);

        if (!length || length <= 0) return setCalcError('Please enter valid box length');
        if (!width || width <= 0) return setCalcError('Please enter valid box width');
        if (!height || height <= 0) return setCalcError('Please enter valid box height');
        if (!weight || weight <= 0) return setCalcError('Please enter valid box weight');

        const containerCode = selectedContainerType?.code || '20FT';
        const container = CONTAINER_SPECS[containerCode];

        // Check if box fits
        const dims = [length, width, height].sort((a, b) => b - a);
        if (dims[0] > container.lengthCm || dims[1] > container.widthCm || dims[2] > container.heightCm) {
            return setCalcError('Box is too large to fit in the container!');
        }

        // Calculate boxes by VOLUME (try all orientations)
        const orientations = [
            { l: length, w: width, h: height },
            { l: length, w: height, h: width },
            { l: width, w: length, h: height },
            { l: width, w: height, h: length },
            { l: height, w: length, h: width },
            { l: height, w: width, h: length }
        ];

        let maxBoxesByVolume = 0;
        let bestOrientation = orientations[0];

        for (const o of orientations) {
            if (o.l <= container.lengthCm && o.w <= container.widthCm && o.h <= container.heightCm) {
                const alongLength = Math.floor(container.lengthCm / o.l);
                const alongWidth = Math.floor(container.widthCm / o.w);
                const alongHeight = Math.floor(container.heightCm / o.h);
                const total = alongLength * alongWidth * alongHeight;
                if (total > maxBoxesByVolume) {
                    maxBoxesByVolume = total;
                    bestOrientation = { ...o, alongLength, alongWidth, alongHeight };
                }
            }
        }

        // Calculate boxes by WEIGHT
        const maxBoxesByWeight = Math.floor(container.maxWeightKg / weight);

        // Use the LOWER of the two
        const boxesPerContainer = Math.min(maxBoxesByVolume, maxBoxesByWeight);
        const limitedBy = maxBoxesByVolume <= maxBoxesByWeight ? 'volume' : 'weight';

        // Volume & weight utilization
        const boxVolume = (length * width * height) / 1000000;
        const containerVolume = (container.lengthCm * container.widthCm * container.heightCm) / 1000000;
        const volumeUtilization = Math.round((boxesPerContainer * boxVolume / containerVolume) * 100);
        const weightPerContainer = boxesPerContainer * weight;
        const weightUtilization = Math.round((weightPerContainer / container.maxWeightKg) * 100);

        // quantity now represents total weight in kg
        const totalWeightKg = parseFloat(quantity) || 0;
        const totalBoxes = totalWeightKg > 0 ? Math.ceil(totalWeightKg / weight) : 0;

        setCalcResult({
            boxesPerContainer,
            limitedBy,
            maxByVolume: maxBoxesByVolume,
            maxByWeight: maxBoxesByWeight,
            volumeUtilization,
            weightUtilization,
            weightPerContainer,
            orientation: bestOrientation,
            // Calculate from total weight
            totalWeightKg,
            totalBoxes,
            totalContainers: totalBoxes > 0 ? Math.ceil(totalBoxes / boxesPerContainer) : 0,
            fullContainers: totalBoxes > 0 ? Math.floor(totalBoxes / boxesPerContainer) : 0,
            remainingBoxes: totalBoxes > 0 ? totalBoxes % boxesPerContainer : 0,
            lastContainerPercent: totalBoxes > 0 && totalBoxes % boxesPerContainer > 0
                ? Math.round((totalBoxes % boxesPerContainer) / boxesPerContainer * 100)
                : 100,
            boxWeight: weight
        });
    };

    // Apply calculated result to main form
    const applyCalcResult = () => {
        if (calcResult) {
            // Set boxes per container and weight per box
            setBoxesPerContainer(calcResult.boxesPerContainer.toString());
            setBoxWeightMain(calcResult.boxWeight.toString());
            setShowCalcModal(false);
            setCalcResult(null);
            setBoxLength(''); setBoxWidth(''); setBoxHeight(''); setBoxWeight('');
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
                        </div>

                        {/* Boxes per Container */}
                        <div className="form-group">
                            <label className="form-label">
                                📦 Boxes per Container *
                            </label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="e.g., 66"
                                value={boxesPerContainer}
                                onChange={(e) => setBoxesPerContainer(e.target.value)}
                                min="1"
                            />
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-2)' }}>
                                <small style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                                    How many boxes fit in {selectedContainerType?.code || 'container'}
                                </small>
                                <button
                                    type="button"
                                    onClick={() => { setShowCalcModal(true); setCalcResult(null); setCalcError(''); }}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: 'var(--text-xs)', padding: 'var(--space-1) var(--space-2)' }}
                                >
                                    📐 Calculate
                                </button>
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

                        {/* Pricing Tier Selection */}
                        <div className="form-group">
                            <label className="form-label">💰 Price Quote Type *</label>
                            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className={`btn ${selectedTier === 'exFactory' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => { setSelectedTier('exFactory'); setResult(null); }}
                                    style={{ flex: 1, minWidth: '100px' }}
                                >
                                    Ex Factory
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${selectedTier === 'fob' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => { setSelectedTier('fob'); setResult(null); }}
                                    style={{ flex: 1, minWidth: '100px' }}
                                >
                                    FOB
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${selectedTier === 'cif' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => { setSelectedTier('cif'); setResult(null); }}
                                    style={{ flex: 1, minWidth: '100px' }}
                                >
                                    CIF
                                </button>
                            </div>
                            <small style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)', display: 'block' }}>
                                {selectedTier === 'exFactory' && '🏭 Factory gate price with profit included'}
                                {selectedTier === 'fob' && '🚢 Free on Board (includes local freight, port charges) with profit'}
                                {selectedTier === 'cif' && '🌍 Cost Insurance Freight (full export price) with profit'}
                            </small>
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

                        {/* Custom Charges Section */}
                        <div style={{
                            background: 'var(--bg-glass)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-4)',
                            marginBottom: 'var(--space-4)'
                        }}>
                            <label className="form-label" style={{ marginBottom: 'var(--space-3)' }}>
                                💰 Custom Charges (Optional)
                            </label>

                            {/* Profit Margin and Packaging in a row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                                <div>
                                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)', display: 'block' }}>
                                        Profit Margin (%)
                                    </label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="e.g., 10"
                                        value={customProfitRate}
                                        onChange={(e) => { setCustomProfitRate(e.target.value); setResult(null); }}
                                        min="0"
                                        step="0.5"
                                        style={{ fontSize: 'var(--text-sm)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)', display: 'block' }}>
                                        Packaging per Box (₹)
                                    </label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="e.g., 50"
                                        value={packagingCharges}
                                        onChange={(e) => { setPackagingCharges(e.target.value); setResult(null); }}
                                        min="0"
                                        style={{ fontSize: 'var(--text-sm)' }}
                                    />
                                </div>
                            </div>

                            {/* Extra Charges */}
                            {extraCharges.length > 0 && (
                                <div style={{ marginBottom: 'var(--space-3)' }}>
                                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)', display: 'block' }}>
                                        Extra Charges
                                    </label>
                                    {extraCharges.map((charge, index) => (
                                        <div key={index} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Name (e.g., Fumigation)"
                                                value={charge.name}
                                                onChange={(e) => updateExtraCharge(index, 'name', e.target.value)}
                                                style={{ flex: 2, fontSize: 'var(--text-sm)' }}
                                            />
                                            <input
                                                type="number"
                                                className="form-input"
                                                placeholder="₹"
                                                value={charge.amount}
                                                onChange={(e) => updateExtraCharge(index, 'amount', e.target.value)}
                                                min="0"
                                                style={{ flex: 1, fontSize: 'var(--text-sm)' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeExtraCharge(index)}
                                                style={{
                                                    background: 'var(--error)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: 'var(--radius-sm)',
                                                    padding: 'var(--space-2)',
                                                    cursor: 'pointer',
                                                    fontSize: 'var(--text-sm)'
                                                }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add Extra Charge Button */}
                            <button
                                type="button"
                                onClick={addExtraCharge}
                                className="btn btn-secondary btn-sm"
                                style={{ width: '100%', fontSize: 'var(--text-sm)' }}
                            >
                                ➕ Add Extra Charge
                            </button>
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
                    </div >

                    {/* Results */}
                    {
                        result && (
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

                                {/* Progressive Tier Price Display */}
                                <div className="price-grid" style={{
                                    display: 'grid',
                                    gridTemplateColumns: selectedTier === 'exFactory' ? '1fr' : selectedTier === 'fob' ? '1fr 1fr' : 'repeat(3, 1fr)',
                                    gap: 'var(--space-3)'
                                }}>
                                    {/* Ex-Factory - Always show */}
                                    <div style={{
                                        background: selectedTier === 'exFactory' ? 'linear-gradient(135deg, var(--accent-500), var(--accent-600))' : 'var(--bg-glass)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: 'var(--space-4)',
                                        textAlign: 'center',
                                        color: selectedTier === 'exFactory' ? 'white' : 'inherit'
                                    }}>
                                        <div style={{ fontSize: 'var(--text-xs)', opacity: 0.8, marginBottom: 'var(--space-1)' }}>
                                            EX-FACTORY {selectedTier === 'exFactory' && '✓'}
                                        </div>
                                        <div style={{ fontSize: selectedTier === 'exFactory' ? 'var(--text-2xl)' : 'var(--text-lg)', fontWeight: 'var(--font-bold)' }}>
                                            {showCurrency === 'INR' ? formatINR(result.pricing.exFactory.inr) : formatUSD(result.pricing.exFactory.usd)}
                                        </div>
                                        <div style={{ fontSize: 'var(--text-xs)', opacity: 0.7 }}>
                                            Per {result.unit}: {formatUSD(result.pricing.perUnit.exFactory)}
                                        </div>
                                    </div>

                                    {/* FOB - Show for FOB and CIF */}
                                    {(selectedTier === 'fob' || selectedTier === 'cif') && (
                                        <div style={{
                                            background: selectedTier === 'fob' ? 'linear-gradient(135deg, var(--accent-500), var(--accent-600))' : 'var(--bg-glass)',
                                            borderRadius: 'var(--radius-lg)',
                                            padding: 'var(--space-4)',
                                            textAlign: 'center',
                                            color: selectedTier === 'fob' ? 'white' : 'inherit'
                                        }}>
                                            <div style={{ fontSize: 'var(--text-xs)', opacity: 0.8, marginBottom: 'var(--space-1)' }}>
                                                FOB {selectedTier === 'fob' && '✓'}
                                            </div>
                                            <div style={{ fontSize: selectedTier === 'fob' ? 'var(--text-2xl)' : 'var(--text-lg)', fontWeight: 'var(--font-bold)' }}>
                                                {showCurrency === 'INR' ? formatINR(result.pricing.fob.inr) : formatUSD(result.pricing.fob.usd)}
                                            </div>
                                            <div style={{ fontSize: 'var(--text-xs)', opacity: 0.7 }}>
                                                Per {result.unit}: {formatUSD(result.pricing.perUnit.fob)}
                                            </div>
                                        </div>
                                    )}

                                    {/* CIF - Show only for CIF */}
                                    {selectedTier === 'cif' && (
                                        <div style={{
                                            background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))',
                                            borderRadius: 'var(--radius-lg)',
                                            padding: 'var(--space-4)',
                                            textAlign: 'center',
                                            color: 'white'
                                        }}>
                                            <div style={{ fontSize: 'var(--text-xs)', opacity: 0.8, marginBottom: 'var(--space-1)' }}>
                                                CIF ✓
                                            </div>
                                            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)' }}>
                                                {showCurrency === 'INR' ? formatINR(result.pricing.cif.inr) : formatUSD(result.pricing.cif.usd)}
                                            </div>
                                            <div style={{ fontSize: 'var(--text-xs)', opacity: 0.7 }}>
                                                Per {result.unit}: {formatUSD(result.pricing.perUnit.cif)}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Profit indicator */}
                                <div style={{
                                    textAlign: 'center',
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--text-muted)',
                                    marginTop: 'var(--space-2)'
                                }}>
                                    {selectedTier === 'exFactory' ? 'Ex-Factory' : selectedTier === 'fob' ? 'FOB' : 'CIF'} includes {result.pricing.breakdown.profit.rate}% profit
                                </div>

                                {/* Cost Breakdown */}
                                <h4 style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
                                    {selectedTier === 'exFactory' ? 'Ex-Factory' : selectedTier === 'fob' ? 'FOB' : 'CIF'} Cost Breakdown
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

                                        {/* Packaging & Extra Charges */}
                                        {result.pricing.breakdown.packagingCharges && result.pricing.breakdown.packagingCharges.total > 0 && (
                                            <tr>
                                                <td>Packaging & Extra Charges</td>
                                                <td><span className="badge badge-info">Per Box</span></td>
                                                <td>{formatINR(result.pricing.breakdown.packagingCharges.total)}</td>
                                            </tr>
                                        )}

                                        {/* Local Freight - FOB and CIF only */}
                                        {(selectedTier === 'fob' || selectedTier === 'cif') && (
                                            <tr>
                                                <td>Local Freight ({result.containerCount} × {formatINR(result.pricing.breakdown.localFreight.perContainer)})</td>
                                                <td><span className="badge badge-warning">Per Container</span></td>
                                                <td>{formatINR(result.pricing.breakdown.localFreight.total)}</td>
                                            </tr>
                                        )}

                                        {/* Handling - FOB and CIF only */}
                                        {(selectedTier === 'fob' || selectedTier === 'cif') && result.pricing.breakdown.handling.breakdown.map((item, idx) => (
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

                                        {/* Port Charges - FOB and CIF only */}
                                        {(selectedTier === 'fob' || selectedTier === 'cif') && (
                                            <>
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
                                            </>
                                        )}

                                        {/* Certifications - FOB and CIF only */}
                                        {(selectedTier === 'fob' || selectedTier === 'cif') && result.pricing.breakdown.certifications.items.map((cert, idx) => (
                                            <tr key={`cert-${idx}`}>
                                                <td>{cert.name}</td>
                                                <td><span className="badge badge-info">Per Shipment</span></td>
                                                <td>{formatINR(cert.cost)}</td>
                                            </tr>
                                        ))}

                                        {/* FOB Subtotal - FOB and CIF only */}
                                        {(selectedTier === 'fob' || selectedTier === 'cif') && (
                                            <tr style={{ background: 'var(--bg-glass)', fontWeight: 'var(--font-semibold)' }}>
                                                <td colSpan="2">FOB Total</td>
                                                <td>{formatINR(result.pricing.fob.inr)}</td>
                                            </tr>
                                        )}

                                        {/* CIF-only costs */}
                                        {selectedTier === 'cif' && (
                                            <>
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
                                            </>
                                        )}

                                        {/* Profit */}
                                        <tr>
                                            <td>Company Margin ({result.pricing.breakdown.profit.rate}%)</td>
                                            <td><span className="badge badge-success">Profit</span></td>
                                            <td>{formatINR(result.pricing.breakdown.profit.total)}</td>
                                        </tr>

                                        {/* Final Total for Selected Tier */}
                                        <tr style={{ background: 'linear-gradient(135deg, rgba(0, 168, 168, 0.2), rgba(0, 168, 168, 0.1))', fontWeight: 'var(--font-bold)' }}>
                                            <td colSpan="2">{selectedTier === 'exFactory' ? 'Ex-Factory' : selectedTier === 'fob' ? 'FOB' : 'CIF'} Total</td>
                                            <td style={{ color: 'var(--accent-400)' }}>{formatINR(result.pricing[selectedTier].inr)}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Summary - Only for FOB and CIF */}
                                {(selectedTier === 'fob' || selectedTier === 'cif') && (
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
                                )}

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
                        )
                    }
                </main >

                {/* Footer */}
                < footer style={{
                    textAlign: 'center',
                    padding: 'var(--space-8) 0',
                    color: 'var(--text-muted)',
                    fontSize: 'var(--text-sm)'
                }
                }>
                    <p>© {new Date().getFullYear()} Arovave Global. All rights reserved.</p>
                </footer >
            </div >

            {/* Container Calculator Modal */}
            < ContainerCalcModal
                show={showCalcModal}
                onClose={() => setShowCalcModal(false)}
                containerCode={selectedContainerType?.code || '20FT'}
                onCalc={handleContainerCalc}
                calcResult={calcResult}
                calcError={calcError}
                boxLength={boxLength}
                setBoxLength={setBoxLength}
                boxWidth={boxWidth}
                setBoxWidth={setBoxWidth}
                boxHeight={boxHeight}
                setBoxHeight={setBoxHeight}
                boxWeight={boxWeight}
                setBoxWeight={setBoxWeight}
                onApply={applyCalcResult}
                CONTAINER_SPECS={CONTAINER_SPECS}
            />
        </>
    );
}

// Container Calculator Modal Component - integrated at the end of the file
function ContainerCalcModal({ show, onClose, containerCode, onCalc, calcResult, calcError, boxLength, setBoxLength, boxWidth, setBoxWidth, boxHeight, setBoxHeight, boxWeight, setBoxWeight, onApply, CONTAINER_SPECS }) {
    if (!show) return null;
    const container = CONTAINER_SPECS[containerCode] || CONTAINER_SPECS['20FT'];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'var(--space-4)'
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-6)', maxWidth: '500px', width: '100%',
                maxHeight: '90vh', overflowY: 'auto'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                    <h3 style={{ margin: 0 }}>📦 Calculate Box Capacity</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
                </div>

                {/* Container Info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--text-xs)' }}>
                    <div><div style={{ color: 'var(--text-muted)' }}>Container</div><div style={{ fontWeight: 'bold', color: 'var(--primary-400)' }}>{containerCode}</div></div>
                    <div><div style={{ color: 'var(--text-muted)' }}>L</div><div>{(container.lengthCm / 100).toFixed(1)}m</div></div>
                    <div><div style={{ color: 'var(--text-muted)' }}>W</div><div>{(container.widthCm / 100).toFixed(2)}m</div></div>
                    <div><div style={{ color: 'var(--text-muted)' }}>H</div><div>{(container.heightCm / 100).toFixed(2)}m</div></div>
                </div>

                {calcError && <div style={{ background: 'var(--error-light)', color: 'var(--error)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>{calcError}</div>}

                {/* Box Dimensions */}
                <div style={{ marginBottom: 'var(--space-3)' }}>
                    <label style={{ fontSize: 'var(--text-sm)', fontWeight: '600', marginBottom: 'var(--space-2)', display: 'block' }}>📦 Box Dimensions (cm)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                        <input type="number" className="form-input" placeholder="Length" value={boxLength} onChange={e => setBoxLength(e.target.value)} min="1" style={{ fontSize: 'var(--text-sm)' }} />
                        <input type="number" className="form-input" placeholder="Width" value={boxWidth} onChange={e => setBoxWidth(e.target.value)} min="1" style={{ fontSize: 'var(--text-sm)' }} />
                        <input type="number" className="form-input" placeholder="Height" value={boxHeight} onChange={e => setBoxHeight(e.target.value)} min="1" style={{ fontSize: 'var(--text-sm)' }} />
                    </div>
                </div>

                {/* Weight */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{ fontSize: 'var(--text-sm)', fontWeight: '600', marginBottom: 'var(--space-2)', display: 'block' }}>⚖️ Weight per Box (kg)</label>
                    <input type="number" className="form-input" placeholder="e.g., 5" value={boxWeight} onChange={e => setBoxWeight(e.target.value)} min="0.1" step="0.1" style={{ fontSize: 'var(--text-sm)' }} />
                </div>

                <button className="btn btn-primary" onClick={onCalc} style={{ width: '100%', marginBottom: 'var(--space-4)' }}>🧮 Calculate</button>

                {/* Results */}
                {calcResult && (
                    <div style={{ background: 'linear-gradient(135deg, rgba(0, 168, 168, 0.15), rgba(0, 168, 168, 0.05))', border: '2px solid var(--primary-500)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
                        {/* Boxes per Container */}
                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-3)' }}>
                            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', color: 'var(--primary-400)' }}>{calcResult.boxesPerContainer}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>boxes per {containerCode}</div>
                        </div>

                        {/* Weight per Container */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-3)' }}>
                            <div style={{ padding: 'var(--space-2)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                <div style={{ color: 'var(--text-muted)' }}>Weight/Container</div>
                                <div style={{ fontWeight: '600', color: 'var(--accent-400)' }}>{calcResult.weightPerContainer.toLocaleString()} kg</div>
                            </div>
                            <div style={{ padding: 'var(--space-2)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                <div style={{ color: 'var(--text-muted)' }}>Volume Used</div>
                                <div style={{ fontWeight: '600' }}>{calcResult.volumeUtilization}%</div>
                            </div>
                        </div>

                        {/* Total Container Breakdown - only show if weight entered */}
                        {calcResult.totalWeightKg > 0 && (
                            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                                <div style={{ textAlign: 'center', marginBottom: 'var(--space-2)' }}>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                        {calcResult.totalWeightKg.toLocaleString()} kg = {calcResult.totalBoxes.toLocaleString()} boxes
                                    </div>
                                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: 'var(--accent-400)' }}>
                                        {calcResult.totalContainers} Container{calcResult.totalContainers > 1 ? 's' : ''} Required
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center', fontSize: 'var(--text-sm)' }}>
                                    {calcResult.fullContainers > 0 && (
                                        <span style={{ color: 'var(--success)' }}>
                                            ✅ {calcResult.fullContainers} Full
                                        </span>
                                    )}
                                    {calcResult.fullContainers > 0 && calcResult.remainingBoxes > 0 && ' + '}
                                    {calcResult.remainingBoxes > 0 && (
                                        <span style={{ color: 'var(--warning)' }}>
                                            📦 1 at {calcResult.lastContainerPercent}% ({calcResult.remainingBoxes} boxes)
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {!calcResult.totalWeightKg && (
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 'var(--space-3)', fontStyle: 'italic' }}>
                                💡 Enter "Total Weight to Ship" in main form to see container breakdown
                            </div>
                        )}

                        <div style={{ fontSize: 'var(--text-xs)', color: calcResult.limitedBy === 'weight' ? 'var(--warning)' : 'var(--text-muted)', textAlign: 'center', marginBottom: 'var(--space-3)' }}>
                            ⚠️ Limited by {calcResult.limitedBy} (max {calcResult.limitedBy === 'weight' ? calcResult.maxByWeight : calcResult.maxByVolume} boxes)
                        </div>
                        <button className="btn btn-accent" onClick={onApply} style={{ width: '100%' }}>✅ Use {calcResult.boxesPerContainer} boxes × {calcResult.boxWeight} kg/box</button>
                    </div>
                )}
            </div>
        </div>
    );
}
