import express, { Application } from "express";
import routes from "./routes/routes";
import { PDFService } from "./services/pdf-service";
import { OUTPUTS_DIR, PORT, UPLOADS_DIR } from "./constants/constants";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", routes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


