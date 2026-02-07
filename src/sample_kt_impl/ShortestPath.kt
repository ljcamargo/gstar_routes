package org.nehuatl.cdmx.services


import org.nehuatl.cdmx.extensions.v
import org.nehuatl.cdmx.models.Edge
import org.nehuatl.cdmx.models.MutableEdges


fun dijkstra(
    edges: List<Edge>,
    source: String,
    target: String?= null,
    strategy: Edge.CostStrategy = Edge.CostStrategy.LESS_POINTS
): Pair<MutableMap<String, Int>, MutableMap<String, String?>> {
    val distances = mutableMapOf<String, Int>()
    val previous = mutableMapOf<String, String?>()
    val q = findDistinctNodes(edges)

    q.forEach { v ->
        distances[v] = Integer.MAX_VALUE
        previous[v] = null
    }
    distances[source] = 0

    while (q.isNotEmpty()) {
        val u = q.minByOrNull { distances[it] ?: 0 }
        q.remove(u)

        if (u == target) {
            break
        }
        edges
            .filter { it.node1 == u }
            .forEach { edge ->
                val v = edge.node2
                val alt = (distances[u] ?: 0) + edge.cost(strategy)
                if (alt < (distances[v] ?: 0)) {
                    distances[v] = alt
                    previous[v] = u
                }
            }
    }
    return distances to previous
}


fun findShortestPath(
    edges: List<Edge>,
    source: String,
    target: String,
    strategy: Edge.CostStrategy = Edge.CostStrategy.LESS_POINTS
): Pair<Int?, List<String>> {
    val (distances, previous) = dijkstra(edges, source, target, strategy)
    val shortestDistance = shortest(distances, target)
    ">>> X distance is $shortestDistance".v()
    val shortestPath = path(previous, source, target)
    return shortestDistance to shortestPath
}

fun findShortestPaths(
    edges: List<Edge>,
    source: String,
    target: String,
    maxK: Int = 2,
    strategy: Edge.CostStrategy = Edge.CostStrategy.LESS_POINTS
): List<Pair<Int, List<String>>> {
    return kspYen(edges, source, target, maxK, strategy)
}

fun findShortestPathsStrategies(
    edges: List<Edge>,
    source: String,
    target: String,
): List<Triple<Edge.CostStrategy, Int, List<String>>> {
    return Edge.CostStrategy.values().mapNotNull { strategy ->
        val (distances, previous) = dijkstra(edges, source, target, strategy)
        val cost = shortest(distances, target)
        val path = path(previous, source, target)
        if (cost == null) return@mapNotNull null
        Triple(strategy, cost, path)
    }
}

private fun findDistinctNodes(edges: List<Edge>): MutableSet<String> {
    val nodes = mutableSetOf<String>()
    edges.forEach {
        nodes.add(it.node1)
        nodes.add(it.node2)
    }
    return nodes
}

fun kspYen(
    edgesX: List<Edge>,
    nodeStart: String,
    nodeEnd: String,
    maxK: Int = 2,
    strategy: Edge.CostStrategy = Edge.CostStrategy.LESS_POINTS
): MutableList<Pair<Int, List<String>>> {
    ">>> kspYen $nodeStart $nodeEnd $maxK".v()
    val A = mutableListOf<Pair<Int, List<String>>>()
    val B = mutableListOf<Pair<Int, List<String>>>()
    val edges = edgesX.toMutableList()
    val (distances, previous) = dijkstra(edges, nodeStart, nodeEnd, strategy)
    val cost = shortest(distances, nodeEnd)!!
    val path = path(previous, nodeStart, nodeEnd)

    A.add(cost to path)
    if (A.first().second.isEmpty()) {
        ">>> no path, return A".v()
        return A
    }

    for (k in 1 until maxK) {
        val (_, prePath) = A.lastOrNull() ?: break
        for (i in 0 until prePath.size - 1) {
            val spurNode = prePath[i]
            val rootPath = prePath.subList(0, i + 1)
            val edgesRemoved = mutableListOf<Edge>()

            A.forEach loop@ { (_, pathK) ->
                if (pathK.size > i + 1 && rootPath == pathK.subList(0, i + 1)) {
                    val edge = edges.find { it.node1 == pathK[i] && it.node2 == pathK[i + 1] }
                    if (edge != null) {
                        val newCost = edges.remove(edge, cost, strategy)
                        if (newCost == -1) return@loop
                        edgesRemoved.add(edge)
                    }
                }
            }

            val (distances2, previous2) = dijkstra(edges, spurNode, nodeEnd, strategy)
            val cost2 = shortest(distances2, nodeEnd)
            val path2 = path(previous2, spurNode, nodeEnd)
            if (path2.isNotEmpty()) {
                val totalPath = rootPath.dropLast(1) + path2
                val totalDistance = distances[spurNode]!! + cost2!!
                val candidate = totalDistance to totalPath
                if (candidate !in B) B.add(candidate)
            }
            edges.addAll(edgesRemoved)
        }

        if (B.isEmpty()) break
        B.sortBy { it.first }
        A.add(B.removeAt(0))
    }
    return A
}

fun MutableEdges.remove(
    edge: Edge,
    cost: Int? = null,
    strategy: Edge.CostStrategy = Edge.CostStrategy.LESS_POINTS
): Int {
    var reCost = -1
    forEachIndexed { index, edge0 ->
        var newCost: Int? = null
        if (edge0.node1 == edge.node1 && edge0.node2 == edge.node2) {
            val edgeCost = edge.cost(strategy)
            if (cost == null) {
                if (edgeCost != Int.MAX_VALUE) {
                    newCost = Int.MAX_VALUE
                }
            } else if (edgeCost == cost) {
                newCost = Int.MAX_VALUE
                reCost = cost
            }
        }
        if (newCost != null) {
            this[index].customCost = newCost
        }
    }
    return reCost
}

fun cost(path: List<String>, costs: Map<String, Int>): Int {
    return path.zipWithNext().sumOf { (a, b) ->
        costs[b]!! - costs[a]!!
    }
}

fun path(
    previous: Map<String, String?>,
    origin: String,
    destiny: String,
): List<String> {
    val pathList = mutableListOf<String>()
    var current = destiny
    while (current != origin) {
        if (!pathList.contains(current)) {
            pathList.add(current)
        }
        else {
            ">>> broke".v()
            break
        }
        current = previous[current] ?: break
    }
    pathList.add(origin)
    return pathList.asReversed()
}

fun shortest(distances: Map<String, Int>, target: String): Int? {
    val shortest = distances[target]
    if (shortest == Integer.MAX_VALUE) return null
    return shortest
}

// Traverse results
class DeprecateShortestPathResult(
    val previous: Map<String, String?>,
    val distances: Map<String, Int>,
    val origin: String,
    val destination: String
) {

    fun shortestPath(
        from: String = origin,
        to: String = destination,
        list: List<String> = emptyList()
    ): List<String> {
        //">>> shortest path is $from -> $to $list".v()
        //">>> previous $previous previous[to] ${previous[to]}".v()
        val last = previous[to] ?: return if (from == to) {
            list + to
        } else {
            emptyList()
        }
        //"recursion $from -> $last to:$to list:$list".v()
        return shortestPath(from, last, list) + to
    }

    fun shortestDistance(): Int? {
        val shortest = distances[destination]
        if (shortest == Integer.MAX_VALUE) {
            return null
        }
        return shortest
    }
}