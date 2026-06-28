import * as d3 from "d3";
import { worldData, selectedAreaYear, priorityCountries, chartLayer } from "./state";
import { clearViz, setVizOpacity, drawChartAxes, drawLegend, drawStackedChart, drawTreemap, drawAustriaChart } from "./charts";
import { totalFor, getLatestCountryData } from "./data-utils";
import { animateCounter, updateComparison } from "./ui";

export function showFrame(step: number) {
    d3.select("#area-year-picker").style("display", [4, 5, 6, 7].includes(step) ? "block" : "none");

    if (step < 13) {
        d3.select("#austria-chart").style("display", "none").style("opacity", 0);
    }

    d3.selectAll(".step").classed("is-active", false);
    d3.selectAll(".step-content").style("display", "none");
    d3.select(`.step[data-step='${step}']`).classed("is-active", true);
    d3.select(`.step[data-step='${step}'] .step-content`).style("display", "block");

    const frameMap: Record<number, () => void> = {
        1: renderFrame1,
        2: renderFrame2,
        3: renderFrame3,
        4: renderFrame4,
        5: renderFrame5,
        6: renderFrame6,
        7: renderFrame7,
        8: renderFrame8,
        9: renderFrame9,
        10: renderFrame10,
        11: renderFrame11,
        12: renderFrame12,
        13: renderFrame13,
        14: renderFrame14
    };

    frameMap[step]?.();
}

function renderFrame1() {
    clearViz();
    setVizOpacity(1);
    d3.select(".step[data-step='1'] .step-content").html(`
    <h1>We thought soy was just a health food.</h1>
    <div class="scroll-cue">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
      <p style="font-size: 0.8rem; margin-top: 0.5rem;">scroll</p>
    </div>
  `);
}

function renderFrame2() {
    clearViz();
    setVizOpacity(1);
    d3.select(".step[data-step='2'] .step-content").html(`
    <h2>It's often seen as the face of plant-based eating.</h2>
    <div class="icon-grid">
      <div class="icon-item"><div class="icon">◻</div><div class="icon-label">tofu</div></div>
      <div class="icon-item"><div class="icon">◠</div><div class="icon-label">soy milk</div></div>
      <div class="icon-item"><div class="icon">●●●</div><div class="icon-label">edamame</div></div>
    </div>
  `);
}

function renderFrame3() {
    clearViz();
    setVizOpacity(1);
    d3.select(".step[data-step='3'] .step-content").html(`
    <h2>But where does all the world's soy actually end up?</h2>
    <p style="margin-top: 1rem; opacity: 0.8;">The data tells a very different story.</p>
  `);
    drawChartAxes();
    drawLegend();
}

function renderFrame4() {
    d3.select("#comparison-overlay").style("display", "none");
    setVizOpacity(1);
    d3.select(".step[data-step='4'] .step-content").html(`<p>A small amount does go straight to our plates.</p>`);
    drawStackedChart({ visible: ["human"] });
}

function renderFrame5() {
    d3.select("#comparison-overlay").style("display", "none");
    setVizOpacity(1);
    d3.select(".step[data-step='5'] .step-content").html(`<p>But a much larger portion is fed to farm animals.</p>`);
    drawStackedChart({ visible: ["human", "animal"] });
}

function renderFrame6() {
    clearViz();
    setVizOpacity(1);
    const yearData = worldData.find(d => d.year === selectedAreaYear);
    const totalSoy = yearData ? totalFor(yearData) : 0;
    const industrialTotal = yearData ? yearData.processed : 0;
    const percentage = totalSoy === 0 ? 0 : Math.round((industrialTotal / totalSoy) * 100);

    d3.select(".step[data-step='6'] .step-content").html(`
    <div class="wow-stat" style="position: relative; z-index: 2;">
      <p style="opacity: 0.8; font-size: 1rem; margin-bottom: 1rem;">The reality:</p>
      <div class="stat-value" id="percentage-counter">0%</div>
      <p class="stat-label">of global soy is never eaten by humans</p>
      <p style="margin-top: 1.5rem; opacity: 0.8; font-size: 1rem;">Instead, it's used for animal feed, biofuel, and other products.</p>
    </div>
  `);

    animateCounter(document.getElementById("percentage-counter"), percentage);
    drawStackedChart({ visible: ["human", "animal", "processed"], background: true, emphasis: true });
}

function renderFrame7() {
    d3.select(".step[data-step='7'] .step-content").html(`
    <h2>This isn't just a global average.</h2>
    <p style="margin-top: 1.5rem; opacity: 0.8;">We see the exact same pattern when we look at individual countries.</p>
  `);
    drawStackedChart({ visible: ["human", "animal", "processed"], background: true, emphasis: true });
    setVizOpacity(0.18);
}

function renderFrame8() {
    d3.select("#comparison-overlay").style("display", "none");
    d3.select(".step[data-step='8'] .step-content").html(`
    <h2>Every rectangle is a country.</h2>
    <p style="margin-top: 1rem; opacity: 0.8;">The size shows how much soy they use.</p>
    <p style="margin-top: 0.5rem; opacity: 0.8; font-size: 0.95rem;">Hover over a country to see how it uses its soy.</p>
  `);
    setVizOpacity(1);
    chartLayer.selectAll("path.band").transition().duration(800).style("opacity", 0).remove();
    chartLayer.selectAll("g.axis").transition().duration(800).style("opacity", 0).remove();
    chartLayer.selectAll("g.legend-wrap").transition().duration(800).style("opacity", 0).remove();
    drawTreemap(getLatestCountryData(), 0.4);
}

function renderFrame9() {
    d3.select("#comparison-overlay").style("display", "none");
    d3.select(".step[data-step='9'] .step-content").html(`
    <h2>Even the biggest consumers mostly use soy for feed and industry.</h2>
  `);
    setVizOpacity(1);
    chartLayer.selectAll("path.band").transition().duration(800).style("opacity", 0).remove();
    chartLayer.selectAll("g.axis").transition().duration(800).style("opacity", 0).remove();
    chartLayer.selectAll("g.legend-wrap").transition().duration(800).style("opacity", 0).remove();
    drawTreemap(getLatestCountryData(), 1, priorityCountries);
}

function renderFrame10() {
    d3.select(".step[data-step='10'] .step-content").html(`
    <h2>Take a look for yourself.</h2>
    <p style="opacity: 0.8; font-size: 0.95rem;">Click any country on the map to compare them.</p>
  `);
    setVizOpacity(1);
    chartLayer.selectAll(".treemap-node").transition().duration(400).style("opacity", 1);
    d3.select("#comparison-overlay")
        .style("display", "flex")
        .style("left", "55%")
        .style("width", "45%");

    drawTreemap(getLatestCountryData(), 1);
    updateComparison();
}

function renderFrame11() {
    d3.select(".step[data-step='11'] .step-content").html(`<p>Different places, same story.</p>`);
    setVizOpacity(1);
    chartLayer.selectAll(".treemap-node").transition().duration(400).style("opacity", 1);
    d3.select("#comparison-overlay")
        .style("display", "flex")
        .style("left", "55%")
        .style("width", "45%");

    drawTreemap(getLatestCountryData(), 1);
    updateComparison();
}

function renderFrame12() {
    setVizOpacity(1);
    clearViz();
    d3.select(".step[data-step='12'] .step-content").html(`
    <h2>Using soy mostly for animal feed is the standard worldwide.</h2>
    <p style="margin-top: 1.5rem; opacity: 0.8; font-size: 1.2rem;">But there's an interesting exception...</p>
  `);
}

function renderFrame13() {
    clearViz();
    drawAustriaChart();
    d3.select("#austria-chart").style("display", "flex");
    setTimeout(() => d3.select("#austria-chart").style("opacity", 1), 50);
    d3.select("#austria-badges").style("opacity", 0);
    d3.select("#austria-restart").style("opacity", 0).style("pointer-events", "none");

    d3.select(".step[data-step='13'] .step-content").html(`
    <h2>A Different Approach</h2>
    <p style="margin-top: 1rem; opacity: 0.8;">Globally, about 80% of soy is used for animal feed and oil. But in Austria, half of the harvest goes directly into human food.</p>
  `);
}

function renderFrame14() {
    clearViz();
    drawAustriaChart();
    d3.select("#austria-chart").style("display", "flex").style("opacity", 1);
    d3.select("#austria-badges").style("opacity", 1);
    d3.select("#austria-restart").style("opacity", 1).style("pointer-events", "auto");

    d3.select(".step[data-step='14'] .step-content").html(`
    <h2>Growing Locally</h2>
    <p style="margin-top: 1rem; opacity: 0.8;">This isn't just a small project. Austria grows a massive amount of soy, showing that it's possible to focus on food over feed.</p>
  `);
}
