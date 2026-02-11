/**
 * AROVAVE GLOBAL - Export Rate Calculator Engine v2
 * Container-Based FCL Export Pricing System
 * 
 * Calculation Flow:
 * EX-FACTORY → Container Count → Local Freight → Handling → Port → FOB
 * → ECGC → Int'l Freight → Currency → Insurance → Bank → Profit → CIF
 */

// ============================================
// CONTAINER CALCULATION
// ============================================

/**
 * Calculate number of containers required
 * @param {number} quantity - Total quantity ordered
 * @param {number} qtyPerContainer - How much fits in 1 container (user defined)
 * @returns {number} Number of containers needed
 */
export function calculateContainers(quantity, qtyPerContainer) {
    if (!quantity || !qtyPerContainer || qtyPerContainer <= 0) {
        return 1;
    }
    return Math.ceil(quantity / qtyPerContainer);
}

// ============================================
// CURRENCY CONVERSION
// ============================================

/**
 * Convert foreign currency to INR with bank margin
 * @param {number} amount - Amount in foreign currency
 * @param {number} exchangeRate - Base exchange rate to INR
 * @param {number} bankMargin - Bank's margin (e.g., 0.50)
 * @returns {number} Amount in INR
 */
export function convertToINR(amount, exchangeRate, bankMargin = 0) {
    const effectiveRate = exchangeRate + bankMargin;
    return amount * effectiveRate;
}

/**
 * Convert INR to USD for display
 * @param {number} amountINR
 * @param {number} usdRate
 * @returns {number}
 */
export function convertToUSD(amountINR, usdRate) {
    if (!usdRate || usdRate <= 0) return 0;
    return amountINR / usdRate;
}

// ============================================
// COST AGGREGATION
// ============================================

/**
 * Calculate costs based on charge type
 * @param {Array} costHeads - Array of cost head objects
 * @param {number} containerCount - Number of containers
 * @param {number} quantity - Total quantity
 * @param {number} baseValue - Base value for percentage calculations
 * @returns {Object} Categorized costs
 */
export function calculateCostHeads(costHeads, containerCount, quantity, baseValue = 0) {
    let perShipmentTotal = 0;
    let perContainerTotal = 0;
    const breakdown = [];

    costHeads.forEach(cost => {
        if (!cost.is_active) return;

        let amount = 0;
        let displayAmount = 0;

        if (cost.calculation_base === 'percentage') {
            amount = baseValue * (cost.percentage_rate / 100);
            displayAmount = amount;
        } else {
            amount = parseFloat(cost.base_amount) || 0;

            if (cost.charge_type === 'per_container') {
                displayAmount = amount * containerCount;
                perContainerTotal += displayAmount;
            } else if (cost.charge_type === 'per_unit') {
                displayAmount = amount * quantity;
                perShipmentTotal += displayAmount;
            } else {
                // per_shipment
                displayAmount = amount;
                perShipmentTotal += displayAmount;
            }
        }

        if (displayAmount > 0) {
            breakdown.push({
                name: cost.name,
                chargeType: cost.charge_type,
                unitAmount: amount,
                quantity: cost.charge_type === 'per_container' ? containerCount : 1,
                total: displayAmount
            });
        }
    });

    return {
        perShipment: roundToTwo(perShipmentTotal),
        perContainer: roundToTwo(perContainerTotal),
        total: roundToTwo(perShipmentTotal + perContainerTotal),
        breakdown
    };
}

// ============================================
// MAIN CALCULATION ENGINE
// ============================================

/**
 * Complete export pricing calculation
 * @param {Object} params - All input parameters
 * @returns {Object} Complete pricing breakdown
 */
export function calculateExportPricing({
    // Product & Quantity
    product,
    customPriceUsd = null, // Optional: user can override product price
    quantity,

    // Container
    containerType,
    qtyPerContainer,
    containerCount: providedContainerCount = null, // Optional: pass pre-calculated container count
    customPrice = null, // Optional: temporary price override (USD)

    // Locations
    localFreightRate,  // Rate per container in INR

    // Port charges
    portHandlingPerContainer,
    chaCharges,
    customsClearance,

    // Cost heads
    costHeads = [],

    // Certifications
    certifications = [],

    // International Freight
    freightRate,  // Per container in foreign currency
    freightCurrency = 'USD',
    freightConversionRate = 1.0,
    freightGST = 5,

    // Currency settings
    exchangeRate = 83.50,
    bankMargin = 0.50,

    // ECGC
    ecgcRate = 0.50,

    // Insurance
    insuranceRate = 0.50,
    minInsurance = 5000,

    // Bank charges
    bankChargeRate = 0.25,

    // Profit
    profitRate = 5.0,
    profitType = 'percentage',

    // Display currency
    displayCurrency = 'USD',

    // Selected pricing tier: 'exFactory', 'fob', or 'cif'
    // Profit will be calculated at the selected tier
    selectedTier = 'cif',

    // Custom charges (in INR)
    packagingCharges = 0,
    extraCharges = 0, // Treated as FOB Extra Charges
    exwExtraCharges = 0, // NEW: EXW Extra Charges
    cifExtraCharges = 0, // NEW: CIF Extra Charges

    // NEW: Restructured cost breakdown fields
    innerPackingTotal = 0,
    outerPackingTotal = 0,
    containerStuffingTotal = 0,
    exportPackingTotal = 0,
    indiaInsuranceRate = 0,
    marineInsuranceRate = 0.50, // Replaces marineInsuranceType

    totalBoxes = 0,
    totalUnits = 0, // NEW: Explicit unit count (if different from quantity)
    paymentTerms = 0
}) {

    // ============================================
    // STEP 1: CONTAINER CALCULATION
    // ============================================
    // Use provided container count if available, otherwise calculate
    const containerCount = providedContainerCount !== null && providedContainerCount > 0
        ? providedContainerCount
        : calculateContainers(quantity, qtyPerContainer);

    // ============================================
    // STEP 2: PACKAGING CHARGES (per box, added to product cost)
    // ============================================
    const totalPackagingCharges = parseFloat(packagingCharges) || 0;
    const totalExwExtraCharges = parseFloat(exwExtraCharges) || 0;
    // Note: extraCharges (FOB) removed from here and moved to FOB step

    // ============================================
    // STEP 3: EX-FACTORY COST (Product + Packaging + EXW Extras)
    // ============================================
    const basePrice = (customPriceUsd !== null && customPriceUsd > 0) ? customPriceUsd : (parseFloat(product.base_price_usd) || 0);
    const exFactoryProductUSD = basePrice * quantity;
    const exFactoryProductINR = convertToINR(exFactoryProductUSD, exchangeRate, 0);

    // Add packaging and EXW extra charges to Ex-Factory
    const exFactoryINR = exFactoryProductINR + totalPackagingCharges + totalExwExtraCharges;
    const exFactoryUSD = convertToUSD(exFactoryINR, exchangeRate);

    // ============================================
    // STEP 3: LOCAL FREIGHT (Per Container)
    // ============================================
    const localFreightPerContainer = parseFloat(localFreightRate) || 0;
    const localFreightTotal = localFreightPerContainer * containerCount;

    // ============================================
    // STEP 4: HANDLING & LABOUR (From Cost Heads)
    // ============================================
    const handlingCosts = calculateCostHeads(
        costHeads.filter(c => c.category === 'handling'),
        containerCount,
        quantity,
        exFactoryINR
    );

    // ============================================
    // STEP 5: PORT CHARGES
    // ============================================
    const portHandlingTotal = (parseFloat(portHandlingPerContainer) || 0) * containerCount;
    const chaTotal = parseFloat(chaCharges) || 0;  // Per shipment
    const customsTotal = parseFloat(customsClearance) || 0;  // Per shipment

    const portCosts = {
        handling: portHandlingTotal,
        cha: chaTotal,
        customs: customsTotal,
        total: portHandlingTotal + chaTotal + customsTotal
    };

    // ============================================
    // STEP 6: MISCELLANEOUS CHARGES
    // ============================================
    const miscCosts = calculateCostHeads(
        costHeads.filter(c => c.category === 'misc'),
        containerCount,
        quantity,
        exFactoryINR
    );

    // ============================================
    // STEP 7: CERTIFICATIONS
    // ============================================
    let certificationTotal = 0;
    const certBreakdown = [];

    certifications.forEach(cert => {
        let cost = 0;
        if (cert.cost_percentage > 0) {
            cost = exFactoryINR * (cert.cost_percentage / 100);
        } else {
            cost = parseFloat(cert.cost_flat) || 0;
            if (cert.charge_type === 'per_container') {
                cost = cost * containerCount;
            }
        }
        certificationTotal += cost;
        if (cost > 0) {
            certBreakdown.push({ name: cert.name, cost: roundToTwo(cost) });
        }
    });

    // ============================================
    // STEP 8: FOB CALCULATION
    // ============================================
    // Add legacy/FOB extra charges here (container stuffing, export packing, etc)
    const totalFobExtraCharges = parseFloat(extraCharges) || 0;

    // Calculate Indian Insurance (Compulsory per shipment)
    // Applied on cumulative cost before final FOB aggregation
    // Base for Indian Insurance = Ex-Factory + Local Freight + Handling + Port Charges + Misc
    const indianInsuranceBase = exFactoryINR + localFreightTotal + handlingCosts.total + portCosts.total + miscCosts.total;
    const indianInsuranceCost = indianInsuranceBase * (parseFloat(indiaInsuranceRate) / 100);

    const fobINR = exFactoryINR
        + localFreightTotal
        + handlingCosts.total
        + portCosts.total
        + miscCosts.total
        + certificationTotal
        + totalFobExtraCharges
        + indianInsuranceCost; // Add Indian Insurance to FOB

    const fobUSD = convertToUSD(fobINR, exchangeRate);

    // ============================================
    // STEP 9: INTERNATIONAL FREIGHT (CFR)
    // ============================================
    const freightAmountUSD = (parseFloat(freightRate) || 0) * containerCount;

    // Apply freight conversion rate
    const freightAdjusted = freightAmountUSD * (parseFloat(freightConversionRate) || 1);

    // Convert to INR with bank margin
    const freightINR = convertToINR(freightAdjusted, exchangeRate, bankMargin);

    // Add GST on freight
    const freightGSTAmount = freightINR * (freightGST / 100);
    const freightWithGST = freightINR + freightGSTAmount;

    // ============================================
    // STEP 10: ECGC (Export Credit Guarantee)
    // ============================================
    const ecgcAmount = fobINR * (ecgcRate / 100);

    // ============================================
    // STEP 11: MARINE INSURANCE (CIF)
    // ============================================
    // Calculated as percentage of (CFR Value + 10%) usually, but keeping it simple as % of CFR Base
    // Base = FOB + Freight
    const cfrBase = fobINR + freightINR; // Use freightINR without GST for insurance base
    const marineInsuranceCost = cfrBase * (parseFloat(marineInsuranceRate) / 100);
    const insuranceTotal = Math.max(marineInsuranceCost, parseFloat(minInsurance) || 0);

    // ============================================
    // STEP 12: BANK CHARGES
    // ============================================
    // Base for bank charges: FOB + ECGC + Freight (with GST) + Marine Insurance + CIF Extra Charges
    const cifBaseForBankCharges = fobINR + ecgcAmount + freightWithGST + insuranceTotal;
    const bankCharges = cifBaseForBankCharges * (bankChargeRate / 100);

    // ============================================
    // STEP 13: PROFIT MARGIN (Applied at selected tier)
    // ============================================
    const totalCifExtraCharges = parseFloat(cifExtraCharges) || 0;
    const costBaseCIF = cifBaseForBankCharges + bankCharges + totalCifExtraCharges;

    // Calculate profit base based on selected tier
    let profitBase = 0;
    if (selectedTier === 'exFactory') {
        profitBase = exFactoryINR;
    } else if (selectedTier === 'fob') {
        profitBase = fobINR;
    } else {
        // CIF - use full cost base
        profitBase = costBaseCIF;
    }

    let profitAmount = 0;
    if (profitType === 'percentage') {
        profitAmount = profitBase * (profitRate / 100);
    } else if (profitType === 'per_container') {
        profitAmount = profitRate * containerCount;
    } else if (profitType === 'per_unit') {
        profitAmount = profitRate * quantity;
    } else {
        profitAmount = profitRate;  // Fixed amount
    }

    // ============================================
    // STEP 14: FINAL PRICES WITH PROFIT AT SELECTED TIER
    // ============================================

    // Calculate final prices based on selected tier
    let exFactoryFinalINR = exFactoryINR;
    let fobFinalINR = fobINR;
    let cifFinalINR = costBaseCIF;

    if (selectedTier === 'exFactory') {
        // Profit added to Ex Factory only
        exFactoryFinalINR = exFactoryINR + profitAmount;
        fobFinalINR = fobINR + profitAmount; // Profit flows through
        cifFinalINR = costBaseCIF + profitAmount; // Profit flows through
    } else if (selectedTier === 'fob') {
        // Profit added to FOB
        exFactoryFinalINR = exFactoryINR;
        fobFinalINR = fobINR + profitAmount;
        cifFinalINR = costBaseCIF + profitAmount; // Profit flows through
    } else {
        // CIF - profit added to full cost (current behavior)
        exFactoryFinalINR = exFactoryINR;
        fobFinalINR = fobINR;
        cifFinalINR = costBaseCIF + profitAmount;
    }

    const exFactoryFinalUSD = convertToUSD(exFactoryFinalINR, exchangeRate);
    const fobFinalUSD = convertToUSD(fobFinalINR, exchangeRate);
    const cifFinalUSD = convertToUSD(cifFinalINR, exchangeRate);

    // ============================================
    // RETURN COMPLETE BREAKDOWN
    // ============================================
    return {
        // Container info
        containerType: containerType?.name || 'N/A',
        containerCode: containerType?.code || 'N/A',
        qtyPerContainer,
        containerCount,

        // Selected pricing tier info
        selectedTier,
        tierLabels: {
            exFactory: 'Ex Factory',
            fob: 'FOB (Free on Board)',
            cif: 'CIF (Cost Insurance Freight)'
        },

        // Main prices (with profit applied at selected tier)
        exFactory: {
            inr: roundToTwo(exFactoryFinalINR),
            usd: roundToTwo(exFactoryFinalUSD),
            baseInr: roundToTwo(exFactoryINR),
            baseUsd: roundToTwo(exFactoryUSD)
        },
        fob: {
            inr: roundToTwo(fobFinalINR),
            usd: roundToTwo(fobFinalUSD),
            baseInr: roundToTwo(fobINR),
            baseUsd: roundToTwo(convertToUSD(fobINR, exchangeRate))
        },
        cif: {
            inr: roundToTwo(cifFinalINR),
            usd: roundToTwo(cifFinalUSD),
            baseInr: roundToTwo(costBaseCIF),
            baseUsd: roundToTwo(convertToUSD(costBaseCIF, exchangeRate))
        },

        // Per unit prices (using final prices with profit)
        perUnit: {
            exFactory: roundToTwo(exFactoryFinalUSD / quantity),
            fob: roundToTwo(fobFinalUSD / quantity),
            cif: roundToTwo(cifFinalUSD / quantity)
        },

        // Detailed breakdown
        breakdown: {
            productBase: {
                label: 'Product Base Price',
                perUnit: basePrice,
                quantity,
                total: roundToTwo(exFactoryProductINR),
                chargeType: 'per_unit'
            },
            customCharges: {
                label: 'Packaging & Extra Charges',
                total: roundToTwo(totalPackagingCharges + totalExwExtraCharges + totalFobExtraCharges + totalCifExtraCharges),
                chargeType: 'flat'
            },
            // NEW: EXW Packing breakdown
            innerPacking: {
                label: 'Inner Packing',
                perUnit: roundToTwo(innerPackingTotal / (totalUnits && totalUnits > 0 ? totalUnits : (quantity || 1))),
                quantity: totalUnits && totalUnits > 0 ? totalUnits : quantity,
                total: roundToTwo(innerPackingTotal),
                chargeType: 'per_unit'
            },
            outerPacking: {
                label: 'Outer Box Packing',
                perBox: roundToTwo(outerPackingTotal / (totalBoxes || 1)),
                boxes: totalBoxes,
                total: roundToTwo(outerPackingTotal),
                chargeType: 'per_box'
            },
            totalBoxes: totalBoxes,
            localFreight: {
                label: 'Inland Transport',
                perContainer: localFreightPerContainer,
                containers: containerCount,
                total: roundToTwo(localFreightTotal),
                chargeType: 'per_container'
            },
            handling: handlingCosts,
            port: {
                label: 'Port Charges',
                handling: roundToTwo(portHandlingTotal),
                cha: roundToTwo(chaTotal),
                customs: roundToTwo(customsTotal),
                total: roundToTwo(portCosts.total),
                chargeType: 'mixed'
            },
            // NEW: FOB extra costs
            containerStuffing: {
                label: 'Container Stuffing',
                perContainer: roundToTwo(containerStuffingTotal / (containerCount || 1)),
                containers: containerCount,
                total: roundToTwo(containerStuffingTotal),
                chargeType: 'per_container'
            },
            exportPacking: {
                label: 'Export Packing/Palletization',
                perContainer: roundToTwo(exportPackingTotal / (containerCount || 1)),
                containers: containerCount,
                total: roundToTwo(exportPackingTotal),
                chargeType: 'per_container'
            },
            indianInsurance: {
                label: 'Insurance (India Side)',
                base: roundToTwo(indianInsuranceBase),
                rate: indiaInsuranceRate,
                total: roundToTwo(indianInsuranceCost),
                chargeType: 'percentage'
            },
            paymentTerms: {
                label: 'Payment Terms',
                creditPercent: paymentTerms,
                chargeType: 'info'
            },
            misc: miscCosts,
            certifications: {
                items: certBreakdown,
                total: roundToTwo(certificationTotal)
            },
            ecgc: {
                label: 'ECGC Premium',
                rate: ecgcRate,
                creditPercent: paymentTerms,
                total: roundToTwo(ecgcAmount),
                chargeType: 'percentage'
            },
            freight: {
                label: 'Sea Freight',
                perContainer: freightRate,
                containers: containerCount,
                currency: freightCurrency,
                foreignTotal: roundToTwo(freightAmountUSD),
                conversionRate: freightConversionRate,
                exchangeRate: exchangeRate + bankMargin,
                inrTotal: roundToTwo(freightINR),
                gstRate: freightGST,
                gstAmount: roundToTwo(freightGSTAmount),
                totalWithGST: roundToTwo(freightWithGST),
                chargeType: 'per_container'
            },
            insurance: {
                label: 'Marine Insurance',
                type: 'Standard',
                rate: insuranceRate,
                total: roundToTwo(insuranceTotal),
                chargeType: 'percentage'
            },
            bankCharges: {
                label: 'Bank Charges',
                rate: bankChargeRate,
                total: roundToTwo(bankCharges),
                chargeType: 'percentage'
            },
            // Profit is merged into the selected tier rate - not shown separately
            profitIncluded: {
                tier: selectedTier,
                rate: profitRate,
                amount: roundToTwo(profitAmount)
            }
        },

        // Summary by charge type
        summary: {
            perShipmentCosts: roundToTwo(
                handlingCosts.perShipment +
                chaTotal +
                customsTotal +
                miscCosts.perShipment +
                certificationTotal +
                ecgcAmount +
                insuranceTotal +
                bankCharges +
                profitAmount
            ),
            perContainerCosts: roundToTwo(
                localFreightTotal +
                handlingCosts.perContainer +
                portHandlingTotal +
                miscCosts.perContainer +
                freightWithGST
            )
        },

        // Currency info
        currency: {
            exchange: exchangeRate,
            bankMargin,
            effective: exchangeRate + bankMargin
        }
    };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Round to 2 decimal places
 */
function roundToTwo(value) {
    return Math.round((value || 0) * 100) / 100;
}

/**
 * Format currency (INR)
 */
export function formatINR(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount || 0);
}

/**
 * Format currency (USD)
 */
export function formatUSD(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount || 0);
}

/**
 * Format number with commas (Indian style)
 */
export function formatNumber(num) {
    return new Intl.NumberFormat('en-IN').format(num || 0);
}

/**
 * Format as percentage
 */
export function formatPercent(rate) {
    return `${rate}%`;
}
