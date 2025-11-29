import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * SearchableSelect Component
 * 
 * @param {Object} props
 * @param {Array} props.options - Array of objects to select from
 * @param {any} props.value - Currently selected value (ID)
 * @param {Function} props.onChange - Callback when selection changes (returns value)
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.label - Label text
 * @param {Function} props.filterOption - Function(option, query) -> boolean. Default filters by label.
 * @param {Function} props.getOptionLabel - Function(option) -> string. Default uses option.label or option.name.
 * @param {Function} props.getOptionValue - Function(option) -> any. Default uses option.value or option.id.
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {boolean} props.isLoading - Whether options are loading
 */
export default function SearchableSelect({
    options = [],
    value,
    onChange,
    placeholder = "Seleccionar...",
    label,
    filterOption,
    getOptionLabel,
    getOptionValue,
    disabled = false,
    isLoading = false
}) {
    const { colors, theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    // Helper to get label
    const getLabel = (option) => {
        if (!option) return '';
        if (getOptionLabel) return getOptionLabel(option);
        return option.label || option.name || option.client_name || '';
    };

    // Helper to get value
    const getValue = (option) => {
        if (!option) return '';
        if (getOptionValue) return getOptionValue(option);
        return option.value || option.id || '';
    };

    // Find selected option object
    const selectedOption = options.find(opt => getValue(opt) === value);

    // Update search term when value changes externally
    useEffect(() => {
        if (selectedOption) {
            setSearchTerm(getLabel(selectedOption));
        } else if (!value) {
            setSearchTerm('');
        }
    }, [value, selectedOption]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                // Reset search term to selected value if we didn't pick anything new
                if (selectedOption) {
                    setSearchTerm(getLabel(selectedOption));
                } else {
                    setSearchTerm('');
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef, selectedOption]);

    // Filter options
    const filteredOptions = options.filter(option => {
        if (!searchTerm) return true;
        if (filterOption) return filterOption(option, searchTerm);

        // Default filter: case-insensitive match on label
        const labelText = getLabel(option).toLowerCase();
        const query = searchTerm.toLowerCase();
        return labelText.includes(query);
    });

    const handleSelect = (option) => {
        onChange(getValue(option));
        setIsOpen(false);
        setSearchTerm(getLabel(option));
    };

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
        setIsOpen(true);
        // If user clears input, clear selection
        if (e.target.value === '') {
            onChange('');
        }
    };

    const handleFocus = () => {
        setIsOpen(true);
        // Optional: Select all text on focus for easy replacement
        // e.target.select();
    };

    // Styles
    const containerStyle = {
        position: 'relative',
        width: '100%'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '8px',
        fontWeight: '500',
        fontSize: '0.9rem',
        color: colors.text
    };

    const inputStyle = {
        width: '100%',
        padding: '10px',
        borderRadius: '6px',
        border: `1px solid ${colors.border}`,
        backgroundColor: disabled ? (theme === 'dark' ? '#1e293b' : '#f1f5f9') : (theme === 'dark' ? '#334155' : 'white'),
        color: colors.text,
        fontFamily: 'inherit',
        fontSize: '0.9rem',
        boxSizing: 'border-box',
        cursor: disabled ? 'not-allowed' : 'text'
    };

    const dropdownStyle = {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: colors.bgSecondary,
        border: `1px solid ${colors.border}`,
        borderRadius: '0 0 6px 6px',
        maxHeight: '250px',
        overflowY: 'auto',
        zIndex: 20,
        listStyle: 'none',
        padding: 0,
        margin: '4px 0 0 0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    };

    const optionStyle = {
        padding: '10px',
        cursor: 'pointer',
        borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f1f5f9'}`,
        color: colors.text,
        fontSize: '0.9rem',
        transition: 'background-color 0.1s'
    };

    return (
        <div style={containerStyle} ref={wrapperRef}>
            {label && <label style={labelStyle}>{label}</label>}

            <input
                ref={inputRef}
                type="text"
                placeholder={isLoading ? "Cargando..." : placeholder}
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={handleFocus}
                disabled={disabled}
                style={inputStyle}
                autoComplete="off"
            />

            {isOpen && !disabled && (
                <ul style={dropdownStyle}>
                    {isLoading ? (
                        <li style={{ ...optionStyle, cursor: 'default', color: colors.textMuted }}>
                            Cargando...
                        </li>
                    ) : filteredOptions.length === 0 ? (
                        <li style={{ ...optionStyle, cursor: 'default', color: colors.textMuted }}>
                            No se encontraron resultados
                        </li>
                    ) : (
                        filteredOptions.map((option, index) => (
                            <li
                                key={index}
                                onClick={() => handleSelect(option)}
                                style={optionStyle}
                                onMouseEnter={(e) => e.target.style.backgroundColor = theme === 'dark' ? '#334155' : '#f1f5f9'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                                {getLabel(option)}
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}
