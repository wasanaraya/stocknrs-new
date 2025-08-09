
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { StockProvider } from './contexts/StockContext';
import { Toaster } from '@/components/ui/toaster';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Suppliers from './pages/Suppliers';
import Movements from './pages/Movements';
import Scanner from './pages/Scanner';
import BudgetRequest from './pages/BudgetRequest';
import ApprovalPage from './pages/ApprovalPage';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function App() {
  return (
    <StockProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/movements" element={<Movements />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/budget-request" element={<BudgetRequest />} />
          <Route path="/approval" element={<ApprovalPage />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </Router>
    </StockProvider>
  );
}

export default App;
