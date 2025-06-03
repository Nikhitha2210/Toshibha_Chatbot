import { createContext, useContext, useState } from "react"

import Colors from "../theme/colors";

const ThemeContext = createContext<any>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {

    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    console.log("theme", theme)

    const toggleTheme = () => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    }

    const value = {
        theme,
        colors: Colors[theme],
        toggleTheme,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>

}

export const useThemeContext = () => useContext(ThemeContext);