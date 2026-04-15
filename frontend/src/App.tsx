import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Matches from "./pages/Matches";
import ValueBets from "./pages/ValueBets";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/value-bets" element={<ValueBets />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
