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
    fetch('/melbourne-suburbs.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load GeoJSON data');
        }
        return response.json();
      })
      .then(data => {
        console.log('Loaded GeoJSON data');
        setGeoJSONData(data);
      })
      .catch(err => {
        console.error('Error loading GeoJSON data:', err);
        setError(err.message);
      });
  }, []);

  // Merge data when both sources are loaded
  useEffect(() => {
    if (suburbData.length > 0 && geoJSONData) {
      console.log('Merging data...');
      
      const mergedData = {
        ...geoJSONData,
        features: geoJSONData.features.map(feature => {
          // Try to extract suburb name from different possible property fields
          let suburbName = '';
          if (feature.properties.name) {
            suburbName = feature.properties.name;
          } else if (feature.properties.vic_loca_2) {
            suburbName = feature.properties.vic_loca_2;
          } else if (feature.id && typeof feature.id === 'string') {
            suburbName = feature.id.split('.').pop() || '';
          }
          
          // Find matching suburb in CSV data
          const matchingSuburb = suburbData.find(item => {
            // Try exact match first
            if (item.Suburb.toLowerCase() === suburbName.toLowerCase()) {
              return true;
            }
            
            // Try partial match (suburb name contains or is contained in)
            if (item.Suburb.toLowerCase().includes(suburbName.toLowerCase()) || 
                suburbName.toLowerCase().includes(item.Suburb.toLowerCase())) {
              return true;
            }
            
            return false;
          });
          
          if (matchingSuburb) {
            const pricePerSqm = parseFloat(matchingSuburb['$/sqm'].replace(/[^0-9.]/g, ''));
            
            return {
              ...feature,
              properties: {
                ...feature.properties,
                name: suburbName,
                price_sqm: pricePerSqm,
                median_price: matchingSuburb['Median Price'],
                block_size: matchingSuburb['Estimated Block Size (sqm)'],
                lga: matchingSuburb.LGA
              }
            };
          }
          
          return feature;
        })
      };
      
      setGeoJSONData(mergedData);
      setLoading(false);
    } else if (suburbData.length > 0 && !geoJSONData) {
      // If we have CSV data but no GeoJSON yet, wait for GeoJSON
    } else if (geoJSONData && suburbData.length === 0) {
      // If we have GeoJSON but no CSV data yet, wait for CSV
    }
  }, [suburbData, geoJSONData]);

  // Function to determine color based on price per sqm
  const getColor = (price: number): string => {
    if (!price || isNaN(price)) return '#cccccc'; // Default gray for missing data
    if (price < 5000) return '#1a9850'; // Dark green
    if (price < 6000) return '#91cf60'; // Light green
    if (price < 7000) return '#d9ef8b'; // Yellow-green
    if (price < 8000) return '#fee08b'; // Light orange
    if (price < 9000) return '#fc8d59'; // Orange
    if (price < 10000) return '#d73027'; // Red
    if (price < 12000) return '#bd0026'; // Dark red
    return '#800026'; // Very dark red for extremely expensive
  };

  // Style function for GeoJSON features
  const style = (feature: any) => {
    const price = feature.properties.price_sqm;
    return {
      fillColor: getColor(price),
      weight: 1.5,
      opacity: 1,
      color: '#444',
      fillOpacity: 0.7
    };
  };

  // Event handlers for hover and click effects
  const onEachFeature = (feature: any, layer: any) => {
    const price = feature.properties.price_sqm;
    const name = feature.properties.name || 'Unnamed';
    const medianPrice = feature.properties.median_price || 'N/A';
    const blockSize = feature.properties.block_size || 'N/A';
    const lga = feature.properties.lga || 'N/A';
    
    layer.bindPopup(`
      <div style="padding: 10px;">
        <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #333;">${name}</h3>
        <div style="background-color: ${getColor(price)}; height: 4px; margin-bottom: 10px;"></div>
        <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>LGA:</strong> ${lga}</p>
        <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Median Price:</strong> ${medianPrice}</p>
        <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Block Size:</strong> ${blockSize} sqm</p>
        <p style="margin: 0 0 5px 0; font-size: 16px; font-weight: bold; color: #333;">
          <strong>Price per sqm:</strong> $${price ? price.toLocaleString() : 'N/A'}
        </p>
      </div>
    `);
    
    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: '#222',
          fillOpacity: 0.9
        });
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          layer.bringToFront();
        }
      },
      mouseout: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 1.5,
          color: '#444',
          fillOpacity: 0.7
        });
      }
    });
  };

  // Legend component
  const Legend = () => {
    return (
      <div style={{
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
          <div><i style={{ background: '#1a9850', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px', border: '1px solid #444' }}></i> Less than $5,000</div>
          <div><i style={{ background: '#91cf60', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px', border: '1px solid #444' }}></i> $5,000 - $6,000</div>
          <div><i style={{ background: '#d9ef8b', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px', border: '1px solid #444' }}></i> $6,000 - $7,000</div>
          <div><i style={{ background: '#fee08b', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px', border: '1px solid #444' }}></i> $7,000 - $8,000</div>
          <div><i style={{ background: '#fc8d59', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px', border: '1px solid #444' }}></i> $8,000 - $9,000</div>
          <div><i style={{ background: '#d73027', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px', border: '1px solid #444' }}></i> $9,000 - $10,000</div>
          <div><i style={{ background: '#bd0026', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px', border: '1px solid #444' }}></i> $10,000 - $12,000</div>
          <div><i style={{ background: '#800026', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px', border: '1px solid #444' }}></i> More than $12,000</div>
          <div><i style={{ background: '#cccccc', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px', border: '1px solid #444' }}></i> No data</div>
        </div>
      </div>
    );
  };

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
              style={style}
              onEachFeature={onEachFeature}
            />
          )}
        </MapContainer>
      </div>
      
      <Legend />
    </div>
  );
};

export default RealDataMap;
