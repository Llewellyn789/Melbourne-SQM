import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix the icon issue by setting default icon
const DefaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const BasicMap: React.FC = () => {
  // Melbourne center coordinates
  const position: [number, number] = [-37.8136, 144.9631];
  
  // Sample data for demonstration
  const sampleSuburbs = [
    { name: "Melbourne CBD", position: [-37.8136, 144.9631], price: 15000 },
    { name: "South Yarra", position: [-37.8409, 144.9958], price: 18000 },
    { name: "Richmond", position: [-37.8232, 145.0078], price: 12000 },
    { name: "Carlton", position: [-37.8012, 144.9672], price: 10000 },
    { name: "Fitzroy", position: [-37.7963, 144.9786], price: 14000 },
    { name: "St Kilda", position: [-37.8678, 144.9811], price: 9000 },
    { name: "Brunswick", position: [-37.7660, 144.9598], price: 8000 },
    { name: "Footscray", position: [-37.8010, 144.9004], price: 6000 },
    { name: "Docklands", position: [-37.8152, 144.9456], price: 16000 },
    { name: "Southbank", position: [-37.8252, 144.9637], price: 17000 }
  ];

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
        center={position}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Display markers for sample suburbs */}
        {sampleSuburbs.map((suburb, index) => (
          <Marker 
            key={index} 
            position={suburb.position as [number, number]}
          >
            <Popup>
              <div>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{suburb.name}</h3>
                <p style={{ margin: 0, fontSize: '14px' }}>${suburb.price.toLocaleString()}/sqm</p>
                <div style={{ 
                  width: '100%', 
                  height: '10px', 
                  backgroundColor: getColor(suburb.price),
                  marginTop: '5px',
                  borderRadius: '3px'
                }}></div>
              </div>
            </Popup>
          </Marker>
        ))}
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

export default BasicMap;
