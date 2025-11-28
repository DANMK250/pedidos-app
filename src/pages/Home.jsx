import React from 'react';
import DashboardHeader from '../components/DashboardHeader';
import KanbanBoard from '../components/kanban/KanbanBoard';
import { useTheme } from '../context/ThemeContext';

// Home Page
// Replaces the old list view with the new Kanban Board layout.
export default function Home() {
    const { colors } = useTheme();
    const [showFilters, setShowFilters] = React.useState(false);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: colors.bg
        }}>
            {/* Top Header */}
            <DashboardHeader />

            {/* Filter Bar */}
        </div>
    );
}
