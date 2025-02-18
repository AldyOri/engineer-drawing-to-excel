import express, { Application } from "express";
import routes from "./routes/routes";
import routesV2 from "./routes/routes-v2";
import { PORT } from "./constants/constants";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", routes);
app.use("/api/v2", routesV2);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
