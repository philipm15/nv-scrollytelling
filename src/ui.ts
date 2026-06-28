import * as d3 from "d3";
import { worldData, countryData, countryAlias, selectedTreemapYear, setSelectedAreaYear, setSelectedTreemapYear, svg } from "./state";
import { getLatestCountryData, getSelectedCountryValues } from "./data-utils";
import { drawTreemap, syncTreemapSelection } from "./charts";
import { showFrame } from "./frames";
import type { CountrySummary, ComparisonValue } from "./types";

export function bootstrap() {
    svg.style("opacity", 1);
    d3.select("#visualization").selectAll(".bootstrap-message").remove();
    // Loading message removed for cleaner start

    if (d3.select("#area-year-picker").empty()) {
        const yearOptions = Array.from(new Set(worldData.map(d => d.year)))
            .sort((a, b) => b - a)
            .map(y => `<option value="${y}">${y}</option>`).join('');

        d3.select("#visualization")
            .append("div")
            .attr("id", "area-year-picker")
            .style("position", "absolute")
            .style("top", "24px")
            .style("right", "32px")
            .style("display", "none")
            .style("z-index", "20")
            .style("pointer-events", "auto")
            .html(`
                <label for="area-year-select" style="color: var(--text-dark); margin-right: 0.5rem; font-size: 0.9rem; font-weight: 500;">Timeline up to:</label>
                <select id="area-year-select" style="padding: 0.4rem; border-radius: 4px; background: rgba(220,218,211,0.7); color: var(--text-dark); border: 1px solid rgba(0,0,0,0.1);">
                    ${yearOptions}
                </select>
            `);

        document.getElementById("area-year-select")?.addEventListener("change", (e) => {
            setSelectedAreaYear(Number((e.target as HTMLSelectElement).value));
            const currentStep = document.querySelector(".step.is-active")?.getAttribute("data-step") || "4";
            showFrame(Number(currentStep));
        });
    }

    if (d3.select("#comparison-overlay").empty()) {
        const uniqueCountries = new Map();
        countryData.forEach(d => {
            if (!uniqueCountries.has(d.code)) uniqueCountries.set(d.code, d.entity);
        });
        const allCountries = Array.from(uniqueCountries.entries()).map(([code, entity]) => ({ code, entity })).sort((a, b) => a.entity.localeCompare(b.entity));
        const optionsHtml = `<option value="">Select a country</option>` +
            allCountries.map(c => `<option value="${c.code}">${countryAlias[c.code] ?? c.entity}</option>`).join('');

        const treemapYearOptions = Array.from(new Set(countryData.map(d => d.year)))
            .sort((a, b) => b - a)
            .map(y => `<option value="${y}">${y}</option>`).join('');

        const overlay = d3.select("#visualization")
            .append("div")
            .attr("id", "comparison-overlay")
            .style("position", "absolute")
            .style("top", "0")
            .style("left", "0")
            .style("width", "100%")
            .style("height", "100%")
            .style("display", "none")
            .style("flex-direction", "column")
            .style("align-items", "center")
            .style("justify-content", "space-around")
            .style("padding", "24px 0")
            .style("gap", "1.5rem")
            .style("overflow-y", "auto")
            .style("z-index", "10")
            .style("pointer-events", "none");

        overlay.html(`
            <div class="controls" style="pointer-events: auto; background: rgba(220,218,211,0.6); backdrop-filter: blur(8px); padding: 0.6rem 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.25); box-shadow: 0 8px 24px rgba(0,0,0,0.04);">
              <div class="control-group">
                <label class="control-label" for="treemap-year-select">Year</label>
                <select id="treemap-year-select">
                  ${treemapYearOptions}
                </select>
              </div>
              <div class="control-group">
                <label class="control-label" for="country1-select">Country 1</label>
                <select id="country1-select">
                  ${optionsHtml}
                </select>
              </div>
              <div class="control-group">
                <label class="control-label" for="country2-select">Country 2</label>
                <select id="country2-select">
                  ${optionsHtml}
                </select>
              </div>
            </div>
            <div class="comparison-container" id="comparison-container" style="pointer-events: auto; width: 100%; max-width: 900px; padding: 0 2rem;"></div>
        `);

        const bind = () => updateComparison();
        document.getElementById("country1-select")?.addEventListener("change", bind);
        document.getElementById("country2-select")?.addEventListener("change", bind);

        document.getElementById("treemap-year-select")?.addEventListener("change", (e) => {
            setSelectedTreemapYear(Number((e.target as HTMLSelectElement).value));
            drawTreemap(getLatestCountryData(), 1);
            updateComparison();
        });
    }
}

export function updateComparison() {
    const container = d3.select("#comparison-container");
    if (container.empty()) return;

    const country1 = (document.getElementById("country1-select") as HTMLSelectElement | null)?.value || "";
    const country2 = (document.getElementById("country2-select") as HTMLSelectElement | null)?.value || "";
    const rows = [getSelectedCountryValues(country1), getSelectedCountryValues(country2)].filter((d): d is CountrySummary => Boolean(d));

    // Update treemap selection highlight
    syncTreemapSelection(null);

    const cards = container.selectAll<HTMLDivElement, CountrySummary>("div.comparison-card")
        .data(rows, (d, i) => `${d.code}-${i}`)
        .join(enter => {
            const card = enter.append("div").attr("class", "comparison-card");
            card.append("h3");
            card.append("div").attr("class", "comparison-meta");
            const bars = card.append("div").attr("class", "comparison-bars");
            ["human", "animal", "industrial"].forEach(key => {
                const bar = bars.append("div").attr("class", "comparison-bar");
                bar.append("div").attr("class", "comparison-bar-label");
                bar.append("div").attr("class", `comparison-bar-fill fill-${key}`);
            });
            return card;
        });

    cards.select("h3").text(d => countryAlias[d.code] ?? d.entity);
    cards.select(".comparison-meta").text(d => `${selectedTreemapYear} · ${d3.format(",.0f")(d.total)} tonnes`);

    cards.each(function (d) {
        const total = d.total || 1;
        const values: ComparisonValue[] = [
            { key: "human", label: "Human food", value: d.directHumanFood, pct: (d.directHumanFood / total) * 100 },
            { key: "animal", label: "Animal feed", value: d.directAnimalFeed, pct: (d.directAnimalFeed / total) * 100 },
            { key: "industrial", label: "Industrial", value: d.processed, pct: (d.processed / total) * 100 }
        ];

        d3.select(this)
            .selectAll<HTMLDivElement, ComparisonValue>(".comparison-bar")
            .data(values, (v: ComparisonValue) => v.key)
            .join("div")
            .attr("class", "comparison-bar")
            .each(function (v) {
                const row = d3.select(this);
                row.selectAll<HTMLDivElement, ComparisonValue>(".comparison-bar-label")
                    .data([v])
                    .join("div")
                    .attr("class", "comparison-bar-label")
                    .text(v.label);

                row.selectAll<HTMLDivElement, ComparisonValue>(".comparison-bar-fill")
                    .data([v])
                    .join("div")
                    .attr("class", `comparison-bar-fill fill-${v.key}`)
                    .style("width", `${Math.max(2, v.pct)}%`)
                    .text(`${v.pct.toFixed(0)}%`);
            });
    });
}

export function animateCounter(element: HTMLElement | null, finalValue: number) {
    if (!element) return;
    const duration = 1800;
    const start = performance.now();
    const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        element.textContent = `${Math.round(finalValue * (1 - Math.pow(1 - t, 3)))}%`;
        if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}
