/**
 * Checks if module is available / installed
 * @param module Node Module to check
 * 
 * @returns True if module is installed, false if module is inavailable
 * 
 * @see https://stackoverflow.com/a/15303236
 */
function modulechecker(module: string) {
    try {
        require.resolve(module);
        return true;
    } catch (err) {
        return false;
    }
}

export = modulechecker;