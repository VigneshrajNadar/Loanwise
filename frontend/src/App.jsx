import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import { ChatProvider } from './context/ChatContext';
import { Section10AIChat } from './pages/fhd/Section10AIChat';


// ── Lazy-load every page (code splitting — only load what's needed) ─────────
const HomePage                = lazy(() => import('./pages/HomePage'));
const EligibilityPage         = lazy(() => import('./pages/EligibilityPage'));
const DefaultRiskPage         = lazy(() => import('./pages/DefaultRiskPage'));
const DecisionIntelligencePage= lazy(() => import('./pages/DecisionIntelligencePage'));
const FinancialHealthDashboard= lazy(() => import('./pages/FinancialHealthDashboard'));
const LoginPage               = lazy(() => import('./pages/LoginPage'));
const RegisterPage            = lazy(() => import('./pages/RegisterPage'));
const UserDashboard           = lazy(() => import('./pages/UserDashboard'));
const LifePlannerPage         = lazy(() => import('./pages/LifePlannerPage'));

// Minimal loading fallback — no heavy UI, just keeps layout stable
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );
}

// Auth pages don't show the Navbar
function AuthLayout({ children }) {
  return <>{children}</>;
}

// Main app layout with Navbar — no heavy blur-blobs (massive perf killer removed)
function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col w-full">
      <Navbar />
      <main className="flex-1 w-full mt-20">{children}</main>
      <Section10AIChat />
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth routes */}
        <Route path="/login"    element={<AuthLayout><LoginPage /></AuthLayout>} />
        <Route path="/register" element={<AuthLayout><RegisterPage /></AuthLayout>} />

        {/* Main app routes */}
        <Route path="/"               element={<AppLayout><HomePage /></AppLayout>} />
        <Route path="/eligibility"    element={<AppLayout><EligibilityPage /></AppLayout>} />
        <Route path="/default-risk"   element={<AppLayout><DefaultRiskPage /></AppLayout>} />
        <Route path="/intelligence"   element={<AppLayout><DecisionIntelligencePage /></AppLayout>} />
        <Route path="/health-dashboard" element={<AppLayout><FinancialHealthDashboard /></AppLayout>} />
        <Route path="/dashboard"      element={<AppLayout><UserDashboard /></AppLayout>} />
        <Route path="/life-planner"   element={<AppLayout><LifePlannerPage /></AppLayout>} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <AppRoutes />
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

