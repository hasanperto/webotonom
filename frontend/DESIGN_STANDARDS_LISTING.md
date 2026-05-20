# Admin Listing Page Template (Standard)

This template MUST be used for all admin listing pages (e.g., Orders, Users, Logs, etc.) to ensure consistency with the `Payment Requests` design.

## 1. UI Structure

The page structure consists of **4 main sections**:

1.  **Header Section** (`.page-header`)
    *   Left: Page Title & Subtitle.
    *   Right: Key Statistics (optional) using `.stat-pill`.
2.  **Filters Section** (`.filters-section`)
    *   Top Row: Search Bar & "Filter" Toggle Button.
    *   Middle Row (Collapsible): Advanced Filters Grid (`.advanced-filters-panel`).
    *   Bottom Row: Status Tabs (`.status-tabs`).
3.  **Table Section** (`.table-container`)
    *   Card-style container.
    *   `.modern-table` class for the table.
    *   Responsive design (hides Thead on mobile, card view).
4.  **Modal Section** (`.modal-overlay`)
    *   For viewing details/actions without leaving the page.

## 2. Standard CSS Classes

Use these exact class names to automatically inherit established styles (defined in `AdminListing.css` - *to be created/imported*).

| Component | Class Name | Description |
| :--- | :--- | :--- |
| **Page Container** | `.admin-listing-page` | Background color, padding, min-height. |
| **Header** | `.page-header` | Flex container for Title and Stats. |
| **Stats** | `.header-stats`, `.stat-pill` | Pill-shaped stats with borders. |
| **Filters Container** | `.filters-section` | White card container for all filter controls. |
| **Search** | `.search-bar-wrapper`, `.search-input` | Standard search input with icon. |
| **Adv. Filters** | `.advanced-filters-panel` | Grid layout for extra inputs. |
| **Tabs** | `.status-tabs`, `.status-tab` | Pill-shaped toggle buttons for status. |
| **Table Container** | `.table-container` | White card with shadow and border radius. |
| **Table** | `.modern-table` | The standard table style. |
| **Badges** | `.status-badge`, `.badge-{type}` | `badge-success`, `badge-warning`, `badge-danger`, `badge-info`. |
| **Action Buttons** | `.btn-icon`, `.btn-view`, `.btn-edit` | Icon-only buttons for table actions. |

## 3. React Component Structure (Example)

```jsx
import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { FiSearch, FiFilter, FiEye } from 'react-icons/fi';
import './AdminListing.css'; // Shared styles

const AdminExamplePage = () => {
    // State
    const [filter, setFilter] = useState('all');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    
    return (
        <AdminLayout>
            <div className="admin-listing-page">
                {/* 1. Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Page Title</h1>
                        <p className="page-subtitle">Page description here.</p>
                    </div>
                    <div className="header-stats">
                        <div className="stat-pill success">
                            <span>Total:</span>
                            <strong>150</strong>
                        </div>
                    </div>
                </div>

                {/* 2. Filters */}
                <div className="filters-section">
                    <div className="search-bar-wrapper">
                        <div className="search-input-group">
                            <FiSearch className="search-icon" />
                            <input type="text" className="search-input" placeholder="Search..." />
                        </div>
                        <button 
                            className={`btn-filter-toggle ${showAdvancedFilters ? 'active' : ''}`}
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        >
                            <FiFilter /> Filters
                        </button>
                    </div>

                    {/* Advanced Filters Panel */}
                    {showAdvancedFilters && (
                        <div className="advanced-filters-panel">
                            {/* Inputs go here */}
                        </div>
                    )}

                    {/* Status Tabs */}
                    <div className="status-tabs">
                        <button className={`status-tab ${filter === 'all' ? 'active' : ''}`}>All</button>
                        <button className={`status-tab ${filter === 'active' ? 'active' : ''}`}>Active</button>
                    </div>
                </div>

                {/* 3. Table */}
                <div className="table-container">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td data-label="Name">Item Name</td>
                                <td data-label="Status"><span className="status-badge badge-success">Active</span></td>
                                <td data-label="Actions">
                                    <div className="actions-cell">
                                        <button className="btn-icon btn-view"><FiEye /></button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
};
```

## 4. Mobile Responsiveness

The `.modern-table` class automatically handles mobile views by:
*   Hiding the `thead`.
*   Turning `tr` into card-like blocks.
*   Using `data-label` attributes on `td` to show column names.
