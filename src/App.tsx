
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
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
            <Route path="/company-data" element={<CompanyData />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/tsbs" element={<TSBs />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
