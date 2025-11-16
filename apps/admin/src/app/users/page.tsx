import { UserTable } from '@/components/UserTable';
import { UserFilters } from '@/components/UserFilters';
import { BulkActions } from '@/components/BulkActions';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <BulkActions />
      </div>

      <UserFilters />

      <UserTable
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'username', label: 'Username' },
          { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role' },
          { key: 'status', label: 'Status' },
          { key: 'createdAt', label: 'Joined' },
          { key: 'lastActive', label: 'Last Active' },
          { key: 'actions', label: 'Actions' },
        ]}
      />
    </div>
  );
}
