import { describe, it, expect } from "vitest";
import {
  toEthiopianDate,
  toGregorianDate,
  toGeezNumeral,
  isEthiopianLeapYear,
  getDaysInEthiopianMonth,
  formatEthiopianDate,
} from "./ethiopianDate";

describe("Ethiopian Calendar Calculations", () => {
  it("converts Gregorian date to Ethiopian date accurately", () => {
    // 2026-10-18 corresponds to Tikimt 8, 2019 E.C.
    const eth = toEthiopianDate(new Date(2026, 9, 18));
    expect(eth).not.toBeNull();
    expect(eth.year).toBe(2019);
    expect(eth.month).toBe(2); // Tikimt is 2nd month
    expect(eth.day).toBe(8);
    expect(eth.monthNameAm).toBe("ጥቅምት");
    expect(eth.monthNameEn).toBe("Tikimt");
  });

  it("handles round-trip conversion between Gregorian and Ethiopian calendars", () => {
    const origGreg = new Date(2025, 8, 11); // Meskerem 1 (Ethiopian New Year)
    const eth = toEthiopianDate(origGreg);
    expect(eth.month).toBe(1);
    expect(eth.day).toBe(1);

    const backToGreg = toGregorianDate(eth.year, eth.month, eth.day);
    expect(backToGreg.getFullYear()).toBe(origGreg.getFullYear());
    expect(backToGreg.getMonth()).toBe(origGreg.getMonth());
    expect(backToGreg.getDate()).toBe(origGreg.getDate());
  });

  it("correctly identifies Ethiopian leap years", () => {
    // Ethiopian leap year occurs when year % 4 === 3 (e.g. 2015, 2019)
    expect(isEthiopianLeapYear(2015)).toBe(true);
    expect(isEthiopianLeapYear(2019)).toBe(true);
    expect(isEthiopianLeapYear(2016)).toBe(false);
    expect(isEthiopianLeapYear(2017)).toBe(false);
  });

  it("calculates correct days in Pagume (month 13)", () => {
    // Leap year has 6 days in Pagume; normal year has 5
    expect(getDaysInEthiopianMonth(2015, 13)).toBe(6);
    expect(getDaysInEthiopianMonth(2016, 13)).toBe(5);
    expect(getDaysInEthiopianMonth(2019, 13)).toBe(6);
    expect(getDaysInEthiopianMonth(2020, 13)).toBe(5);
    // Regular months always have 30 days
    expect(getDaysInEthiopianMonth(2019, 1)).toBe(30);
    expect(getDaysInEthiopianMonth(2019, 2)).toBe(30);
  });

  it("converts numbers to Ge'ez numerals", () => {
    expect(toGeezNumeral(1)).toBe("፩");
    expect(toGeezNumeral(5)).toBe("፭");
    expect(toGeezNumeral(10)).toBe("፲");
    expect(toGeezNumeral(12)).toBe("፲፪");
    expect(toGeezNumeral(25)).toBe("፳፭");
  });

  it("formats Ethiopian dates in Amharic and Latin styles", () => {
    const d = new Date(2026, 9, 18);
    const amharicFormatted = formatEthiopianDate(d, "amharic");
    expect(amharicFormatted).toContain("ጥቅምት 8, 2019");

    const latinFormatted = formatEthiopianDate(d, "latinShort");
    expect(latinFormatted).toBe("8 Tikimt 2019");
  });
});
