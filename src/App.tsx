import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import HomePage from "./pages/HomePage";
import AudioCountPage from "./pages/AudioCountPage";
import ManualCountPage from "./pages/ManualCountPage";
import SpiritualIdPage from "./pages/SpiritualIdPage";
import IdentityGuidePage from "./pages/IdentityGuidePage";
import ActiveDaysPage from "./pages/ActiveDaysPage";
import NotFound from "./pages/NotFound";
import { initializeDatabase } from "./utils/indexedDBUtils";
import { initializeBackupScheduler } from "./utils/backupScheduler";

const queryClient = new QueryClient();

const App = () => {
  // Initialize IndexedDB when the app starts
  useEffect(() => {
    const init = async () => {
      await initializeDatabase();
      
      // Initialize backup scheduler
      initializeBackupScheduler();
    };
    init();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/audio" element={<AudioCountPage />} />
            <Route path="/manual" element={<ManualCountPage />} />
            <Route path="/spiritual-id" element={<SpiritualIdPage />} />
            <Route path="/identity-guide" element={<IdentityGuidePage />} />
            <Route path="/active-days" element={<ActiveDaysPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
