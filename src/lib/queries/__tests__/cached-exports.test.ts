/**
 * Verifies that all cached query wrappers are exported and are functions.
 * This catches typos and missing exports at test time.
 */

import {
  getCachedHomeStats,
  getCachedRecentNotableFlights,
  getCachedSeasonHeatmap,
  getCachedTopTakeoffs,
  getCachedTopPilots,
  getCachedTopFlights,
  getCachedTopWings,
  getCachedCommunityGrowth,
  getCachedFlyabilityCalendar,
} from "../home";

import {
  getCachedTakeoffsList,
  getCachedTakeoffCalendarHeatmap,
  getCachedTakeoffMonthlyStats,
  getCachedTakeoffHourlyDistribution,
  getCachedTakeoffDayOfWeek,
  getCachedTakeoffDistanceHistogram,
  getCachedTakeoffTop10,
  getCachedTakeoffRecentFlights,
  getCachedTakeoffWingClasses,
  getCachedTakeoffTopGliders,
  getCachedTakeoffYearlyTrend,
  getCachedTakeoffBusiestDays,
} from "../takeoffs";

import {
  getCachedPilotsList,
  getCachedPilotsYearlyGrowth,
  getCachedPilotStats,
  getCachedPilotFavoriteTakeoff,
  getCachedPilotYearlyStats,
  getCachedPilotSiteMap,
  getCachedPilotEquipmentTimeline,
  getCachedPilotActivityHeatmap,
  getCachedPilotTopFlights,
  getCachedPilotLatestFlights,
  getCachedPilotDistanceHistogram,
  getCachedPilotDna,
} from "../pilots";

import {
  getCachedWingsList,
  getCachedCategoryMarketShare,
  getCachedWingTopFlights,
  getCachedWingRecentFlights,
  getCachedWingDistanceHistogram,
  getCachedWingAdoptionCurve,
  getCachedWingYearlyStats,
  getCachedWingFavoriteTakeoffs,
  getCachedWingCalendarHeatmap,
} from "../wings";

import {
  getCachedAllTimeRecords,
  getCachedCategoryRecords,
  getCachedAnnualRecords,
  getCachedYearOverYearGrowth,
  getCachedFunStats,
} from "../records";

import { getCachedSimilarFlights } from "../flights";

jest.mock("../../db", () => ({
  db: { execute: jest.fn() },
}));

describe("cached query exports", () => {
  const cachedFunctions = {
    // home
    getCachedHomeStats,
    getCachedRecentNotableFlights,
    getCachedSeasonHeatmap,
    getCachedTopTakeoffs,
    getCachedTopPilots,
    getCachedTopFlights,
    getCachedTopWings,
    getCachedCommunityGrowth,
    getCachedFlyabilityCalendar,
    // takeoffs
    getCachedTakeoffsList,
    getCachedTakeoffCalendarHeatmap,
    getCachedTakeoffMonthlyStats,
    getCachedTakeoffHourlyDistribution,
    getCachedTakeoffDayOfWeek,
    getCachedTakeoffDistanceHistogram,
    getCachedTakeoffTop10,
    getCachedTakeoffRecentFlights,
    getCachedTakeoffWingClasses,
    getCachedTakeoffTopGliders,
    getCachedTakeoffYearlyTrend,
    getCachedTakeoffBusiestDays,
    // pilots
    getCachedPilotsList,
    getCachedPilotsYearlyGrowth,
    getCachedPilotStats,
    getCachedPilotFavoriteTakeoff,
    getCachedPilotYearlyStats,
    getCachedPilotSiteMap,
    getCachedPilotEquipmentTimeline,
    getCachedPilotActivityHeatmap,
    getCachedPilotTopFlights,
    getCachedPilotLatestFlights,
    getCachedPilotDistanceHistogram,
    getCachedPilotDna,
    // wings
    getCachedWingsList,
    getCachedCategoryMarketShare,
    getCachedWingTopFlights,
    getCachedWingRecentFlights,
    getCachedWingDistanceHistogram,
    getCachedWingAdoptionCurve,
    getCachedWingYearlyStats,
    getCachedWingFavoriteTakeoffs,
    getCachedWingCalendarHeatmap,
    // records
    getCachedAllTimeRecords,
    getCachedCategoryRecords,
    getCachedAnnualRecords,
    getCachedYearOverYearGrowth,
    getCachedFunStats,
    // flights
    getCachedSimilarFlights,
  };

  it.each(Object.entries(cachedFunctions))(
    "%s is exported as a function",
    (name, fn) => {
      expect(fn).toBeDefined();
      expect(typeof fn).toBe("function");
    }
  );
});
