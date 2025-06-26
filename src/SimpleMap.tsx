import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const SimpleMap: React.FC = () => {
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/vic_suburbs_simple.json')
      .then(response => response.json())
      .then(data => {
        // Add random prices to each feature
        const enhancedData = {
          ...data,
          features: data.features.map((feature: any) => ({
            ...feature,
            properties: {
              ...feature.properties,
              price_sqm: Math.floor(Math.random() * 18000) + 2000 // Random price between 2000 and 20000
            }
          }))
        };
        setGeoData(enhancedData);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error loading GeoJSON:", error);
        setLoading(false);
      });
  }, []);

  const getColor = (price: number) => {
    if (price < 5000) return '#1a9850';
    if (price < 8000) return '#91cf60';
    if (price < 11000) return '#d9ef8b';
    if (price < 14000) return '#fee08b';
    if (price < 17000) return '#fc8d59';
    if (price < 20000) return '#d73027';
    return '#bd0026';
  };

  const style = (feature: any) => {
    return {
      fillColor: getColor(feature.properties.price_sqm),
      weight: 1,
      opacity: 1,
      color: '#666',
      fillOpacity: 0.7
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const name = feature.properties.name || feature.properties.vic_loca_2 || 'Unnamed';
    const price = feature.properties.price_sqm;
    
    layer.bindPopup(`
      <div>
        <h3 style="margin: 0 0 5px 0; font-size: 16px;">${name}</h3>
        <p style="margin: 0; font-size: 14px;">$${price.toLocaleString()}/sqm</p>
      </div>
    `);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading map data...</div>;
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
        background: 'rgba(255,255,255,0.8)',
        padding: '10px 20px',
        borderRadius: '5px',
        boxShadow: '0 0 15px rgba(0,0,0,0.2)',
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', textAlign: 'center' }}>Victoria Suburbs - Property Prices ($/sqm)</h1>
      </div>

      {/* Map */}
      <MapContainer
        center={[-37.8, 144.9]}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {geoData && (
          <GeoJSON
            data={geoData}
            style={style}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>

      {/* Legend */}
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
    </div>
  );
};

export default SimpleMap;
