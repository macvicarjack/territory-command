import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import OutcomesPage from "./pages/OutcomesPage";
import PipelinePage from "./pages/PipelinePage";
import TerritoryPage from "./pages/TerritoryPage";
import MapPage from "./pages/MapPage";
import CalendarPage from "./pages/CalendarPage";
import ProspectsPage from "./pages/ProspectsPage";
import NotesPage from "./pages/NotesPage";
import EmailBridgePage from "./pages/EmailBridgePage";
import WaitingRoomPage from "./pages/WaitingRoomPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/outcomes" element={<OutcomesPage />} />
          <Route path="/outcomes/:id" element={<OutcomesPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/territory" element={<TerritoryPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/prospects" element={<ProspectsPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/email" element={<EmailBridgePage />} />
          <Route path="/waiting" element={<WaitingRoomPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
