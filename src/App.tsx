
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Splash from "./pages/Splash";
import BPA from "./pages/BPA";
import Auth from "./pages/Auth";
import CustomerDetails from "./pages/CustomerDetails";
import Customers from "./pages/Customers";
import Menu from "./pages/Menu";
import CompanyData from "./pages/CompanyData";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
