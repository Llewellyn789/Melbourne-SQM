import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Papa from 'papaparse';

// Fix Leaflet icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface SuburbData {
  LGA: string;
  Suburb: string;
  'Estimated Block Size (sqm)': string;
  'Median Price': string;
  '$/sqm': string;
}

interface GeoJSONFeature {
  type: string;
  id?: string;
  properties: {
    [key: string]: any;
    price_sqm?: number;
    median_price?: string;
    block_size?: string;
    lga?: string;
  };
  geometry: any;
}

interface GeoJSONData {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

const RealDataMap: React.FC = () => {
  const [suburbData, setSuburbData] = useState<SuburbData[]>([]);
  const [geoJSONData, setGeoJSONData] = useState<GeoJSONData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataProcessed, setDataProcessed] = useState(false);
  const [matchedCount, setMatchedCount] = useState(0);

  // Load CSV data
  useEffect(() => {
    fetch('/V1_Greater_Melbourne_LGAs_with_Corrected_Prices.csv')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load CSV data');
        }
        return response.text();
      })
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            console.log('Parsed CSV data:', results.data);
            setSuburbData(results.data as SuburbData[]);
          },
          error: (error: Error) => {
            console.error('Error parsing CSV:', error);
            setError('Failed to parse CSV data');
          }
        });
      })
      .catch(err => {
        console.error('Error loading CSV data:', err);
        setError(err.message);
      });
  }, []);

  // Load GeoJSON data
  useEffect(() => {
    fetch('/vic_suburbs.json')
      .then(response => response.json())
      .then(data => {
        // Log some suburb names for debugging
        console.log('Sample GeoJSON suburb names:', 
          data.features.slice(0, 10).map((f: any) => f.properties.vic_loca_2 || f.properties.name || f.properties.VIC_LOCA_2));
        setGeoJSONData(data);
      })
      .catch(err => {
        console.error('Error loading GeoJSON data:', err);
        setError(err.message);
      });
  }, []);

  // Effect to merge GeoJSON and CSV data when both are available
  useEffect(() => {
    if (geoJSONData && suburbData.length > 0 && !dataProcessed) {
      console.log('Merging data...');
      console.log('Total suburbs in CSV:', suburbData.length);
      console.log('Total features in GeoJSON:', geoJSONData.features.length);
      
      // Create a map of suburb names to their data for faster lookup
      const suburbMap: Record<string, any> = {};
      
      // Add all suburbs to the map with various key formats for flexible matching
      suburbData.forEach(suburb => {
        const name = suburb.Suburb.toLowerCase().trim();
        suburbMap[name] = suburb;
        
        // Add variations without directional prefixes/suffixes
        const simpleName = name
          .replace(/^(north|south|east|west|port)\s+/, '')
          .replace(/\s+(north|south|east|west)$/, '');
        
        if (simpleName !== name) {
          suburbMap[simpleName] = suburb;
        }
      });
      
      // Add manual mappings for problematic suburbs
      suburbMap['williamstown'] = suburbData.find(s => s.Suburb.toLowerCase() === 'williamstown');
      suburbMap['richmond'] = suburbData.find(s => s.Suburb.toLowerCase() === 'richmond');
      
      // Debug the map
      console.log('Created suburb map with keys:', Object.keys(suburbMap).length);
      console.log('Williamstown in map:', !!suburbMap['williamstown']);
      console.log('Richmond in map:', !!suburbMap['richmond']);
      
      // Count how many suburbs we can match
      let matchCount = 0;
      
      // Create a copy of the GeoJSON data to modify
      const mergedData = {
        ...geoJSONData,
        features: geoJSONData.features.map(feature => {
          // Get suburb name from feature properties
          const suburbName = feature.properties.vic_loca_2 || 
                            feature.properties.name || 
                            feature.properties.VIC_LOCA_2 || '';
          
          // Normalize suburb name for lookup
          const lookupName = suburbName.toLowerCase().trim();
          
          // Debug specific suburbs
          if (lookupName === 'williamstown' || lookupName === 'richmond') {
            console.log(`Looking up ${lookupName} in suburb map:`, !!suburbMap[lookupName]);
          }
          
          // Find matching suburb in our map
          const matchingSuburb = suburbMap[lookupName];
          
          if (matchingSuburb) {
            matchCount++;
            const pricePerSqm = parseFloat(matchingSuburb['$/sqm'].replace(/[^0-9.]/g, ''));
            const medianPrice = matchingSuburb['Median Price'];
            const blockSize = matchingSuburb['Estimated Block Size (sqm)'];
            const lga = matchingSuburb.LGA;
            
            return {
              ...feature,
              properties: {
                ...feature.properties,
                price_sqm: pricePerSqm,
                median_price: medianPrice,
                block_size: blockSize,
                lga: lga,
                matched_suburb: matchingSuburb.Suburb
              }
            };
          }
          
          return feature;
        })
      };
      
      console.log(`Successfully matched ${matchCount} suburbs out of ${suburbData.length} in CSV data`);
      setMatchedCount(matchCount);
      setGeoJSONData(mergedData);
      setLoading(false);
      setDataProcessed(true);
    } else if (suburbData.length > 0 && !geoJSONData) {
      // If we have CSV data but no GeoJSON yet, wait for GeoJSON
    } else if (geoJSONData && suburbData.length === 0) {
      // If we have GeoJSON but no CSV data yet, wait for CSV
    }
  }, [suburbData.length, geoJSONData ? JSON.stringify(geoJSONData.type) : null, dataProcessed]);
  
  // The dataProcessed state is now declared above

  // Function to determine color based on price per sqm
  const getColor = (price: number): string => {
    if (!price || isNaN(price)) return '#cccccc'; // Default gray for missing data
    if (price < 3000) return '#1a9850'; // Dark green
    if (price < 4000) return '#91cf60'; // Light green
    if (price < 5000) return '#d9ef8b'; // Yellow-green
    if (price < 6000) return '#fee08b'; // Light orange
    if (price < 7000) return '#fc8d59'; // Orange
    if (price < 8000) return '#d73027'; // Red
    if (price < 9000) return '#bd0026'; // Dark red
    return '#800026'; // Very dark red for extremely expensive
  };

  // Style function for GeoJSON features
  const featureStyle = (feature: any) => {
    const price = feature.properties.price_sqm;
    
    return {
      fillColor: price ? getColor(price) : '#cccccc',
      weight: 1,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    };
  };

  // Function to handle popup content for each feature
  const onEachFeature = (feature: any, layer: any) => {
    const props = feature.properties;
    const price = props.price_sqm;
    
    // Add hover effect
    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.8
        });
      },
      mouseout: (e: any) => {
        layer.setStyle(featureStyle(feature));
      }
    });
    
    if (price) {
      const popupContent = `
        <div class="popup-content">
          <h3>${props.vic_loca_2 || props.name || props.VIC_LOCA_2}</h3>
          <p><strong>Median House Price:</strong> ${props.median_price || 'N/A'}</p>
          <p><strong>Estimated Block Size:</strong> ${props.block_size || 'N/A'} sqm</p>
          <p><strong>Price per sqm:</strong> $${price.toLocaleString()}</p>
        </div>
      `;
      layer.bindPopup(popupContent);
    } else {
      layer.bindPopup(`<div class="popup-content"><h3>${props.vic_loca_2 || props.name || props.VIC_LOCA_2}</h3><p>No price data available</p></div>`);
    }
  };

  // Event handlers for hover and click effects

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '24px', color: '#333' }}>Loading suburb data...</div>
        <div style={{ fontSize: '16px', color: '#666' }}>This may take a moment as we process the data.</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '24px', color: '#d73027' }}>Error loading data</div>
        <div style={{ fontSize: '16px', color: '#666' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Title */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'rgba(255,255,255,0.9)',
        padding: '10px 20px',
        borderRadius: '5px',
        boxShadow: '0 0 15px rgba(0,0,0,0.2)',
        maxWidth: '90%',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Melbourne Suburbs - Property Prices ($/sqm)</h1>
        <p style={{ margin: '5px 0 0', fontSize: '14px', color: '#666' }}>Data from Greater Melbourne LGAs property price analysis</p>
      </div>

      {/* No filter toggle - showing all suburbs by default */}

      {/* Map */}
      <div style={{ height: '100vh', width: '100%' }}>
        <MapContainer
          center={[-37.8136, 144.9631]} // Melbourne center coordinates
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          maxZoom={18}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {geoJSONData && (
            <GeoJSON 
              data={geoJSONData} 
              style={featureStyle}
              onEachFeature={onEachFeature}
            />
          )}
          
          {/* Legend */}
          <div className="legend" style={{
            padding: '10px',
            background: 'rgba(255,255,255,0.9)',
            boxShadow: '0 0 15px rgba(0,0,0,0.2)',
            borderRadius: '5px',
            position: 'absolute',
            bottom: '20px',
            right: '10px',
            zIndex: 1000,
            lineHeight: '18px',
            color: '#555',
            maxWidth: '200px'
          }}>
            <h4 style={{ margin: '0 0 10px', color: '#333', fontSize: '16px' }}>Price per sqm</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div><i style={{ background: '#1a9850', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px', border: '1px solid #444' }}></i> Under $3,000</div>
              <div><i style={{ background: '#91cf60', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px', border: '1px solid #444' }}></i> $3,000 - $4,000</div>
              <div><i style={{ background: '#d9ef8b', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px', border: '1px solid #444' }}></i> $4,000 - $5,000</div>
              <div><i style={{ background: '#fee08b', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px', border: '1px solid #444' }}></i> $5,000 - $6,000</div>
              <div><i style={{ background: '#fc8d59', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px', border: '1px solid #444' }}></i> $6,000 - $7,000</div>
              <div><i style={{ background: '#d73027', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px', border: '1px solid #444' }}></i> $7,000 - $8,000</div>
              <div><i style={{ background: '#bd0026', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px', border: '1px solid #444' }}></i> $8,000 - $9,000</div>
              <div><i style={{ background: '#800026', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px', border: '1px solid #444' }}></i> $10,000+</div>
              <div><i style={{ background: '#cccccc', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px', border: '1px solid #444' }}></i> No data</div>
              <div style={{ marginTop: '10px', fontSize: '12px', fontStyle: 'italic' }}>
                Matched: {matchedCount} of {suburbData.length} suburbs
              </div>
            </div>
          </div>
        </MapContainer>
      </div>
    </div>
  );
};

export default RealDataMap;
