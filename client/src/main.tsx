import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

document.title = "Farm Management System";

createRoot(document.getElementById("root")!).render(<App />);
