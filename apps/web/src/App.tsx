import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider, useCart } from "./context/CartContext";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { RestaurantList } from "./pages/RestaurantList";
import { RestaurantDetails } from "./pages/RestaurantDetails";
import { Checkout } from "./pages/Checkout";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { VerifyEmail } from "./pages/VerifyEmail";
import { Profile } from "./pages/Profile";
import { OrderHistory } from "./pages/OrderHistory";
import { AccountSettings } from "./pages/AccountSettings";
import { AddressBook } from "./pages/AddressBook";
import { AdminRoute } from "./components/AdminRoute";
import { OwnerRoute } from "./components/OwnerRoute";
import { SuperAdminDashboard } from "./pages/admin/SuperAdminDashboard";
import { OwnerDashboard } from "./pages/admin/OwnerDashboard";
import { RestaurantConsole } from "./pages/admin/RestaurantConsole";
import { MenuManagement } from "./pages/admin/MenuManagement";
import { StaffManagement } from "./pages/admin/StaffManagement";
import { InventoryManager } from "./pages/admin/InventoryManager";
import { RestaurantSettings } from "./pages/admin/RestaurantSettings";
import { CartSidebar } from "./components/CartSidebar";
import { User, ShoppingCart, Search, ShoppingBag, MapPin } from "lucide-react";

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
  const navigate = useNavigate();
  const itemCount = cart?.items.length || 0;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-stone-900 selection:text-white">
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <h1
              onClick={() => navigate("/")}
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

            {user ? (
              <div className="group relative">
                <div className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-1 pr-3 shadow-sm transition-all hover:border-stone-200">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-sm font-bold text-white uppercase">
                    {user?.name?.charAt(0)}
                  </div>
                  <div className="hidden flex-col sm:flex">
                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">Customer</span>
                    <span className="text-sm font-bold leading-none">{user?.name}</span>
                  </div>
                </div>

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-2 w-56 origin-top-right scale-95 opacity-0 transition-all group-hover:scale-100 group-hover:opacity-100">
                  <div className="overflow-hidden rounded-2xl border border-stone-100 bg-white p-2 shadow-2xl shadow-stone-200/50">
                    <button onClick={() => navigate("/profile")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-stone-600 transition hover:bg-stone-50 hover:text-stone-900">
                      <User size={16} /> Profile
                    </button>
                    <button onClick={() => navigate("/orders")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-stone-600 transition hover:bg-stone-50 hover:text-stone-900">
                      <ShoppingBag size={16} /> Order History
                    </button>
                    <button onClick={() => navigate("/address-book")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-stone-600 transition hover:bg-stone-50 hover:text-stone-900">
                      <MapPin size={16} /> Address Book
                    </button>
                    <button onClick={() => navigate("/settings")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-stone-600 transition hover:bg-stone-50 hover:text-stone-900">
                      <Search size={16} /> Account Settings
                    </button>
                    <div className="my-2 h-px bg-stone-100" />
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-red-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/login")}
                  className="rounded-xl px-4 py-2 text-sm font-bold text-stone-900 transition hover:bg-stone-100"
                >
                  Log In
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-stone-800"
                >
                  Sign Up
                </button>
              </div>
            )}
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
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route
              path="/"
              element={
                <Layout>
                  <RestaurantList />
                </Layout>
              }
            />
            <Route
              path="/restaurant/:id"
              element={
                <Layout>
                  <RestaurantDetails />
                </Layout>
              }
            />
            <Route
              path="/checkout"
              element={
                <Layout>
                  <Checkout />
                </Layout>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Layout>
                    <OrderHistory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AccountSettings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/address-book"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AddressBook />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Super Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <SuperAdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/restaurant/:id"
              element={
                <AdminRoute>
                  <RestaurantConsole />
                </AdminRoute>
              }
            >
              <Route path="menu" element={<MenuManagement />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="inventory" element={<InventoryManager />} />
              <Route path="settings" element={<RestaurantSettings />} />
            </Route>

            {/* Restaurant Partner Portal Routes */}
            <Route
              path="/restaurant/admin-portal"
              element={
                <OwnerRoute>
                  <OwnerDashboard />
                </OwnerRoute>
              }
            />
            <Route
              path="/restaurant/admin-portal/restaurant/:id"
              element={
                <OwnerRoute>
                  <RestaurantConsole />
                </OwnerRoute>
              }
            >
              <Route path="menu" element={<MenuManagement />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="inventory" element={<InventoryManager />} />
              <Route path="settings" element={<RestaurantSettings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
