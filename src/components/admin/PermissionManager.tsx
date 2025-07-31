import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, User, UserCheck, UserX, Settings, Plus, Edit2, Save, X } from "lucide-react";

interface AdminUser {
  id: string;
  username: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'viewer';
  permissions: {
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_view: boolean;
    can_manage_users: boolean;
    can_manage_categories: boolean;
    can_manage_registrations: boolean;
    can_view_analytics: boolean;
  };
  is_active: boolean;
  created_at: string;
}

const PermissionManager = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const defaultPermissions = {
    can_create: false,
    can_edit: false,
    can_delete: false,
    can_view: true,
    can_manage_users: false,
    can_manage_categories: false,
    can_manage_registrations: false,
    can_view_analytics: false,
  };

  const rolePermissions = {
    super_admin: {
      can_create: true,
      can_edit: true,
      can_delete: true,
      can_view: true,
      can_manage_users: true,
      can_manage_categories: true,
      can_manage_registrations: true,
      can_view_analytics: true,
    },
    admin: {
      can_create: true,
      can_edit: true,
      can_delete: true,
      can_view: true,
      can_manage_users: false,
      can_manage_categories: true,
      can_manage_registrations: true,
      can_view_analytics: true,
    },
    moderator: {
      can_create: true,
      can_edit: true,
      can_delete: false,
      can_view: true,
      can_manage_users: false,
      can_manage_categories: false,
      can_manage_registrations: true,
      can_view_analytics: false,
    },
    viewer: {
      can_create: false,
      can_edit: false,
      can_delete: false,
      can_view: true,
      can_manage_users: false,
      can_manage_categories: false,
      can_manage_registrations: false,
      can_view_analytics: false,
    },
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    setLoading(true);
    try {
      // For demo purposes, we'll simulate admin user data since we don't have a proper user_permissions table
      // In a real app, you'd fetch from a proper permissions table
      const { data: admins, error } = await supabase
        .from('admins')
        .select('id, username, created_at');

      if (error) throw error;

      // Simulate user roles and permissions
      const mockAdminUsers: AdminUser[] = (admins || []).map((admin, index) => ({
        id: admin.id,
        username: admin.username,
        role: index === 0 ? 'super_admin' : index === 1 ? 'admin' : 'moderator',
        permissions: index === 0 ? rolePermissions.super_admin : 
                    index === 1 ? rolePermissions.admin : rolePermissions.moderator,
        is_active: true,
        created_at: admin.created_at,
      }));

      setAdminUsers(mockAdminUsers);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userId: string, newRole: AdminUser['role']) => {
    setAdminUsers(prev => prev.map(user => 
      user.id === userId 
        ? { 
            ...user, 
            role: newRole, 
            permissions: rolePermissions[newRole] 
          }
        : user
    ));

    toast({
      title: "Role Updated",
      description: "User role and permissions have been updated",
    });
  };

  const handlePermissionChange = (userId: string, permission: keyof AdminUser['permissions'], value: boolean) => {
    setAdminUsers(prev => prev.map(user => 
      user.id === userId 
        ? { 
            ...user, 
            permissions: { ...user.permissions, [permission]: value }
          }
        : user
    ));
  };

  const toggleUserStatus = (userId: string) => {
    setAdminUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, is_active: !user.is_active }
        : user
    ));

    toast({
      title: "User Status Updated",
      description: "User account status has been changed",
    });
  };

  const getRoleBadgeVariant = (role: AdminUser['role']) => {
    switch (role) {
      case 'super_admin': return 'default';
      case 'admin': return 'secondary';
      case 'moderator': return 'outline';
      case 'viewer': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Permission Management</h3>
          <p className="text-sm text-muted-foreground">Manage user roles and access permissions</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading permissions...</div>
      ) : (
        <div className="space-y-4">
          {adminUsers.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      user.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {user.is_active ? <UserCheck className="h-5 w-5" /> : <UserX className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="font-medium">{user.username}</h4>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Switch
                      checked={user.is_active}
                      onCheckedChange={() => toggleUserStatus(user.id)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingUser(user);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Role</Label>
                    <Select value={user.role} onValueChange={(value: AdminUser['role']) => handleRoleChange(user.id, value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(user.permissions).map(([permission, value]) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Switch
                          id={`${user.id}-${permission}`}
                          checked={value}
                          onCheckedChange={(checked) => handlePermissionChange(user.id, permission as keyof AdminUser['permissions'], checked)}
                        />
                        <Label 
                          htmlFor={`${user.id}-${permission}`}
                          className="text-xs cursor-pointer"
                        >
                          {permission.replace('can_', '').replace('_', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User Permissions</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">{editingUser.username}</h4>
                  <Badge variant={getRoleBadgeVariant(editingUser.role)}>
                    {editingUser.role.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Role Assignment</Label>
                  <Select 
                    value={editingUser.role} 
                    onValueChange={(value: AdminUser['role']) => {
                      const updatedUser = { 
                        ...editingUser, 
                        role: value, 
                        permissions: rolePermissions[value] 
                      };
                      setEditingUser(updatedUser);
                      handleRoleChange(editingUser.id, value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Individual Permissions</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {Object.entries(editingUser.permissions).map(([permission, value]) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Switch
                          id={`edit-${permission}`}
                          checked={value}
                          onCheckedChange={(checked) => {
                            const updatedUser = {
                              ...editingUser,
                              permissions: { ...editingUser.permissions, [permission]: checked }
                            };
                            setEditingUser(updatedUser);
                            handlePermissionChange(editingUser.id, permission as keyof AdminUser['permissions'], checked);
                          }}
                        />
                        <Label 
                          htmlFor={`edit-${permission}`}
                          className="text-sm cursor-pointer capitalize"
                        >
                          {permission.replace('can_', '').replace('_', ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PermissionManager;