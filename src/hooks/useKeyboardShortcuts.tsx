import {useEffect} from "react";

export default function useKeyboardShortcuts(shortcuts: {key: string, function: () => void}[], deps: any[]) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                if (e.ctrlKey && e.key.toLowerCase() === shortcut.key.toLowerCase()) {
                    e.preventDefault();
                    shortcut.function();
                }
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [shortcuts, ...deps]);
}