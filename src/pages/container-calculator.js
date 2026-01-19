import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

// Container specifications (internal dimensions in cm)
const CONTAINER_SPECS = {
    '20FT': {
        name: '20 Foot Container',
        lengthCm: 590,  // 5.9m
        widthCm: 235,   // 2.35m
        heightCm: 239,  // 2.39m
        maxWeightKg: 28000,
        lengthFt: '19.4 ft',
        widthFt: '7.7 ft',
        heightFt: '7.8 ft'
    },
    '40FT': {
        name: '40 Foot Container',
        lengthCm: 1200, // 12.0m
        widthCm: 235,   // 2.35m
        heightCm: 239,  // 2.39m
        maxWeightKg: 28000,
        lengthFt: '39.5 ft',
        widthFt: '7.7 ft',
        heightFt: '7.8 ft'
    }
};

export default function ContainerCalculator() {
    // State
    const [containerType, setContainerType] = useState('20FT');
    const [boxLength, setBoxLength] = useState('');
    const [boxWidth, setBoxWidth] = useState('');
    const [boxHeight, setBoxHeight] = useState('');
    const [boxWeight, setBoxWeight] = useState('');
    const [totalWeight, setTotalWeight] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const container = CONTAINER_SPECS[containerType];

    // Calculate packing
    const handleCalculate = () => {
        setError('');
        setResult(null);

        // Validation
        const length = parseFloat(boxLength);
        const width = parseFloat(boxWidth);
        const height = parseFloat(boxHeight);
        const weight = parseFloat(boxWeight);
        const totalWt = parseFloat(totalWeight);

        if (!length || length <= 0) return setError('Please enter valid box length');
        if (!width || width <= 0) return setError('Please enter valid box width');
        if (!height || height <= 0) return setError('Please enter valid box height');
        if (!weight || weight <= 0) return setError('Please enter valid box weight');
        if (!totalWt || totalWt <= 0) return setError('Please enter valid total weight to ship');

        // Calculate total boxes needed from weight
        const totalBoxes = Math.ceil(totalWt / weight);

        // Check if box fits in container
        if (length > container.lengthCm || width > container.widthCm || height > container.heightCm) {
            // Try rotating the box
            const dims = [length, width, height].sort((a, b) => b - a);
            if (dims[0] > container.lengthCm || dims[1] > container.widthCm || dims[2] > container.heightCm) {
                return setError('Box is too large to fit in the container!');
            }
        }

        // Calculate boxes by VOLUME (optimize orientation)
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

        // Calculate containers needed
        const fullContainers = Math.floor(totalBoxes / boxesPerContainer);
        const remainingBoxes = totalBoxes % boxesPerContainer;
        const totalContainers = remainingBoxes > 0 ? fullContainers + 1 : fullContainers;
        const lastContainerFillPercent = remainingBoxes > 0
            ? Math.round((remainingBoxes / boxesPerContainer) * 100)
            : 100;

        // Volume utilization
        const boxVolume = (length * width * height) / 1000000; // m³
        const containerVolume = (container.lengthCm * container.widthCm * container.heightCm) / 1000000; // m³
        const volumeUtilization = Math.round((boxesPerContainer * boxVolume / containerVolume) * 100);

        // Weight utilization
        const weightPerContainer = boxesPerContainer * weight;
        const weightUtilization = Math.round((weightPerContainer / container.maxWeightKg) * 100);

        setResult({
            boxesPerContainer,
            totalBoxes,
            totalWeight: totalWt,
            limitedBy,
            maxByVolume: maxBoxesByVolume,
            maxByWeight: maxBoxesByWeight,
            fullContainers,
            remainingBoxes,
            totalContainers,
            lastContainerFillPercent,
            volumeUtilization,
            weightUtilization,
            weightPerContainer,
            orientation: bestOrientation,
            boxDims: { length, width, height, weight }
        });
    };

    return (
        <>
            <Head>
                <title>Container Capacity Calculator | Arovave Global</title>
            </Head>

            <div className="container">
                {/* Header */}
                <header className="header">
                    <div className="header-content">
                        <div className="logo">
                            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                <div className="logo-icon">AG</div>
                                <div>
                                    <div className="logo-text">AROVAVE GLOBAL</div>
                                    <div className="logo-tagline">Container Capacity Calculator</div>
                                </div>
                            </Link>
                        </div>
                        <Link href="/" className="btn btn-secondary btn-sm">← Back to Calculator</Link>
                    </div>
                </header>

                <main>
                    <div className="card">
                        <h2 style={{ marginBottom: 'var(--space-6)' }}>📦 Calculate Container Capacity</h2>

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

                        {/* Container Type Selection */}
                        <div className="form-group">
                            <label className="form-label">Container Type *</label>
                            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                                {Object.entries(CONTAINER_SPECS).map(([code, spec]) => (
                                    <button
                                        key={code}
                                        className={`btn ${containerType === code ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => { setContainerType(code); setResult(null); }}
                                        style={{ flex: 1 }}
                                    >
                                        {code}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Container Dimensions Display */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: 'var(--space-3)',
                            padding: 'var(--space-4)',
                            background: 'linear-gradient(135deg, rgba(0, 168, 168, 0.1), rgba(0, 168, 168, 0.05))',
                            border: '1px solid var(--primary-500)',
                            borderRadius: 'var(--radius-lg)',
                            marginBottom: 'var(--space-5)',
                            textAlign: 'center'
                        }}>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Length</div>
                                <div style={{ fontWeight: 'var(--font-bold)', color: 'var(--primary-400)' }}>{container.lengthFt}</div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{(container.lengthCm / 100).toFixed(1)}m</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Width</div>
                                <div style={{ fontWeight: 'var(--font-bold)', color: 'var(--primary-400)' }}>{container.widthFt}</div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{(container.widthCm / 100).toFixed(2)}m</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Height</div>
                                <div style={{ fontWeight: 'var(--font-bold)', color: 'var(--primary-400)' }}>{container.heightFt}</div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{(container.heightCm / 100).toFixed(2)}m</div>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Max Weight</div>
                                <div style={{ fontWeight: 'var(--font-bold)', color: 'var(--accent-400)' }}>{(container.maxWeightKg / 1000).toFixed(0)}T</div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{container.maxWeightKg.toLocaleString()} kg</div>
                            </div>
                        </div>

                        {/* Box Dimensions Input */}
                        <div style={{ marginBottom: 'var(--space-4)' }}>
                            <label className="form-label" style={{ marginBottom: 'var(--space-3)' }}>📦 Box Dimensions (in cm) *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
                                <div>
                                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Length (cm)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="e.g., 50"
                                        value={boxLength}
                                        onChange={(e) => { setBoxLength(e.target.value); setResult(null); }}
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Width (cm)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="e.g., 30"
                                        value={boxWidth}
                                        onChange={(e) => { setBoxWidth(e.target.value); setResult(null); }}
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Height (cm)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="e.g., 20"
                                        value={boxHeight}
                                        onChange={(e) => { setBoxHeight(e.target.value); setResult(null); }}
                                        min="1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Weight per Box */}
                        <div className="form-group">
                            <label className="form-label">⚖️ Weight per Box (kg) *</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="e.g., 5"
                                value={boxWeight}
                                onChange={(e) => { setBoxWeight(e.target.value); setResult(null); }}
                                min="0.1"
                                step="0.1"
                            />
                        </div>

                        {/* Total Weight to Ship */}
                        <div className="form-group">
                            <label className="form-label">📊 Total Weight to Ship (kg) *</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="e.g., 25000"
                                value={totalWeight}
                                onChange={(e) => { setTotalWeight(e.target.value); setResult(null); }}
                                min="1"
                            />
                            <small style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                                Enter the total weight you want to ship. We'll calculate boxes needed.
                            </small>
                        </div>

                        {/* Calculate Button */}
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={handleCalculate}
                            style={{ width: '100%', marginTop: 'var(--space-4)' }}
                        >
                            🧮 CALCULATE CAPACITY
                        </button>
                    </div>

                    {/* Results */}
                    {result && (
                        <div className="result-card fade-in">
                            <h3 style={{ marginBottom: 'var(--space-6)' }}>📊 Container Loading Results</h3>

                            {/* 3D Container Visualization */}
                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                <h4 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>Container Visualization</h4>
                                <div style={{
                                    perspective: '1000px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    padding: 'var(--space-6)'
                                }}>
                                    <div style={{
                                        width: containerType === '20FT' ? '200px' : '300px',
                                        height: '100px',
                                        position: 'relative',
                                        transformStyle: 'preserve-3d',
                                        transform: 'rotateX(-15deg) rotateY(-25deg)'
                                    }}>
                                        {/* Container Box */}
                                        <div style={{
                                            position: 'absolute',
                                            width: '100%',
                                            height: '100%',
                                            border: '3px solid var(--primary-400)',
                                            borderRadius: 'var(--radius-md)',
                                            background: 'rgba(0, 168, 168, 0.1)',
                                            boxShadow: 'inset 0 0 20px rgba(0, 168, 168, 0.2)'
                                        }}>
                                            {/* Filled portion */}
                                            <div style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                height: `${result.volumeUtilization}%`,
                                                background: `linear-gradient(to top, 
                                                    ${result.volumeUtilization > 80 ? 'rgba(34, 197, 94, 0.6)' :
                                                        result.volumeUtilization > 50 ? 'rgba(234, 179, 8, 0.6)' :
                                                            'rgba(249, 115, 22, 0.6)'}, 
                                                    transparent)`,
                                                borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexWrap: 'wrap',
                                                gap: '2px',
                                                padding: '4px',
                                                overflow: 'hidden'
                                            }}>
                                                {/* Box representations */}
                                                {Array.from({ length: Math.min(result.boxesPerContainer, 50) }).map((_, i) => (
                                                    <div key={i} style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        background: 'var(--primary-500)',
                                                        borderRadius: '2px',
                                                        opacity: 0.8
                                                    }} />
                                                ))}
                                            </div>
                                        </div>
                                        {/* Depth effect */}
                                        <div style={{
                                            position: 'absolute',
                                            width: '30px',
                                            height: '100%',
                                            right: '-15px',
                                            top: '10px',
                                            background: 'linear-gradient(to right, var(--primary-600), var(--primary-700))',
                                            transform: 'skewY(-45deg)',
                                            transformOrigin: 'top left',
                                            borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                                            opacity: 0.5
                                        }} />
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                                    {result.boxesPerContainer} boxes shown
                                </div>
                            </div>

                            {/* Key Stats */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: 'var(--space-4)',
                                marginBottom: 'var(--space-6)'
                            }}>
                                <div style={{
                                    padding: 'var(--space-4)',
                                    background: 'var(--bg-glass)',
                                    borderRadius: 'var(--radius-lg)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--primary-400)' }}>
                                        {result.boxesPerContainer}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Boxes per Container</div>
                                </div>
                                <div style={{
                                    padding: 'var(--space-4)',
                                    background: 'var(--bg-glass)',
                                    borderRadius: 'var(--radius-lg)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--accent-400)' }}>
                                        {result.totalContainers}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Total Containers</div>
                                </div>
                                <div style={{
                                    padding: 'var(--space-4)',
                                    background: 'var(--bg-glass)',
                                    borderRadius: 'var(--radius-lg)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--success)' }}>
                                        {result.weightPerContainer.toLocaleString()}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>kg per Container</div>
                                </div>
                            </div>

                            {/* Container Breakdown */}
                            <div style={{
                                padding: 'var(--space-4)',
                                background: 'linear-gradient(135deg, rgba(0, 168, 168, 0.15), rgba(0, 168, 168, 0.05))',
                                border: '2px solid var(--primary-500)',
                                borderRadius: 'var(--radius-lg)',
                                marginBottom: 'var(--space-5)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    <span style={{ fontSize: 'var(--text-2xl)' }}>🚢</span>
                                    <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>
                                        {result.fullContainers > 0 && (
                                            <span style={{ color: 'var(--success)' }}>
                                                {result.fullContainers} Full Container{result.fullContainers > 1 ? 's' : ''}
                                            </span>
                                        )}
                                        {result.fullContainers > 0 && result.remainingBoxes > 0 && ' + '}
                                        {result.remainingBoxes > 0 && (
                                            <span style={{ color: 'var(--warning)' }}>
                                                1 Container at {result.lastContainerFillPercent}%
                                            </span>
                                        )}
                                        {result.fullContainers === 0 && result.remainingBoxes === 0 && (
                                            <span>No containers needed</span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ marginTop: 'var(--space-2)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                    {result.totalBoxes.toLocaleString()} boxes ({result.totalWeight.toLocaleString()} kg) across {result.totalContainers} × {containerType}
                                </div>
                            </div>

                            {/* Utilization Bars */}
                            <h4 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>Container Utilization</h4>
                            <div style={{ display: 'grid', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                                {/* Volume Utilization */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)' }}>
                                        <span>📦 Volume Utilization</span>
                                        <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--primary-400)' }}>{result.volumeUtilization}%</span>
                                    </div>
                                    <div style={{ height: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${result.volumeUtilization}%`,
                                            height: '100%',
                                            background: result.limitedBy === 'volume'
                                                ? 'linear-gradient(90deg, var(--primary-500), var(--accent-400))'
                                                : 'var(--primary-500)',
                                            borderRadius: 'var(--radius-full)',
                                            transition: 'width 0.5s ease'
                                        }} />
                                    </div>
                                    {result.limitedBy === 'volume' && (
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--warning)', marginTop: 'var(--space-1)' }}>
                                            ⚠️ Limited by volume (max {result.maxByVolume} boxes)
                                        </div>
                                    )}
                                </div>

                                {/* Weight Utilization */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)' }}>
                                        <span>⚖️ Weight Utilization</span>
                                        <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--accent-400)' }}>{result.weightUtilization}%</span>
                                    </div>
                                    <div style={{ height: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.min(result.weightUtilization, 100)}%`,
                                            height: '100%',
                                            background: result.limitedBy === 'weight'
                                                ? 'linear-gradient(90deg, var(--accent-500), var(--warning))'
                                                : 'var(--accent-500)',
                                            borderRadius: 'var(--radius-full)',
                                            transition: 'width 0.5s ease'
                                        }} />
                                    </div>
                                    {result.limitedBy === 'weight' && (
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--warning)', marginTop: 'var(--space-1)' }}>
                                            ⚠️ Limited by weight (max {result.maxByWeight} boxes at {container.maxWeightKg.toLocaleString()} kg)
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Detailed Container Breakdown */}
                            <h4 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>Container Details</h4>
                            <table className="breakup-table">
                                <thead>
                                    <tr>
                                        <th>Container</th>
                                        <th>Boxes</th>
                                        <th>Weight</th>
                                        <th>Fill %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: result.totalContainers }).map((_, i) => {
                                        const isLast = i === result.totalContainers - 1 && result.remainingBoxes > 0;
                                        const boxes = isLast ? result.remainingBoxes : result.boxesPerContainer;
                                        const weight = boxes * result.boxDims.weight;
                                        const fill = isLast ? result.lastContainerFillPercent : 100;
                                        return (
                                            <tr key={i} style={isLast ? { background: 'rgba(234, 179, 8, 0.1)' } : {}}>
                                                <td>
                                                    <span style={{ marginRight: 'var(--space-2)' }}>{isLast && fill < 100 ? '📦' : '✅'}</span>
                                                    {containerType} #{i + 1}
                                                </td>
                                                <td>{boxes.toLocaleString()}</td>
                                                <td>{weight.toLocaleString()} kg</td>
                                                <td>
                                                    <span style={{
                                                        color: fill === 100 ? 'var(--success)' : 'var(--warning)',
                                                        fontWeight: 'var(--font-semibold)'
                                                    }}>
                                                        {fill}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    <tr style={{ background: 'var(--bg-glass)', fontWeight: 'var(--font-bold)' }}>
                                        <td>TOTAL</td>
                                        <td>{result.totalBoxes.toLocaleString()}</td>
                                        <td>{result.totalWeight.toLocaleString()} kg</td>
                                        <td>-</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Box Orientation Info */}
                            <div style={{
                                marginTop: 'var(--space-5)',
                                padding: 'var(--space-4)',
                                background: 'var(--bg-glass)',
                                borderRadius: 'var(--radius-lg)',
                                fontSize: 'var(--text-sm)'
                            }}>
                                <div style={{ fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)' }}>📐 Optimal Stacking</div>
                                <div style={{ color: 'var(--text-secondary)' }}>
                                    {result.orientation.alongLength} × {result.orientation.alongWidth} × {result.orientation.alongHeight} arrangement
                                    <span style={{ color: 'var(--text-muted)', marginLeft: 'var(--space-2)' }}>
                                        (L × W × H layers)
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer style={{
                    textAlign: 'center',
                    padding: 'var(--space-6)',
                    color: 'var(--text-muted)',
                    fontSize: 'var(--text-sm)'
                }}>
                    <p>Container capacity calculator for export shipments</p>
                    <p style={{ marginTop: 'var(--space-2)' }}>
                        <Link href="/" style={{ color: 'var(--primary-400)' }}>← Back to Export Calculator</Link>
                    </p>
                </footer>
            </div>
        </>
    );
}
