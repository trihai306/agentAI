import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// Available daisyUI themes
export const availableThemes = [
    'light',
    'dark',
    'corporate',
    'emerald',
    'synthwave',
    'retro',
    'cyberpunk',
    'valentine',
    'halloween',
    'garden',
    'forest',
    'aqua',
    'lofi',
    'pastel',
    'fantasy',
    'wireframe',
    'black',
    'luxury',
    'dracula',
    'cmyk',
    'autumn',
    'business',
    'acid',
    'lemonade',
    'night',
    'coffee',
    'winter',
    'dim',
    'nord',
    'sunset',
];

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        // Load theme from localStorage or default to 'dark'
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            if (saved && availableThemes.includes(saved)) {
                return saved;
            }
            // Check system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
                return 'light';
            }
        }
        return 'dark';
    });

    useEffect(() => {
        // Apply theme to document using daisyUI data-theme attribute
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        // Add/remove dark class for Tailwind dark mode
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        // Save to localStorage
        localStorage.setItem('theme', theme);
    }, [theme]);

    const changeTheme = (newTheme) => {
        if (availableThemes.includes(newTheme)) {
            setTheme(newTheme);
        }
    };

    const toggleTheme = () => {
        // Toggle between light and dark
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme: changeTheme, toggleTheme, availableThemes }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}

