# G*ROUTES CDMX

A modern, AI-powered public transport route finder for Mexico City (CDMX). This MVP demonstrates the use of Large Language Models (Gemini) to execute graph search algorithms (Dijkstra-style) with a focus on "reasoning" through commutes and transit options.

## Features

- **LLM-Powered Routing**: Uses Gemini 1.5 Flash to find optimal routes through a pre-filtered graph of station edges.
- **Classical Fallback**: Includes a robust JavaScript implementation of the Dijkstra algorithm for validation and comparison.
- **Rich Interactive UI**: A premium, glassmorphic dashboard built with Next.js and Tailwind CSS.
- **Semantic Data Model**: Hierarchical transport system data covering Metro, Metrobús, Cablebús, and more.
- **Station Search**: Real-time textual search for over 900+ transit points.

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

- `src/lib/dijkstra.js`: Classical graph search implementation.
- `src/lib/gemini.js`: LLM prompt engineering and response parsing.
- `src/lib/data/`: JSON database of CDMX transit.
- `src/app/api/route/`: API endpoint orchestrating the search.
- `src/components/`: Reusable React components with premium aesthetics.

## License
MIT
