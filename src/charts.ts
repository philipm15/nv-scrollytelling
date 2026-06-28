import * as d3 from "d3";
import { chartLayer, colors, chartWidth, seriesHeight, xScale, yScale, selectedAreaYear, worldData, svg, countryAlias, width } from "./state";
import { totalFor } from "./data-utils";
import type { ChartSeriesKey, CountrySummary, StackedSeries } from "./types";
import { updateComparison } from "./ui";

export function clearViz() {
    chartLayer.selectAll("path.band, .treemap-node, g.axis, g.legend-wrap")
        .transition().duration(400)
        .style("opacity", 0)
        .remove();
    d3.select("#comparison-overlay").style("display", "none");
}

export function setVizOpacity(opacity: number) {
    svg.style("opacity", opacity);
}

export function drawChartAxes(domainMax?: number) {
    const minYear = d3.min(worldData, d => d.year) ?? 1961;
    xScale.domain([minYear, selectedAreaYear]);

    const defaultMax = d3.max(worldData, d => d.directHumanFood) ?? 0;
    yScale.domain([0, domainMax ?? defaultMax]);

    const axisY = d3.axisLeft(yScale).tickFormat(d3.format(".0s"));
    const tickCount = width < 600 ? 4 : 8;
    const axisX = d3.axisBottom(xScale).ticks(tickCount).tickFormat(d3.format("d"));

    chartLayer.selectAll("g.chart-frame")
        .data([null])
        .join("g")
        .attr("class", "chart-frame");

    chartLayer.selectAll("g.x-axis")
        .data([null])
        .join("g")
        .attr("class", "axis x-axis active")
        .attr("transform", `translate(0,${seriesHeight})`)
        .transition().duration(800)
        .call(axisX as any);

    chartLayer.selectAll("g.y-axis")
        .data([null])
        .join("g")
        .attr("class", "axis y-axis active")
        .transition().duration(800)
        .call(axisY as any);
}

export function drawLegend(activeKeys?: string[]) {
    const items = [
        { label: "Human Food", color: colors.human, key: "human" },
        { label: "Animal Feed", color: colors.animal, key: "animal" },
        { label: "Processed Uses", color: colors.processed, key: "processed" }
    ];

    const legend = chartLayer.selectAll<SVGGElement, null>("g.legend-wrap")
        .data([null])
        .join("g")
        .attr("class", "legend-wrap")
        .attr("transform", `translate(${chartWidth / 2 - 180},${seriesHeight + 54})`);

    legend.style("opacity", 1);

    const itemsJoin = legend.selectAll<SVGGElement, any>("g.legend-item")
        .data(items, d => d.label)
        .join(enter => {
            const g = enter.append("g").attr("class", "legend-item active");
            g.append("rect").attr("width", 12).attr("height", 12).attr("rx", 2);
            g.append("text").attr("x", 18).attr("y", 10).attr("fill", "#f0f0f0").attr("font-size", 12).attr("opacity", 0.72);
            return g;
        });

    itemsJoin
        .attr("transform", (_d, i) => `translate(${i * 180},0)`)
        .transition().duration(800)
        .style("opacity", d => (!activeKeys || activeKeys.includes(d.key)) ? 1 : 0.3)
        .select("rect")
        .attr("fill", d => d.color);

    itemsJoin.select("text").text(d => d.label);
}

export function drawStackedChart(options: { visible: ChartSeriesKey[]; background?: boolean; emphasis?: boolean }) {
    chartLayer.selectAll(".treemap-node").transition().duration(400).style("opacity", 0).remove();

    const keys = options.visible;
    const stackData = worldData
        .filter(d => d.year <= selectedAreaYear)
        .map(d => ({
            year: d.year,
            human: d.directHumanFood,
            animal: d.directAnimalFeed,
            processed: d.processed
        }));

    const maxTotal = d3.max(stackData, d => keys.reduce((sum, key) => sum + d[key], 0)) ?? 0;

    drawChartAxes(maxTotal);
    drawLegend(keys);

    const seriesConfig: StackedSeries[] = keys.map(key => ({
        key,
        values: stackData.map(d => ({ year: d.year, value: d[key] }))
    }));

    const cumulative = (index: number, dataIndex: number) =>
        seriesConfig.slice(0, index).reduce((sum, series) => sum + series.values[dataIndex].value, 0);

    chartLayer.selectAll<SVGPathElement, StackedSeries>("path.band")
        .data(seriesConfig, (d: any) => d.key)
        .join(
            enter => enter.append("path")
                .attr("class", d => `band band-${d.key}`)
                .attr("fill", d => colors[d.key])
                .style("opacity", 0)
                .attr("d", d => {
                    const area = d3.area<{ year: number; value: number }>()
                        .x(p => xScale(p.year))
                        .y0((_, i) => yScale(cumulative(keys.indexOf(d.key), i)))
                        .y1((_, i) => yScale(cumulative(keys.indexOf(d.key), i)));
                    return area(d.values) ?? "";
                })
                .call(enter => enter.transition().duration(800)
                    .style("opacity", d => options.background ? (d.key === "processed" && options.emphasis ? 0.72 : 0.38) : 1)
                    .attr("d", d => {
                        const area = d3.area<{ year: number; value: number }>()
                            .x(p => xScale(p.year))
                            .y0((_, i) => yScale(cumulative(keys.indexOf(d.key), i)))
                            .y1((p, i) => yScale(cumulative(keys.indexOf(d.key), i) + p.value));
                        return area(d.values) ?? "";
                    })
                ),
            update => update.call(update => update.transition().duration(800)
                .style("opacity", d => options.background ? (d.key === "processed" && options.emphasis ? 0.72 : 0.38) : 1)
                .attr("d", d => {
                    const area = d3.area<{ year: number; value: number }>()
                        .x(p => xScale(p.year))
                        .y0((_, i) => yScale(cumulative(keys.indexOf(d.key), i)))
                        .y1((p, i) => yScale(cumulative(keys.indexOf(d.key), i) + p.value));
                    return area(d.values) ?? "";
                })
            ),
            exit => exit.call(exit => exit.transition().duration(800)
                .style("opacity", 0)
            )
        );
}

const tooltip = d3.select("body").append("div")
    .attr("class", "treemap-tooltip")
    .style("position", "absolute")
    .style("background", "rgba(20, 20, 20, 0.9)")
    .style("color", "#f0f0f0")
    .style("border", "1px solid rgba(255, 255, 255, 0.2)")
    .style("padding", "12px")
    .style("border-radius", "6px")
    .style("box-shadow", "0 4px 12px rgba(0,0,0,0.15)")
    .style("pointer-events", "none")
    .style("display", "none")
    .style("font-size", "0.9rem")
    .style("z-index", "1000")
    .style("min-width", "200px");

export function syncTreemapSelection(hoveredCode: string | null = null) {
    const select1 = (document.getElementById("country1-select") as HTMLSelectElement | null)?.value || "";
    const select2 = (document.getElementById("country2-select") as HTMLSelectElement | null)?.value || "";
    const selectedCodes = [select1, select2].filter(Boolean);

    d3.selectAll(".treemap-node").each(function(d: any) {
        const isSelected = selectedCodes.includes(d.data.code);
        const isHovered = d.data.code === hoveredCode;
        const isActive = isSelected || isHovered;
        
        const g = d3.select(this);
        g.select(".bg-rect")
            .attr("stroke", isActive ? "white" : "rgba(0,0,0,0.12)")
            .attr("stroke-width", isActive ? 3 : 1);
            
        g.selectAll(".hover-split").style("display", isActive ? "block" : "none");
        
        if (isActive) {
            g.select(".node-label").raise();
        }
    });
}

export function drawTreemap(source: CountrySummary[], opacity: number, highlightCountries: string[] = []) {
    const isSideBySide = d3.select("#comparison-overlay").style("display") !== "none";
    const currentTreemapWidth = isSideBySide ? chartWidth * 0.55 : chartWidth;

    const root = d3.hierarchy<{ children: CountrySummary[] }>({ children: source })
        .sum((d: any) => (d.total ?? 0))
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const treemap = d3.treemap<{ children: CountrySummary[] }>()
        .size([currentTreemapWidth, seriesHeight])
        .paddingInner(2)
        .paddingOuter(2);

    treemap(root);

    const nodes = root.leaves() as unknown as d3.HierarchyRectangularNode<CountrySummary>[];

    const node = chartLayer.selectAll<SVGGElement, d3.HierarchyRectangularNode<CountrySummary>>("g.treemap-node")
        .data(nodes, d => d.data.code)
        .join(
            enter => {
                const g = enter.append("g")
                    .attr("class", "treemap-node")
                    .attr("transform", d => `translate(${d.x0},${d.y0})`)
                    .style("opacity", 0);
                    
                g.append("rect").attr("class", "bg-rect");
                
                g.append("rect").attr("class", "hover-split hover-human").style("pointer-events", "none").style("display", "none");
                g.append("rect").attr("class", "hover-split hover-animal").style("pointer-events", "none").style("display", "none");
                g.append("rect").attr("class", "hover-split hover-industrial").style("pointer-events", "none").style("display", "none");
                
                g.append("text").attr("class", "node-label");
                return g;
            },
            update => update,
            exit => exit.transition().duration(400).style("opacity", 0).remove()
        );

    node.transition().duration(800)
        .attr("transform", d => `translate(${d.x0},${d.y0})`)
        .style("opacity", d => highlightCountries.length ? (highlightCountries.includes(d.data.code) ? 1 : 0.28) : opacity);

    node.each(function(d) {
        const w = Math.max(0, d.x1 - d.x0);
        const h = Math.max(0, d.y1 - d.y0);
        const t = d.data.total;
        const pctHuman = t === 0 ? 0 : d.data.directHumanFood / t;
        const pctAnimal = t === 0 ? 0 : d.data.directAnimalFeed / t;
        const pctIndustrial = t === 0 ? 0 : d.data.processed / t;

        const g = d3.select(this);
        g.select(".bg-rect")
            .attr("width", w).attr("height", h)
            .attr("fill", colors.neutral)
            .attr("stroke", "rgba(0,0,0,0.12)")
            .attr("stroke-width", 1);
            
        g.select(".hover-human")
            .attr("x", 0).attr("y", 0).attr("width", w * pctHuman).attr("height", h).attr("fill", colors.human);
        g.select(".hover-animal")
            .attr("x", w * pctHuman).attr("y", 0).attr("width", w * pctAnimal).attr("height", h).attr("fill", colors.animal);
        g.select(".hover-industrial")
            .attr("x", w * (pctHuman + pctAnimal)).attr("y", 0).attr("width", w * pctIndustrial).attr("height", h).attr("fill", colors.processed);
            
        g.select(".node-label")
            .attr("x", 8).attr("y", 18)
            .attr("fill", "#1e1d1b")
            .attr("font-size", 11)
            .attr("font-weight", 600)
            .text(() => {
                const label = countryAlias[d.data.code] ?? d.data.entity;
                return w > 48 && h > 22 ? label : "";
            });
    });

    node.on("click", (_event, d) => {
        const overlay = d3.select("#comparison-overlay");
        if (overlay.style("display") === "none") return;

        const code = d.data.code;
        const select1 = document.getElementById("country1-select") as HTMLSelectElement;
        const select2 = document.getElementById("country2-select") as HTMLSelectElement;

        if (!select1.value) {
            select1.value = code;
        } else if (!select2.value) {
            if (select1.value !== code) select2.value = code;
        } else {
            if (select1.value !== code && select2.value !== code) {
                select1.value = select2.value;
                select2.value = code;
            }
        }
        updateComparison();
    })
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
        syncTreemapSelection(d.data.code);
        
        const t = d.data.total;
        if (t === 0) return;

        const pctHuman = d.data.directHumanFood / t;
        const pctAnimal = d.data.directAnimalFeed / t;
        const pctIndustrial = d.data.processed / t;
        
        tooltip.style("display", "block").html(`
            <div style="font-weight: bold; margin-bottom: 8px; font-size: 1.1em;">${countryAlias[d.data.code] ?? d.data.entity}</div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: ${colors.human}">Human Food:</span>
                <span>${(pctHuman * 100).toFixed(1)}%</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: ${colors.animal}">Animal Feed:</span>
                <span>${(pctAnimal * 100).toFixed(1)}%</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: ${colors.processed}">Industrial:</span>
                <span>${(pctIndustrial * 100).toFixed(1)}%</span>
            </div>
            <div style="margin-top: 8px; font-size: 0.85em; opacity: 0.8; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 6px;">
                Total: ${d3.format(",.0f")(t)} tonnes
            </div>
        `);
    })
    .on("mousemove", function (event) {
        tooltip
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY + 15) + "px");
    })
    .on("mouseout", function () {
        syncTreemapSelection(null);
        tooltip.style("display", "none");
    });
    
    // Call sync immediately to apply initial highlights if any
    syncTreemapSelection(null);
}

export function drawAustriaChart() {
    if (d3.select("#austria-chart").empty()) {
        const c = d3.select("#visualization").append("div")
            .attr("id", "austria-chart")
            .style("position", "absolute")
            .style("top", "50%")
            .style("left", "50%")
            .style("transform", "translate(-50%, -50%)")
            .style("width", "80%")
            .style("max-width", "1000px")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("gap", "2rem")
            .style("opacity", 0)
            .style("transition", "opacity 0.8s ease")
            .style("z-index", "10");

        const buildBar = (label: string, pct1: number, label1: string, c1: string, pct2: number, label2: string, c2: string) => `
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <div style="font-size: 1.2rem; font-weight: 500; color: var(--text-dark);">${label}</div>
                <div style="display: flex; height: 60px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid rgba(255,255,255,0.3);">
                    <div style="width: ${pct1}%; background: ${c1}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">${pct1}% ${label1}</div>
                    <div style="width: ${pct2}%; background: ${c2}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600;">${pct2}% ${label2}</div>
                </div>
            </div>
        `;

        c.html(`
            ${buildBar("Global Soy Use", 80, "Feed & Industry", "linear-gradient(90deg, var(--color-animal), var(--color-industrial))", 20, "Human Food", "var(--color-human)")}
            ${buildBar("Austria Soy Use", 50, "Feed", "var(--color-animal)", 50, "Human Food", "var(--color-human)")}
            
            <div style="text-align: center; margin-top: 0.5rem; opacity: 0.6; font-size: 0.9rem;">*Based on 2025 data for Austria</div>

            <div id="austria-badges" style="display: flex; justify-content: space-around; margin-top: 2rem; opacity: 0; transition: opacity 0.8s ease; flex-wrap: wrap; gap: 1.5rem;">
                <div style="background: rgba(220, 218, 211, 0.8); padding: 1.5rem 2rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.4); text-align: center; flex: 1; box-shadow: 0 8px 24px rgba(0,0,0,0.04);">
                    <div style="font-size: 2.2rem; font-weight: 700; color: var(--color-human);">>275k</div>
                    <div style="font-size: 0.95rem; opacity: 0.8; color: var(--text-dark); margin-top: 0.5rem;">Tonnes grown per year (3rd in EU)</div>
                </div>
                <div style="background: rgba(220, 218, 211, 0.8); padding: 1.5rem 2rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.4); text-align: center; flex: 1; box-shadow: 0 8px 24px rgba(0,0,0,0.04);">
                    <div style="font-size: 2.2rem; font-weight: 700; color: var(--color-human);">85,600</div>
                    <div style="font-size: 0.95rem; opacity: 0.8; color: var(--text-dark); margin-top: 0.5rem;">Hectares farmed across the country</div>
                </div>
                <div style="background: rgba(220, 218, 211, 0.8); padding: 1.5rem 2rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.4); text-align: center; flex: 1; box-shadow: 0 8px 24px rgba(0,0,0,0.04);">
                    <div style="font-size: 2.2rem; font-weight: 700; color: var(--color-human);">100%</div>
                    <div style="font-size: 0.95rem; opacity: 0.8; color: var(--text-dark); margin-top: 0.5rem;">GMO-Free and over 33% Organic</div>
                </div>
            </div>

            <div id="austria-restart" style="display: flex; justify-content: center; margin-top: 3rem; opacity: 0; transition: opacity 0.8s ease;">
                <button type="button" onclick="window.scrollTo({top: 0, behavior: 'smooth'})" style="pointer-events: auto; background: var(--color-human); border: none; padding: 0.8rem 1.5rem; border-radius: 6px; color: white; font-weight: 600; cursor: pointer;">↻ Start Over</button>
            </div>
        `);
    }
}
