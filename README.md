# G*ROUTES CDMX

**G*Routes CDMX: A Novel LLM-based Dijkstra Algorithm implementing human-like reasoning for urban mobility.**

A modern, AI-powered public transport route finder for Mexico City (CDMX). This project moves beyond classical graph theory by implementing a **revolutionary two-step LLM Dijkstra algorithm** using Gemini's advanced reasoning capabilities.

Built with **Antigravity** via "vibe" coding, this app translates human transit intentions into optimal, reasoned paths.

## 🚀 The Core Innovation: LLM Dijkstra

Traditional algorithms (like Dijkstra or A*) find the mathematically shortest path. G*Routes implements a **paramount feature**: an **LLM version of Dijkstra's algorithm**. 

The routing happens in a unique two-step AI pipeline:

1.  **AI Intent Translation (Edge Filtering)**: Gemini parses your natural language input ("Vete de Pantitlán al centro usando solo Metro") to extract origin, destination, and the desired transport systems. This performs a smart "sub-graph" extraction from our 14,000+ edge database.
2.  **LLM Dijkstra (The "Thinking" Step)**: The extracted transit graph is fed into Gemini's long context window. Instead of running a code-based calculation, Gemini uses its thinking capabilities to "reason" through the edges as an **Artificial Dijkstra Engine**, considering transfer complexity and human logic to find the best route.

## ✨ Features

- **LLM-Powered Reasoner**: Uses Gemini 1.5 Flash to execute the graph search, providing "Human-in-the-loop" style results without the human.
- **Dynamic Intent Extraction**: Just type where you want to go. No rigid forms required.
- **Vibe-Coded Foundation**: Developed entirely through natural language orchestration with the **Antigravity** agentic assistant.
- **Classical Fallback**: Includes a standard JS Dijkstra implementation for performance benchmarking.
- **Visual Station Search**: Real-time textual search for over 900+ transit points in CDMX.
- **Premium UI**: A sleek, glassmorphic dashboard built with Next.js 15 and Tailwind CSS 4.0.

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS 4.0
- **AI**: Gemini API
- **Language**: Pure JavaScript

## Getting Started

1. Clone the repository and move to the folder.
2. Install dependencies:
   ```bash
   bun install
   ```
3. Set your Gemini API Key in `.env.local`:
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```
4. Run the development server:
   ```bash
   bun run dev
   ```

## Project Structure

- `src/lib/aidijkstra.js`: AI Dijkstra implementation and prompts.
- `src/lib/gemini.js`: Gemini API wrapper.
- `src/lib/data/`: JSON database of CDMX transit.
- `src/app/api/route/`: API endpoint orchestrating the search.
- `src/components/`: Reusable React components with premium aesthetics.

## License
MIT
