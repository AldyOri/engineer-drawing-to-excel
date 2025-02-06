export interface Zone {
  xStart: number;
  xEnd: number;
  yStart: number;
  yEnd: number;
  origin?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

interface ExtractionConfig {
  label: string;
  pattern: RegExp;
  excludePattern?: RegExp;
  zones: Zone[];
}

export const EXTRACTION_CONFIG: ExtractionConfig[] = [
  {
    label: "Proyek",
    pattern: /^$/,
    zones: [
      {
        xStart: 0,
        xEnd: 0,
        yStart: 0,
        yEnd: 0,
      },
    ],
  },
  {
    label: "No Gambar",
    pattern: /^\d{2,3}\.\d-E\d{5}$/,
    zones: [
      {
        xStart: 1191 / 2,
        xEnd: 1191,
        yStart: 750,
        yEnd: 842,
        origin: "top-left",
      },
      {
        xStart: 0,
        xEnd: 1191 / 2,
        yStart: 0,
        yEnd: 824 / 2,
        origin: "bottom-right",
      },
    ],
  },
  {
    label: "Nama Gambar",
    pattern:
      /^(?:(?:COMPONENT|SCHEMATIC|WIRING|TB|SINGLE LINE|ARCHITECTURE)\s+(?:LAYOUT|INSTALLATION|DIAGRAM|TABLE|CONNECTION)\s+OF(?:\s+[A-Z0-9\s\-&',.\/]+)?|[A-Z0-9\s\-&',.\/]+|&\s+[A-Z0-9]+)$/,
    excludePattern: /^(?:RIE|\d{2}[-\/]\d{2}[-\/]\d{4}|TRP|\d+)$/,
    zones: [
      {
        xStart: 960,
        xEnd: 1160,
        yStart: 710,
        yEnd: 752,
        origin: "top-left",
      },
      {
        xStart: 1028,
        xEnd: 1138,
        yStart: 749,
        yEnd: 772,
        origin: "top-left",
      },
      {
        xStart: 70,
        xEnd: 150,
        yStart: 100,
        yEnd: 140,
        origin: "bottom-right",
      },
    ],
  },
  {
    label: "Type",
    pattern:
      /^(?:TC[1-3]?|M[1-2]?|T[1-3]?(?:\s*&\s*T1')?|KRL(?:\s+KCI)?|EMU)(?:\s*[,;&]\s*(?:TC[1-3]?|M[1-2]?|T[1-3]?(?:\s*&\s*T1')?|KRL(?:\s+KCI)?|EMU))*$/,
    zones: [
      {
        xStart: 1191 / 2,
        xEnd: 1191,
        yStart: 421,
        yEnd: 842,
        origin: "top-left",
      },
      {
        xStart: 0,
        xEnd: 1191 / 2,
        yStart: 0,
        yEnd: 842 / 2,
        origin: "bottom-right",
      },
    ],
  },
  {
    label: "Size",
    pattern: /^A[1-4]$/i,
    zones: [
      {
        xStart: 1091,
        xEnd: 1191,
        yStart: 812,
        yEnd: 842,
        origin: "top-left",
      },
      {
        xStart: 0,
        xEnd: 100,
        yStart: 0,
        yEnd: 30,
        origin: "bottom-right",
      },
    ],
  },
  {
    label: "Sheet", // unused
    pattern: /^\d{1,3}$/,
    zones: [
      // {
      //   xStart: 0, // 800
      //   xEnd: 0, // 820
      //   yStart: 0, // 760
      //   yEnd: 0, // 780
      //   origin: "top-left",
      // },
    ],
  },
  {
    label: "Rev",
    pattern: /^[A-Z0]$/i,
    excludePattern: /^REV$/i,
    zones: [
      {
        xStart: 877,
        xEnd: 960,
        yStart: 615,
        yEnd: 660,
        origin: "top-left",
      },
      {
        xStart: 970,
        xEnd: 1027,
        yStart: 681,
        yEnd: 714,
        origin: "top-left",
      },
      {
        xStart: 117,
        xEnd: 158,
        yStart: 185,
        yEnd: 229,
        origin: "bottom-right",
      },
    ],
  },
  {
    label: "Tanggal Drawing",
    pattern: /^(?:\d{2}[-/]\d{2}[-/]\d{4})$/,
    zones: [
      {
        xStart: 415,
        xEnd: 722,
        yStart: 615,
        yEnd: 747,
        origin: "top-left",
      },
      {
        xStart: 330,
        xEnd: 340,
        yStart: 140,
        yEnd: 150,
        origin: "bottom-right",
      },
    ],
  },
  {
    label: "Tanggal Release",
    pattern: /^$/,
    zones: [
      {
        xStart: 0,
        yStart: 0,
        xEnd: 0,
        yEnd: 0,
      },
    ],
  },
  {
    label: "Drafter",
    pattern: /^[A-Z]{2,3}$/,
    excludePattern: /^REVISED\s+BY$/i,
    zones: [
      {
        xStart: 868,
        xEnd: 980,
        yStart: 496,
        yEnd: 615,
        origin: "top-left",
      },
      {
        xStart: 960,
        xEnd: 1027,
        yStart: 482,
        yEnd: 682,
        origin: "top-left",
      },
      {
        xStart: 117,
        xEnd: 170,
        yStart: 230,
        yEnd: 430,
        origin: "bottom-right",
      },
    ],
  },
  {
    label: "Checker",
    pattern: /^[A-Z]{2,3}$/,
    zones: [
      {
        xStart: 870,
        xEnd: 890,
        yStart: 700,
        yEnd: 720,
        origin: "top-left"
      },
      {
        xStart: 960,
        xEnd: 985,
        yStart: 742,
        yEnd: 762,
        origin: "top-left"
      },
      {
        xStart: 145,
        xEnd: 165,
        yStart: 125,
        yEnd: 145,
        origin: "bottom-right"
      },
    ],
  },
  {
    label: "Approval",
    pattern: /^[A-Z]{3}$/,
    zones: [
      {
        xStart: 870,
        xEnd: 890,
        yStart: 660,
        yEnd: 680,
        origin: "top-left",
      },
      {
        xStart: 950,
        xEnd: 985,
        yStart: 714,
        yEnd: 734,
        origin: "top-left",
      },
      {
        xStart: 145,
        xEnd: 165,
        yStart: 165,
        yEnd: 185,
        origin: "bottom-right",
      },
    ],
  },
  {
    label: "Welding",
    pattern: /^$/,
    zones: [
      {
        xStart: 0,
        yStart: 0,
        xEnd: 0,
        yEnd: 0,
      },
    ],
  },
  {
    label: "Integration",
    pattern: /^(LGA|SSR)$/,
    zones: [
      {
        xStart: 0,
        xEnd: 1191 / 2,
        yStart: 842 / 2,
        yEnd: 842,
        origin: "top-left",
      },
      {
        xStart: 1191 / 3,
        xEnd: 1191 * (2 / 3),
        yStart: 842 * (3 / 4),
        yEnd: 824,
        origin: "top-left",
      },
      {
        xStart: 824 / 3,
        xEnd: 824 * (2 / 3),
        yStart: 0,
        yEnd: 1191 / 4,
        origin: "bottom-right",
      },
    ],
  },
  {
    label: "Mechanical System",
    pattern: /^$/,
    zones: [
      {
        xStart: 0,
        yStart: 0,
        xEnd: 0,
        yEnd: 0,
      },
    ],
  },
  {
    label: "Ket",
    pattern: /^KA\/(DE|EES)\/\d{1,3}\/\d{2,4}$/,
    zones: [
      {
        xStart: 1191 / 2,
        xEnd: 1191,
        yStart: 842 / 2,
        yEnd: 842,
        origin: "top-left",
      },
      {
        xStart: 0,
        xEnd: 1191 / 2,
        yStart: 0,
        yEnd: 842 / 2,
        origin: "bottom-right",
      },
    ],
  },
];
