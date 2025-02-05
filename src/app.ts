import express, { Application } from "express";
import routes from "./routes/routes";
import { PORT } from "./constants/constants";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", routes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
