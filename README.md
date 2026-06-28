# NV Scrollytelling: The Hidden Soy

This project is an interactive data visualization built with **D3.js** and **Scrollama**. It explores global soy production and how the vast majority of it is used for animal feed and industrial purposes, rather than direct human consumption.

## Technologies Used

- [Vite](https://vitejs.dev/) - Frontend tooling and development server
- [D3.js](https://d3js.org/) - Data visualization and DOM manipulation
- [Scrollama](https://github.com/russellgoldenberg/scrollama) - Scrollytelling scroll-driven interactions
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173` in your browser.

## Project Structure

The codebase is modularized for maintainability. The main logic lives in the `src/` directory:

- **`main.ts`**: The entry point. Initializes Scrollama and binds it to the scroll events.
- **`state.ts`**: Manages the global state, data caching, SVG configuration, and shared D3 scales.
- **`data-utils.ts`**: Contains helper functions for parsing and aggregating the CSV data.
- **`charts.ts`**: Contains all D3 visualization rendering logic (`drawStackedChart`, `drawTreemap`, etc.).
- **`ui.ts`**: Handles the non-SVG UI components like dropdowns, year pickers, and the comparison overlay.
- **`frames.ts`**: Contains the logic for what happens at each step (frame) of the scrollytelling experience.

## How it Works

1. **Scrolling**: Scrollama tracks when the user scrolls past `.step` elements in `index.html`.
2. **Frames**: When a step becomes active, `frames.ts` calls a specific `renderFrameX()` function.
3. **Data Updating**: The frame functions update the visualization (via `charts.ts`) and user interface elements (via `ui.ts`) to tell the story sequentially.
