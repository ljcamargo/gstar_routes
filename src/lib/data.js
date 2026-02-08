import systems from './data/systems.json';
import lines from './data/lines.json';
import stations from './data/stations.json';
import edges from './data/edges.json';

export const getSystems = () => systems;
export const getLines = () => lines;
export const getStations = () => stations;
export const getEdges = () => edges;

export const findStationById = (id) => stations.find(s => s.id === id);
export const findStationsByName = (query) => {
    const q = query.toLowerCase();
    return stations.filter(s => s.name.toLowerCase().includes(q));
};

export const getRelevantEdges = (originId, destinationId, maxDistance = 5000) => {
    const origin = findStationById(originId);
    const dest = findStationById(destinationId);

    if (!origin || !dest) return [];

    // Very simple filtering for MVP: edges within a bounding box or near either station
    // In a real app, this would be more sophisticated
    return edges.filter(edge => {
        const node1 = findStationById(edge.node1);
        const node2 = findStationById(edge.node2);
        if (!node1 || !node2) return false;

        // For MVP, just return all edges if they are not too many, 
        // or implement a simple proximity check if needed.
        // Given edges.json size (~12k lines), we might want to filter.
        return true;
    });
};

export const getNearestStation = (lat, lon) => {
    let nearest = null;
    let minDistance = Infinity;

    const toRad = (value) => (value * Math.PI) / 180;

    stations.forEach(station => {
        const R = 6371e3; // Earth radius in meters
        const φ1 = toRad(lat);
        const φ2 = toRad(station.lat);
        const Δφ = toRad(station.lat - lat);
        const Δλ = toRad(station.lon - lon);

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const dist = R * c;

        if (dist < minDistance) {
            minDistance = dist;
            nearest = station;
        }
    });

    return nearest;
};
