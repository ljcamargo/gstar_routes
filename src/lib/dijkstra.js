/**
 * Classical Dijkstra algorithm implementation for public transport routing.
 */

export function dijkstra(nodes, edges, source, target = null, weightKey = 'time') {
    const distances = {};
    const previous = {};
    const q = new Set(nodes);

    for (const node of nodes) {
        distances[node] = Infinity;
        previous[node] = null;
    }
    distances[source] = 0;

    while (q.size > 0) {
        // Find node with minimum distance
        let u = null;
        for (const node of q) {
            if (u === null || distances[node] < distances[u]) {
                u = node;
            }
        }

        if (distances[u] === Infinity) break;
        if (u === target) break;

        q.delete(u);

        // Get neighbors of u
        const neighbors = edges.filter(e => e.node1 === u);
        for (const edge of neighbors) {
            const v = edge.node2;
            if (!q.has(v)) continue;

            const alt = distances[u] + edge[weightKey];
            if (alt < distances[v]) {
                distances[v] = alt;
                previous[v] = u;
            }
        }
    }

    return { distances, previous };
}

export function getPath(previous, target) {
    const path = [];
    let curr = target;
    while (curr !== null) {
        path.unshift(curr);
        curr = previous[curr];
    }
    return path;
}

export function findLeastCost(nodes, edges, source, target, weightKey = 'time') {
    const { distances, previous } = dijkstra(nodes, edges, source, target, weightKey);
    const path = getPath(previous, target);
    const cost = distances[target] === Infinity ? null : distances[target];

    if (path[0] !== source) return null; // No path found

    return { cost, path };
}
