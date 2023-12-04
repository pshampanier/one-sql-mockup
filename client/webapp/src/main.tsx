import ReactDOM from "react-dom/client";
import App from "../../common/src/App";
import "../../common/src/index.css";
import "@/utils/monaco-workers";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
