/**
 * Attempts to fix common encoding issues in strings.
 * Specifically targets cases where UTF-8 characters are displayed incorrectly
 * (e.g., "Ã±" instead of "ñ", "Ã¡" instead of "á").
 * 
 * @param {string} str - The string to fix.
 * @returns {string} - The fixed string.
 */
export function fixEncoding(str) {
    if (!str) return '';

    try {
        // Common replacements for UTF-8 characters misinterpreted as Latin-1/Windows-1252
        // This list covers the most common Spanish characters
        const replacements = {
            'Ã±': 'ñ',
            'Ã‘': 'Ñ',
            'Ã¡': 'á',
            'Ã©': 'é',
            'Ãed': 'í',
            'Ã³': 'ó',
            'Ãº': 'ú',
            'Ã\x81': 'Á',
            'Ã\x89': 'É',
            'Ã\x8D': 'Í',
            'Ã\x93': 'Ó',
            'Ã\x9A': 'Ú',
            'Â¿': '¿',
            'Â¡': '¡',
            // Sometimes the replacement character  appears for invalid sequences
            // We can't recover the original data from , but we can try to handle known broken patterns if any
        };

        let fixed = str;

        // First pass: direct replacements of known mojibake
        Object.entries(replacements).forEach(([bad, good]) => {
            fixed = fixed.split(bad).join(good);
        });

        // If the string contains the replacement character , it often means the data is irretrievably lost 
        // in the source or during transport, BUT sometimes it's a specific byte sequence.
        // For now, we'll just return the fixed string.

        return fixed;
    } catch (e) {
        console.error('Error fixing encoding:', e);
        return str;
    }
}

/**
 * Normalizes a string for searching (removes accents, converts to lowercase).
 * @param {string} str 
 * @returns {string}
 */
export function normalizeForSearch(str) {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
