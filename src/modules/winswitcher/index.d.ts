/// <reference types="node" />

export declare class WinManager {
    /**
     * Stores the current active window.
     */
    storeActiveWindow(): String;
    /**
     * Activates the window that has been stored.
     */
    activateStoredWindow(): String;
    /**
     * Gets current active window's title.
     */
    getActiveWindowTitle(): String;
    /**
     * Check the title of the stored window (if there's any).
     */
    checkStoredWindow(): String;
}