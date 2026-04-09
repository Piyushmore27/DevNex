import { createBrowserRouter } from "react-router-dom";
import Login from "./Features/Auth/Login";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
]);
