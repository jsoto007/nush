import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider, useCart } from "./context/CartContext";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { RestaurantList } from "./pages/RestaurantList";
import { RestaurantDetails } from "./pages/RestaurantDetails";
import { Checkout } from "./pages/Checkout";
import { CartSidebar } from "./components/CartSidebar";
import { User, ShoppingCart, Search } from "lucide-react";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { setIsOpen, cart } = useCart();
  const itemCount = cart?.items.length || 0;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-stone-900 selection:text-white">
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <h1
              onClick={() => window.location.href = "/"}
              className="cursor-pointer text-2xl font-black tracking-tighter"
            >
              NUSH<span className="text-stone-400">.</span>
            </h1>

            <div className="hidden min-w-[320px] items-center gap-3 rounded-2xl bg-stone-100 px-4 py-2.5 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-stone-900/5 sm:flex">
              <Search size={18} className="text-stone-400" />
              <input
                type="text"
                placeholder="Search restaurants, cuisines..."
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-stone-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(true)}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl transition hover:bg-stone-100"
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-[10px] font-bold text-white ring-4 ring-white">
                  {itemCount}
                </span>
              )}
            </button>
            <div className="h-6 w-px bg-stone-200 mx-2" />
            <div className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-1 pr-3 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-sm font-bold text-white uppercase">
                {user?.name?.charAt(0)}
              </div>
              <span className="text-sm font-bold hidden sm:inline">{user?.name}</span>
              <button
                onClick={logout}
                className="ml-2 text-xs font-bold text-stone-400 hover:text-red-500 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      <CartSidebar />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <RestaurantList />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/restaurant/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <RestaurantDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Checkout />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
