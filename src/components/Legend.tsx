import React from 'react';

interface LegendProps {
  minValue: number;
  maxValue: number;
}

const Legend: React.FC<LegendProps> = ({ minValue, maxValue }) => {
  const colorSteps = [
    { color: '#1a9850', label: '< $6,000' },
    { color: '#91cf60', label: '$6,000 - $8,000' },
    { color: '#d9ef8b', label: '$8,000 - $10,000' },
    { color: '#fee08b', label: '$10,000 - $12,000' },
    { color: '#fc8d59', label: '$12,000 - $14,000' },
    { color: '#d73027', label: '> $14,000' }
  ];

  return (
    <div className="map-legend">
      <h3>Price per Square Meter</h3>
      <div className="legend-items">
        {colorSteps.map((step, index) => (
          <div key={index} className="legend-item">
            <div 
              className="color-box" 
              style={{ backgroundColor: step.color }}
            ></div>
            <span>{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Legend;
