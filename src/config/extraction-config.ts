interface Zone {
  xStart: number;
  xEnd: number;
  yStart: number;
  yEnd: number;
}

interface ExtractionConfig {
  label: string;
  pattern: RegExp;
  zones: Zone[];
}

// notes to self
// zones [0] => top left origin
// zones [1] => bottom left origin

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
        xStart: 730,
        xEnd: 825,
        yStart: 1130,
        yEnd: 1180,
      },
      {
        xStart: 30,
        xEnd: 140,
        yStart: 1040,
        yEnd: 1080,
      },
      {
        xStart: 130,
        xEnd: 220,
        yStart: 35,
        yEnd: 80,
      },
    ],
  },
  {
    label: "Nama Gambar", // to do, fix the regex
    pattern:
      /^(?:(?:COMPONENT|SCHEMATIC|WIRING|TB|SINGLE LINE|ARCHITECTURE)\s+(?:LAYOUT|INSTALLATION|DIAGRAM|TABLE|CONNECTION)\s+OF(?:\s+[A-Z0-9\s\-&',.\/]+)?|[A-Z0-9\s\-&',.\/]+|&\s+[A-Z0-9]+)$/,
    zones: [
      {
        xStart: 677,
        xEnd: 767,
        yStart: 1023,
        yEnd: 1087,
      },
      {
        xStart: 71,
        xEnd: 97,
        yStart: 1020,
        yEnd: 1085,
      },
    ],
  },
  {
    label: "Type",
    pattern:
      /^(?:TC[1-3]?|M[1-2]?|T[1-3]?(?:\s*&\s*T1')?|KRL(?:\s+KCI)?|EMU)(?:\s*[,;&]\s*(?:TC[1-3]?|M[1-2]?|T[1-3]?(?:\s*&\s*T1')?|KRL(?:\s+KCI)?|EMU))*$/,
    zones: [
      {
        xStart: 525,
        xEnd: 620,
        yStart: 960,
        yEnd: 1069,
      },
      {
        xStart: 89,
        xEnd: 105,
        yStart: 837,
        yEnd: 872,
      },
    ],
  },
  {
    label: "Size",
    pattern: /^A[1-4]$/i,
    zones: [
      {
        xStart: 772,
        xEnd: 814,
        yStart: 1163,
        yEnd: 1175,
      },
      {
        xStart: 14,
        xEnd: 19,
        yStart: 1141,
        yEnd: 1175,
      },
    ],
  },
  {
    label: "Sheet",
    pattern: /^\d{1,3}$/,
    zones: [
      {
        xStart: 612,
        xEnd: 620,
        yStart: 1105,
        yEnd: 1120,
      },
      {
        xStart: 500,
        xEnd: 550,
        yStart: 1080,
        yEnd: 1100,
      },
      {
        xStart: 55,
        xEnd: 60,
        yStart: 869,
        yEnd: 875,
      },
    ],
  },
  {
    label: "Rev",
    pattern: /^[A-F0]$/i,
    zones: [
      {
        xStart: 180,
        xEnd: 195,
        yStart: 1130,
        yEnd: 1170,
      },
      {
        xStart: 180,
        xEnd: 195,
        yStart: 35,
        yEnd: 75,
      },
    ],
  },
  {
    label: "Tanggal Drawing",
    pattern: /^(?:\d{2}[-/]\d{2}[-/]\d{4})$/,
    zones: [
      // {
      //   xStart: 335,
      //   xEnd: 336,
      //   yStart: 870,
      //   yEnd: 875,
      // },
      {
        xStart: 0,
        xEnd: 562,
        yStart: 595,
        yEnd: 1191,
      },
      {
        xStart: 90,
        xEnd: 150,
        yStart: 35,
        yEnd: 75,
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
    zones: [
      {
        xStart: 500,
        xEnd: 580,
        yStart: 1100,
        yEnd: 1160,
      },
      {
        xStart: 500,
        xEnd: 580,
        yStart: 35,
        yEnd: 75,
      },
    ],
  },
  {
    label: "Checker",
    pattern: /^[A-Z]{2,3}$/,
    zones: [
      {
        xStart: 590,
        xEnd: 670,
        yStart: 1100,
        yEnd: 1160,
      },
      {
        xStart: 590,
        xEnd: 670,
        yStart: 35,
        yEnd: 75,
      },
    ],
  },
  {
    label: "Approval",
    pattern: /^[A-Z]{3}$/,
    zones: [
      {
        xStart: 480,
        xEnd: 520,
        yStart: 1120,
        yEnd: 1160,
      },
      {
        xStart: 480,
        xEnd: 520,
        yStart: 35,
        yEnd: 75,
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
        xStart: 570,
        xEnd: 620,
        yStart: 1100,
        yEnd: 1160,
      },
      {
        xStart: 570,
        xEnd: 620,
        yStart: 35,
        yEnd: 75,
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
        xStart: 421,
        xEnd: 842,
        yStart: 595,
        yEnd: 1191,
      },
      {
        xStart: 421,
        xEnd: 842,
        yStart: 595,
        yEnd: 0,
      },
    ],
  },
];
