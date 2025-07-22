
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Splash from "./pages/Splash";
import BPA from "./pages/BPA";
import Auth from "./pages/Auth";
import CustomerDetails from "./pages/CustomerDetails";
import Customers from "./pages/Customers";
import Menu from "./pages/Menu";
import CompanyData from "./pages/CompanyData";
import Calendar from "./pages/Calendar";
import NotFound from "./pages/NotFound";
import Inventory from "./pages/Inventory";
import Analytics from "./pages/Analytics";
import TSBs from "./pages/TSBs";
import Manuals from "./pages/Manuals";
import PartsDiagrams from "./pages/PartsDiagrams";
import EULA from "./pages/EULA";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { Employees } from "./pages/Employees";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/bpa" element={<BPA />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/customer/:id" element={<CustomerDetails />} />
            <Route path="/company-data" element={
              <ProtectedRoute excludedRoles={['guest']}>
                <CompanyData />
              </ProtectedRoute>
            } />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/employees" element={
              <ProtectedRoute excludedRoles={['guest']}>
                <Employees />
              </ProtectedRoute>
            } />
          <Route path="/tsbs" element={<TSBs />} />
          <Route path="/manuals" element={<Manuals />} />
          <Route path="/manuals/:category" element={<Manuals />} />
          <Route path="/parts-diagrams" element={<PartsDiagrams />} />
          <Route path="/parts-diagrams/:category" element={<PartsDiagrams />} />
          <Route path="/eula" element={<EULA />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
