# G*Routes: AI-Powered CDMX Public Transport Finder

**Elevator Pitch**: G*Routes uses Gemini's reasoning to solve CDMX's complex transit graph, evolving Dijkstra into an AI-powered search that considers human factors like transfer ease and safety.

## About the project

## Inspiration
Mexico City's transit system is a beast with 900+ stations across Metro, Metrobús, and more. Experienced commuters don't just take the "shortest" path; they avoid long transfers and bottleneck stations. I wanted to build a router that doesn't just calculate—it **thinks**. I was inspired to see if Gemini's reasoning could outperform a rigid calculation by considering these "human" variables in one of the world's largest megalopolises.

## What it does
G*Routes covers everything from the Cablebús (flying cablecar) to the Metro(subway). Its **paramount feature is the LLM-based version of Dijkstra's algorithm**. It allows users to search in plain English and receive routes that aren't just the result of a math equation, but reasoned transit advice.

## How we built it
This project was created as **"vibe" coding using Antigravity**. The initial prompt was: *"Ok, please create an public transport best route finder web app for Mexico City based on a LLM Dijkstra algorithm done entirely with Gemini API, you can find the db in json files on database folder, use bun/nextjs/react/tailwind"*

The core innovation is a **two-step AI pipeline**:
1.  **Intent Translation**: Gemini translates natural language into structured intent, performing "Edge Filtering." It identifies which systems the user wants and extracts origin/destination points.
2.  **LLM Dijkstra Step**: This is the revolutionary part. Instead of running a code-based search, we feed the filtered transit graph directly into Gemini's long context window. Using its advanced thinking capabilities, Gemini executes a reasoned "AI Dijkstra" search through the edges, outputting a structured JSON path with a human explanation ("foreword").

## Challenges we ran into
The STC Metro and Metrobús network has thousands of possible edge combinations. Feeding all of that into an LLM would be wasteful and noisy. The biggest challenge was building the pre-filtering logic that extracts a contextually relevant "sub-graph" small enough for the LLM to process instantly but large enough to include all viable alternatives.

## Accomplishments that we're proud of
Proving that an LLM can reliably perform graph-search reasoning at scale. Seeing Gemini correctly navigate a complex 5-transfer route across different transport systems just by "reading" the edge list was a major breakthrough.

## What we learned
I learned that the future of apps is **reasoning, not just rules**. Building with Antigravity demonstrated how agentic AI can drastically speed up the transition from "vibe" to "production-grade code," especially when handling complex data structures like geographic transit graphs.

## What's next for G*Routes Routes (Mexico City)
The next step is **Temporal Reasoning**. I want to feed real-time delay data and crowdsourced reports into the "LLM Dijkstra" prompt so the AI can say: *"Normally I'd take Line 3, but there's a delay at Guerrero, so take the Metrobús instead."*
