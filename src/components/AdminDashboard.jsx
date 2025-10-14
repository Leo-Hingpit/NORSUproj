import React from 'react';
import StaffItems from './StaffItems';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  return (
    <div>
      <h2 className="mb-4">Admin Dashboard</h2>

      <div className="mb-3">
        <Link className="btn btn-secondary me-2" to="/staff/orders">
          View Orders
        </Link>
      </div>

      <StaffItems /> {/* reuse your existing CRUD component */}
    </div>
  );
}
