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
    clearSettingsCache
} from '@/lib/db';
import {
    calculateExportPricing,
    calculateContainers,
    formatINR,
    formatUSD,
    formatNumber
} from '@/lib/calculator';
import { downloadQuotationPDF } from '@/lib/pdf';
import { calculateDistanceFromPincodeToPort, calculateFreightFromDistance } from '@/lib/distance';

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

    const [selectedLocation, setSelectedLocation] = useState('');
    const [factoryPincode, setFactoryPincode] = useState(''); // Pincode for distance calculation
    const [selectedPort, setSelectedPort] = useState('');
    const [distanceKm, setDistanceKm] = useState(''); // Distance between factory and port in km
    const [distanceInfo, setDistanceInfo] = useState(null); // Auto-calculated distance info
    const [selectedCountry, setSelectedCountry] = useState('');
    const [selectedDestPort, setSelectedDestPort] = useState('');
    const [selectedCerts, setSelectedCerts] = useState([]);
    const [customPrice, setCustomPrice] = useState(''); // Editable price - defaults from product but can be overridden

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
    const [customProductPrice, setCustomProductPrice] = useState(''); // Temporary price override (USD)
    const [innerPackingCost, setInnerPackingCost] = useState(''); // Inner packing cost per unit (INR)
    const [outerPackingCost, setOuterPackingCost] = useState(''); // Outer packing cost per box (INR)
    const [unitsPerBox, setUnitsPerBox] = useState(''); // No. of units in outer box
    const [unitWeight, setUnitWeight] = useState(''); // NEW: Weight per unit
    const [boxWeightMain, setBoxWeightMain] = useState(''); // Kept for backward compatibility/fallback
    const [boxDimensions, setBoxDimensions] = useState({ length: '', width: '', height: '' }); // Box dimensions (Optional)
    const [paymentTerms, setPaymentTerms] = useState(''); // Cash/Credit %
    const [containerStuffingCharge, setContainerStuffingCharge] = useState(''); // Per container (INR)
    const [indiaInsuranceRate, setIndiaInsuranceRate] = useState(''); // India side insurance %
    const [marineInsuranceRate, setMarineInsuranceRate] = useState(''); // International marine insurance %
    const [seaFreight, setSeaFreight] = useState(''); // Sea Freight ($/container)
    const [exportPackingCost, setExportPackingCost] = useState(''); // Export packing per container (INR)
    // const [marineInsuranceType, setMarineInsuranceType] = useState('ICC-C'); // Obsolete - replaced by marineInsuranceRate
    const [packagingCharges, setPackagingCharges] = useState(''); // Packaging charges in INR (legacy - will merge with outerPackingCost)
    const [extraCharges, setExtraCharges] = useState([]); // Array of {name, amount} for FOB extra charges
    const [exwExtraCharges, setExwExtraCharges] = useState([]); // Array of {name, amount} for EXW extra charges
    const [cifExtraCharges, setCifExtraCharges] = useState([]); // Array of {name, amount} for CIF extra charges

    // Container Calculator Modal State
    const [showCalcModal, setShowCalcModal] = useState(false);
    const [boxLength, setBoxLength] = useState('');
    const [boxWidth, setBoxWidth] = useState('');
    const [boxHeight, setBoxHeight] = useState('');
    const [boxWeight, setBoxWeight] = useState('');

    const [calcResult, setCalcResult] = useState(null);
    const [calcError, setCalcError] = useState('');

    // Client Details Modal State (for PDF download)
    const [showClientModal, setShowClientModal] = useState(false);
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientCompany, setClientCompany] = useState('');

    // Container specifications (internal dimensions in cm)
    // All specs are now dynamic from settings!
    const getContainerSpecs = (containerCode) => {
        // Get data from settings (selected container type)
        const containerData = containerTypes.find(c => c.code === containerCode);
        const defaultSpecs = {
            '20FT': { lengthCm: 590, widthCm: 235, heightCm: 239, maxWeightKg: 18000 },
            '40FT': { lengthCm: 1200, widthCm: 235, heightCm: 239, maxWeightKg: 26000 }
        };
        const specs = { ...(defaultSpecs[containerCode] || defaultSpecs['20FT']) };

        // Override with settings values if available
        if (containerData) {
            if (containerData.max_weight_kg) specs.maxWeightKg = containerData.max_weight_kg;
            if (containerData.length_cm) specs.lengthCm = containerData.length_cm;
            if (containerData.width_cm) specs.widthCm = containerData.width_cm;
            if (containerData.height_cm) specs.heightCm = containerData.height_cm;
        }
        return specs;
    };

    // Load all master data
    async function loadAllMasterData() {
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

            // Set defaults from settings
            if (settingsData) {
                if (settingsData.container_stuffing_rate) {
                    setContainerStuffingCharge(settingsData.container_stuffing_rate);
                }
                if (settingsData.indian_insurance_rate) {
                    setIndiaInsuranceRate(settingsData.indian_insurance_rate);
                }
                if (settingsData.marine_insurance_rate) {
                    setMarineInsuranceRate(settingsData.marine_insurance_rate);
                }
            }

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

    // Refresh data from settings (clears cache first)
    const refreshData = async () => {
        clearSettingsCache();
        setLoading(true);
        await loadAllMasterData();
        setResult(null);
    };

    // Load initial data
    useEffect(() => {
        loadAllMasterData();
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

    // Auto-fill Factory Pincode when Location changes
    useEffect(() => {
        if (selectedLocation && locations.length > 0) {
            const loc = locations.find(l => l.id.toString() === selectedLocation);
            if (loc && loc.pincode) {
                setFactoryPincode(loc.pincode);

                // Trigger distance calc if port is already selected
                if (selectedPort) {
                    const port = ports.find(p => p.id.toString() === selectedPort);
                    if (port) {
                        const result = calculateDistanceFromPincodeToPort(loc.pincode, port.code, port.pincode);
                        if (!result.error) {
                            setDistanceInfo(result);
                            const dist = result.distance;
                            setDistanceKm(dist.toString());

                            // Auto-calc freight if rate exists
                            if (settings.transport_rate_per_km) {
                                const cost = Math.round(dist * parseFloat(settings.transport_rate_per_km));
                                setLocalFreight(cost.toString());
                            }
                        }
                    }
                }
            }
        }
    }, [selectedLocation, locations, selectedPort, ports, settings]);

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

    // Auto-fill Sea Freight when container type changes
    useEffect(() => {
        if (selectedContainerType && settings) {
            const defaultFreight = selectedContainerType.code === '20FT'
                ? settings.sea_freight_20ft
                : settings.sea_freight_40ft;

            if (defaultFreight) {
                setSeaFreight(defaultFreight);
            }
        }
    }, [selectedContainerType, settings]);

    // Auto-update price if product has specific rate for selected location
    useEffect(() => {
        if (selectedProduct && selectedLocation) {
            let price = selectedProduct.base_price_usd;

            if (selectedProduct.linked_manufacturers && selectedProduct.linked_manufacturers.length > 0) {
                const link = selectedProduct.linked_manufacturers.find(l => l.location_id.toString() === selectedLocation);
                if (link && link.base_price_usd > 0) {
                    price = link.base_price_usd;
                }
            }

            setCustomPrice(price.toString());
        } else if (selectedProduct) {
            setCustomPrice(selectedProduct.base_price_usd.toString());
        }
    }, [selectedProduct, selectedLocation]);

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

    // EXW Extra charges management
    const addExwExtraCharge = () => {
        setExwExtraCharges([...exwExtraCharges, { name: '', amount: '' }]);
    };

    const updateExwExtraCharge = (index, field, value) => {
        const updated = [...exwExtraCharges];
        updated[index][field] = value;
        setExwExtraCharges(updated);
        setResult(null);
    };

    const removeExwExtraCharge = (index) => {
        setExwExtraCharges(exwExtraCharges.filter((_, i) => i !== index));
        setResult(null);
    };

    // CIF Extra charges management
    const addCifExtraCharge = () => {
        setCifExtraCharges([...cifExtraCharges, { name: '', amount: '' }]);
    };

    const updateCifExtraCharge = (index, field, value) => {
        const updated = [...cifExtraCharges];
        updated[index][field] = value;
        setCifExtraCharges(updated);
        setResult(null);
    };

    const removeCifExtraCharge = (index) => {
        setCifExtraCharges(cifExtraCharges.filter((_, i) => i !== index));
        setResult(null);
    };

    // Calculate rates
    const handleCalculate = async () => {
        // Base Validation (all tiers)
        if (!selectedProduct) return setError('Please select a product');
        if (!quantity || parseFloat(quantity) <= 0) return setError('Please enter a valid quantity');

        // Validation for FOB/CIF (Container & Location required)
        if (selectedTier !== 'exFactory') {
            if (!boxesPerContainer || parseFloat(boxesPerContainer) <= 0) return setError('Please enter boxes per container');
            if (!selectedContainerType) return setError('Please select a container type');
            if (!selectedLocation) return setError('Please select manufacturing location');
        }

        // FOB/CIF tier needs port
        if ((selectedTier === 'fob' || selectedTier === 'cif') && !selectedPort) {
            return setError('Please select port of loading');
        }

        // CIF tier needs destination
        if (selectedTier === 'cif') {
            if (!selectedCountry) return setError('Please select destination country');
            if (!selectedDestPort) return setError('Please select destination port');
        }

        setError('');
        setCalculating(true);

        try {
            // Get related data
            // For EXW, location/port/country might be missing, which is fine.
            const location = locations.find(l => l.id.toString() === selectedLocation);
            const port = ports.find(p => p.id.toString() === selectedPort);
            const country = countries.find(c => c.id.toString() === selectedCountry);
            const destPort = destinationPorts.find(p => p.id.toString() === selectedDestPort);
            const selectedCertifications = certifications.filter(c => selectedCerts.includes(c.id));

            // Determine effective container type (use selected or default to first available for EXW)
            const effectiveContainerType = selectedContainerType || (containerTypes.length > 0 ? containerTypes[0] : null);
            if (!effectiveContainerType && selectedTier !== 'exFactory') {
                throw new Error("No container type available");
            }

            // Get freight and local freight rates
            let localFreightRate = 0;
            // Only fetch local freight if a port is selected AND we have a valid container type
            if (selectedPort && effectiveContainerType) {
                localFreightRate = await getLocalFreightRate(
                    selectedLocation,
                    selectedPort,
                    effectiveContainerType.id
                );
            }

            let freightData = null;
            // Only fetch international freight for CIF
            if (selectedTier === 'cif' && effectiveContainerType) {
                freightData = await getFreightRate(
                    selectedPort,
                    selectedDestPort,
                    effectiveContainerType.id
                );

                // Override with manual Sea Freight input if provided
                if (seaFreight && !isNaN(parseFloat(seaFreight))) {
                    if (!freightData) freightData = {};
                    freightData.rate_amount = parseFloat(seaFreight);
                    // Ensure other defaults if freightData was null
                    if (!freightData.currency) freightData.currency = 'USD';
                    if (!freightData.freight_conversion_rate) freightData.freight_conversion_rate = 1.0;
                    if (!freightData.gst_percent) freightData.gst_percent = 5; // Default safe assumption
                }
            }

            const currencyData = await getCurrencySettings('USD');

            // Calculate
            // For EXW, boxesPerContainer might be missing. Default to something safe (e.g., 1000) or calculate from quantity if possible, 
            // but effectively it won't matter for EXW final price since container costs are excluded.
            // However, to avoid NaN, we set defaults.
            const safeBoxesPerContainer = boxesPerContainer && parseFloat(boxesPerContainer) > 0
                ? parseFloat(boxesPerContainer)
                : 10000; // Arbitrary high number if missing

            // 1. Calculate Total Units
            // If Unit Weight is provided, Quantity is treated as Total Weight (kg)
            // Total Units = Total Weight / Unit Weight
            let totalUnits = parseFloat(quantity);
            if (unitWeight && parseFloat(unitWeight) > 0) {
                totalUnits = Math.ceil(parseFloat(quantity) / parseFloat(unitWeight));
            }

            // 2. Calculate Total Boxes
            // Priority: Units per Box -> Box Weight -> Default
            let totalBoxesNeeded = 1;
            if (unitsPerBox && parseFloat(unitsPerBox) > 0) {
                totalBoxesNeeded = Math.ceil(totalUnits / parseFloat(unitsPerBox));
            } else if (boxWeightMain && parseFloat(boxWeightMain) > 0) {
                // Fallback: If we only have box weight and total quantity is weight
                // This path is less precise if unit details are missing
                totalBoxesNeeded = Math.ceil(parseFloat(quantity) / parseFloat(boxWeightMain));
            } else {
                // Fallback to safe defaults
                totalBoxesNeeded = Math.ceil(totalUnits / safeBoxesPerContainer);
            }

            // 3. Inner Packing Cost
            // Cost = Total Units * Inner Rate per Unit
            const totalInnerPacking = (parseFloat(innerPackingCost) || 0) * totalUnits;

            // 4. Outer Packing Cost
            // Cost = Total Boxes * Outer Rate per Box
            const totalOuterPacking = (parseFloat(outerPackingCost) || 0) * totalBoxesNeeded;

            // Calculate Box Weight (for container estimation if not provided)
            // If not explicit, estimate: Total Quantity / Total Boxes
            const estimatedBoxWeight = parseFloat(quantity) / totalBoxesNeeded;

            // Calculate Quantity Per Container (for container count)
            // If we have accurate box info, use it. 
            // boxesPerContainer is user input for "Boxes per Container" (Container Capacity)
            const qtyPerContainer = safeBoxesPerContainer * estimatedBoxWeight;

            // Logic to update container count based on boxes if needed, 
            // but usually container count is derived from "Boxes per Container" input vs "Total Boxes"
            // Let's refine container count logic for consistency:
            // Container Count = Total Boxes / Boxes Per Container
            const calculatedContainerCount = Math.ceil(totalBoxesNeeded / safeBoxesPerContainer);
            // Use provided count if manual or override, else calculated
            // But usually we rely on the main "containerCount" variable if it was passed or calculated differently.
            // Actually, in previous code `containerCount` comes from `calculateContainers(quantity, ...)`
            // which uses `qtyPerContainer`.
            // Let's ensure containerCount reflects the boxes logic:

            // Re-eval container count based on boxes
            const effectiveContainerCount = Math.ceil(totalBoxesNeeded / safeBoxesPerContainer);


            // Total EXW Packing Charges (Inner + Outer)
            const totalPackagingCharges = totalInnerPacking + totalOuterPacking;

            // Calculate extra charges totals
            const totalFobExtraCharges = extraCharges.reduce((sum, charge) => sum + (parseFloat(charge.amount) || 0), 0);
            const totalExwExtraCharges = exwExtraCharges.reduce((sum, charge) => sum + (parseFloat(charge.amount) || 0), 0);
            const totalCifExtraCharges = cifExtraCharges.reduce((sum, charge) => sum + (parseFloat(charge.amount) || 0), 0);

            // NEW: Container Stuffing (per container)
            const totalContainerStuffing = (parseFloat(containerStuffingCharge) || 0) * effectiveContainerCount;

            // NEW: Export Packing/Palletization (per container)
            const totalExportPacking = (parseFloat(exportPackingCost) || 0) * effectiveContainerCount;

            // NEW: India Insurance Rate
            const effectiveIndiaInsuranceRate = parseFloat(indiaInsuranceRate) || 0;

            // NEW: Marine Insurance Rate based on ICC type
            const marineInsuranceRates = { 'ICC-C': 0.2, 'ICC-B': 0.4, 'ICC-A': 0.6 };
            const effectiveMarineInsuranceRate = marineInsuranceRates[marineInsuranceType] || 0.2;

            // Use custom profit rate if provided (even if 0), otherwise use settings
            const effectiveProfitRate = customProfitRate !== '' && !isNaN(parseFloat(customProfitRate))
                ? parseFloat(customProfitRate)
                : parseFloat(settings.profit_rate) || 5.0;

            const pricing = calculateExportPricing({
                product: selectedProduct,
                customPriceUsd: parseFloat(customPrice) || selectedProduct?.base_price_usd || 0, // Use editable price
                quantity: parseFloat(quantity),
                containerType: effectiveContainerType,
                qtyPerContainer: qtyPerContainer,
                containerCount: effectiveContainerCount, // Use box-based count
                containerCount: effectiveContainerCount, // Use box-based count
                localFreightRate: parseFloat(localFreight) || 0, // Manual override or auto-calculated state
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
                insuranceRate: effectiveMarineInsuranceRate, // Use ICC-based marine insurance
                minInsurance: parseFloat(settings.min_insurance) || 5000,
                bankChargeRate: parseFloat(settings.bank_charge_rate) || 0.25,
                profitRate: effectiveProfitRate,
                profitType: settings.profit_type || 'percentage',
                selectedTier: selectedTier,
                packagingCharges: totalPackagingCharges, // Total = Inner + Outer Packing (in INR)
                // Pass extra charges separately
                extraCharges: totalFobExtraCharges + totalContainerStuffing + totalExportPacking, // FOB extras
                exwExtraCharges: totalExwExtraCharges, // EXW extras
                cifExtraCharges: totalCifExtraCharges, // CIF extras
                // NEW fields for breakdown display
                innerPackingTotal: totalInnerPacking,
                outerPackingTotal: totalOuterPacking,
                containerStuffingTotal: totalContainerStuffing,
                exportPackingTotal: totalExportPacking,
                exportPackingTotal: totalExportPacking,
                indiaInsuranceRate: effectiveIndiaInsuranceRate,
                marineInsuranceRate: parseFloat(marineInsuranceRate) || 0, // NEW
                // marineInsuranceType: marineInsuranceType, // Obsolete
                totalBoxes: totalBoxesNeeded,
                totalUnits: totalUnits, // NEW: Pass calculated units
                paymentTerms: parseFloat(paymentTerms) || 0
            });

            setResult({
                pricing,
                productName: selectedProduct.name,
                hsnCode: selectedProduct.hsn_code,
                unit: selectedProduct.unit,
                quantity: parseFloat(quantity),
                containerType: effectiveContainerType?.name || 'N/A',
                containerCode: effectiveContainerType?.code || 'N/A',
                containerCount: effectiveContainerCount, // Use box-based count
                factoryLocation: location?.name || 'N/A',
                loadingPort: port?.name || 'N/A',
                country: country?.name || 'N/A',
                destinationPort: destPort?.name || 'N/A',
                certifications: selectedCertifications.map(c => c.name),
                selectedTier: selectedTier // Pass tier for PDF filtering
            });
        } catch (err) {
            console.error('Calculation error:', err);
            setError(`Error calculating prices: ${err.message}. Check console for details.`);
        }

        setCalculating(false);
    };

    // Open client details modal for PDF download
    const handleDownloadPDF = () => {
        if (result) {
            setShowClientModal(true);
        }
    };

    // Actually generate and download PDF with client info
    const handleGeneratePDF = async () => {
        if (result) {
            const clientInfo = {
                name: clientName.trim() || 'Valued Customer',
                phone: clientPhone.trim(),
                company: clientCompany.trim()
            };
            await downloadQuotationPDF(result, clientInfo);
            setShowClientModal(false);
            // Reset form
            setClientName('');
            setClientPhone('');
            setClientCompany('');
        }
    };

    // Share via WhatsApp - with detailed breakdown like PDF
    const handleWhatsAppShare = () => {
        if (result) {
            const tier = result.selectedTier || 'cif';
            const breakdown = result.pricing?.breakdown || {};

            // Get tier label and final price
            let tierLabel = 'CIF';
            let finalPrice = result.pricing.cif.usd;
            if (tier === 'exFactory') {
                tierLabel = 'Ex-Factory';
                finalPrice = result.pricing.exFactory.usd;
            } else if (tier === 'fob') {
                tierLabel = 'FOB';
                finalPrice = result.pricing.fob.usd;
            }

            // Build detailed breakdown
            let breakdownText = '*Cost Breakdown:*%0A';

            // Product Cost (always)
            if (breakdown.productBase?.total) {
                breakdownText += `• Product: ${formatINR(breakdown.productBase.total)}%0A`;
            }

            // Packaging (always)
            if (breakdown.packagingCharges?.total > 0) {
                breakdownText += `• Packaging: ${formatINR(breakdown.packagingCharges.total)}%0A`;
            }

            // Certifications (always)
            if (breakdown.certifications?.items?.length > 0) {
                breakdown.certifications.items.forEach(cert => {
                    breakdownText += `• ${cert.name}: ${formatINR(cert.cost)}%0A`;
                });
            }

            // FOB/CIF items
            if (tier === 'fob' || tier === 'cif') {
                if (breakdown.localFreight?.total > 0) {
                    breakdownText += `• Inland Transport: ${formatINR(breakdown.localFreight.total)}%0A`;
                }
                if (breakdown.handling?.total > 0) {
                    breakdownText += `• Handling: ${formatINR(breakdown.handling.total)}%0A`;
                }
                if (breakdown.port?.total > 0) {
                    breakdownText += `• Port & Customs: ${formatINR(breakdown.port.total)}%0A`;
                }
            }

            // CIF only items
            if (tier === 'cif') {
                if (breakdown.freight?.totalWithGST > 0) {
                    breakdownText += `• Int'l Freight: ${formatINR(breakdown.freight.totalWithGST)}%0A`;
                }
                if (breakdown.insurance?.total > 0) {
                    breakdownText += `• Insurance: ${formatINR(breakdown.insurance.total)}%0A`;
                }
            }

            // Build destination info
            let destinationInfo = '';
            if (tier === 'fob' || tier === 'cif') {
                destinationInfo = `Port: ${result.loadingPort || 'N/A'}%0A`;
            }
            if (tier === 'cif') {
                destinationInfo += `Destination: ${result.destinationPort || 'N/A'}, ${result.country || 'N/A'}%0A`;
            }

            const text = `*AROVAVE GLOBAL - Export Quotation*%0A` +
                `━━━━━━━━━━━━━━━━━━%0A%0A` +
                `*Product:* ${result.productName}%0A` +
                `*HSN:* ${result.hsnCode || 'N/A'}%0A` +
                `*Quantity:* ${formatNumber(result.quantity)} ${result.unit}%0A` +
                `*Containers:* ${result.containerCount} × ${result.containerCode}%0A` +
                (destinationInfo ? `${destinationInfo}` : '') +
                `%0A${breakdownText}%0A` +
                `━━━━━━━━━━━━━━━━━━%0A` +
                `*Total (${tierLabel}):* ${formatUSD(finalPrice)}%0A%0A` +
                `_Contact us for more details!_`;

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
        const container = getContainerSpecs(containerCode);

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
            // Keep box dimensions - don't clear them so user can re-check anytime!
            // setCalcResult(null); // Also keep the result for reference
        }
    };

    // Clear form - reset all fields
    const clearForm = () => {
        setSelectedProduct(null);
        setQuantity('');
        setBoxesPerContainer('');
        setBoxWeightMain('');
        setFactoryPincode('');
        setDistanceKm('');
        setDistanceInfo(null);
        setSelectedLocation('');
        setSelectedPort('');
        setSelectedCountry('');
        setSelectedDestPort('');
        setSelectedCerts([]);
        setCustomProfitRate('');
        setCustomProductPrice('');
        setPackagingCharges('');
        setExtraCharges([]);
        setExwExtraCharges([]);
        setCifExtraCharges([]);
        setResult(null);
        setError('');
        // Reset container type to first option
        if (containerTypes.length > 0) {
            setSelectedContainerType(containerTypes[0]);
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
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={refreshData}
                                title="Reload data from settings"
                            >
                                🔄 Refresh
                            </button>
                            <a href="/settings" className="btn btn-secondary btn-sm">Settings</a>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main>
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                            <h2 style={{ margin: 0 }}>Calculate Export Rates</h2>
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={clearForm}
                            >
                                Clear Form
                            </button>
                        </div>

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

                        {/* Pricing Tier Selection */}
                        <div className="form-group" style={{
                            background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--bg-secondary) 100%)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-4)',
                            marginBottom: 'var(--space-5)',
                            border: '1px solid var(--primary-100)'
                        }}>
                            <label className="form-label" style={{ marginBottom: 'var(--space-3)', fontWeight: 'var(--font-bold)' }}>
                                Select Quote Type <span style={{ color: 'var(--error)' }}>*</span>
                            </label>
                            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className={`btn ${selectedTier === 'exFactory' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => { setSelectedTier('exFactory'); setResult(null); }}
                                    style={{ flex: 1, minWidth: '100px' }}
                                >
                                    EXW
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
                        </div>

                        {/* ============================================ */}
                        {/* EXW SECTION - Product, Quantity, Packing */}
                        {/* ============================================ */}
                        <div style={{
                            background: 'var(--bg-glass)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-4)',
                            marginBottom: 'var(--space-4)',
                            border: '2px solid var(--primary-200)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                                <span style={{ background: 'var(--primary-500)', color: 'white', padding: '4px 12px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)' }}>EXW</span>
                                <span className="form-label" style={{ margin: 0, fontWeight: 'var(--font-semibold)' }}>Product & Packing Details</span>
                            </div>

                            {/* Product Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                                <div>
                                    <label className="form-label">Product Name <span style={{ color: 'var(--error)' }}>*</span></label>
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
                                <div>
                                    <label className="form-label">HS Code</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={selectedProduct?.hsn_code || '-'}
                                        disabled
                                        style={{ background: 'var(--bg-secondary)' }}
                                    />
                                </div>
                            </div>

                            {/* Quantity & Price Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                                <div>
                                    <label className="form-label">Required Quantity ({selectedProduct?.unit || 'Units'}) <span style={{ color: 'var(--error)' }}>*</span></label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="e.g., 50000"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">
                                        Price (USD/{selectedProduct?.unit || 'Unit'})
                                        {customPrice && selectedProduct?.base_price_usd && parseFloat(customPrice) < parseFloat(selectedProduct.base_price_usd) && (
                                            <span style={{
                                                color: 'var(--success)',
                                                marginLeft: 'var(--space-2)',
                                                fontSize: 'var(--text-xs)',
                                                fontWeight: 'var(--font-bold)'
                                            }}>
                                                💰 {(((parseFloat(selectedProduct.base_price_usd) - parseFloat(customPrice)) / parseFloat(selectedProduct.base_price_usd)) * 100).toFixed(1)}% OFF
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder={selectedProduct?.base_price_usd || '0.00'}
                                        value={selectedProduct?.base_price_usd || ''}
                                        disabled
                                        style={{ background: 'var(--bg-secondary)' }}
                                    />
                                </div>
                            </div>

                            {/* Unit Weight & Units per Box Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                                <div>
                                    <label className="form-label">Unit Weight (kg) <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(Optional)</span></label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="e.g., 0.5"
                                        value={unitWeight}
                                        onChange={(e) => { setUnitWeight(e.target.value); setResult(null); }}
                                        min="0"
                                        step="0.01"
                                    />
                                    <small style={{ color: 'var(--text-muted)', fontSize: '10px' }}>If Quantity is Total Weight, enter weight per unit here.</small>
                                </div>
                                <div>
                                    <label className="form-label">Units per Outer Box</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="e.g., 20"
                                        value={unitsPerBox}
                                        onChange={(e) => { setUnitsPerBox(e.target.value); setResult(null); }}
                                        min="1"
                                    />
                                    <small style={{ color: 'var(--text-muted)', fontSize: '10px' }}>How many units fit in one master carton?</small>
                                </div>
                            </div>

                            {/* Inner & Outer Packing Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                                <div>
                                    <label className="form-label">Inner Packing Cost (₹/unit)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="e.g., 2"
                                        value={innerPackingCost}
                                        onChange={(e) => { setInnerPackingCost(e.target.value); setResult(null); }}
                                        min="0"
                                        step="0.5"
                                    />
                                    <small style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Per unit (polybag, shrink wrap)</small>
                                </div>
                                <div>
                                    <label className="form-label">Outer Packing Cost (₹/box)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="e.g., 50"
                                        value={outerPackingCost}
                                        onChange={(e) => { setOuterPackingCost(e.target.value); setResult(null); }}
                                        min="0"
                                    />
                                    <small style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Export carton per box</small>
                                </div>
                            </div>

                            {/* Profit Margin */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                                <div>
                                    <label className="form-label">Profit Margin (%)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="e.g., 10"
                                        value={customProfitRate}
                                        onChange={(e) => { setCustomProfitRate(e.target.value); setResult(null); }}
                                        min="0"
                                        step="0.5"
                                    />
                                    <small style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Applied on overall rate</small>
                                </div>


                            </div>
                            {/* EXW Extra Charges */}
                            {exwExtraCharges.length > 0 && (
                                <div style={{ marginTop: 'var(--space-3)' }}>
                                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)', display: 'block' }}>
                                        EXW Extra Charges
                                    </label>
                                    {exwExtraCharges.map((charge, index) => (
                                        <div key={index} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Name (e.g., Special Packing)"
                                                value={charge.name}
                                                onChange={(e) => updateExwExtraCharge(index, 'name', e.target.value)}
                                                style={{ flex: 2, fontSize: 'var(--text-sm)' }}
                                            />
                                            <input
                                                type="number"
                                                className="form-input"
                                                placeholder="₹"
                                                value={charge.amount}
                                                onChange={(e) => updateExwExtraCharge(index, 'amount', e.target.value)}
                                                min="0"
                                                style={{ flex: 1, fontSize: 'var(--text-sm)' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeExwExtraCharge(index)}
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

                            {/* Add EXW Extra Charge Button */}
                            <button
                                type="button"
                                onClick={addExwExtraCharge}
                                className="btn btn-secondary btn-sm"
                                style={{ width: '100%', fontSize: 'var(--text-sm)', marginTop: 'var(--space-3)' }}
                            >
                                + Add EXW Extra Charge
                            </button>
                        </div>

                        {/* ============================================ */}
                        {/* FOB SECTION - Container, Shipping & Costs */}
                        {/* ============================================ */}
                        {(selectedTier === 'fob' || selectedTier === 'cif') && (
                            <div style={{
                                background: 'var(--bg-glass)',
                                borderRadius: 'var(--radius-lg)',
                                padding: 'var(--space-4)',
                                marginBottom: 'var(--space-4)',
                                border: '2px solid var(--warning)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                                    <span style={{ background: 'var(--warning)', color: 'var(--black)', padding: '4px 12px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)' }}>FOB</span>
                                    <span className="form-label" style={{ margin: 0, fontWeight: 'var(--font-semibold)' }}>Container & Shipping Details</span>
                                </div>

                                {/* Container & Location Row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                                    <div>
                                        <label className="form-label">Container Type <span style={{ color: 'var(--error)' }}>*</span></label>
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
                                    <div>
                                        <label className="form-label">Manufacturing Location <span style={{ color: 'var(--error)' }}>*</span></label>
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
                                </div>

                                {/* Boxes per Container - Full Width with Calculate Button */}
                                <div style={{ marginBottom: 'var(--space-3)' }}>
                                    {/* Calculate Button - Opens Modal */}
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        style={{ width: '100%', marginBottom: 'var(--space-2)' }}
                                        onClick={() => {
                                            setCalcError('');
                                            setCalcResult(null);
                                            setShowCalcModal(true);
                                        }}
                                    >
                                        Calculate no. of boxes per container
                                    </button>

                                    <label className="form-label">Boxes per Container <span style={{ color: 'var(--error)' }}>*</span></label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="e.g., 66"
                                        value={boxesPerContainer}
                                        onChange={(e) => setBoxesPerContainer(e.target.value)}
                                        min="1"
                                    />
                                    <small style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                                        How many boxes fit in {selectedContainerType?.code || 'container'}
                                    </small>
                                </div>

                                {/* Port of Loading */}
                                <div style={{ marginBottom: 'var(--space-3)' }}>
                                    <label className="form-label">Port of Loading <span style={{ color: 'var(--error)' }}>*</span></label>
                                    <select
                                        className="form-select"
                                        value={selectedPort}
                                        onChange={(e) => {
                                            setSelectedPort(e.target.value);
                                            setResult(null);
                                            if (factoryPincode.length >= 3 && e.target.value) {
                                                const port = ports.find(p => p.id == e.target.value);
                                                if (port) {
                                                    const result = calculateDistanceFromPincodeToPort(factoryPincode, port.code);
                                                    if (!result.error) {
                                                        setDistanceInfo(result);
                                                        setDistanceKm(result.distance.toString());
                                                    }
                                                }
                                            }
                                        }}
                                    >
                                        <option value="">Select port</option>
                                        {ports.map(port => (
                                            <option key={port.id} value={port.id}>{port.name} ({port.code})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Factory Pincode & Distance Row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                                    <div>
                                        <label className="form-label">Factory Pincode</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="e.g., 110001"
                                            value={factoryPincode}
                                            onChange={(e) => {
                                                const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                setFactoryPincode(pin);
                                                setDistanceInfo(null);
                                                if (pin.length >= 3 && selectedPort) {
                                                    const port = ports.find(p => p.id == selectedPort);
                                                    if (port) {
                                                        const result = calculateDistanceFromPincodeToPort(pin, port.code);
                                                        if (!result.error) {
                                                            setDistanceInfo(result);
                                                            setDistanceKm(result.distance.toString());
                                                        }
                                                    }
                                                }
                                            }}
                                            maxLength={6}
                                        />
                                        <small style={{ color: 'var(--text-muted)', fontSize: '10px' }}>For auto distance calculation</small>
                                    </div>
                                    <div>
                                        <label className="form-label">Distance (km)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="Enter or auto-calculated"
                                            value={distanceKm}
                                            onChange={(e) => setDistanceKm(e.target.value)}
                                            min="0"
                                        />
                                        {distanceInfo && (
                                            <small style={{ color: 'var(--success)', fontSize: '10px' }}>
                                                📍 {distanceInfo.from} → {distanceInfo.to}
                                            </small>
                                        )}
                                    </div>
                                </div>

                                {/* Container Count Display */}
                                {containerCount > 0 && (
                                    <div style={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--gray-300)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: 'var(--space-3)',
                                        marginBottom: 'var(--space-3)',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)' }}>
                                            {containerCount} Container{containerCount > 1 ? 's' : ''} Required
                                        </div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                                            {containerCount} × {selectedContainerType?.code} ({formatNumber(quantity)} {selectedProduct?.unit || 'units'})
                                        </div>
                                    </div>
                                )}

                                {/* Box & Payment Details */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                                    <div>
                                        <label className="form-label">Units per Outer Box</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="e.g., 12"
                                            value={unitsPerBox}
                                            onChange={(e) => { setUnitsPerBox(e.target.value); setResult(null); }}
                                            min="1"
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Payment Terms (Credit %)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="e.g., 30"
                                            value={paymentTerms}
                                            onChange={(e) => { setPaymentTerms(e.target.value); setResult(null); }}
                                            min="0"
                                            max="100"
                                        />
                                    </div>
                                </div>

                                {/* FOB Costs Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                                    <div>
                                        <label className="form-label">Container Stuffing (₹/container)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="e.g., 5000"
                                            value={containerStuffingCharge}
                                            onChange={(e) => { setContainerStuffingCharge(e.target.value); setResult(null); }}
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">India Insurance (%)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="e.g., 0.1"
                                            value={indiaInsuranceRate}
                                            onChange={(e) => { setIndiaInsuranceRate(e.target.value); setResult(null); }}
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: 'var(--space-3)' }}>
                                    <label className="form-label">Export Packing/Palletization (₹/container)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="e.g., 3000"
                                        value={exportPackingCost}
                                        onChange={(e) => { setExportPackingCost(e.target.value); setResult(null); }}
                                        min="0"
                                    />
                                    <small style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Palletization cost per container (optional)</small>
                                </div>



                                <div style={{ marginBottom: 'var(--space-3)' }}>
                                    <label className="form-label">Certifications</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
                                        {certifications.map(cert => (
                                            <label
                                                key={cert.id}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '4px 8px',
                                                    background: selectedCerts.includes(cert.id) ? 'var(--primary-100)' : 'var(--bg-secondary)',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontSize: 'var(--text-xs)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCerts.includes(cert.id)}
                                                    onChange={() => toggleCertification(cert.id)}
                                                    style={{ width: '12px', height: '12px' }}
                                                />
                                                {cert.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Extra Charges */}
                                {extraCharges.length > 0 && (
                                    <div style={{ marginTop: 'var(--space-3)' }}>
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
                                    style={{ width: '100%', fontSize: 'var(--text-sm)', marginTop: 'var(--space-3)' }}
                                >
                                    + Add Extra Charge
                                </button>
                            </div>
                        )}

                        {/* ============================================ */}
                        {/* CIF SECTION - Marine Insurance */}
                        {/* ============================================ */}
                        {selectedTier === 'cif' && (
                            <div style={{
                                background: 'var(--bg-glass)',
                                borderRadius: 'var(--radius-lg)',
                                padding: 'var(--space-4)',
                                marginBottom: 'var(--space-4)',
                                border: '2px solid var(--success)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                                    <span style={{ background: 'var(--success)', color: 'white', padding: '4px 12px', borderRadius: 'var(--radius-sm)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)' }}>CIF</span>
                                    <span className="form-label" style={{ margin: 0, fontWeight: 'var(--font-semibold)' }}>Destination & Insurance</span>
                                </div>

                                {/* Destination Row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                                    <div>
                                        <label className="form-label">Destination Country <span style={{ color: 'var(--error)' }}>*</span></label>
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
                                    <div>
                                        <label className="form-label">Destination Port <span style={{ color: 'var(--error)' }}>*</span></label>
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
                                </div>

                                {/* Sea Freight */}
                                <div>
                                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)', display: 'block' }}>
                                        Sea Freight Rate ($/container)
                                    </label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={seaFreight}
                                        onChange={(e) => { setSeaFreight(e.target.value); setResult(null); }}
                                        placeholder="e.g. 1200"
                                        min="0"
                                        style={{ fontSize: 'var(--text-sm)' }}
                                    />
                                </div>

                                {/* Marine Insurance */}
                                <div>
                                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)', display: 'block' }}>
                                        Marine Insurance Rate (%)
                                    </label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={marineInsuranceRate}
                                        onChange={(e) => { setMarineInsuranceRate(e.target.value); setResult(null); }}
                                        step="0.01"
                                        min="0"
                                        style={{ fontSize: 'var(--text-sm)' }}
                                    />
                                    <small style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                                        Applied on (FOB + Freight) value
                                    </small>
                                </div>

                                {/* CIF Extra Charges */}
                                {cifExtraCharges.length > 0 && (
                                    <div style={{ marginTop: 'var(--space-3)' }}>
                                        <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)', display: 'block' }}>
                                            CIF Extra Charges
                                        </label>
                                        {cifExtraCharges.map((charge, index) => (
                                            <div key={index} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'center' }}>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Name (e.g., Destination Handling)"
                                                    value={charge.name}
                                                    onChange={(e) => updateCifExtraCharge(index, 'name', e.target.value)}
                                                    style={{ flex: 2, fontSize: 'var(--text-sm)' }}
                                                />
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    placeholder="₹"
                                                    value={charge.amount}
                                                    onChange={(e) => updateCifExtraCharge(index, 'amount', e.target.value)}
                                                    min="0"
                                                    style={{ flex: 1, fontSize: 'var(--text-sm)' }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeCifExtraCharge(index)}
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

                                {/* Add CIF Extra Charge Button */}
                                <button
                                    type="button"
                                    onClick={addCifExtraCharge}
                                    className="btn btn-secondary btn-sm"
                                    style={{ width: '100%', fontSize: 'var(--text-sm)', marginTop: 'var(--space-3)' }}
                                >
                                    + Add CIF Extra Charge
                                </button>
                            </div>
                        )}

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

                                {/* Shipment Summary */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: selectedTier === 'exFactory' ? '1fr' : 'repeat(5, 1fr)',
                                    gap: 'var(--space-3)',
                                    padding: 'var(--space-4)',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--space-5)',
                                    border: '1px solid var(--gray-200)'
                                }}>
                                    {selectedTier !== 'exFactory' && (
                                        <>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Container</div>
                                                <div style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-lg)' }}>{result.containerCount} × {result.containerCode}</div>
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                                    {result.containerCode === '20FT' ? '5.9m × 2.35m × 2.39m' : '12m × 2.35m × 2.39m'}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Boxes</div>
                                                <div style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-lg)' }}>{result.breakdown?.totalBoxes?.toLocaleString() || Math.ceil(result.quantity / (parseInt(unitsPerBox) || 1)).toLocaleString()}</div>
                                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{boxesPerContainer} per container</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Origin</div>
                                                <div style={{ fontWeight: 'var(--font-medium)' }}>{result.loadingPort}</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Destination</div>
                                                <div style={{ fontWeight: 'var(--font-medium)' }}>{result.destinationPort}</div>
                                            </div>
                                        </>
                                    )}
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity</div>
                                        <div style={{ fontWeight: 'var(--font-bold)', fontSize: 'selectedTier === exFactory' ? 'var(--text-xl)' : 'inherit' }}>{formatNumber(result.quantity)} {result.unit}</div>
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
                                        background: selectedTier === 'exFactory' ? 'var(--black)' : 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: 'var(--space-4)',
                                        textAlign: 'center',
                                        color: selectedTier === 'exFactory' ? 'white' : 'inherit',
                                        border: '1px solid var(--gray-200)'
                                    }}>
                                        <div style={{ fontSize: 'var(--text-xs)', opacity: 0.8, marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            EX-FACTORY
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
                                            background: selectedTier === 'fob' ? 'var(--black)' : 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: 'var(--space-4)',
                                            textAlign: 'center',
                                            color: selectedTier === 'fob' ? 'white' : 'inherit',
                                            border: '1px solid var(--gray-200)'
                                        }}>
                                            <div style={{ fontSize: 'var(--text-xs)', opacity: 0.8, marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                FOB
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
                                            background: 'var(--black)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: 'var(--space-4)',
                                            textAlign: 'center',
                                            color: 'white',
                                            border: '1px solid var(--black)'
                                        }}>
                                            <div style={{ fontSize: 'var(--text-xs)', opacity: 0.8, marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                CIF
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
                                        {/* ============= EXW SECTION ============= */}
                                        {/* Product Base */}
                                        <tr style={{ background: 'var(--primary-50)' }}>
                                            <td colSpan="3" style={{ fontWeight: 'var(--font-semibold)', color: 'var(--primary-600)' }}>
                                                📦 EXW Costs
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>Product ({formatNumber(result.quantity)} × {formatUSD(result.pricing.breakdown.productBase.perUnit)})</td>
                                            <td><span className="badge badge-info">Per Unit</span></td>
                                            <td>{formatINR(result.pricing.breakdown.productBase.total)}</td>
                                        </tr>

                                        {result.pricing.breakdown.innerPacking?.total > 0 && (
                                            <tr>
                                                <td>Inner Packing ({formatNumber(result.pricing.breakdown.innerPacking.quantity)} × ₹{result.pricing.breakdown.innerPacking.perUnit}/unit)</td>
                                                <td><span className="badge badge-info">Per Unit</span></td>
                                                <td>{formatINR(result.pricing.breakdown.innerPacking.total)}</td>
                                            </tr>
                                        )}

                                        {/* Outer Packing */}
                                        {result.pricing.breakdown.outerPacking?.total > 0 && (
                                            <tr>
                                                <td>Outer Box Packing ({result.pricing.breakdown.totalBoxes} boxes × ₹{result.pricing.breakdown.outerPacking.perBox}/box)</td>
                                                <td><span className="badge badge-warning">Per Box</span></td>
                                                <td>{formatINR(result.pricing.breakdown.outerPacking.total)}</td>
                                            </tr>
                                        )}




                                        {/* Profit Margin (if applicable) */}
                                        {result.pricing.breakdown.profitIncluded?.amount > 0 && (
                                            <tr>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                        <span>💰</span>
                                                        <div>
                                                            <div>Profit Margin ({customProfitRate}% on Total)</div>
                                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Applied to entire bill</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><span className="badge badge-dark">On Total</span></td>
                                                <td>+{formatINR(result.pricing.breakdown.profitIncluded.amount)}</td>
                                            </tr>
                                        )}

                                        {/* EXW Subtotal */}
                                        {selectedTier === 'exFactory' ? (
                                            <tr style={{ background: 'var(--gray-100)', fontWeight: 'var(--font-bold)' }}>
                                                <td colSpan="2">EX-FACTORY Total</td>
                                                <td>{formatINR(result.pricing.exFactory.inr)}</td>
                                            </tr>
                                        ) : (
                                            <tr style={{ background: 'var(--gray-50)', color: 'var(--text-muted)' }}>
                                                <td colSpan="2">Ex-Factory Subtotal</td>
                                                <td>{formatINR(result.pricing.exFactory.inr - result.pricing.profit)}</td>
                                            </tr>
                                        )}

                                        {/* ============= FOB SECTION ============= */}
                                        {(selectedTier === 'fob' || selectedTier === 'cif') && (
                                            <>
                                                <tr style={{ background: 'var(--warning-50)' }}>
                                                    <td colSpan="3" style={{ fontWeight: 'var(--font-semibold)', color: 'var(--warning-700)' }}>
                                                        🚚 FOB Costs
                                                    </td>
                                                </tr>

                                                {/* Inland Transport */}
                                                <tr>
                                                    <td>Inland Transport ({result.containerCount} × {formatINR(result.pricing.breakdown.localFreight.perContainer)})</td>
                                                    <td><span className="badge badge-warning">Per Container</span></td>
                                                    <td>{formatINR(result.pricing.breakdown.localFreight.total)}</td>
                                                </tr>

                                                {/* CHA & Customs */}
                                                <tr>
                                                    <td>CHA & Customs Processing</td>
                                                    <td><span className="badge badge-info">Per Shipment</span></td>
                                                    <td>{formatINR(result.pricing.breakdown.port.cha + result.pricing.breakdown.port.customs)}</td>
                                                </tr>

                                                {/* Port Handling */}
                                                <tr>
                                                    <td>Port & Terminal Handling ({result.containerCount}×)</td>
                                                    <td><span className="badge badge-warning">Per Container</span></td>
                                                    <td>{formatINR(result.pricing.breakdown.port.handling)}</td>
                                                </tr>

                                                {/* Container Stuffing */}
                                                {result.pricing.breakdown.containerStuffing?.total > 0 && (
                                                    <tr>
                                                        <td>Container Stuffing ({result.containerCount}×)</td>
                                                        <td><span className="badge badge-warning">Per Container</span></td>
                                                        <td>{formatINR(result.pricing.breakdown.containerStuffing.total)}</td>
                                                    </tr>
                                                )}

                                                {/* Export Packing/Palletization */}
                                                {result.pricing.breakdown.exportPacking?.total > 0 && (
                                                    <tr>
                                                        <td>Export Packing/Palletization ({result.containerCount}×)</td>
                                                        <td><span className="badge badge-warning">Per Container</span></td>
                                                        <td>{formatINR(result.pricing.breakdown.exportPacking.total)}</td>
                                                    </tr>
                                                )}

                                                {/* Certifications */}
                                                {result.pricing.breakdown.certifications.items.map((cert, idx) => (
                                                    <tr key={`cert-${idx}`}>
                                                        <td>{cert.name}</td>
                                                        <td><span className="badge badge-info">Per Shipment</span></td>
                                                        <td>{formatINR(cert.cost)}</td>
                                                    </tr>
                                                ))}

                                                {/* FOB Subtotal/Total */}
                                                {selectedTier === 'fob' ? (
                                                    <tr style={{ background: 'var(--gray-100)', fontWeight: 'var(--font-bold)' }}>
                                                        <td colSpan="2">FOB Total</td>
                                                        <td>{formatINR(result.pricing.fob.inr)}</td>
                                                    </tr>
                                                ) : (
                                                    <tr style={{ background: 'var(--bg-glass)', fontWeight: 'var(--font-semibold)' }}>
                                                        <td colSpan="2">FOB Subtotal</td>
                                                        <td>{formatINR(result.pricing.fob.baseInr)}</td>
                                                    </tr>
                                                )}
                                            </>
                                        )}

                                        {/* ============= CIF SECTION ============= */}
                                        {selectedTier === 'cif' && (
                                            <>
                                                <tr style={{ background: 'var(--success-50)' }}>
                                                    <td colSpan="3" style={{ fontWeight: 'var(--font-semibold)', color: 'var(--success-700)' }}>
                                                        🚢 CIF Costs
                                                    </td>
                                                </tr>

                                                {/* Sea Freight */}
                                                <tr>
                                                    <td>
                                                        Sea Freight ({result.containerCount} × {formatUSD(result.pricing.breakdown.freight.perContainer)})
                                                        <br />
                                                        <small style={{ color: 'var(--text-muted)' }}>
                                                            + {result.pricing.breakdown.freight.gstRate}% GST
                                                        </small>
                                                    </td>
                                                    <td><span className="badge badge-warning">Per Container</span></td>
                                                    <td>{formatINR(result.pricing.breakdown.freight.totalWithGST)}</td>
                                                </tr>

                                                {/* Marine Insurance with ICC Type */}
                                                <tr>
                                                    <td>
                                                        Marine Insurance ({result.pricing.breakdown.insurance.type} @ {result.pricing.breakdown.insurance.rate}%)
                                                    </td>
                                                    <td><span className="badge badge-info">Percentage</span></td>
                                                    <td>{formatINR(result.pricing.breakdown.insurance.total)}</td>
                                                </tr>

                                                {/* ECGC */}
                                                <tr>
                                                    <td>ECGC Premium ({result.pricing.breakdown.ecgc.rate}%)</td>
                                                    <td><span className="badge badge-info">Percentage</span></td>
                                                    <td>{formatINR(result.pricing.breakdown.ecgc.total)}</td>
                                                </tr>

                                                {/* Bank Charges */}
                                                <tr>
                                                    <td>Bank Charges ({result.pricing.breakdown.bankCharges.rate}%)</td>
                                                    <td><span className="badge badge-info">Percentage</span></td>
                                                    <td>{formatINR(result.pricing.breakdown.bankCharges.total)}</td>
                                                </tr>

                                                {/* CIF Total */}
                                                <tr style={{ background: 'var(--gray-100)', fontWeight: 'var(--font-bold)' }}>
                                                    <td colSpan="2">CIF Total</td>
                                                    <td>{formatINR(result.pricing.cif.inr)}</td>
                                                </tr>
                                            </>
                                        )}

                                        {/* Profit Row - Applied to Entire Bill */}

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
                                    <button className="btn btn-primary" onClick={handleDownloadPDF}>
                                        Download PDF
                                    </button>
                                    <button className="btn btn-secondary" onClick={handleWhatsAppShare}>
                                        Share via WhatsApp
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

            {/* Client Details Modal for PDF */}
            {showClientModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 'var(--space-4)'
                }} onClick={() => setShowClientModal(false)}>
                    <div style={{
                        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)',
                        padding: 'var(--space-6)', maxWidth: '450px', width: '100%'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                            <h3 style={{ margin: 0 }}>Generate Quotation</h3>
                            <button onClick={() => setShowClientModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
                        </div>

                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                            Enter client details to personalize the quotation PDF
                        </p>

                        <div style={{ marginBottom: 'var(--space-3)' }}>
                            <label style={{ display: 'block', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)', color: 'var(--text-secondary)' }}>
                                Client Name *
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., John Smith"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--space-3)' }}>
                            <label style={{ display: 'block', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)', color: 'var(--text-secondary)' }}>
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                className="form-input"
                                placeholder="e.g., +1 234 567 8900"
                                value={clientPhone}
                                onChange={(e) => setClientPhone(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--space-4)' }}>
                            <label style={{ display: 'block', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)', color: 'var(--text-secondary)' }}>
                                Company Name
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g., ABC Trading Co."
                                value={clientCompany}
                                onChange={(e) => setClientCompany(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowClientModal(false)}
                                style={{ flex: 1 }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-accent"
                                onClick={handleGeneratePDF}
                                style={{ flex: 1 }}
                            >
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                CONTAINER_SPECS={getContainerSpecs}
            />
        </>
    );
}

// Container Calculator Modal Component - integrated at the end of the file
function ContainerCalcModal({ show, onClose, containerCode, onCalc, calcResult, calcError, boxLength, setBoxLength, boxWidth, setBoxWidth, boxHeight, setBoxHeight, boxWeight, setBoxWeight, onApply, CONTAINER_SPECS }) {
    if (!show) return null;
    // CONTAINER_SPECS is now a function, call it with containerCode
    const container = typeof CONTAINER_SPECS === 'function' ? CONTAINER_SPECS(containerCode) : (CONTAINER_SPECS[containerCode] || CONTAINER_SPECS['20FT']);

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
                    <h3 style={{ margin: 0 }}>Calculate Box Capacity</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
                </div>

                {/* Container Info */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-2)', padding: 'var(--space-3)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--text-xs)' }}>
                    <div><div style={{ color: 'var(--text-muted)' }}>Container</div><div style={{ fontWeight: 'bold' }}>{containerCode}</div></div>
                    <div><div style={{ color: 'var(--text-muted)' }}>L</div><div>{(container.lengthCm / 100).toFixed(1)}m</div></div>
                    <div><div style={{ color: 'var(--text-muted)' }}>W</div><div>{(container.widthCm / 100).toFixed(2)}m</div></div>
                    <div><div style={{ color: 'var(--text-muted)' }}>H</div><div>{(container.heightCm / 100).toFixed(2)}m</div></div>
                    <div><div style={{ color: 'var(--text-muted)' }}>Max Load</div><div style={{ fontWeight: 'bold' }}>{(container.maxWeightKg / 1000).toFixed(1)}T</div></div>
                </div>

                {calcError && <div style={{ background: 'var(--error-light)', color: 'var(--error)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>{calcError}</div>}

                {/* Box Dimensions */}
                <div style={{ marginBottom: 'var(--space-3)' }}>
                    <label style={{ fontSize: 'var(--text-sm)', fontWeight: '600', marginBottom: 'var(--space-2)', display: 'block' }}>Box Dimensions (cm)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                        <input type="number" className="form-input" placeholder="Length" value={boxLength} onChange={e => setBoxLength(e.target.value)} min="1" style={{ fontSize: 'var(--text-sm)' }} />
                        <input type="number" className="form-input" placeholder="Width" value={boxWidth} onChange={e => setBoxWidth(e.target.value)} min="1" style={{ fontSize: 'var(--text-sm)' }} />
                        <input type="number" className="form-input" placeholder="Height" value={boxHeight} onChange={e => setBoxHeight(e.target.value)} min="1" style={{ fontSize: 'var(--text-sm)' }} />
                    </div>
                </div>

                {/* Weight */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{ fontSize: 'var(--text-sm)', fontWeight: '600', marginBottom: 'var(--space-2)', display: 'block' }}>Weight per Box (kg)</label>
                    <input type="number" className="form-input" placeholder="e.g., 5" value={boxWeight} onChange={e => setBoxWeight(e.target.value)} min="0.1" step="0.1" style={{ fontSize: 'var(--text-sm)' }} />
                </div>

                <button className="btn btn-primary" onClick={onCalc} style={{ width: '100%', marginBottom: 'var(--space-4)' }}>Calculate</button>

                {/* Results */}
                {calcResult && (
                    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--gray-300)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' }}>
                        {/* Boxes per Container */}
                        <div style={{ textAlign: 'center', marginBottom: 'var(--space-3)' }}>
                            <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold' }}>{calcResult.boxesPerContainer}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>boxes per {containerCode}</div>
                        </div>

                        {/* Weight per Container */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-3)' }}>
                            <div style={{ padding: 'var(--space-2)', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                <div style={{ color: 'var(--text-muted)' }}>Weight/Container</div>
                                <div style={{ fontWeight: '600' }}>{calcResult.weightPerContainer.toLocaleString()} kg</div>
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
                                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>
                                        {calcResult.totalContainers} Container{calcResult.totalContainers > 1 ? 's' : ''} Required
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center', fontSize: 'var(--text-sm)' }}>
                                    {calcResult.fullContainers > 0 && (
                                        <span>
                                            {calcResult.fullContainers} Full
                                        </span>
                                    )}
                                    {calcResult.fullContainers > 0 && calcResult.remainingBoxes > 0 && ' + '}
                                    {calcResult.remainingBoxes > 0 && (
                                        <span style={{ color: 'var(--text-muted)' }}>
                                            1 at {calcResult.lastContainerPercent}% ({calcResult.remainingBoxes} boxes)
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {!calcResult.totalWeightKg && (
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 'var(--space-3)', fontStyle: 'italic' }}>
                                Enter "Total Weight to Ship" in main form to see container breakdown
                            </div>
                        )}

                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 'var(--space-3)' }}>
                            Note: Limited by {calcResult.limitedBy} (max {calcResult.limitedBy === 'weight' ? calcResult.maxByWeight : calcResult.maxByVolume} boxes)
                        </div>
                        <button className="btn btn-primary" onClick={onApply} style={{ width: '100%' }}>Use {calcResult.boxesPerContainer} boxes x {calcResult.boxWeight} kg/box</button>
                    </div>
                )}
            </div>
        </div>
    );
}
