import { countryData, priorityCountries, selectedTreemapYear } from "./state";
import type { CountrySummary, DataRow } from "./types";

export function totalFor(d: DataRow) {
    return d.directHumanFood + d.directAnimalFeed + d.processed;
}

export function makeCountrySummary(d: DataRow): CountrySummary {
    const total = totalFor(d);
    return {
        ...d,
        total,
        processedShare: total === 0 ? 0 : d.processed / total
    };
}

export function getLatestCountryData(): CountrySummary[] {
    const latest = countryData.filter(d => d.year === selectedTreemapYear);
    const summaries = latest.map(makeCountrySummary).filter(d => d.total > 0);

    const byCode = new Map(summaries.map(d => [d.code, d] as const));
    const prioritized = priorityCountries
        .map(code => byCode.get(code))
        .filter((d): d is CountrySummary => Boolean(d));

    const rest = summaries
        .filter(d => !priorityCountries.includes(d.code))
        .sort((a, b) => b.total - a.total)
        .slice(0, 35);

    return [...prioritized, ...rest];
}

export function getSelectedCountryValues(code: string) {
    const row = countryData
        .filter(d => d.year === selectedTreemapYear && d.code === code)
        .map(makeCountrySummary)[0];
    return row ?? null;
}
