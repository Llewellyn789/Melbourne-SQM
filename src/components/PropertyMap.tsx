import React from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoJSON as GeoJSONType } from 'geojson';

// Fix Leaflet icon issue
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface PropertyMapProps {
  suburbData: GeoJSONType;
}

const PropertyMap: React.FC<PropertyMapProps> = ({ suburbData }) => {
  // Function to determine color based on price per sqm
  const getColor = (price: number): string => {
    // Color scale from green (low price) to red (high price)
    if (price < 6000) return '#1a9850'; // Dark green
    if (price < 8000) return '#91cf60'; // Light green
    if (price < 10000) return '#d9ef8b'; // Yellow-green
    if (price < 12000) return '#fee08b'; // Light orange
    if (price < 14000) return '#fc8d59'; // Orange
    return '#d73027'; // Red
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

  // Event handlers for hover effects
  const onEachFeature = (feature: any, layer: any) => {
    const price = feature.properties.price_sqm;
    const name = feature.properties.name;
    
    layer.bindTooltip(`
      <div class="suburb-tooltip">
        <h3>${name}</h3>
        <p>$${price.toLocaleString()} per sqm</p>
      </div>
    `, { sticky: true });
    
    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: '#222',
          fillOpacity: 0.9
        });
        layer.bringToFront();
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

  return (
    <div className="map-wrapper">
      <MapContainer
        center={[-37.8136, 144.9631]} // Melbourne CBD coordinates
        zoom={11}
        style={{ height: '600px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON 
          data={suburbData} 
          style={style}
          onEachFeature={onEachFeature}
        />
      </MapContainer>
    </div>
  );
};

export default PropertyMap;
