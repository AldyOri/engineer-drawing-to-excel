"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KETERANGAN_REGEX = exports.MECHANICAL_SYSTEM_REGEX = exports.INTEGRATION_REGEX = exports.WELDING_REGEX = exports.APPROVAL_REGEX = exports.CHECKER_REGEX = exports.DRAFTER_REGEX = exports.TANGGAL_RELEASE_REGEX = exports.TANGGAL_DRAWING_REGEX = exports.REV_REGEX = exports.SHEET_REGEX = exports.SIZE_REGEX = exports.TYPE_REGEX = exports.NAMA_GAMBAR_REGEX = exports.NO_GAMBAR_REGEX = exports.PROYEK_REGEX = void 0;
exports.PROYEK_REGEX = "^[\\w\\s]+$";
exports.NO_GAMBAR_REGEX = "^\\d{2,3}\\.\\d-[A-Z]+\\d{5}$";
exports.NAMA_GAMBAR_REGEX = "^[A-Z\\s]+$";
exports.TYPE_REGEX = "^([A-Z0-9]+(; )?)+$";
// Paper
exports.SIZE_REGEX = "^[A-Z]\\d?$";
exports.SHEET_REGEX = "^d$";
exports.REV_REGEX = "^[A-Z0-9]$";
exports.TANGGAL_DRAWING_REGEX = "^\\d{2}-[A-Za-z]{3}-\\d{2}$";
exports.TANGGAL_RELEASE_REGEX = "^\\d{2}-[A-Za-z]{3}-\\d{2}$";
// Drawing Initial
exports.DRAFTER_REGEX = "^[A-Z]{2,4}$";
exports.CHECKER_REGEX = "^[A-Z]{2,4}$";
exports.APPROVAL_REGEX = "^[A-Z]{2,4}$";
exports.WELDING_REGEX = "^[A-Z]{2,4}$";
exports.INTEGRATION_REGEX = "^[A-Z]{2,4}$";
exports.MECHANICAL_SYSTEM_REGEX = "^[A-Z]{2,4}$";
exports.KETERANGAN_REGEX = "^[A-Z/]+\\d{4}$";
// export const
