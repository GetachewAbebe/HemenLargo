// Ethiopian Calendar (የኢትዮጵያ ዘመን አቆጣጠር) Utility
// Accurate mathematical JDN converter between Gregorian and Ethiopian calendars

export const ETHIOPIAN_MONTHS_AM = [
  "መስከረም",
  "ጥቅምት",
  "ኅዳር",
  "ታኅሣሥ",
  "ጥር",
  "የካቲት",
  "መጋቢት",
  "ሚያዝያ",
  "ግንቦት",
  "ሰኔ",
  "ሐምሌ",
  "ነሐሴ",
  "ጳጉሜን",
];

export const ETHIOPIAN_MONTHS_EN = [
  "Meskerem",
  "Tikimt",
  "Hidar",
  "Tahsas",
  "Tir",
  "Yekatit",
  "Megabit",
  "Miazia",
  "Ginbot",
  "Sene",
  "Hamle",
  "Nehase",
  "Pagume",
];

export const ETHIOPIAN_WEEKDAYS_AM = [
  "እሑድ",
  "ሰኞ",
  "ማክሰኞ",
  "ረቡዕ",
  "ሐሙስ",
  "ዓርብ",
  "ቅዳሜ",
];

export const ETHIOPIAN_WEEKDAYS_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Ge'ez Numerals Converter
export const toGeezNumeral = (num) => {
  const n = parseInt(num, 10);
  if (isNaN(n) || n < 1) return String(num);

  const geezDigits = ["", "፩", "፪", "፫", "፬", "፭", "፮", "፯", "፰", "፱"];
  const geezTens = ["", "፲", "፳", "፴", "፵", "፶", "፷", "፸", "፹", "፺"];

  const convert2Digit = (val) => {
    const tens = Math.floor(val / 10);
    const ones = val % 10;
    return (geezTens[tens] || "") + (geezDigits[ones] || "");
  };

  if (n < 100) return convert2Digit(n);
  if (n < 10000) {
    const hundreds = Math.floor(n / 100);
    const rem = n % 100;
    const hStr = hundreds === 1 ? "፻" : convert2Digit(hundreds) + "፻";
    const rStr = rem > 0 ? convert2Digit(rem) : "";
    return hStr + rStr;
  }
  return String(num);
};

// Check if an Ethiopian year is a leap year (Pagume has 6 days instead of 5)
export const isEthiopianLeapYear = (ethYear) => {
  return ethYear % 4 === 3;
};

// Returns number of days in a given Ethiopian month
export const getDaysInEthiopianMonth = (ethYear, ethMonth) => {
  if (ethMonth === 13) {
    return isEthiopianLeapYear(ethYear) ? 6 : 5;
  }
  return 30;
};

// Julian Day Number (JDN) <-> Ethiopian Calendar
export const ethiopianToJDN = (year, month, day) => {
  return 1723856 + 365 * year + Math.floor(year / 4) + 30 * (month - 1) + day - 1;
};

export const jdnToEthiopian = (jdn) => {
  const r = (jdn - 1723856) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const year = 4 * Math.floor((jdn - 1723856) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;
  return { year, month, day };
};

// Julian Day Number (JDN) <-> Gregorian Calendar
export const gregorianToJDN = (year, month, day) => {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
};

export const jdnToGregorian = (jdn) => {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
};

// Convert any Date/ISO string to Ethiopian Date object
export const toEthiopianDate = (dateInput = new Date()) => {
  const dateObj = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(dateObj.getTime())) {
    return null;
  }

  const gy = dateObj.getFullYear();
  const gm = dateObj.getMonth() + 1;
  const gd = dateObj.getDate();

  const jdn = gregorianToJDN(gy, gm, gd);
  const { year, month, day } = jdnToEthiopian(jdn);

  const weekdayIndex = dateObj.getDay(); // 0 = Sunday
  const monthNameAm = ETHIOPIAN_MONTHS_AM[month - 1] || "";
  const monthNameEn = ETHIOPIAN_MONTHS_EN[month - 1] || "";
  const weekdayAm = ETHIOPIAN_WEEKDAYS_AM[weekdayIndex] || "";
  const weekdayEn = ETHIOPIAN_WEEKDAYS_EN[weekdayIndex] || "";

  return {
    year,
    month,
    day,
    monthNameAm,
    monthNameEn,
    weekdayAm,
    weekdayEn,
    weekdayIndex,
    isLeapYear: isEthiopianLeapYear(year),
    originalDate: dateObj,
  };
};

// Convert Ethiopian year, month, day to Gregorian Date object
export const toGregorianDate = (ethYear, ethMonth, ethDay, hours = 0, minutes = 0) => {
  const jdn = ethiopianToJDN(Number(ethYear), Number(ethMonth), Number(ethDay));
  const { year, month, day } = jdnToGregorian(jdn);
  return new Date(year, month - 1, day, hours, minutes);
};

// Format Ethiopian Date with various styles
export const formatEthiopianDate = (dateInput, style = "amharic") => {
  if (!dateInput) return "";
  const eth = toEthiopianDate(dateInput);
  if (!eth) return "";

  switch (style) {
    case "full":
      // እሑድ፣ ጥቅምት 8 ቀን 2019 ዓ.ም
      return `${eth.weekdayAm}፣ ${eth.monthNameAm} ${eth.day} ቀን ${eth.year} ዓ.ም`;
    case "medium":
    case "amharic":
      // ጥቅምት 8, 2019 ዓ.ም
      return `${eth.monthNameAm} ${eth.day}, ${eth.year} ዓ.ም`;
    case "short":
      // 08/02/2019 ዓ.ም
      return `${String(eth.day).padStart(2, "0")}/${String(eth.month).padStart(2, "0")}/${eth.year} ዓ.ም`;
    case "latin":
      // Sunday, 8 Tikimt 2019 E.C.
      return `${eth.weekdayEn}, ${eth.day} ${eth.monthNameEn} ${eth.year} E.C.`;
    case "latinShort":
      // 8 Tikimt 2019
      return `${eth.day} ${eth.monthNameEn} ${eth.year}`;
    case "dual": {
      // ጥቅምት 8, 2019 ዓ.ም (Oct 18, 2026)
      const d = eth.originalDate;
      const gregStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return `${eth.monthNameAm} ${eth.day}, ${eth.year} ዓ.ም (${gregStr})`;
    }
    case "geez":
      // ፰ ጥቅምት ፳፻፲፱ ዓ.ም
      return `${toGeezNumeral(eth.day)} ${eth.monthNameAm} ${toGeezNumeral(eth.year)} ዓ.ም`;
    default:
      return `${eth.monthNameAm} ${eth.day}, ${eth.year} ዓ.ም`;
  }
};

// Format Time with Amharic or 12hr representation
export const formatEthiopianTime = (dateInput, includeAmharicPeriod = true) => {
  if (!dateInput) return "";
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const h12 = hours % 12 || 12;
  const ampm = hours >= 12 ? "PM" : "AM";

  if (!includeAmharicPeriod) {
    return `${String(h12).padStart(2, "0")}:${minutes} ${ampm}`;
  }

  let periodAm = "ጥዋት"; // Morning (6am - 12pm)
  if (hours >= 12 && hours < 18) {
    periodAm = "ከሰዓት"; // Afternoon (12pm - 6pm)
  } else if (hours >= 18 && hours < 23) {
    periodAm = "ማታ"; // Evening (6pm - 11pm)
  } else if (hours >= 23 || hours < 6) {
    periodAm = "ሌሊት"; // Night (11pm - 6am)
  }

  return `${String(h12).padStart(2, "0")}:${minutes} ${periodAm}`;
};

// Format Date & Time combined
export const formatEthiopianDateTime = (dateInput, style = "amharic", includeAmharicTime = false) => {
  if (!dateInput) return "";
  const dateStr = formatEthiopianDate(dateInput, style);
  const timeStr = formatEthiopianTime(dateInput, includeAmharicTime);
  return `${dateStr} • ${timeStr}`;
};

// Returns current Ethiopian date object
export const getEthiopianToday = () => {
  return toEthiopianDate(new Date());
};

// Returns Ethiopian date N days in the future (for store credit due dates)
export const getEthiopianDaysAhead = (days = 7, style = "amharic") => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return {
    dateObj: d,
    eth: toEthiopianDate(d),
    formatted: formatEthiopianDate(d, style),
  };
};

// Check if two dates fall on the same Ethiopian day
export const isSameEthiopianDay = (dateA, dateB = new Date()) => {
  const a = toEthiopianDate(dateA);
  const b = toEthiopianDate(dateB);
  if (!a || !b) return false;
  return a.year === b.year && a.month === b.month && a.day === b.day;
};

// Check if two dates fall in the same Ethiopian month & year
export const isSameEthiopianMonth = (dateA, dateB = new Date()) => {
  const a = toEthiopianDate(dateA);
  const b = toEthiopianDate(dateB);
  if (!a || !b) return false;
  return a.year === b.year && a.month === b.month;
};

// Check if two dates fall in the same Ethiopian year
export const isSameEthiopianYear = (dateA, dateB = new Date()) => {
  const a = toEthiopianDate(dateA);
  const b = toEthiopianDate(dateB);
  if (!a || !b) return false;
  return a.year === b.year;
};

// Get Gregorian Date range for an entire Ethiopian month
export const getEthiopianMonthDateRange = (ethYear, ethMonth) => {
  const daysInMonth = getDaysInEthiopianMonth(ethYear, ethMonth);
  const start = toGregorianDate(ethYear, ethMonth, 1, 0, 0);
  const end = toGregorianDate(ethYear, ethMonth, daysInMonth, 23, 59);
  return { start, end, daysInMonth };
};
