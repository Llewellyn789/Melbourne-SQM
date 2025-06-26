import React from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

interface FilterPanelProps {
  minPrice: number;
  maxPrice: number;
  currentRange: [number, number];
  onRangeChange: (range: [number, number]) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  minPrice,
  maxPrice,
  currentRange,
  onRangeChange
}) => {
  const handleRangeChange = (value: number | number[]) => {
    if (Array.isArray(value) && value.length === 2) {
      onRangeChange([value[0], value[1]]);
    }
  };

  return (
    <div className="filter-panel">
      <h3>Filter by Price ($/sqm)</h3>
      <div className="price-range-display">
        <span>${currentRange[0].toLocaleString()}</span>
        <span>to</span>
        <span>${currentRange[1].toLocaleString()}</span>
      </div>
      <div className="slider-container">
        <Slider
          range
          min={minPrice}
          max={maxPrice}
          value={currentRange}
          onChange={handleRangeChange}
          trackStyle={{ backgroundColor: '#3498db' }}
          handleStyle={[
            { borderColor: '#3498db', backgroundColor: '#3498db' },
            { borderColor: '#3498db', backgroundColor: '#3498db' }
          ]}
          railStyle={{ backgroundColor: '#e0e0e0' }}
          step={100}
        />
      </div>
      <div className="price-labels">
        <span>${minPrice.toLocaleString()}</span>
        <span>${maxPrice.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default FilterPanel;
