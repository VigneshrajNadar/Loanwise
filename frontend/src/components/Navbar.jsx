import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Menu, X, ChevronRight, Zap, Brain, LogOut, LayoutDashboard, LogIn, Bell, Calendar } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = 'http://127.0.0.1:5001/api';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const { user, token, logout, isAuthenticated } = useAuth();

    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    setScrolled(window.scrollY > 20);
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fetchAlerts = useCallback(async () => {
        if (!isAuthenticated || !token) return;
        try {
            const r = await axios.get(`${API}/user/alerts`, { headers: { Authorization: `Bearer ${token}` } });
            setAlerts(r.data?.alerts || []);
        } catch(e) {}
    }, [isAuthenticated, token]);

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 15000); // Polling every 15s
        return () => clearInterval(interval);
    }, [fetchAlerts]);

    const markAlertsRead = async () => {
        try {
            await axios.post(`${API}/user/alerts/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
            fetchAlerts();
            setShowNotifications(false);
        } catch(e) {}
    };


    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Eligibility', path: '/eligibility', icon: ShieldCheck },
        { name: 'Default Risk', path: '/default-risk', icon: Zap },
        { name: 'Decision AI', path: '/intelligence', icon: Brain },
        { name: 'Health Dashboard', path: '/health-dashboard', icon: ShieldCheck },
        { name: 'Life Planner', path: '/life-planner', icon: Calendar },
    ];

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-800' : 'bg-transparent'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-600/20 border border-emerald-500/20 group-hover:border-emerald-500/50 transition-colors">
                            <ShieldCheck className="w-6 h-6 text-emerald-400" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            Loanwise
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`text-sm font-medium transition-colors hover:text-emerald-400 ${location.pathname === link.path ? 'text-emerald-400' : 'text-slate-400'}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Auth Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                {/* Notification Bell */}
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowNotifications(!showNotifications)} 
                                        className="relative p-2.5 hover:bg-white/5 rounded-full transition-colors border border-transparent hover:border-white/10"
                                    >
                                        <Bell className="w-5 h-5 text-slate-300 hover:text-white" />
                                        {alerts.filter(a => !a.is_read).length > 0 && (
                                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#111827]"></span>
                                        )}
                                    </button>
                                    
                                    {/* Dropdown UI */}
                                    {showNotifications && (
                                        <div className="absolute top-14 right-0 w-80 bg-[#111827]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100]">
                                            <div className="flex items-center justify-between p-3 border-b border-white/5 bg-white/5">
                                                <h3 className="text-sm font-bold text-white flex items-center gap-1.5"><Brain className="w-4 h-4 text-emerald-400" /> Notifications</h3>
                                                {alerts.filter(a => !a.is_read).length > 0 && (
                                                    <button onClick={markAlertsRead} className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors">Mark all read</button>
                                                )}
                                            </div>
                                            <div className="max-h-[350px] overflow-y-auto">
                                                {alerts.length === 0 ? (
                                                    <p className="text-xs text-slate-500 p-6 text-center">No notifications yet</p>
                                                ) : (
                                                    alerts.map(a => (
                                                        <div key={a.id} className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${a.is_read ? 'opacity-60 bg-transparent' : 'bg-emerald-500/5'}`}>
                                                            <p className="text-xs font-bold text-white mb-1 leading-tight">{a.title}</p>
                                                            <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{a.message}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Link
                                    to="/dashboard"
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-all ${location.pathname === '/dashboard' ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    {user?.name?.split(' ')[0]}
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-semibold hover:bg-rose-500/20 transition-all"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="px-4 py-2.5 rounded-full border border-white/10 text-slate-300 text-sm font-semibold hover:bg-white/5 transition-all flex items-center gap-2">
                                    <LogIn className="w-4 h-4" />
                                    Sign In
                                </Link>
                                <Link to="/register" className="px-4 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-all flex items-center">
                                    Get Started <ChevronRight className="w-4 h-4 ml-1" />
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-400 hover:text-white">
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-[#0B0F19] border-b border-slate-800 absolute w-full">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                onClick={() => setIsOpen(false)}
                                className={`block px-3 py-3 rounded-lg text-base font-medium ${location.pathname === link.path ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="pt-4 mt-4 border-t border-slate-800 space-y-2">
                            {isAuthenticated ? (
                                <>
                                    <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block w-full text-center px-5 py-3 rounded-lg bg-indigo-500/20 text-indigo-300 font-semibold">
                                        My Dashboard
                                    </Link>
                                    <button onClick={handleLogout} className="block w-full text-center px-5 py-3 rounded-lg bg-rose-500/10 text-rose-400 font-semibold">
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" onClick={() => setIsOpen(false)} className="block w-full text-center px-5 py-3 rounded-lg border border-white/10 text-slate-300 font-semibold">
                                        Sign In
                                    </Link>
                                    <Link to="/register" onClick={() => setIsOpen(false)} className="block w-full text-center px-5 py-3 rounded-lg bg-emerald-600 text-white font-semibold">
                                        Create Account
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
