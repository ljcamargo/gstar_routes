import systems from './data/systems.json';
import lines from './data/lines.json';
import stations from './data/stations.json';
import edges from './data/edges.json';

export const getSystems = () => systems;
export const getLines = () => lines;
export const getStations = () => stations;
export const getEdges = () => edges;

export const findStationById = (id) => stations.find(s => s.id === id);
export const findStationsByName = (query, selectedSystems = [], lat = null, lon = null) => {
    const q = query.toLowerCase();
    let results = stations;

    // Filter by selected systems
    if (selectedSystems.length > 0) {
        results = results.filter(s => selectedSystems.includes(s.system_id));
    }

    // Filter by query
    if (q) {
        results = results.filter(s => s.name.toLowerCase().includes(q));
    }

    // Sort by proximity if coordinates are provided
    if (lat !== null && lon !== null) {
        const toRad = (value) => (value * Math.PI) / 180;
        const R = 6371e3;

        results = [...results].sort((a, b) => {
            const dist = (s) => {
                const φ1 = toRad(lat);
                const φ2 = toRad(s.lat);
                const Δφ = toRad(s.lat - lat);
                const Δλ = toRad(s.lon - lon);
                const aVal = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
                const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
                return R * c;
            };
            return dist(a) - dist(b);
        });
    }

    return results;
};

export const getRelevantEdges = (originId, destinationId, selectedSystems = []) => {
    return edges.filter(edge => {
        const node1 = findStationById(edge.node1);
        const node2 = findStationById(edge.node2);
        if (!node1 || !node2) return false;

        // If system filtering is active
        if (selectedSystems.length > 0) {
            if (!selectedSystems.includes(node1.system_id) || !selectedSystems.includes(node2.system_id)) {
                return false;
            }
        }

        return true;
    });
};

export const getNearestStation = (lat, lon, selectedSystems = []) => {
    let nearest = null;
    let minDistance = Infinity;

    const toRad = (value) => (value * Math.PI) / 180;

    let filteredStations = stations;
    if (selectedSystems.length > 0) {
        filteredStations = filteredStations.filter(s => selectedSystems.includes(s.system_id));
    }

    filteredStations.forEach(station => {
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
