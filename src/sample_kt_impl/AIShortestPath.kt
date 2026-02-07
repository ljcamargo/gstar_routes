package org.nehuatl.cdmx.services

import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.Json
import org.nehuatl.cdmx.agnostic.AgnosticLLM
import org.nehuatl.cdmx.extensions.v
import org.nehuatl.cdmx.models.Courses
import org.nehuatl.cdmx.models.Edges

object AIShortestPath {
    private const val SCHEMA = "{\n" +
            "  \"type\": \"array\",\n" +
            "  \"items\": {\n" +
            "    \"type\": \"object\",\n" +
            "    \"properties\": {\n" +
            "      \"name\": {\n" +
            "        \"type\": \"string\"\n" +
            "      },\n" +
            "      \"cost\": {\n" +
            "        \"type\": \"integer\"\n" +
            "      },\n" +
            "      \"path\": {\n" +
            "        \"type\": \"array\",\n" +
            "        \"items\": {\n" +
            "          \"type\": \"string\"\n" +
            "        }\n" +
            "      }\n" +
            "    },\n" +
            "    \"required\": [\"name\", \"cost\", \"path\"]\n" +
            "  }\n" +
            "}"
    private const val SAMPLE = "[\n" +
            "  {\n" +
            "    \"name\":\"Option A\",\n" +
            "    \"cost\":\"3453\",\n" +
            "    \"path\":[\n" +
            "      \"originStation\",\n" +
            "      \"stationX\",\n" +
            "      \"stationY\",\n" +
            "      \"...\"\n" +
            "      \"destinyStation\"\n" +
            "    ]\n" +
            "  }\n" +
            "]"
    private const val PROMPT = "From this list of edges in the included csv describing a graph, find the shortest path from \"%INPUT_A%\" to \"%INPUT_B%\", deliver the path and cost as an object inside a json array according to this schema:\n" +
            "%SCHEMA%\n" +
            "\n" +
            //"for example:\n" +
            //"%SAMPLE%\n" +
            //"\n" +
            //"In order to save time, the path nodes which are contiguous can be entered as a range, for example \"metrobus_01_40\", \"metrobus_01_41\", \"metrobus_01_42\", \"metrobus_01_43\" could be entered as \"metrobus_01_40...metrobus_01_43\" or \"trolebus_12_10\", \"trolebus_12_9\", \"trolebus_12_8\", \"trolebus_12_7\" to just \"trolebus_12_10...trolebus_12_7\"\n" +
            //"\n" +
            "Don't run code, don't explain, just output the shortest path and the calculated cost in the json object and say nothing nor explain anything else. \n" +
            "\n" +
            "Here is the list of edges: \n" +
            "station1, station2, cost\n" +
            "%DATA%"

    private fun prompt(a: String, b: String, csv: String): String {
        return PROMPT
            .replace("%SCHEMA%", SCHEMA)
            .replace("%SAMPLE%", SAMPLE)
            .replace("%INPUT_A%", a)
            .replace("%INPUT_B%", b)
            .replace("%DATA%", csv)
    }

    private fun expandPaths(list: List<String>): List<String> {
        val expandedList = mutableListOf<String>()

        for (item in list) {
            val rangeRegex = """^(.+?)\.\.\.(.+?)$""".toRegex()
            val matchResult = rangeRegex.find(item)
            if (matchResult != null) {
                val (start, end) = matchResult.destructured
                val (prefix, suffix) = start.split("_", limit = 2)
                val startNumber = suffix.toIntOrNull()
                val endNumber = end.split("_").last().toIntOrNull()
                if (startNumber != null && endNumber != null) {
                    val step = if (startNumber <= endNumber) 1 else -1
                    for (num in startNumber..endNumber step step) {
                        val expandedItem = "${prefix}_${String.format("%02d", num)}"
                        expandedList.add(expandedItem)
                    }
                }
            } else {
                expandedList.add(item)
            }
        }

        return expandedList.map { it.deAbbreviateEdges() }
    }

    private fun String.abbreviateEdges(): String {
        return this
            .replace("stcmetro_","A_")
            .replace("metrobus_","B_")
            .replace("cablebus_","C_")
            .replace("trolebus_","D_")
            .replace("trenligero_","E_")
    }

    private fun String.deAbbreviateEdges(): String {
        return this
            .replace("A_", "stcmetro_")
            .replace("B_", "metrobus_")
            .replace("C_", "cablebus_")
            .replace("D_", "trolebus_")
            .replace("E_", "trenligero_")
    }

    suspend fun shortestPath(origin: String, destination: String, edges: Edges): Courses {
        //">>>AI shortest path init".v()
        val prompt = prompt(
            a = origin.abbreviateEdges(),
            b = destination.abbreviateEdges(),
            csv = edges.joinToString("\n") { it.toCSVRow() }.abbreviateEdges()
        )
        //">>>AI prompt $prompt".v()
        val json = Json { ignoreUnknownKeys = true }
        return try {
            val llm = AgnosticLLM()
            val text: String = llm.prompt(prompt) ?: return emptyList()
            //">>>AI result raw $text".v()
            json.decodeFromString<Courses>(text).map {
                it.also { it.path = expandPaths(it.path) }
            }
        } catch (e: Exception) {
            emptyList()
        }
    }
}