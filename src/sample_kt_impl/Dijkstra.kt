package org.nehuatl.cdmx.services


import org.nehuatl.cdmx.extensions.v
import org.nehuatl.cdmx.models.Edge2


object Dijkstra {

    fun <T>dijkstra(
        evaluator: (T, T) -> Float,
        edges: List<Edge2<T>>,
        source: T,
        target: T?= null
    ): Pair<MutableMap<T, Float>, MutableMap<T, T?>> {
        val costs = mutableMapOf<T, Float>()
        val previous = mutableMapOf<T, T?>()
        val q = findDistinctNodes(edges)

        q.forEach { v ->
            costs[v] = Float.MAX_VALUE
            previous[v] = null
        }
        costs[source] = 0f

        while (q.isNotEmpty()) {
            val u = q.minByOrNull { costs[it] ?: 0f }
            q.remove(u)

            if (u == target) {
                break
            }
            edges
                .filter { it.node1 == u }
                .forEach { edge ->
                    val v = edge.node2
                    val alt = (costs[u] ?: 0f) + edge.evaluate(evaluator)
                    if (alt < (costs[v] ?: 0f)) {
                        costs[v] = alt
                        previous[v] = u
                    }
                }
        }
        return costs to previous
    }

    fun <T>findLeastCost(
        evaluator: (T, T) -> Float,
        edges: List<Edge2<T>>,
        source: T,
        target: T,
    ): Pair<Float?, List<T>>? {
        val (costs, previous) = this.dijkstra(evaluator, edges, source, target)
        val shortestPath = path(previous, source, target)
        val cost = cost(shortestPath, costs)
        if (cost == null) {
            "no cost found".v()
        }
        return cost to shortestPath
    }

    private fun <T>findDistinctNodes(edges: List<Edge2<T>>): MutableSet<T> {
        val nodes = mutableSetOf<T>()
        edges.forEach {
            nodes.add(it.node1)
            nodes.add(it.node2)
        }
        return nodes
    }

    inline fun <T> Iterable<T>.floatSumOf(selector: (T) -> Float): Float {
        var sum = 0f
        for (element in this) {
            sum += selector(element)
        }
        return sum
    }

    fun <T>cost(path: List<T>, costs: Map<T, Float>): Float? {
        return path.zipWithNext().floatSumOf { (a, b) ->
            if (costs[b] == null || costs[a] == null) {
                return null
            }
            costs[b]!! - costs[a]!!
        }
    }

    fun <T>path(
        previous: Map<T, T?>,
        origin: T,
        destiny: T,
    ): List<T> {
        val pathList = mutableListOf<T>()
        var current = destiny
        while (current != origin) {
            if (!pathList.contains(current)) {
                pathList.add(current)
            }
            else {
                ">>> broke path".v()
                break
            }
            current = previous[current] ?: break
        }
        pathList.add(origin)
        return pathList.asReversed()
    }

    fun <T>leastCost(distances: Map<T, Float>, target: T): Float? {
        val shortest = distances[target]
        if (shortest == Float.MAX_VALUE) return null
        return shortest
    }
}