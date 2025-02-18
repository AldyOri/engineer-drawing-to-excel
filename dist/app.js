"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routes_1 = __importDefault(require("./routes/routes"));
const routes_v2_1 = __importDefault(require("./routes/routes-v2"));
const constants_1 = require("./constants/constants");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api/v1", routes_1.default);
app.use("/api/v2", routes_v2_1.default);
app.listen(constants_1.PORT, () => {
    console.log(`Server is running on http://localhost:${constants_1.PORT}`);
});
