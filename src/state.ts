import * as d3 from "d3";
import { importedData } from "./data";
import Scrollama from "scrollama";

export const data = importedData;
export const worldData = data.filter(d => d.entity === "World").sort((a, b) => a.year - b.year);
export const countryData = data.filter(d => d.code && d.code.length === 3 && d.entity !== "World");
export const latestYear = d3.max(countryData, d => d.year) ?? 2023;

export let selectedAreaYear = latestYear;
export let selectedTreemapYear = latestYear;

export function setSelectedAreaYear(year: number) {
    selectedAreaYear = year;
}

export function setSelectedTreemapYear(year: number) {
    selectedTreemapYear = year;
}

export const countryAlias: Record<string, string> = {
    USA: "United States",
    BRA: "Brazil",
    CHN: "China",
    AUT: "Austria"
};

export const priorityCountries = ["USA", "BRA", "CHN", "AUT"];

export const width = window.innerWidth;
export const height = window.innerHeight;
export const margin = { top: 56, right: 32, bottom: 48, left: 56 };
export const chartWidth = width - margin.left - margin.right;
export const chartHeight = height - margin.top - margin.bottom;
export const seriesHeight = chartHeight;

export const colors = {
    human: "#4db68b",
    animal: "#dfa430",
    processed: "#d55b96",
    neutral: "#dcdad3" // Added for treemap background
} as const;

export const svg = d3.select("#visualization")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

export const mainGroup = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

export const chartLayer = mainGroup.append("g").attr("class", "chart-layer");

export const xScale = d3.scaleLinear()
    .domain(d3.extent(worldData, d => d.year) as [number, number])
    .range([0, chartWidth]);

export const yScale = d3.scaleLinear().range([seriesHeight, 0]);

export const scroller = Scrollama();
