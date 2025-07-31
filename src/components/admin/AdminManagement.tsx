import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Save, X, User, Shield, Users, Key } from "lucide-react";

interface Admin {
  id: string;
  username: string;
  password_hash?: string;
  created_at: string;
  updated_at: string;
}

interface Permission {
  id: string;
  username: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'viewer';
  permissions: {
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_view: boolean;
    can_manage_users: boolean;
  };
}

const AdminManagement = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '' });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('id, username, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.username || !newAdmin.password) {
      toast({
        title: "Error",
        description: "Username and password are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('hash_password', {
        password: newAdmin.password
      });

      if (error) throw error;

      const { error: insertError } = await supabase
        .from('admins')
        .insert({
          username: newAdmin.username,
          password_hash: data
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Admin user created successfully",
      });

      setNewAdmin({ username: '', password: '' });
      setIsAddDialogOpen(false);
      fetchAdmins();
    } catch (error) {
      console.error('Error creating admin:', error);
      toast({
        title: "Error",
        description: "Failed to create admin user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin user?')) return;

    try {
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', adminId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admin user deleted successfully",
      });

      fetchAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast({
        title: "Error",
        description: "Failed to delete admin user",
        variant: "destructive",
      });
    }
  };

  const handleEditAdmin = async () => {
    if (!editingAdmin) return;

    try {
      const updateData: any = { username: editingAdmin.username };
      
      // If password is provided, hash it
      if ((editingAdmin as any).newPassword) {
        const { data: hashedPassword, error: hashError } = await supabase.rpc('hash_password', {
          password: (editingAdmin as any).newPassword
        });

        if (hashError) throw hashError;
        updateData.password_hash = hashedPassword;
      }

      const { error } = await supabase
        .from('admins')
        .update(updateData)
        .eq('id', editingAdmin.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admin user updated successfully",
      });

      setEditingAdmin(null);
      setIsEditDialogOpen(false);
      fetchAdmins();
    } catch (error) {
      console.error('Error updating admin:', error);
      toast({
        title: "Error",
        description: "Failed to update admin user",
        variant: "destructive",
      });
    }
  };

  // Initialize on component mount
  useState(() => {
    fetchAdmins();
  });

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Admin User Management</h3>
          <p className="text-sm text-muted-foreground">Manage administrator accounts and permissions</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Admin User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newAdmin.username}
                  onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAdmin}>Create Admin</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Admin Users List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">Loading admin users...</div>
        ) : (
          admins.map((admin) => (
            <Card key={admin.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{admin.username}</h4>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(admin.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAdmin(admin);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteAdmin(admin.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Admin Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin User</DialogTitle>
          </DialogHeader>
          {editingAdmin && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={editingAdmin.username}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-password">New Password (leave empty to keep current)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={(editingAdmin as any).newPassword || ''}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, newPassword: e.target.value } as any)}
                  placeholder="Enter new password"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditAdmin}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminManagement;