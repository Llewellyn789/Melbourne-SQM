import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
const DefaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const VicMap: React.FC = () => {
  const [suburbData, setSuburbData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/vic_suburbs_simple.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load suburb data');
        }
        return response.json();
      })
      .then((data) => {
        // Assign random price per sqm to each suburb
        const dataWithPrices = {
          ...data,
          features: data.features.map((feature: any) => {
            const randomPrice = Math.floor(Math.random() * (20000 - 2000 + 1)) + 2000;
            return {
              ...feature,
              properties: {
                ...feature.properties,
                price_sqm: randomPrice
              }
            };
          })
        };
        
        setSuburbData(dataWithPrices);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading data:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Function to determine color based on price per sqm
  const getColor = (price: number): string => {
    if (price < 5000) return '#1a9850'; // Dark green
    if (price < 8000) return '#91cf60'; // Light green
    if (price < 11000) return '#d9ef8b'; // Yellow-green
    if (price < 14000) return '#fee08b'; // Light orange
    if (price < 17000) return '#fc8d59'; // Orange
    if (price < 20000) return '#d73027'; // Red
    return '#bd0026'; // Dark red for very expensive
  };

  // Style function for GeoJSON features
  const style = (feature: any) => {
    const price = feature.properties.price_sqm;
    return {
      fillColor: getColor(price),
      weight: 1,
      opacity: 1,
      color: '#666',
      fillOpacity: 0.7
    };
  };

  // Event handlers for hover and click effects
  const onEachFeature = (feature: any, layer: any) => {
    const price = feature.properties.price_sqm;
    const name = feature.properties.name || feature.properties.vic_loca_2 || "Unnamed";
    
    layer.bindPopup(`
      <div style="padding: 5px;">
        <h3 style="margin: 0 0 5px 0; font-size: 16px;">${name}</h3>
        <p style="margin: 0; font-size: 14px;">$${price.toLocaleString()}/sqm</p>
      </div>
    `);
    
    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 2,
          color: '#222',
          fillOpacity: 0.9
        });
      },
      mouseout: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 1,
          color: '#666',
          fillOpacity: 0.7
        });
      }
    });
  };

  // Legend component
  const Legend = () => {
    return (
      <div style={{
        padding: '6px 8px',
        background: 'rgba(255,255,255,0.8)',
        boxShadow: '0 0 15px rgba(0,0,0,0.2)',
        borderRadius: '5px',
        position: 'absolute',
        bottom: '20px',
        right: '10px',
        zIndex: 1000,
        lineHeight: '18px',
        color: '#555'
      }}>
        <h4 style={{ margin: '0 0 5px', color: '#777' }}>Price per sqm</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div><i style={{ background: '#1a9850', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px' }}></i> $2,000 - $5,000</div>
          <div><i style={{ background: '#91cf60', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px' }}></i> $5,000 - $8,000</div>
          <div><i style={{ background: '#d9ef8b', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px' }}></i> $8,000 - $11,000</div>
          <div><i style={{ background: '#fee08b', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px' }}></i> $11,000 - $14,000</div>
          <div><i style={{ background: '#fc8d59', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px' }}></i> $14,000 - $17,000</div>
          <div><i style={{ background: '#d73027', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px' }}></i> $17,000 - $20,000</div>
          <div><i style={{ background: '#bd0026', display: 'inline-block', width: '18px', height: '18px', marginRight: '8px' }}></i> $20,000+</div>
        </div>
      </div>
    );
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading suburb data...</div>;
  if (error) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'rgba(255,255,255,0.8)',
        padding: '10px 20px',
        borderRadius: '5px',
        boxShadow: '0 0 15px rgba(0,0,0,0.2)',
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', textAlign: 'center' }}>Victoria Suburbs - Property Prices ($/sqm)</h1>
      </div>
      
      <div style={{ height: '100vh', width: '100%' }}>
        <MapContainer
          center={[-37.8, 144.9]}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {suburbData && (
            <GeoJSON 
              data={suburbData} 
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

export default VicMap;
